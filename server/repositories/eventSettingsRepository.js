import { randomUUID } from 'crypto';
import pool from '../config/pool.js';
import { mapRow } from '../utils/mapRow.js';

export const findActiveSettings = async () => {
  const { rows } = await pool.query(
    'SELECT * FROM event_settings WHERE is_active = TRUE LIMIT 1'
  );
  return mapRow(rows[0]);
};

export const createSettings = async (data) => {
  const id = randomUUID();
  const { rows } = await pool.query(
    `INSERT INTO event_settings (id, event_id, event_name, event_prefix, id_prefix, is_active, branding)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [
      id,
      data.eventId,
      data.eventName,
      data.eventPrefix,
      data.idPrefix,
      data.isActive ?? true,
      data.branding ? JSON.stringify(data.branding) : null,
    ]
  );
  return mapRow(rows[0]);
};

export const upsertSettings = async (eventId, data) => {
  const existing = await pool.query(
    'SELECT id FROM event_settings WHERE event_id = $1',
    [eventId]
  );

  if (existing.rows.length) {
    const { rows } = await pool.query(
      `UPDATE event_settings SET
        event_name = COALESCE($2, event_name),
        event_prefix = COALESCE($3, event_prefix),
        id_prefix = COALESCE($4, id_prefix),
        is_active = COALESCE($5, is_active),
        branding = COALESCE($6, branding),
        updated_at = NOW()
       WHERE event_id = $1
       RETURNING *`,
      [
        eventId,
        data.eventName,
        data.eventPrefix,
        data.idPrefix,
        data.isActive,
        data.branding ? JSON.stringify(data.branding) : null,
      ]
    );
    return mapRow(rows[0]);
  }

  return createSettings({ eventId, ...data });
};

export const deleteAllSettings = async () => {
  await pool.query('DELETE FROM event_settings');
};
