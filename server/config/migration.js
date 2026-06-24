import dotenv from 'dotenv';
import pool from '../config/pool.js';

dotenv.config();

const runMigration = async () => {
  try {
    console.log('Running migration: Add child member columns...');

    // Add columns to participants table
    await pool.query(`
      ALTER TABLE participants 
      ADD COLUMN IF NOT EXISTS parent_participant_id VARCHAR(32),
      ADD COLUMN IF NOT EXISTS is_child_member BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_participants_parent ON participants (parent_participant_id);
      CREATE INDEX IF NOT EXISTS idx_participants_child_member ON participants (is_child_member);
    `);

    // Add column to otp_verifications table
    await pool.query(`
      ALTER TABLE otp_verifications 
      ADD COLUMN IF NOT EXISTS parent_participant_id VARCHAR(32);
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
