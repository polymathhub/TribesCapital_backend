import { resolveUserValue } from './get-current-user.decorator';

describe('GetCurrentUser decorator', () => {
  it('falls back to request.user.id when the requested key is sub', () => {
    const result = resolveUserValue({ id: 'user-123' }, 'sub');

    expect(result).toBe('user-123');
  });
});
