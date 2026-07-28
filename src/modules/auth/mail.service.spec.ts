import { MailService } from './mail.service';

describe('MailService', () => {
  it('delegates sending to the configured email provider', async () => {
    const emailProvider = {
      name: 'emailit',
      send: jest.fn().mockResolvedValue(true),
    };

    const service = new MailService(emailProvider as any);
    const result = await service.sendPasswordResetEmail('user@example.com', '123456');

    expect(result).toBe(true);
    expect(emailProvider.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: expect.stringContaining('password'),
    }));
  });

  it('uses the site root for welcome and verification emails', async () => {
    const emailProvider = {
      name: 'emailit',
      send: jest.fn().mockResolvedValue(true),
    };

    const service = new MailService(emailProvider as any);
    await service.sendWelcomeEmail('user@example.com', 'Ada');
    await service.sendVerificationEmail('user@example.com', 'https://example.com/verify');

    const calls = emailProvider.send.mock.calls.map(([payload]) => payload);
    expect(calls[0].html).toContain('https://community.tribes.capital');
    expect(calls[0].text).toContain('https://community.tribes.capital');
    expect(calls[1].html).toContain('https://example.com/verify');
    expect(calls[1].text).toContain('https://example.com/verify');
  });
});
