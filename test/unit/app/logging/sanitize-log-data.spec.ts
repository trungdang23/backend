import { sanitizeLogData } from '../../../../src/app/logging/sanitize-log-data';

describe('sanitizeLogData', () => {
  it('redacts sensitive keys recursively', () => {
    expect(
      sanitizeLogData({
        accessToken: 'token-123',
        nested: {
          authorization: 'Bearer secret',
          password: 'super-secret',
        },
        profile: {
          email: 'traveler@example.com',
        },
      }),
    ).toEqual({
      accessToken: '[REDACTED]',
      nested: {
        authorization: '[REDACTED]',
        password: '[REDACTED]',
      },
      profile: {
        email: 'traveler@example.com',
      },
    });
  });
});
