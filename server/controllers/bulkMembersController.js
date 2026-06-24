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
      };
    })
    .filter(Boolean);

  res.json({ success: true, data: result });
});

export const checkInExcel = asyncHandler(async (req, res) => {
  const { industryName, fullName } = req.query;
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
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      throw new ApiError(400, 'Excel sheet is empty');
    }

    // Validate columns exist
    const firstRow = data[0];
    const requiredColumns = ['Name', 'Contact person', 'Mobile No.'];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    
    if (missingColumns.length > 0) {
      throw new ApiError(
        400,
        `Missing required columns: ${missingColumns.join(', ')}`
      );
    }

    // Clear existing data
    await bulkRepo.clearBulkMembers();

    // Insert new data
    let insertedCount = 0;
    for (const row of data) {
      const industryName = String(row.Name || '').trim();
      const contactPerson = String(row['Contact person'] || '').trim();
      const mobileNo = String(row['Mobile No.'] || '').trim().split(/[,/\s]+/)[0].slice(0, 20);

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
        totalRows: data.length,
        insertedCount,
        fileName: req.file.originalname,
      },
      req,
    });

    res.json({
      success: true,
      message: `Uploaded ${insertedCount} members from Excel sheet`,
      data: {
        totalRows: data.length,
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
