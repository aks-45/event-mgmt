import asyncHandler from '../utils/asyncHandler.js';
import * as settingsRepo from '../repositories/eventSettingsRepository.js';
import { toApiDoc } from '../utils/serialize.js';

export const getSettings = asyncHandler(async (req, res) => {
  let settings = await settingsRepo.findActiveSettings();

  if (!settings) {
    settings = await settingsRepo.createSettings({
      eventId: 'IIA2026',
      eventName: process.env.EVENT_NAME || 'IIA Annual Industrial Meet 2026',
      eventPrefix: process.env.EVENT_PREFIX || 'IIA2026',
      idPrefix: 'IIA2026',
    });
  }

  res.json({ success: true, data: toApiDoc(settings) });
});

export const updateSettings = asyncHandler(async (req, res) => {
  const eventId = req.body.eventId || 'IIA2026';
  const existing = await settingsRepo.findActiveSettings();
  const branding =
    req.body.branding == null
      ? undefined
      : {
          ...(existing?.branding || {}),
          ...req.body.branding,
        };
  const settings = await settingsRepo.upsertSettings(eventId, {
    eventName: req.body.eventName,
    eventPrefix: req.body.eventPrefix,
    idPrefix: req.body.idPrefix,
    isActive: req.body.isActive,
    branding,
  });

  res.json({ success: true, data: toApiDoc(settings) });
});
