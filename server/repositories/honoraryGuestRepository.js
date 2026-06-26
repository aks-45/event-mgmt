import { v4 as uuidv4 } from 'uuid';
import pool from '../config/pool.js';
import { mapRow, mapRows } from '../utils/mapRow.js';

export const createHonoraryGuest = async ({ fullName, mobileNo }) => {
  const id = uuidv4();
  const { rows } = await pool.query(
    `INSERT INTO honorary_guests (id, full_name, mobile_no)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [id, fullName, mobileNo || null]
  );
  return mapRow(rows[0]);
};

export const getAllHonoraryGuests = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM honorary_guests ORDER BY full_name ASC`
  );
  return mapRows(rows);
};

export const searchHonoraryGuests = async (q) => {
  const { rows } = await pool.query(
    `SELECT * FROM honorary_guests
     WHERE full_name ILIKE $1
     ORDER BY full_name ASC
     LIMIT 20`,
    [`%${q}%`]
  );
  return mapRows(rows);
};

export const clearHonoraryGuests = async () => {
  await pool.query('DELETE FROM honorary_guests');
};

export const countHonoraryGuests = async () => {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM honorary_guests');
  return parseInt(rows[0].count, 10);
};
