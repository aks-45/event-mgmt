import 'dotenv/config';
import pool from './pool.js';
import * as userRepo from '../repositories/userRepository.js';
import * as eventSettingsRepo from '../repositories/eventSettingsRepository.js';
import * as attendanceRepo from '../repositories/attendanceRepository.js';
import * as auditRepo from '../repositories/auditRepository.js';
import * as participantRepo from '../repositories/participantRepository.js';
import { hashPassword } from '../utils/password.js';

const seed = async () => {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@iia.org';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123';
  const operatorEmail = process.env.SEED_OPERATOR_EMAIL || 'operator@iia.org';
  const operatorPassword = process.env.SEED_OPERATOR_PASSWORD || 'Operator@123';

  await attendanceRepo.deleteAllAttendance();
  await auditRepo.deleteAllAuditLogs();
  await participantRepo.deleteAllParticipants();
  await userRepo.deleteAllUsers();
  await eventSettingsRepo.deleteAllSettings();

  await userRepo.createUser({
    name: 'IIA Admin',
    email: adminEmail,
    password: await hashPassword(adminPassword),
    role: 'admin',
  });

  await userRepo.createUser({
    name: 'Registration Desk',
    email: operatorEmail,
    password: await hashPassword(operatorPassword),
    role: 'operator',
  });

  await eventSettingsRepo.createSettings({
    eventId: 'IIA2026',
    eventName: process.env.EVENT_NAME || 'IIA Annual Industrial Meet 2026',
    eventPrefix: process.env.EVENT_PREFIX || 'IIA2026',
    idPrefix: 'IIA2026',
    isActive: true,
  });

  console.log('Seed completed.');
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Operator: ${operatorEmail} / ${operatorPassword}`);
  await pool.end();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
