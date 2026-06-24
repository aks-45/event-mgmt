import api from './api';

export const login = (credentials) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');
export const registerUser = (data) => api.post('/auth/register', data);
