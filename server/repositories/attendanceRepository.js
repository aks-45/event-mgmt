import { randomUUID } from 'crypto';
import pool from '../config/pool.js';
import { mapRow, mapRows } from '../utils/mapRow.js';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const findTodayAttendance = async (participantId) => {
  const { rows } = await pool.query(
    `SELECT * FROM attendance
     WHERE participant_id = $1 AND scan_time >= $2
     LIMIT 1`,
    [participantId, startOfToday()]
  );
  return mapRow(rows[0]);
};

export const findTodayAttendedIds = async () => {
  const { rows } = await pool.query(
    `SELECT participant_id FROM attendance WHERE scan_time >= $1`,
    [startOfToday()]
  );
  return rows.map((r) => r.participant_id);
};

export const createAttendance = async (data) => {
  const id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO attendance (
      id, participant_id, participant_ref_id, verified_by_id, scanner_name, location
    ) VALUES ($1,$2,$3,$4,$5,$6)
    RETURNING *`,
    [
      id,
      data.participantId,
      data.participantRefId,
      data.verifiedById,
      data.scannerName,
      data.location || 'Main Entrance',
    ]
  );
  return mapRow(rows[0]);
};

export const listAttendance = async ({ participantId, limit, offset }) => {
  const params = [];
  let where = '';
  if (participantId) {
    where = 'WHERE a.participant_id = $1';
    params.push(participantId);
  }

  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM attendance a ${where}`,
    params
  );

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const { rows } = await pool.query(
    `SELECT a.*,
            u.id AS verifier_id, u.name AS verifier_name, u.email AS verifier_email
     FROM attendance a
     LEFT JOIN users u ON a.verified_by_id = u.id
     ${where}
     ORDER BY a.scan_time DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...params, limit, offset]
  );

  const logs = rows.map((row) => {
    const att = mapRow(row);
    if (row.verifier_id) {
      att.verifiedBy = {
        id: row.verifier_id,
        name: row.verifier_name,
        email: row.verifier_email,
      };
    }
    return att;
  });

  return { logs, total: countRes.rows[0].total };
};

export const deleteAllAttendance = async () => {
  await pool.query('DELETE FROM attendance');
};
