import api from './api';

export const uploadHonoraryGuests = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/honorary-guests/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getHonoraryGuestStats = () => api.get('/honorary-guests/stats');

export const searchHonoraryGuests = (q) =>
  api.get('/honorary-guests', { params: { q } });

export const clearAllHonoraryGuests = () => api.delete('/honorary-guests/clear');
