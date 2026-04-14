import { HealthService } from '../../../../../src/modules/health/application/health.service';
import type { PrismaService } from '../../../../../src/shared/infrastructure/prisma/prisma.service';

describe('HealthService', () => {
  it('returns a stable health snapshot when the database is reachable', async () => {
    const prismaService = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    } as unknown as PrismaService;
    const service = new HealthService(
      {
        appName: 'journey-backend',
        nodeEnv: 'test',
      } as never,
      prismaService,
    );

    await expect(service.getSnapshot()).resolves.toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'journey-backend',
        environment: 'test',
        version: '0.1.0',
        checks: {
          database: {
            status: 'up',
          },
        },
      }),
    );
  });

  it('throws when the database is unavailable', async () => {
    const prismaService = {
      $queryRaw: jest.fn().mockRejectedValue(new Error('connect ECONNREFUSED')),
    } as unknown as PrismaService;
    const service = new HealthService(
      {
        appName: 'journey-backend',
        nodeEnv: 'test',
      } as never,
      prismaService,
    );

    await expect(service.getSnapshot()).rejects.toMatchObject({
      response: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database is unavailable',
      },
      status: 503,
    });
  });
});
