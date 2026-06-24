import XLSX from 'xlsx';
import * as participantRepo from '../repositories/participantRepository.js';

export const buildParticipantsWorkbook = async () => {
  const participants = await participantRepo.findAllParticipants();

  const rows = participants.map((p) => ({
    'Participant ID': p.participantId,
    Name: p.fullName,
    Industry: p.industryName,
    Mobile: p.mobile,
    Email: p.email,
    Attendance: p.attendanceStatus,
    Verified: p.isVerified ? 'Yes' : 'No',
    'Registration Date': new Date(p.createdAt).toLocaleString('en-IN'),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

export const parseBulkImport = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map((row) => ({
    fullName: row['Name'] || row['Full Name'] || row.fullName || row.name,
    industryName: row['Industry'] || row.industryName || row.industry,
    mobile: String(row['Mobile'] || row.mobile || ''),
    email: row['Email'] || row.email || '',
  }));
};
