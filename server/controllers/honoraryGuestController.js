import XLSX from 'xlsx';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import * as honoraryRepo from '../repositories/honoraryGuestRepository.js';
import { logAudit } from '../services/auditService.js';

export const uploadHonoraryGuests = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  if (!rows || rows.length === 0) throw new ApiError(400, 'Excel sheet is empty');

  // Find the header row by searching for a cell with "NAME" (case-insensitive)
  let headerRowIndex = -1;
  let nameColIndex = -1;
  let mobileColIndex = -1;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    
    // Look for "NAME" column in this row
    const nIndex = row.findIndex(
      (cell) => typeof cell === 'string' && cell.toLowerCase().trim() === 'name'
    );
    
    if (nIndex !== -1) {
      headerRowIndex = r;
      nameColIndex = nIndex;
      
      // Find the mobile column in the same row
      mobileColIndex = row.findIndex(
        (cell) =>
          typeof cell === 'string' &&
          /^(mob\.?\s*no\.?|mobile\s*no\.?|mobile|phone|contact)$/i.test(cell.toLowerCase().trim())
      );
      break;
    }
  }

  if (headerRowIndex === -1 || nameColIndex === -1) {
    throw new ApiError(400, 'Missing required column: NAME');
  }

  // Clear existing and insert new
  await honoraryRepo.clearHonoraryGuests();

  let insertedCount = 0;
  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || !Array.isArray(row)) continue;

    const fullName = String(row[nameColIndex] || '').trim();
    const rawMobile = mobileColIndex !== -1 ? String(row[mobileColIndex] || '').trim() : '';
    const mobileNo = rawMobile.split(/[,/\s]+/)[0].slice(0, 20);

    if (fullName) {
      await honoraryRepo.createHonoraryGuest({ fullName, mobileNo });
      insertedCount++;
    }
  }

  await logAudit({
    action: 'HONORARY_UPLOAD',
    entity: 'HonoraryGuests',
    user: req.user,
    details: { totalRows: rows.length, insertedCount, fileName: req.file.originalname },
    req,
  });

  res.json({
    success: true,
    message: `Uploaded ${insertedCount} honorary guests`,
    data: { totalRows: rows.length, insertedCount },
  });
});

export const getHonoraryGuests = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const guests = q
    ? await honoraryRepo.searchHonoraryGuests(q.trim())
    : await honoraryRepo.getAllHonoraryGuests();
  res.json({ success: true, data: guests });
});

export const getHonoraryStats = asyncHandler(async (req, res) => {
  const count = await honoraryRepo.countHonoraryGuests();
  res.json({ success: true, data: { totalGuests: count } });
});

export const clearHonoraryGuests = asyncHandler(async (req, res) => {
  await honoraryRepo.clearHonoraryGuests();
  await logAudit({ action: 'HONORARY_CLEAR', entity: 'HonoraryGuests', user: req.user, req });
  res.json({ success: true, message: 'All honorary guests cleared' });
});
