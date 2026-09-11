import api from './api';

export const workspaceService = {
  async getWorkspaces() {
    const response = await api.get('/workspaces/');
    return response.data?.results || response.data || [];
  },

  async getWorkspace(slug) {
    const response = await api.get(`/workspaces/${slug}/`);
    return response.data;
  },

  async createWorkspace(data) {
    const response = await api.post('/workspaces/', data);
    return response.data;
  },

  async updateWorkspace(slug, data) {
    const response = await api.patch(`/workspaces/${slug}/`, data);
    return response.data;
  },

  async deleteWorkspace(slug) {
    const response = await api.delete(`/workspaces/${slug}/`);
    return response.data;
  },

  async getMembers(slug) {
    const response = await api.get(`/workspaces/${slug}/members/`);
    return response.data;
  },

  async addMember(slug, data) {
    const response = await api.post(`/workspaces/${slug}/members/`, data);
    return response.data;
  },

  async updateMemberRole(slug, memberId, role) {
    const response = await api.patch(`/workspaces/${slug}/members/${memberId}/`, { role });
    return response.data;
  },

  async removeMember(slug, memberId) {
    const response = await api.delete(`/workspaces/${slug}/members/${memberId}/`);
    return response.data;
  },

  async getAnalytics(slug) {
    const response = await api.get(`/workspaces/${slug}/analytics/`);
    return response.data;
  },

  async getActivity(slug) {
    const response = await api.get(`/workspaces/${slug}/activity/`);
    return response.data;
  },
};

export default workspaceService;
