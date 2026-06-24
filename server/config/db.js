import pool from './pool.js';

const connectDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('PostgreSQL connected (local)');
  } finally {
    client.release();
  }
};

export default connectDB;
export { pool };
