import apiClient from './client';

export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  refreshToken: () => apiClient.post('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
};

export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.patch('/users/profile', data),
  getById: (id) => apiClient.get(`/users/${id}`),
};

export const coursesAPI = {
  list: (params) => apiClient.get('/courses', { params }),
  getById: (id) => apiClient.get(`/courses/${id}`),
  getEnrolled: () => apiClient.get('/courses/enrolled'),
  enroll: (courseId) => apiClient.post(`/courses/${courseId}/enroll`),
  getProgress: (courseId) => apiClient.get(`/courses/${courseId}/progress`),
};

export const lessonsAPI = {
  getByCourse: (courseId) => apiClient.get(`/lessons/courses/${courseId}`),
  getById: (id) => apiClient.get(`/lessons/${id}`),
  getVideoUrl: (lessonId) => apiClient.get(`/lessons/${lessonId}/video-url`),
  create: (courseId, data, file) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    if (file) formData.append('video', file);
    return apiClient.post(`/lessons/courses/${courseId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id, data, file) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    if (file) formData.append('video', file);
    return apiClient.put(`/lessons/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (id) => apiClient.delete(`/lessons/${id}`),
  markComplete: (lessonId) => apiClient.post(`/lessons/${lessonId}/complete`),
};

export const eventsAPI = {
  list: (params) => apiClient.get('/events', { params }),
  getById: (id) => apiClient.get(`/events/${id}`),
  getRSVPStatus: (eventId) => apiClient.get(`/events/${eventId}/rsvp-status`),
  rsvp: (eventId) => apiClient.post(`/events/${eventId}/rsvp`),
  cancelRSVP: (eventId) => apiClient.delete(`/events/${eventId}/rsvp`),
};

export const documentsAPI = {
  list: (params) => apiClient.get('/documents', { params }),
  getById: (id) => apiClient.get(`/documents/${id}`),
  upload: (formData) => apiClient.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const notificationsAPI = {
  list: () => apiClient.get('/notifications'),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/mark-all-read'),
};

export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getUserStats: () => apiClient.get('/analytics/user-stats'),
};

export const projectsAPI = {
  list: (params) => apiClient.get('/projects', { params }),
  getById: (id) => apiClient.get(`/projects/${id}`),
};

export const communityAPI = {
  getStats: () => apiClient.get('/community/stats'),
  listMembers: (params) => apiClient.get('/community/members', { params }),
};
