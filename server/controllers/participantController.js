import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import * as participantRepo from '../repositories/participantRepository.js';
import * as guestRepo from '../repositories/guestRepository.js';
import { generateNextParticipantId } from '../services/participantIdService.js';
import { buildQrPayload, generateQrImage } from '../services/qrService.js';
import { logAudit } from '../services/auditService.js';
import { toApiDoc } from '../utils/serialize.js';

const checkDuplicate = async ({ fullName, industryName, excludeId }) => {
  const dup = await participantRepo.findDuplicate({ fullName, industryName, excludeId });
  if (dup) {
    throw new ApiError(
      400,
      `"${fullName}" from "${industryName}" is already registered (${dup.participantId})`
    );
  }
};

const buildListFilter = ({ search, verified, attendanceStatus }) => {
  const conditions = [];
  const params = [];
  let i = 1;

  if (search) {
    conditions.push(`(
      participant_id ILIKE $${i} OR full_name ILIKE $${i} OR
      industry_name ILIKE $${i} OR mobile ILIKE $${i} OR email ILIKE $${i}
    )`);
    params.push(`%${search}%`);
    i++;
  }
  if (verified === 'true') {
    conditions.push(`is_verified = TRUE`);
  }
  if (verified === 'false') {
    conditions.push(`is_verified = FALSE`);
  }
  if (attendanceStatus) {
    conditions.push(`attendance_status = $${i}`);
    params.push(attendanceStatus);
    i++;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
};

export const createParticipant = asyncHandler(async (req, res) => {
  const { fullName, industryName, mobile, email, isHonorary } = req.body;
  await checkDuplicate({ fullName, industryName });

  const participantId = await generateNextParticipantId();
  const qrPayload = buildQrPayload({
    participantId,
    name: fullName,
    industry: industryName,
  });
  const { qrCodeData, qrImage } = await generateQrImage(qrPayload);

  let participant;
  try {
    participant = await participantRepo.createParticipant({
      participantId,
      fullName,
      industryName,
      mobile,
      email,
      isHonorary,
      qrCodeData,
      qrImage,
    });
  } catch (err) {
    // Handle unique constraint violation from concurrent registration on another computer
    if (err.code === '23505') {
      throw new ApiError(
        400,
        `"${fullName}" from "${industryName}" is already registered (duplicate detected)`
      );
    }
    throw err;
  }

  await logAudit({
    action: 'CREATE',
    entity: 'Participant',
    entityId: participant.id,
    user: req.user,
    details: { participantId },
    req,
  });

  res.status(201).json({ success: true, data: toApiDoc(participant) });
});

export const getParticipants = asyncHandler(async (req, res) => {
  const {
    search,
    verified,
    attendanceStatus,
    page = 1,
    limit = 20,
    sort = '-createdAt',
  } = req.query;

  const { whereClause, params } = buildListFilter({ search, verified, attendanceStatus });
  const orderDir = sort === 'createdAt' ? 'ASC' : 'DESC';
  const skip = (Number(page) - 1) * Number(limit);

  const { participants, total } = await participantRepo.listParticipants({
    whereClause,
    params,
    limit: Number(limit),
    offset: skip,
    orderDir,
  });

  res.json({
    success: true,
    data: toApiDoc(participants),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

export const getParticipant = asyncHandler(async (req, res) => {
  const participant = await participantRepo.findParticipantById(req.params.id);
  if (!participant) throw new ApiError(404, 'Participant not found');
  res.json({ success: true, data: toApiDoc(participant) });
});

export const updateParticipant = asyncHandler(async (req, res) => {
  const existing = await participantRepo.findParticipantById(req.params.id);
  if (!existing) throw new ApiError(404, 'Participant not found');

  const { fullName, industryName, mobile, email, isHonorary } = req.body;
  if (email || mobile) {
    await checkDuplicate({
      fullName: fullName || existing.fullName,
      industryName: industryName || existing.industryName,
      excludeId: existing.id,
    });
  }

  const data = {
    ...(fullName && { fullName }),
    ...(industryName && { industryName }),
    ...(mobile && { mobile }),
    ...(email && { email }),
    ...(isHonorary !== undefined && { isHonorary }),
  };

  if (fullName || industryName) {
    const qrPayload = buildQrPayload({
      participantId: existing.participantId,
      name: fullName || existing.fullName,
      industry: industryName || existing.industryName,
    });
    const { qrCodeData, qrImage } = await generateQrImage(qrPayload);
    data.qrCodeData = qrCodeData;
    data.qrImage = qrImage;
  }

  const participant = await participantRepo.updateParticipant(req.params.id, data);

  await logAudit({
    action: 'UPDATE',
    entity: 'Participant',
    entityId: participant.id,
    user: req.user,
    req,
  });

  res.json({ success: true, data: toApiDoc(participant) });
});

export const addSameIndustryMember = asyncHandler(async (req, res) => {
  const source = await participantRepo.findParticipantById(req.params.id);
  if (!source) throw new ApiError(404, 'Participant not found');

  const { fullName, mobile } = req.body;
  const industryName = source.industryName;
  await checkDuplicate({ fullName, industryName });

  const participantId = await generateNextParticipantId();
  const qrPayload = buildQrPayload({ participantId, name: fullName, industry: industryName });
  const { qrCodeData, qrImage } = await generateQrImage(qrPayload);

  let participant;
  try {
    participant = await participantRepo.createParticipant({
      participantId, fullName, industryName, mobile,
      email: null, qrCodeData, qrImage,
      parentParticipantId: source.participantId,
      isChildMember: true,
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new ApiError(
        400,
        `"${fullName}" from "${industryName}" is already registered (duplicate detected)`
      );
    }
    throw err;
  }

  await logAudit({
    action: 'CREATE', entity: 'Participant', entityId: participant.id,
    user: req.user,
    details: { participantId, parentParticipantId: source.participantId, isChildMember: true },
    req,
  });

  res.status(201).json({ success: true, data: toApiDoc(participant) });
});

export const deleteParticipant = asyncHandler(async (req, res) => {
  const participant = await participantRepo.findParticipantById(req.params.id);
  if (!participant) throw new ApiError(404, 'Participant not found');

  await participantRepo.deleteParticipant(req.params.id);

  await logAudit({
    action: 'DELETE',
    entity: 'Participant',
    entityId: participant.id,
    user: req.user,
    details: { participantId: participant.participantId },
    req,
  });

  res.json({ success: true, message: 'Participant removed' });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalRegistrations,
    todayRegistrations,
    totalVerified,
    pendingVerification,
    presentCount,
    registrationTrends,
    attendanceTrends,
    totalGuests,
    totalCollection,
  ] = await Promise.all([
    participantRepo.countParticipants(),
    participantRepo.countParticipants('WHERE created_at >= $1', [startOfDay]),
    participantRepo.countParticipants('WHERE is_verified = TRUE'),
    participantRepo.countParticipants('WHERE is_verified = FALSE'),
    participantRepo.countParticipants(`WHERE attendance_status = 'Present'`),
    participantRepo.registrationTrends(),
    participantRepo.attendanceTrends(),
    guestRepo.countGuests(),
    guestRepo.getTotalCollection(),
  ]);

  res.json({
    success: true,
    data: {
      totalRegistrations,
      todayRegistrations,
      totalVerified,
      pendingVerification,
      presentCount,
      totalGuests,
      totalCollection,
      registrationTrends: registrationTrends.map((r) => ({ date: r.date, count: Number(r.count) })),
      attendanceTrends: attendanceTrends.map((r) => ({ date: r.date, count: Number(r.count) })),
    },
  });
});

export const bulkImportParticipants = asyncHandler(async (req, res) => {
  let buffer = Buffer.isBuffer(req.body) ? req.body : null;
  if (!buffer && req.body?.file) {
    buffer = Buffer.from(req.body.file, 'base64');
  }
  if (!buffer?.length) throw new ApiError(400, 'Excel file is required');

  const { parseBulkImport } = await import('../services/exportService.js');
  const rows = parseBulkImport(buffer);
  const results = { created: [], failed: [] };

  for (const row of rows) {
    try {
      if (!row.fullName || !row.industryName || !row.mobile) {
        throw new Error('Missing required fields');
      }
      await checkDuplicate({ fullName: row.fullName, industryName: row.industryName });
      const participantId = await generateNextParticipantId();
      const qrPayload = buildQrPayload({
        participantId,
        name: row.fullName,
        industry: row.industryName,
      });
      const { qrCodeData, qrImage } = await generateQrImage(qrPayload);
      const p = await participantRepo.createParticipant({
        participantId,
        fullName: row.fullName,
        industryName: row.industryName,
        mobile: row.mobile,
        email: row.email,
        qrCodeData,
        qrImage,
      });
      results.created.push(p.participantId);
    } catch (err) {
      results.failed.push({ row, error: err.message });
    }
  }

  res.json({ success: true, data: results });
});
