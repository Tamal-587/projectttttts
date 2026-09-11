import api from './api';

export const postService = {
  async getPosts(params = {}) {
    const response = await api.get('/posts/', { params });
    return response.data?.results || response.data || [];
  },

  async getPost(id) {
    const response = await api.get(`/posts/${id}/`);
    return response.data;
  },

  async createPost(data) {
    const response = await api.post('/posts/', data);
    return response.data;
  },

  async updatePost(id, data) {
    const response = await api.patch(`/posts/${id}/`, data);
    return response.data;
  },

  async deletePost(id) {
    const response = await api.delete(`/posts/${id}/`);
    return response.data;
  },

  async toggleLike(id) {
    const response = await api.post(`/posts/${id}/like/`);
    return response.data;
  },

  async getComments(postId) {
    const response = await api.get(`/posts/${postId}/comments/`);
    return response.data;
  },

  async addComment(postId, content) {
    const response = await api.post(`/posts/${postId}/comments/`, { content });
    return response.data;
  },

  async deleteComment(commentId) {
    const response = await api.delete(`/post-comments/${commentId}/`);
    return response.data;
  },

  async getUsers(params = {}) {
    const response = await api.get('/users/', { params });
    return response.data?.results || response.data || [];
  },

  async getUser(username) {
    const response = await api.get(`/users/${username}/`);
    return response.data;
  },

  async toggleFollow(username) {
    const response = await api.post(`/users/${username}/follow/`);
    return response.data;
  },
};

export default postService;
