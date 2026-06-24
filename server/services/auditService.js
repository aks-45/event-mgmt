import * as auditRepo from '../repositories/auditRepository.js';

export const logAudit = async ({ action, entity, entityId, user, details, req }) => {
  try {
    await auditRepo.createAuditLog({
      action,
      entity,
      entityId: entityId?.toString(),
      performedById: user?._id || user?.id,
      performedByName: user?.name,
      details,
      ip: req?.ip || req?.headers?.['x-forwarded-for'],
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};
