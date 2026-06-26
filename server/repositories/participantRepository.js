import { randomUUID } from 'crypto';
import pool from '../config/pool.js';
import { mapRow, mapRows } from '../utils/mapRow.js';

export const findParticipantById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM participants WHERE id = $1', [id]);
  return mapRow(rows[0]);
};

export const findParticipantByParticipantId = async (participantId) => {
  const { rows } = await pool.query(
    'SELECT * FROM participants WHERE participant_id = $1',
    [participantId]
  );
  return mapRow(rows[0]);
};

export const findDuplicate = async ({ fullName, industryName, excludeId }) => {
  let sql = `SELECT * FROM participants WHERE LOWER(full_name) = LOWER($1) AND LOWER(industry_name) = LOWER($2)`;
  const params = [fullName, industryName];
  if (excludeId) {
    params.push(excludeId);
    sql += ` AND id != $${params.length}`;
  }
  sql += ' LIMIT 1';
  const { rows } = await pool.query(sql, params);
  return mapRow(rows[0]);
};

export const findLatestParticipantId = async (prefix) => {
  const { rows } = await pool.query(
    `SELECT participant_id FROM participants
     WHERE participant_id LIKE $1
     ORDER BY participant_id DESC
     LIMIT 1`,
    [`${prefix}-%`]
  );
  return rows[0]?.participant_id;
};

export const createParticipant = async (data) => {
  const id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO participants (
      id, participant_id, full_name, industry_name, mobile, email,
      qr_code_data, qr_image, parent_participant_id, is_child_member, is_honorary
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING *`,
    [
      id,
      data.participantId,
      data.fullName,
      data.industryName,
      data.mobile,
      data.email ? data.email.toLowerCase() : null,
      data.qrCodeData,
      data.qrImage,
      data.parentParticipantId || null,
      data.isChildMember || false,
      data.isHonorary || false,
    ]
  );
  return mapRow(rows[0]);
};

export const updateParticipant = async (id, data) => {
  const fields = [];
  const values = [];
  let i = 1;

  const set = (col, val) => {
    fields.push(`${col} = $${i++}`);
    values.push(val);
  };

  if (data.fullName != null) set('full_name', data.fullName);
  if (data.industryName != null) set('industry_name', data.industryName);
  if (data.mobile != null) set('mobile', data.mobile);
  if (data.email != null) set('email', data.email.toLowerCase());
  if (data.qrCodeData != null) set('qr_code_data', data.qrCodeData);
  if (data.qrImage != null) set('qr_image', data.qrImage);
  if (data.isVerified != null) set('is_verified', data.isVerified);
  if (data.attendanceStatus != null) set('attendance_status', data.attendanceStatus);
  if (data.isHonorary != null) set('is_honorary', data.isHonorary);

  fields.push(`updated_at = NOW()`);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE participants SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
    values
  );
  return mapRow(rows[0]);
};

export const deleteParticipant = async (id) => {
  await pool.query('DELETE FROM participants WHERE id = $1', [id]);
};

export const listParticipants = async ({ whereClause, params, limit, offset, orderDir }) => {
  const countRes = await pool.query(
    `SELECT COUNT(*)::int AS total FROM participants ${whereClause}`,
    params
  );
  const { rows } = await pool.query(
    `SELECT * FROM participants ${whereClause}
     ORDER BY created_at ${orderDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { participants: mapRows(rows), total: countRes.rows[0].total };
};

export const findAllParticipants = async () => {
  const { rows } = await pool.query('SELECT * FROM participants ORDER BY created_at DESC');
  return mapRows(rows);
};

export const countParticipants = async (whereSql = '', params = []) => {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM participants ${whereSql}`,
    params
  );
  return rows[0].count;
};

export const registrationTrends = async () => {
  const { rows } = await pool.query(`
    SELECT to_char(created_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
    FROM participants
    GROUP BY 1 ORDER BY 1 ASC LIMIT 14
  `);
  return rows;
};

export const attendanceTrends = async () => {
  const { rows } = await pool.query(`
    SELECT to_char(updated_at, 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
    FROM participants
    WHERE attendance_status = 'Present'
    GROUP BY 1 ORDER BY 1 ASC LIMIT 14
  `);
  return rows;
};

export const getChildMembers = async (parentParticipantId) => {
  const { rows } = await pool.query(
    `SELECT * FROM participants 
     WHERE parent_participant_id = $1 
     ORDER BY created_at DESC`,
    [parentParticipantId]
  );
  return mapRows(rows);
};

export const deleteAllParticipants = async () => {
  await pool.query('DELETE FROM participants');
};
