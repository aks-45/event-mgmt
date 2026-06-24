import * as participantRepo from '../repositories/participantRepository.js';

const PREFIX = () => process.env.EVENT_PREFIX || 'IIA2026';

export const generateNextParticipantId = async () => {
  const prefix = PREFIX();
  const regex = new RegExp(`^${prefix}-(\\d+)$`);
  const latest = await participantRepo.findLatestParticipantId(prefix);

  let nextNum = 1;
  if (latest) {
    const match = latest.match(regex);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }

  return `${prefix}-${String(nextNum).padStart(6, '0')}`;
};
