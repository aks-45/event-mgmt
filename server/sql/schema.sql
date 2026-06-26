-- Run once against local PostgreSQL (or let npm run db:init do it)
-- CREATE DATABASE iia_event;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY,
  participant_id VARCHAR(32) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  industry_name VARCHAR(255) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  qr_code_data TEXT NOT NULL,
  qr_image TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  attendance_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
    CHECK (attendance_status IN ('Pending', 'Present', 'Absent')),
  parent_participant_id VARCHAR(32),
  is_child_member BOOLEAN NOT NULL DEFAULT FALSE,
  event_id VARCHAR(32) NOT NULL DEFAULT 'IIA2026',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participants_email_mobile ON participants (email, mobile);
CREATE INDEX IF NOT EXISTS idx_participants_search ON participants (participant_id, full_name, industry_name);
CREATE INDEX IF NOT EXISTS idx_participants_parent ON participants (parent_participant_id);
CREATE INDEX IF NOT EXISTS idx_participants_child_member ON participants (is_child_member);

-- Safe migrations: add columns if they don't exist yet
ALTER TABLE participants ADD COLUMN IF NOT EXISTS parent_participant_id VARCHAR(32);
ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_child_member BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS event_id VARCHAR(32) NOT NULL DEFAULT 'IIA2026';
ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_honorary BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE participants ALTER COLUMN email DROP NOT NULL;

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY,
  participant_id VARCHAR(32) NOT NULL,
  participant_ref_id UUID REFERENCES participants(id) ON DELETE SET NULL,
  scan_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  scanner_name VARCHAR(255),
  location VARCHAR(255) NOT NULL DEFAULT 'Main Entrance',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_participant_scan ON attendance (participant_id, scan_time DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY,
  action VARCHAR(64) NOT NULL,
  entity VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64),
  performed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(255),
  details JSONB,
  ip VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_settings (
  id UUID PRIMARY KEY,
  event_id VARCHAR(32) NOT NULL UNIQUE,
  event_name VARCHAR(255) NOT NULL,
  event_prefix VARCHAR(32) NOT NULL,
  id_prefix VARCHAR(32) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  branding JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY,
  participant_id VARCHAR(32) NOT NULL,
  parent_participant_id VARCHAR(32),
  mobile VARCHAR(20) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_participant_mobile ON otp_verifications (participant_id, mobile);
CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verifications (expires_at);

CREATE TABLE IF NOT EXISTS bulk_members (
  id UUID PRIMARY KEY,
  industry_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  mobile_no VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bulk_members_industry ON bulk_members (industry_name);

CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY,
  guest_id VARCHAR(32) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  industry_name VARCHAR(255),
  mobile VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  payment_mode VARCHAR(10) CHECK (payment_mode IN ('Cash', 'Online')),
  amount INTEGER NOT NULL DEFAULT 0,
  qr_code_data TEXT NOT NULL,
  qr_image TEXT NOT NULL,
  is_honorary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guests_mobile ON guests (mobile);

-- Safe migration for guests table
ALTER TABLE guests ALTER COLUMN payment_mode DROP NOT NULL;
ALTER TABLE guests ALTER COLUMN amount SET DEFAULT 0;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS is_honorary BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS honorary_guests (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  mobile_no VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_honorary_guests_name ON honorary_guests (full_name);

-- Sequences for atomic ID generation (safe across concurrent connections)
CREATE SEQUENCE IF NOT EXISTS participant_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS guest_id_seq START 1;

-- Unique constraints to prevent duplicate registrations from concurrent computers
CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_unique_name_industry
  ON participants (LOWER(full_name), LOWER(industry_name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_guests_unique_name_industry
  ON guests (LOWER(full_name), LOWER(COALESCE(industry_name, '')));
