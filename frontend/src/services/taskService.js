import api from './api';

export const taskService = {
  async getTasks(params = {}) {
    const response = await api.get('/tasks/', { params });
    return response.data?.results || response.data || [];
  },

  async getTask(id) {
    const response = await api.get(`/tasks/${id}/`);
    return response.data;
  },

  async createTask(data) {
    const response = await api.post('/tasks/', data);
    return response.data;
  },

  async updateTask(id, data) {
    const response = await api.patch(`/tasks/${id}/`, data);
    return response.data;
  },

  async quickStatusUpdate(id, status, order = 0) {
    const response = await api.patch(`/tasks/${id}/status/`, { status, order });
    return response.data;
  },

  async deleteTask(id) {
    const response = await api.delete(`/tasks/${id}/`);
    return response.data;
  },

  async getComments(taskId) {
    const response = await api.get('/comments/', { params: { task: taskId } });
    return response.data?.results || response.data || [];
  },

  async addComment(taskId, content) {
    const response = await api.post('/comments/', { task: taskId, content });
    return response.data;
  },

  async deleteComment(commentId) {
    const response = await api.delete(`/comments/${commentId}/`);
    return response.data;
  },
};

export default taskService;
