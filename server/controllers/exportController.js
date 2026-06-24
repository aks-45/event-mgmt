import asyncHandler from '../utils/asyncHandler.js';
import { buildParticipantsWorkbook } from '../services/exportService.js';

export const exportExcel = asyncHandler(async (req, res) => {
  const buffer = await buildParticipantsWorkbook();
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', 'attachment; filename=participants.xlsx');
  res.send(buffer);
});
