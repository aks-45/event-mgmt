import QRCode from 'qrcode';

const EVENT_NAME = () =>
  process.env.EVENT_NAME || 'IIA Annual Industrial Meet 2026';

export const buildQrPayload = ({ participantId, name, industry }) => ({
  participantId,
  name,
  industry,
  event: EVENT_NAME(),
});

export const generateQrImage = async (payload) => {
  const data = JSON.stringify(payload);
  const qrImage = await QRCode.toDataURL(data, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 1,
    margin: 1,
    width: 512,
    color: { dark: '#000000', light: '#FFFFFF' },
  });
  return { qrCodeData: data, qrImage };
};

export const parseQrPayload = (raw) => {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed?.participantId) return null;
    return parsed;
  } catch {
    return null;
  }
};
