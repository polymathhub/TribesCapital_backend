const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@tribes.capital',
  firstName: 'Demo',
  lastName: 'User',
  name: 'Demo User',
  role: 'member',
};

const DEMO_ACCESS_TOKEN = 'demo-access-token';
const DEMO_REFRESH_TOKEN = 'demo-refresh-token';

function getStorage(storage = window.localStorage) {
  return storage || window.localStorage;
}

export function persistDemoSession({ storage } = {}) {
  const targetStorage = getStorage(storage);

  targetStorage.setItem('accessToken', DEMO_ACCESS_TOKEN);
  targetStorage.setItem('refreshToken', DEMO_REFRESH_TOKEN);
  targetStorage.setItem('userEmail', DEMO_USER.email);
  targetStorage.setItem('userName', DEMO_USER.firstName);
  targetStorage.setItem('user', JSON.stringify(DEMO_USER));

  return {
    accessToken: DEMO_ACCESS_TOKEN,
    refreshToken: DEMO_REFRESH_TOKEN,
    user: DEMO_USER,
  };
}

export function clearAuthSession(storage = window.localStorage) {
  const targetStorage = getStorage(storage);

  targetStorage.removeItem('accessToken');
  targetStorage.removeItem('refreshToken');
  targetStorage.removeItem('userEmail');
  targetStorage.removeItem('userName');
  targetStorage.removeItem('user');
  targetStorage.removeItem('rememberEmail');
}

export function getDemoUser() {
  return DEMO_USER;
}

export function shouldUseDemoFallback({ email, password, error } = {}) {
  const emailMatches = email?.toLowerCase() === DEMO_USER.email;
  const passwordMatches = password === 'DemoPass123!';

  if (emailMatches && passwordMatches) {
    return true;
  }

  if (error) {
    const isNetworkIssue = error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('Failed to fetch');
    const isOffline = error.response?.status === 0;
    return Boolean(isNetworkIssue || isOffline);
  }

  return false;
}
