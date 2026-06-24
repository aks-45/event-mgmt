import api from './api';

export const getAttendance = (params) => api.get('/attendance', { params });
export const getPendingAttendance = () => api.get('/attendance/pending');
export const markManualAttendance = (data) => api.post('/attendance/manual', data);
