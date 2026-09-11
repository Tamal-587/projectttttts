import api from './api';

export const authService = {
  async register(userData) {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  async login(credentials) {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  async getMe() {
    const response = await api.get('/auth/me/');
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.patch('/auth/profile/', profileData);
    return response.data;
  },

  async changePassword(passwordData) {
    const response = await api.post('/auth/change-password/', passwordData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('taskflow_access_token');
    localStorage.removeItem('taskflow_refresh_token');
    localStorage.removeItem('taskflow_user');
  },
};

export default authService;
