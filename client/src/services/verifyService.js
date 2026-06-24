import api from './api';

export const verifyQr = (qrData, location) =>
  api.post('/verify', { qrData, location });
