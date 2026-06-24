import { randomUUID } from 'crypto';
import pool from '../config/pool.js';
import { mapRow, mapRows } from '../utils/mapRow.js';

export const createAuditLog = async (data) => {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO audit_logs (
      id, action, entity, entity_id, performed_by_id, performed_by_name, details, ip
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      data.action,
      data.entity,
      data.entityId,
      data.performedById,
      data.performedByName,
      data.details ? JSON.stringify(data.details) : null,
      data.ip,
    ]
  );
};

export const listAuditLogs = async ({ limit, offset }) => {
  const countRes = await pool.query('SELECT COUNT(*)::int AS total FROM audit_logs');
  const { rows } = await pool.query(
    `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { logs: mapRows(rows), total: countRes.rows[0].total };
};

export const deleteAllAuditLogs = async () => {
  await pool.query('DELETE FROM audit_logs');
};
