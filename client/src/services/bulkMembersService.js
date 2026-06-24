import api from './api';

export const uploadBulkMembers = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/bulk-members/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const searchMemberByIndustry = (industryName) => {
  return api.get('/bulk-members/search', {
    params: { industryName },
  });
};

export const getBulkMembersStats = () => api.get('/bulk-members/stats');

export const clearAllBulkMembers = () => api.delete('/bulk-members/clear');
