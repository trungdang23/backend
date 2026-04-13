import { RequestContextService } from '../../../../src/app/request-context/request-context.service';

describe('RequestContextService', () => {
  it('stores and enriches request scoped context', async () => {
    const requestContextService = new RequestContextService();

    await requestContextService.run(
      {
        correlationId: 'journey-correlation-id',
        requestMethod: 'GET',
        requestPath: '/api/v1/health',
      },
      async () => {
        requestContextService.assign({
          actorId: 'user-01',
        });

        await Promise.resolve();

        expect(requestContextService.getContext()).toEqual({
          actorId: 'user-01',
          correlationId: 'journey-correlation-id',
          requestMethod: 'GET',
          requestPath: '/api/v1/health',
        });
      },
    );

    expect(requestContextService.getContext()).toBeUndefined();
  });
});
