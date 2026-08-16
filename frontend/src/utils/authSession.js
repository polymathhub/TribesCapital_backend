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

const normalizeRoleName = (value) => String(value ?? '').trim().toLowerCase();

export function normalizeUserRoles(rawRoles = []) {
  if (!rawRoles) return [];

  const entries = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  return entries
    .flatMap((role) => {
      if (typeof role === 'string') {
        return [normalizeRoleName(role)];
      }

      if (role && typeof role === 'object') {
        const name = normalizeRoleName(role.name ?? role.role ?? role.value ?? '');
        return name ? [name] : [];
      }

      return [];
    })
    .filter(Boolean);
}

export function normalizeStoredUser(user) {
  if (!user || typeof user !== 'object') return user;

  const roleNames = normalizeUserRoles(user.roles ?? user.role ?? []);
  const normalizedUser = {
    ...user,
    roles: roleNames,
    role: roleNames[0] || normalizeRoleName(user.role || user.roleName || user.permission || user.permissions || ''),
    isAdmin: Boolean(user.isAdmin || roleNames.includes('admin') || roleNames.includes('super-admin') || normalizeRoleName(user.permission ?? user.permissions) === 'admin'),
  };

  return normalizedUser;
}

const getStorage = (storage) => {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

export function getAuthState(storage) {
  const targetStorage = getStorage(storage);

  if (!targetStorage) {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      email: null,
    };
  }

  try {
    const rawUser = targetStorage.getItem('user');
    const user = rawUser ? normalizeStoredUser(JSON.parse(rawUser)) : null;
    if (user) {
      targetStorage.setItem('user', JSON.stringify(user));
    }
    return {
      accessToken: targetStorage.getItem('accessToken'),
      refreshToken: targetStorage.getItem('refreshToken'),
      user,
      email: targetStorage.getItem('userEmail') || user?.email || null,
    };
  } catch (error) {
    return {
      accessToken: null,
      refreshToken: null,
      user: null,
      email: null,
    };
  }
}

export function persistAuthSession({ accessToken, refreshToken, user, email } = {}) {
  const targetStorage = getStorage();
  if (!targetStorage) return getAuthState();

  const normalizedUser = normalizeStoredUser(user);

  if (accessToken) {
    targetStorage.setItem('accessToken', accessToken);
  }
  if (refreshToken) {
    targetStorage.setItem('refreshToken', refreshToken);
  }
  if (email) {
    targetStorage.setItem('userEmail', email);
  }
  if (normalizedUser?.firstName) {
    targetStorage.setItem('userName', normalizedUser.firstName);
  }
  if (normalizedUser) {
    targetStorage.setItem('user', JSON.stringify(normalizedUser));
    if (normalizedUser.email) {
      targetStorage.setItem('userEmail', normalizedUser.email);
    }
  }

  try {
    window.dispatchEvent(new CustomEvent('tribes:auth-updated', { detail: { user: normalizedUser } }));
  } catch (error) {
    // no-op in non-browser env
  }

  return getAuthState(targetStorage);
}

export function persistDemoSession({ storage } = {}) {
  const targetStorage = getStorage(storage);
  if (!targetStorage) {
    return {
      accessToken: DEMO_ACCESS_TOKEN,
      refreshToken: DEMO_REFRESH_TOKEN,
      user: DEMO_USER,
    };
  }

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

export function clearAuthSession(storage) {
  const targetStorage = getStorage(storage);

  if (!targetStorage) {
    return;
  }

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

