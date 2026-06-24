import dotenv from 'dotenv';
import pool from '../config/pool.js';

dotenv.config();

const runMigration = async () => {
  try {
    console.log('Running migration: Create bulk_members table...');

    // Add bulk_members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bulk_members (
        id UUID PRIMARY KEY,
        industry_name VARCHAR(255) NOT NULL,
        contact_person VARCHAR(255) NOT NULL,
        mobile_no VARCHAR(20) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_bulk_members_industry ON bulk_members (industry_name);
    `);

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigration();
