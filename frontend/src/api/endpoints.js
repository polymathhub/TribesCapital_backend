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
  connectSocialProfile: (provider) => apiClient.get(`/users/social-profiles/connect/${encodeURIComponent(provider)}`),
  getAll: (params) => apiClient.get('/users', { params }),
  updateProfile: (data) => apiClient.patch('/users/me', data),
  getById: (id) => apiClient.get(`/users/${id}`),
};

export const uploadsAPI = {
  initiate: (data) => apiClient.post('/uploads/multipart/initiate', data),
  getPartUrl: (data) => apiClient.post('/uploads/multipart/part-url', data),
  complete: (data) => apiClient.post('/uploads/multipart/complete', data),
  abort: (data) => apiClient.delete('/uploads/multipart', { data }),
};

export const coursesAPI = {
  list: (params) => apiClient.get('/courses', { params }),
  getById: (id) => apiClient.get(`/courses/${id}`),
  create: (data) => apiClient.post('/courses', data),
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
    return apiClient.post(`/lessons/courses/${courseId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id, data, file) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => formData.append(key, data[key]));
    if (file) formData.append('video', file);
    return apiClient.put(`/lessons/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  delete: (id) => apiClient.delete(`/lessons/${id}`),
  markComplete: (lessonId) => apiClient.post(`/lessons/${lessonId}/complete`),
};

export const eventsAPI = {
  list: (params) => apiClient.get('/events', { params }),
  listPending: () => apiClient.get('/events/admin/pending'),
  getById: (id) => apiClient.get(`/events/${id}`),
  create: (data) => apiClient.post('/events', data),
  update: (id, data) => apiClient.put(`/events/${id}`, data),
  approve: (id) => apiClient.put(`/events/${id}/approve`),
  delete: (id) => apiClient.delete(`/events/${id}`),
  getRSVPStatus: (eventId) => apiClient.get(`/events/${eventId}/rsvp-status`),
  rsvp: (eventId, guestCount = 1) => apiClient.post(`/events/${eventId}/rsvp`, { guestCount }),
  cancelRSVP: (eventId) => apiClient.delete(`/events/${eventId}/rsvp`),
};

export const documentsAPI = {
  list: (params) => apiClient.get('/documents', { params }),
  getById: (id) => apiClient.get(`/documents/${id}`),
  upload: (formData) => apiClient.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const notificationsAPI = {
  list: () => apiClient.get('/notifications'),
  create: (data) => apiClient.post('/notifications', data),
  broadcast: (data) => apiClient.post('/notifications/broadcast', data),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/mark-all-read'),
};

export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getUserStats: () => apiClient.get('/analytics/user-stats'),
  getAdminOverview: () => apiClient.get('/analytics/admin/overview'),
};

export const projectsAPI = {
  list: (params) => apiClient.get('/projects', { params }),
  getById: (id) => apiClient.get(`/projects/${id}`),
  create: (data) => apiClient.post('/projects', data),
  update: (id, data) => apiClient.patch(`/projects/${id}`, data),
  updateStatus: (id, status) => apiClient.patch(`/projects/${id}/status`, { status }),
  delete: (id) => apiClient.delete(`/projects/${id}`),
  getAttachmentDownloadUrl: (id, index) => apiClient.get(`/projects/${id}/attachments/${index}/download`),
};

export const communityAPI = {
  getStats: () => apiClient.get('/community/stats'),
  listMembers: (params) => apiClient.get('/community/members', { params }),
  listConnections: () => apiClient.get('/community/connections'),
  requestConnection: (memberId) => apiClient.post(`/community/members/${memberId}/connection-requests`),
  respondToConnectionRequest: (requestId, status) => apiClient.patch(`/community/connection-requests/${requestId}`, { status }),
  listPosts: (params) => apiClient.get('/community/posts', { params }),
  getPost: (id) => apiClient.get(`/community/posts/${id}`),
  createPost: (data) => apiClient.post('/community/posts', data),
  addComment: (id, data) => apiClient.post(`/community/posts/${id}/comments`, data),
  togglePostVote: (id) => apiClient.post(`/community/posts/${id}/vote`),
  toggleCommentVote: (id) => apiClient.post(`/community/comments/${id}/vote`),
  toggleSave: (id) => apiClient.post(`/community/posts/${id}/save`),
  toggleFollow: (id) => apiClient.post(`/community/members/${id}/follow`),
};

export const marketplaceAPI = {
  listContractors: (params) => apiClient.get('/marketplace/contractors', { params }),
  getContractor: (id) => apiClient.get(`/marketplace/contractors/${id}`),
  getMyContractorProfile: () => apiClient.get('/marketplace/contractors/me'),
  saveContractorProfile: (data) => apiClient.post('/marketplace/contractors', data),
  addContractorReview: (id, data) => apiClient.post(`/marketplace/contractors/${id}/reviews`, data),
  setContractorVerification: (id, isVerified) => apiClient.patch(`/marketplace/contractors/${id}/verification`, { isVerified }),
};

export const messagingAPI = {
  listConversations: () => apiClient.get('/messaging/conversations'),
  listActiveUsers: () => apiClient.get('/messaging/active-users'),
  createConversation: (data) => apiClient.post('/messaging/conversations', data),
  getConversation: (id) => apiClient.get(`/messaging/conversations/${id}`),
  getMessages: (id, params) => apiClient.get(`/messaging/conversations/${id}/messages`, { params }),
  sendMessage: (id, data) => apiClient.post(`/messaging/conversations/${id}/messages`, data),
  editMessage: (id, data) => apiClient.patch(`/messaging/messages/${id}`, data),
  deleteMessage: (id) => apiClient.delete(`/messaging/messages/${id}`),
  addReaction: (id, reaction) => apiClient.post(`/messaging/messages/${id}/reactions`, { reaction }),
  toggleReaction: (id, reaction) => apiClient.post(`/messaging/messages/${id}/reactions/toggle`, { reaction }),
  removeReaction: (id, reaction) => apiClient.delete(`/messaging/messages/${id}/reactions/${encodeURIComponent(reaction)}`),
  markRead: (id, messageIds) => apiClient.post(`/messaging/messages/${id}/read`, { messageIds }),
  search: (query, limit = 25, conversationId) => apiClient.get('/messaging/search', { params: { query, limit, ...(conversationId ? { conversationId } : {}) } }),
  unread: () => apiClient.get('/messaging/unread'),
  uploadAttachment: (conversationId, formData) => apiClient.post(`/messaging/conversations/${conversationId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAttachmentDownloadUrl: (id) => apiClient.get(`/messaging/attachments/${id}/download`),
};

const buildFormDataHeaders = (data, config = {}) => {
  const headers = { ...(config.headers || {}) };
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    headers['Content-Type'] = 'multipart/form-data';
  }
  return headers;
};

export const dueDiligenceAPI = {
  list: (params) => apiClient.get('/due-diligence', { params }),
  getById: (id) => apiClient.get(`/due-diligence/${id}`),
  create: (data) => apiClient.post('/due-diligence', data),
  update: (id, data) => apiClient.put(`/due-diligence/${id}`, data),
  delete: (id) => apiClient.delete(`/due-diligence/${id}`),
  createItem: (dueDiligenceId, data) => apiClient.post(`/due-diligence/${dueDiligenceId}/items`, data),
  updateItem: (dueDiligenceId, itemId, data) => apiClient.put(`/due-diligence/${dueDiligenceId}/items/${itemId}`, data),
  deleteItem: (dueDiligenceId, itemId) => apiClient.delete(`/due-diligence/${dueDiligenceId}/items/${itemId}`),
  uploadDocument: (dueDiligenceId, data, config = {}) => apiClient.post(`/due-diligence/${dueDiligenceId}/documents`, data, {
    ...config,
    timeout: config?.timeout || 30000,
    headers: buildFormDataHeaders(data, config),
  }),
  deleteDocument: (dueDiligenceId, docId) => apiClient.delete(`/due-diligence/${dueDiligenceId}/documents/${docId}`),
  downloadDocument: (dueDiligenceId, docId, config = {}) => apiClient.get(`/due-diligence/${dueDiligenceId}/documents/${docId}/download`, { ...config, responseType: 'blob' }),
  reviewDocument: (dueDiligenceId, docId, data) => apiClient.put(`/due-diligence/${dueDiligenceId}/documents/${docId}/review`, data),
  addComment: (dueDiligenceId, data, config) => apiClient.post(`/due-diligence/${dueDiligenceId}/comments`, data, config),
  deleteComment: (dueDiligenceId, commentId) => apiClient.delete(`/due-diligence/${dueDiligenceId}/comments/${commentId}`),
  createApproval: (dueDiligenceId, data) => apiClient.post(`/due-diligence/${dueDiligenceId}/approvals`, data),
  approveOrReject: (dueDiligenceId, approvalId, data) => apiClient.put(`/due-diligence/${dueDiligenceId}/approvals/${approvalId}`, data),
};
