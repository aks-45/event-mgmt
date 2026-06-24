import asyncHandler from '../utils/asyncHandler.js';
import * as auditRepo from '../repositories/auditRepository.js';
import { toApiDoc } from '../utils/serialize.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const { logs, total } = await auditRepo.listAuditLogs({
    limit: Number(limit),
    offset: skip,
  });

  res.json({
    success: true,
    data: toApiDoc(logs),
    pagination: { page: Number(page), limit: Number(limit), total },
  });
});
