import XLSX from 'xlsx';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import * as bulkRepo from '../repositories/bulkMembersRepository.js';
import { logAudit } from '../services/auditService.js';

const parseContactPerson = (contactPerson) => {
  if (!contactPerson) return [];
  return contactPerson
    .split(/[,/&]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
};

export const liveSearchMembers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json({ success: true, data: [] });

  const members = await bulkRepo.searchBulkMembersByName(q.trim());

  // Get all registered full names (participants + guests) lowercased
  const pool = (await import('../config/pool.js')).default;
  const { rows: usedNames } = await pool.query(
    `SELECT LOWER(full_name) AS n FROM participants
     UNION
     SELECT LOWER(full_name) FROM guests`
  );
  const usedSet = new Set(usedNames.map((r) => r.n));

  const result = members
    .map((m) => {
      const availableNames = parseContactPerson(m.contactPerson)
        .filter((n) => !usedSet.has(n.toLowerCase()));
      if (!availableNames.length) return null;
      return {
        industryName: m.industryName,
        names: availableNames,
        mobileNo: m.mobileNo,
        isHonorary: false,
      };
    })
    .filter(Boolean);

  // Also search honorary guests
  const { searchHonoraryGuests } = await import('../repositories/honoraryGuestRepository.js');
  const honoraryGuests = await searchHonoraryGuests(q.trim());
  for (const hg of honoraryGuests) {
    if (!usedSet.has(hg.fullName.toLowerCase())) {
      result.push({
        industryName: 'Honorary Guest',
        names: [hg.fullName],
        mobileNo: hg.mobileNo || '',
        isHonorary: true,
      });
    }
  }

  res.json({ success: true, data: result });
});

export const checkInExcel = asyncHandler(async (req, res) => {
  const { industryName, fullName } = req.query;

  if (industryName?.trim() === 'Honorary Guest') {
    const { searchHonoraryGuests } = await import('../repositories/honoraryGuestRepository.js');
    const honoraryGuests = await searchHonoraryGuests(fullName?.trim() || '');
    const foundGuest = honoraryGuests.find(
      (hg) => hg.fullName.toLowerCase() === fullName?.trim().toLowerCase()
    );
    if (foundGuest) {
      return res.json({
        success: true,
        data: {
          found: true,
          nameMatch: true,
          names: [foundGuest.fullName],
          mobileNo: foundGuest.mobileNo || '',
        },
      });
    }
  }

  const member = industryName ? await bulkRepo.findMemberByIndustry(industryName.trim()) : null;

  if (!member) return res.json({ success: true, data: { found: false } });

  const pool = (await import('../config/pool.js')).default;
  const { rows: usedNames } = await pool.query(
    `SELECT LOWER(full_name) AS n FROM participants UNION SELECT LOWER(full_name) FROM guests`
  );
  const usedSet = new Set(usedNames.map((r) => r.n));

  const names = parseContactPerson(member.contactPerson)
    .filter((n) => !usedSet.has(n.toLowerCase()));

  const nameMatch = !fullName || names.some(
    (n) => n.toLowerCase() === fullName.trim().toLowerCase()
  );

  res.json({ success: true, data: { found: true, nameMatch, names, mobileNo: member.mobileNo } });
});

export const uploadBulkMembers = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded');
  }

  try {
    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (!rows || rows.length === 0) {
      throw new ApiError(400, 'Excel sheet is empty');
    }

    // Find the header row by searching for a row containing 'Name', 'Contact person', 'Mobile No.'
    let headerRowIndex = -1;
    let industryColIndex = -1;
    let contactColIndex = -1;
    let mobileColIndex = -1;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      const indIdx = row.findIndex(
        (cell) => typeof cell === 'string' && cell.toLowerCase().trim() === 'name'
      );
      const contactIdx = row.findIndex(
        (cell) => typeof cell === 'string' && cell.toLowerCase().trim() === 'contact person'
      );
      const mobIdx = row.findIndex(
        (cell) =>
          typeof cell === 'string' &&
          /^(mob\.?\s*no\.?|mobile\s*no\.?|mobile)$/i.test(cell.toLowerCase().trim())
      );

      if (indIdx !== -1 && contactIdx !== -1 && mobIdx !== -1) {
        headerRowIndex = r;
        industryColIndex = indIdx;
        contactColIndex = contactIdx;
        mobileColIndex = mobIdx;
        break;
      }
    }

    if (headerRowIndex === -1) {
      throw new ApiError(
        400,
        `Missing required columns: Name, Contact person, Mobile No. (Ensure your sheet has these headers)`
      );
    }

    // Clear existing data
    await bulkRepo.clearBulkMembers();

    // Insert new data
    let insertedCount = 0;
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !Array.isArray(row)) continue;

      const industryName = String(row[industryColIndex] || '').trim();
      const contactPerson = String(row[contactColIndex] || '').trim();
      const mobileNo = String(row[mobileColIndex] || '').trim().split(/[,/\s]+/)[0].slice(0, 20);

      if (industryName && contactPerson && mobileNo) {
        await bulkRepo.createBulkMember({
          industryName,
          contactPerson,
          mobileNo,
        });
        insertedCount++;
      }
    }

    await logAudit({
      action: 'BULK_UPLOAD',
      entity: 'BulkMembers',
      user: req.user,
      details: {
        totalRows: rows.length,
        insertedCount,
        fileName: req.file.originalname,
      },
      req,
    });

    res.json({
      success: true,
      message: `Uploaded ${insertedCount} members from Excel sheet`,
      data: {
        totalRows: rows.length,
        insertedCount,
      },
    });
  } catch (error) {
    if (error.message.includes('Missing required columns')) {
      throw error;
    }
    throw new ApiError(400, `Excel parsing error: ${error.message}`);
  }
});

export const searchMemberByIndustry = asyncHandler(async (req, res) => {
  const { industryName } = req.query;

  if (!industryName || industryName.trim().length === 0) {
    throw new ApiError(400, 'Industry name is required');
  }

  const member = await bulkRepo.findMemberByIndustry(industryName);

  if (!member) {
    return res.json({
      success: true,
      data: null,
      message: 'No member found for this industry',
    });
  }

  // Parse contact person into multiple names
  const names = parseContactPerson(member.contactPerson);

  res.json({
    success: true,
    data: {
      industryName: member.industryName,
      contactPersonRaw: member.contactPerson,
      names, // Array of individual names
      primaryName: names[0] || member.contactPerson,
      mobileNo: member.mobileNo,
    },
  });
});

export const getBulkMembersStats = asyncHandler(async (req, res) => {
  const count = await bulkRepo.countBulkMembers();
  
  res.json({
    success: true,
    data: {
      totalMembers: count,
    },
  });
});

export const clearAllBulkMembers = asyncHandler(async (req, res) => {
  await bulkRepo.clearBulkMembers();

  await logAudit({
    action: 'BULK_CLEAR',
    entity: 'BulkMembers',
    user: req.user,
    req,
  });

  res.json({
    success: true,
    message: 'All bulk members cleared',
  });
});
