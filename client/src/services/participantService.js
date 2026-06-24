import api from './api';

export const getParticipants = (params) => api.get('/participants', { params });
export const getParticipant = (id) => api.get(`/participants/${id}`);
export const createParticipant = (data) => api.post('/participants', data);
export const addSameIndustryMember = (id, data) =>
  api.post(`/participants/${id}/add-member`, data);
export const verifyAndConfirmMember = (data) =>
  api.post('/participants/member/verify-otp', data);
export const updateParticipant = (id, data) => api.put(`/participants/${id}`, data);
export const deleteParticipant = (id) => api.delete(`/participants/${id}`);
export const getDashboardStats = () => api.get('/participants/stats/dashboard');
export const liveSearchMembers = (q) => api.get('/bulk-members/live-search', { params: { q } });
export const checkInExcel = (industryName, fullName) => api.get('/bulk-members/check', { params: { industryName, fullName } });

export const bulkImport = async (file) => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  const base64 = btoa(binary);
  return api.post('/participants/bulk-import', { file: base64 });
};
