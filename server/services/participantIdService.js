import pool from '../config/pool.js';

const PREFIX = () => process.env.EVENT_PREFIX || 'IIA2026';

/**
 * Generate next participant ID atomically using a PostgreSQL sequence.
 * Safe for concurrent access from multiple computers — nextval() is
 * guaranteed to return unique values even under high concurrency.
 */
export const generateNextParticipantId = async () => {
  const prefix = PREFIX();
  const { rows } = await pool.query(`SELECT nextval('participant_id_seq') AS num`);
  const nextNum = parseInt(rows[0].num, 10);
  return `${prefix}-${String(nextNum).padStart(6, '0')}`;
};
