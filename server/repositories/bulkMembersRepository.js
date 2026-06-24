import { v4 as uuidv4 } from 'uuid';
import pool from '../config/pool.js';
import { mapRow, mapRows } from '../utils/mapRow.js';

export const createBulkMember = async (data) => {
  const id = uuidv4();
  const { rows } = await pool.query(
    `INSERT INTO bulk_members (id, industry_name, contact_person, mobile_no)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id, data.industryName, data.contactPerson, data.mobileNo]
  );
  return mapRow(rows[0]);
};

export const findMemberByIndustry = async (industryName) => {
  const { rows } = await pool.query(
    `SELECT * FROM bulk_members 
     WHERE LOWER(industry_name) = LOWER($1)
     LIMIT 1`,
    [industryName]
  );
  return mapRow(rows[0]);
};

export const searchBulkMembersByName = async (q) => {
  const { rows } = await pool.query(
    `SELECT * FROM bulk_members
     WHERE industry_name ILIKE $1
        OR contact_person ILIKE $1
        OR mobile_no ILIKE $1
     ORDER BY industry_name ASC
     LIMIT 10`,
    [`%${q}%`]
  );
  return mapRows(rows);
};

export const getAllBulkMembers = async () => {
  const { rows } = await pool.query(
    `SELECT * FROM bulk_members ORDER BY industry_name ASC`
  );
  return mapRows(rows);
};

export const clearBulkMembers = async () => {
  await pool.query('DELETE FROM bulk_members');
};

export const countBulkMembers = async () => {
  const { rows } = await pool.query('SELECT COUNT(*) as count FROM bulk_members');
  return parseInt(rows[0].count, 10);
};

export const deleteBulkMember = async (id) => {
  await pool.query('DELETE FROM bulk_members WHERE id = $1', [id]);
};
