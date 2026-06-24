import { randomUUID } from 'crypto';
import pool from '../config/pool.js';
import { mapRow } from '../utils/mapRow.js';

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
    email.toLowerCase(),
  ]);
  return mapRow(rows[0]);
};

export const findUserById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return mapRow(rows[0]);
};

export const createUser = async ({ name, email, password, role }) => {
  const id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO users (id, name, email, password, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, name, email.toLowerCase(), password, role]
  );
  return mapRow(rows[0]);
};

export const deleteAllUsers = async () => {
  await pool.query('DELETE FROM users');
};
