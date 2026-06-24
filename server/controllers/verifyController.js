import asyncHandler from '../utils/asyncHandler.js';
import * as participantRepo from '../repositories/participantRepository.js';
import * as attendanceRepo from '../repositories/attendanceRepository.js';
import { parseQrPayload } from '../services/qrService.js';
import { logAudit } from '../services/auditService.js';
import { toApiDoc } from '../utils/serialize.js';

export const verifyQr = asyncHandler(async (req, res) => {
  const { qrData, location } = req.body;
  const payload = parseQrPayload(qrData);

  if (!payload?.participantId) {
    return res.status(400).json({
      success: false,
      valid: false,
      message: 'Invalid QR code',
    });
  }

  const participant = await participantRepo.findParticipantByParticipantId(
    payload.participantId
  );

  if (!participant) {
    return res.status(404).json({
      success: false,
      valid: false,
      message: 'Participant not found',
    });
  }

  const existingToday = await attendanceRepo.findTodayAttendance(
    participant.participantId
  );

  let attendanceRecord = null;
  let duplicateScan = false;

  if (!existingToday) {
    attendanceRecord = await attendanceRepo.createAttendance({
      participantId: participant.participantId,
      participantRefId: participant.id,
      verifiedById: req.user?._id,
      scannerName: req.user?.name || 'System',
      location: location || 'Main Entrance',
    });

    await participantRepo.updateParticipant(participant.id, {
      isVerified: true,
      attendanceStatus: 'Present',
    });

    participant.isVerified = true;
    participant.attendanceStatus = 'Present';

    await logAudit({
      action: 'VERIFY',
      entity: 'Participant',
      entityId: participant.id,
      user: req.user,
      details: { participantId: participant.participantId },
      req,
    });
  } else {
    duplicateScan = true;
  }

  res.json({
    success: true,
    valid: true,
    duplicateScan,
    message: duplicateScan
      ? 'Already checked in today'
      : 'Verified Participant',
    data: {
      participant: toApiDoc(participant),
      attendance: toApiDoc(attendanceRecord || existingToday),
    },
  });
});
