import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import * as guestRepo from '../repositories/guestRepository.js';
import { buildQrPayload, generateQrImage } from '../services/qrService.js';
import { logAudit } from '../services/auditService.js';
import { toApiDoc } from '../utils/serialize.js';
import pool from '../config/pool.js';

const GUEST_PREFIX = () => `${process.env.EVENT_PREFIX || 'IIA2026'}-G`;

/**
 * Generate next guest ID atomically using a PostgreSQL sequence.
 * Safe for concurrent access from multiple computers.
 */
const generateNextGuestId = async () => {
  const prefix = GUEST_PREFIX();
  const { rows } = await pool.query(`SELECT nextval('guest_id_seq') AS num`);
  const nextNum = parseInt(rows[0].num, 10);
  return `${prefix}-${String(nextNum).padStart(6, '0')}`;
};

export const createGuest = asyncHandler(async (req, res) => {
  const { fullName, industryName, mobile, email, paymentMode, honorGuest } = req.body;
  if (!fullName || !mobile) throw new ApiError(400, 'fullName and mobile are required');
  if (!honorGuest && !['Cash', 'Online'].includes(paymentMode))
    throw new ApiError(400, 'paymentMode must be Cash or Online');

  // Check duplicate by mobile
  const dupMobile = await guestRepo.findGuestByMobile(mobile);
  if (dupMobile) throw new ApiError(400, `Mobile already registered as guest (${dupMobile.guestId})`);

  // Check duplicate by full name + industry (prevents concurrent double-registration)
  const dupName = await guestRepo.findGuestByFullNameAndIndustry(fullName, industryName);
  if (dupName) throw new ApiError(400, `"${fullName}" is already registered as guest (${dupName.guestId})`);

  const guestId = await generateNextGuestId();
  const qrPayload = buildQrPayload({ participantId: guestId, name: fullName, industry: industryName || 'Guest' });
  const { qrCodeData, qrImage } = await generateQrImage(qrPayload);

  let guest;
  try {
    guest = await guestRepo.createGuest({
      guestId, fullName, industryName, mobile, email,
      paymentMode: honorGuest ? null : paymentMode,
      amount: honorGuest ? 0 : 1500,
      isHonorary: !!honorGuest,
      qrCodeData, qrImage,
    });
  } catch (err) {
    // Handle unique constraint violation from concurrent registration
    if (err.code === '23505') {
      throw new ApiError(400, `"${fullName}" is already registered (duplicate detected)`);
    }
    throw err;
  }

  await logAudit({ action: 'CREATE', entity: 'Guest', entityId: guest.id, user: req.user, details: { guestId, honorGuest: !!honorGuest }, req });

  res.status(201).json({ success: true, data: toApiDoc(guest) });
});

export const getGuests = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(guest_id ILIKE $1 OR full_name ILIKE $1 OR mobile ILIKE $1)`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { guests, total } = await guestRepo.listGuests({
    whereClause, params,
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({
    success: true,
    data: toApiDoc(guests),
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
  });
});

export const deleteGuest = asyncHandler(async (req, res) => {
  const guest = await guestRepo.findGuestById(req.params.id);
  if (!guest) throw new ApiError(404, 'Guest not found');
  await guestRepo.deleteGuest(req.params.id);
  await logAudit({ action: 'DELETE', entity: 'Guest', entityId: guest.id, user: req.user, details: { guestId: guest.guestId }, req });
  res.json({ success: true, message: 'Guest removed' });
});
