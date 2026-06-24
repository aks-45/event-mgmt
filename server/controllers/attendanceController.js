import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import * as participantRepo from '../repositories/participantRepository.js';
import * as attendanceRepo from '../repositories/attendanceRepository.js';
import * as guestRepo from '../repositories/guestRepository.js';
import { toApiDoc } from '../utils/serialize.js';

export const getPendingList = asyncHandler(async (req, res) => {
  const attendedIds = await attendanceRepo.findTodayAttendedIds();
  const attendedSet = new Set(attendedIds);

  const [{ participants }, guestResult] = await Promise.all([
    participantRepo.listParticipants({ whereClause: '', params: [], limit: 1000, offset: 0, orderDir: 'DESC' }),
    guestRepo.listGuests({ whereClause: '', params: [], limit: 1000, offset: 0, orderDir: 'DESC' }),
  ]);

  const pendingParticipants = participants
    .filter((p) => !attendedSet.has(p.participantId))
    .map((p) => ({ id: p.participantId, name: p.fullName, industry: p.industryName || '', type: 'member' }));

  const pendingGuests = guestResult.guests
    .filter((g) => !attendedSet.has(g.guestId))
    .map((g) => ({ id: g.guestId, name: g.fullName, industry: g.industryName || '', type: 'guest' }));

  res.json({ success: true, data: [...pendingParticipants, ...pendingGuests] });
});

export const markManualAttendance = asyncHandler(async (req, res) => {
  const { id, type, location } = req.body;
  if (!id) throw new ApiError(400, 'id is required');

  const existing = await attendanceRepo.findTodayAttendance(id);
  if (existing) throw new ApiError(400, 'Attendance already marked for today');

  let refId = null;
  if (type === 'guest') {
    const guest = await guestRepo.findGuestByGuestId(id);
    if (!guest) throw new ApiError(404, 'Guest not found');
  } else {
    const participant = await participantRepo.findParticipantByParticipantId(id);
    if (!participant) throw new ApiError(404, 'Participant not found');
    refId = participant.id;
    await participantRepo.updateParticipant(participant.id, { attendanceStatus: 'Present', isVerified: true });
  }

  const record = await attendanceRepo.createAttendance({
    participantId: id,
    participantRefId: refId,
    verifiedById: req.user?.id,
    scannerName: req.user?.name || 'Manual',
    location: location || 'Main Entrance',
  });

  res.status(201).json({ success: true, data: toApiDoc(record) });
});

export const getAttendance = asyncHandler(async (req, res) => {
  const { participantId, page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const { logs, total } = await attendanceRepo.listAttendance({
    participantId,
    limit: Number(limit),
    offset: skip,
  });

  res.json({
    success: true,
    data: toApiDoc(logs),
    pagination: { page: Number(page), limit: Number(limit), total },
  });
});

export const createAttendance = asyncHandler(async (req, res) => {
  const { participantId, location } = req.body;
  const participant = await participantRepo.findParticipantByParticipantId(participantId);
  if (!participant) throw new ApiError(404, 'Participant not found');

  const existingToday = await attendanceRepo.findTodayAttendance(participantId);
  if (existingToday) throw new ApiError(400, 'Attendance already recorded for today');

  const record = await attendanceRepo.createAttendance({
    participantId,
    participantRefId: participant.id,
    verifiedById: req.user.id,
    scannerName: req.user.name,
    location: location || 'Main Entrance',
  });

  await participantRepo.updateParticipant(participant.id, {
    attendanceStatus: 'Present',
    isVerified: true,
  });

  res.status(201).json({ success: true, data: toApiDoc(record) });
});
