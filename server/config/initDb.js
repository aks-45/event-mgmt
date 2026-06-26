import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const initSchema = async () => {
  const schemaPath = path.join(__dirname, '../sql/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // Split on semicolons, skip blank lines and pure comments
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.replace(/--.*$/gm, '').trim().length > 0);

  for (const stmt of statements) {
    const cleaned = stmt.replace(/--.*$/gm, '').trim();
    if (!cleaned) continue;
    try {
      await pool.query(stmt);
    } catch (err) {
      // Ignore "already exists" and "does not exist" errors — they are safe
      if (
        err.code === '42701' || // column already exists
        err.code === '42P07' || // relation already exists
        err.code === '42710' || // constraint already exists
        err.code === '23505' || // unique violation (index)
        err.message.includes('already exists')
      ) {
        continue;
      }
      throw err;
    }
  }

  console.log('Database schema ready.');
};
