import apiClient from './client';

export const authAPI = {
  login: (credentials, config = {}) => apiClient.post('/auth/login', credentials, config),
  register: (data, config = {}) => apiClient.post('/auth/register', data, config),
  googleAuth: (googleData, config = {}) => apiClient.post('/auth/google', googleData, config),
  refreshToken: (config = {}) => apiClient.post('/auth/refresh', { refreshToken: localStorage.getItem('refreshToken') }, config),
  forgotPassword: (email, config = {}) => apiClient.post('/auth/forgot-password', { email }, config),
  resendVerification: (email, config = {}) => apiClient.post('/auth/resend-verification', { email }, config),
  verifyEmail: (token, config = {}) => apiClient.post('/auth/verify-email', { token }, config),
  verifyCode: (email, code, config = {}) => apiClient.post('/auth/verify-code', { email, code }, config),
  resetPassword: (email, code, password, config = {}) => apiClient.post('/auth/reset-password', { email, code, password }, config),
  logout: (config = {}) => apiClient.post('/auth/logout', {}, config),
};

export const usersAPI = {
  getProfile: () => apiClient.get('/users/me'),
  getAll: (params) => apiClient.get('/users', { params }),
  updateProfile: (data) => apiClient.patch('/users/me', data),
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
  getYouTubeProxy: (videoId) => apiClient.post(`/lessons/youtube-proxy/${videoId}`),
  trackWatch: (data) => apiClient.post('/lessons/track/watch', data),
  getAnalytics: (courseId) => apiClient.get(`/lessons/track/analytics/${courseId}`),
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
  create: (data) => apiClient.post('/events', data),
  update: (id, data) => apiClient.put(`/events/${id}`, data),
  delete: (id) => apiClient.delete(`/events/${id}`),
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


/* DUE DILIGENCE API CLIENT  */


export const dueDiligenceAPI = {
  // Main CRUD
  list: (params) => apiClient.get('/due-diligence', { params }),
  getById: (id) => apiClient.get(`/due-diligence/${id}`),
  create: (data) => apiClient.post('/due-diligence', data),
  update: (id, data) => apiClient.put(`/due-diligence/${id}`, data),
  delete: (id) => apiClient.delete(`/due-diligence/${id}`),

  // Items
  createItem: (dueDiligenceId, data) => apiClient.post(`/due-diligence/${dueDiligenceId}/items`, data),
  updateItem: (dueDiligenceId, itemId, data) =>
    apiClient.put(`/due-diligence/${dueDiligenceId}/items/${itemId}`, data),
  deleteItem: (dueDiligenceId, itemId) =>
    apiClient.delete(`/due-diligence/${dueDiligenceId}/items/${itemId}`),

  // Documents
  uploadDocument: (dueDiligenceId, data, config) =>
    apiClient.post(`/due-diligence/${dueDiligenceId}/documents`, data, config),
  deleteDocument: (dueDiligenceId, docId) =>
    apiClient.delete(`/due-diligence/${dueDiligenceId}/documents/${docId}`),
  reviewDocument: (dueDiligenceId, docId, data) =>
    apiClient.put(`/due-diligence/${dueDiligenceId}/documents/${docId}/review`, data),

  // Comments
  addComment: (dueDiligenceId, data, config) =>
    apiClient.post(`/due-diligence/${dueDiligenceId}/comments`, data, config),
  deleteComment: (dueDiligenceId, commentId) =>
    apiClient.delete(`/due-diligence/${dueDiligenceId}/comments/${commentId}`),

  // Approvals
  createApproval: (dueDiligenceId, data) =>
    apiClient.post(`/due-diligence/${dueDiligenceId}/approvals`, data),
  approveOrReject: (dueDiligenceId, approvalId, data) =>
    apiClient.put(`/due-diligence/${dueDiligenceId}/approvals/${approvalId}`, data),
};

