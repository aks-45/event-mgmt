import 'dotenv/config';
import { initSchema } from './initDb.js';
import pool from './pool.js';

initSchema()
  .then(() => {
    console.log('Tables created successfully.');
    return pool.end();
  })
  .catch(async (err) => {
    console.error('Database init failed:', err.message);
    await pool.end();
    process.exit(1);
  });
