import apiClient from './client';

export const messagingMembersAPI = {
  list: (params = {}) => apiClient.get('/messaging/members', { params }),
};
