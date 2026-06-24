import api from './api';

export const createGuest = (data) => api.post('/guests', data);
export const getGuests = (params) => api.get('/guests', { params });
export const deleteGuest = (id) => api.delete(`/guests/${id}`);
