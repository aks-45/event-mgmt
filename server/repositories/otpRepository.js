import { v4 as uuidv4 } from 'uuid';
import pool from '../config/pool.js';

export const createOtp = async (participantId, mobile, otp, expiryMinutes = 10, parentParticipantId = null) => {
  const id = uuidv4();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const result = await pool.query(
    `INSERT INTO otp_verifications (id, participant_id, parent_participant_id, mobile, otp, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, participantId, parentParticipantId, mobile, otp, expiresAt]
  );

  return result.rows[0];
};

export const findOtpByParticipantAndMobile = async (participantId, mobile) => {
  const result = await pool.query(
    `SELECT * FROM otp_verifications 
     WHERE participant_id = $1 AND mobile = $2 AND is_verified = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [participantId, mobile]
  );

  return result.rows[0];
};

export const verifyOtp = async (participantId, mobile, otpCode) => {
  const otp = await findOtpByParticipantAndMobile(participantId, mobile);

  if (!otp) {
    throw new Error('OTP not found');
  }

  // Check if OTP is expired
  if (new Date() > otp.expires_at) {
    throw new Error('OTP has expired');
  }

  // Check max attempts
  if (otp.attempts >= otp.max_attempts) {
    throw new Error('Maximum OTP verification attempts exceeded');
  }

  // Check if OTP matches
  if (otp.otp !== String(otpCode).trim()) {
    // Increment attempts
    await pool.query(
      `UPDATE otp_verifications SET attempts = attempts + 1, updated_at = NOW()
       WHERE id = $1`,
      [otp.id]
    );
    throw new Error('Invalid OTP');
  }

  // Mark as verified
  const result = await pool.query(
    `UPDATE otp_verifications 
     SET is_verified = TRUE, verified_at = NOW(), updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [otp.id]
  );

  return result.rows[0];
};

export const getOtpDetails = async (participantId, mobile) => {
  const result = await pool.query(
    `SELECT * FROM otp_verifications 
     WHERE participant_id = $1 AND mobile = $2 AND is_verified = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [participantId, mobile]
  );

  const otp = result.rows[0];
  if (!otp) return null;

  return {
    id: otp.id,
    participantId: otp.participant_id,
    mobile: otp.mobile,
    isVerified: otp.is_verified,
    attempts: otp.attempts,
    maxAttempts: otp.max_attempts,
    expiresAt: otp.expires_at,
    createdAt: otp.created_at,
  };
};

export const deleteExpiredOtps = async () => {
  const result = await pool.query(
    `DELETE FROM otp_verifications WHERE expires_at < NOW()`
  );

  return result.rowCount;
};
