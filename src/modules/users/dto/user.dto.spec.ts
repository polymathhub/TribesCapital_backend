import { validateSync } from 'class-validator';
import { UpdateUserDto } from './user.dto';

describe('UpdateUserDto account type', () => {
  it.each(['COMMUNITY_MEMBER', 'INVESTOR', 'FACILITY_OPERATOR', 'GUEST'])(
    'accepts %s',
    (accountType) => {
      const dto = Object.assign(new UpdateUserDto(), { accountType });
      expect(validateSync(dto)).toHaveLength(0);
    },
  );

  it('rejects unsupported account types', () => {
    const dto = Object.assign(new UpdateUserDto(), { accountType: 'ADMIN' });
    expect(validateSync(dto).some((error) => error.property === 'accountType')).toBe(true);
  });
});
