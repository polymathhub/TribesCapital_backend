const { MailService } = require('./mail.service');

describe('MailService', () => {
  it('delegates sending to the configured email provider', async () => {
    const emailProvider = {
      name: 'emailit',
      send: jest.fn().mockResolvedValue(true),
    };

    const service = new MailService(emailProvider);
    const result = await service.sendPasswordResetEmail('user@example.com', '123456');

    expect(result).toBe(true);
    expect(emailProvider.send).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: expect.stringContaining('password'),
    }));
  });
});
