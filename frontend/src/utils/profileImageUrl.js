import apiClient from '../api/client';

export function resolveProfileImageUrl(value) {
  const imageUrl = typeof value === 'string' ? value.trim() : '';
  if (!imageUrl) return '';
  if (/^(?:https?:|data:|blob:|\/\/)/i.test(imageUrl)) return imageUrl;
  if (typeof window === 'undefined') return imageUrl;

  const apiBaseUrl = apiClient.defaults.baseURL || window.location.origin;
  const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;
  return new URL(imageUrl, apiOrigin).toString();
}
