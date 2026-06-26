import test from 'node:test';
import assert from 'node:assert/strict';
import { persistDemoSession, clearAuthSession, shouldUseDemoFallback } from './authSession.js';

class MemoryStorage {
  constructor(initialEntries = {}) {
    this.store = new Map(Object.entries(initialEntries));
  }

  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }

  setItem(key, value) {
    this.store.set(key, String(value));
  }

  removeItem(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

test('persistDemoSession stores a usable authenticated session', () => {
  const storage = new MemoryStorage();

  const result = persistDemoSession({ storage });

  assert.equal(result.accessToken, 'demo-access-token');
  assert.equal(storage.getItem('accessToken'), 'demo-access-token');
  assert.equal(storage.getItem('userEmail'), 'demo@tribes.capital');
  assert.equal(storage.getItem('userName'), 'Demo');
  assert.equal(JSON.parse(storage.getItem('user')).email, 'demo@tribes.capital');
});

test('clearAuthSession removes persisted auth state', () => {
  const storage = new MemoryStorage({
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    userEmail: 'demo@tribes.capital',
    userName: 'Demo',
    user: JSON.stringify({ email: 'demo@tribes.capital' }),
  });

  clearAuthSession(storage);

  assert.equal(storage.getItem('accessToken'), null);
  assert.equal(storage.getItem('refreshToken'), null);
  assert.equal(storage.getItem('userEmail'), null);
  assert.equal(storage.getItem('userName'), null);
  assert.equal(storage.getItem('user'), null);
});

test('shouldUseDemoFallback enables demo auth for demo credentials and offline errors', () => {
  assert.equal(shouldUseDemoFallback({ email: 'demo@tribes.capital', password: 'DemoPass123!' }), true);
  assert.equal(shouldUseDemoFallback({ error: { code: 'ERR_NETWORK' } }), true);
  assert.equal(shouldUseDemoFallback({ error: { response: { status: 401 } } }), false);
});
