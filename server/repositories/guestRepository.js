import { randomUUID } from 'crypto';
import pool from '../config/pool.js';
import { mapRow, mapRows } from '../utils/mapRow.js';

export const createGuest = async (data) => {
  const id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO guests (id, guest_id, full_name, industry_name, mobile, email, payment_mode, amount, qr_code_data, qr_image, is_honorary)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [
      id, data.guestId, data.fullName, data.industryName || null,
      data.mobile, data.email ? data.email.toLowerCase() : null,
      data.paymentMode || null, data.amount ?? 1500, data.qrCodeData, data.qrImage,
      data.isHonorary || false,
    ]
  );
  return mapRow(rows[0]);
};

export const findGuestByMobile = async (mobile, excludeId) => {
  let sql = 'SELECT * FROM guests WHERE mobile = $1';
  const params = [mobile];
  if (excludeId) { sql += ' AND id != $2'; params.push(excludeId); }
  const { rows } = await pool.query(sql + ' LIMIT 1', params);
  return mapRow(rows[0]);
};

export const listGuests = async ({ whereClause = '', params = [], limit, offset, orderDir = 'DESC' }) => {
  const countRes = await pool.query(`SELECT COUNT(*)::int AS total FROM guests ${whereClause}`, params);
  const { rows } = await pool.query(
    `SELECT * FROM guests ${whereClause} ORDER BY created_at ${orderDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { guests: mapRows(rows), total: countRes.rows[0].total };
};

export const findGuestById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM guests WHERE id = $1', [id]);
  return mapRow(rows[0]);
};

export const findGuestByGuestId = async (guestId) => {
  const { rows } = await pool.query('SELECT * FROM guests WHERE guest_id = $1', [guestId]);
  return mapRow(rows[0]);
};

export const deleteGuest = async (id) => {
  await pool.query('DELETE FROM guests WHERE id = $1', [id]);
};

export const getTotalCollection = async () => {
  const { rows } = await pool.query('SELECT COALESCE(SUM(amount),0)::int AS total FROM guests');
  return rows[0].total;
};

export const countGuests = async () => {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM guests');
  return rows[0].count;
};

export const findLatestGuestId = async (prefix) => {
  const { rows } = await pool.query(
    `SELECT guest_id FROM guests WHERE guest_id LIKE $1 ORDER BY guest_id DESC LIMIT 1`,
    [`${prefix}-%`]
  );
  return rows[0]?.guest_id;
};
