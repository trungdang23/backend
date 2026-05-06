import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { Express } from 'express';
import request from 'supertest';

import { AppModule } from '../../../src/app/app.module';
import { setupApp } from '../../../src/app/bootstrap/setup-app';
import { JOURNAL_ASSET_STORAGE } from '../../../src/modules/journal/application/ports/journal-asset-storage.port';
import { TRIP_JOURNAL_ASSET_REPOSITORY } from '../../../src/modules/journal/application/ports/trip-journal-asset-repository.port';
import { TRIP_JOURNAL_REPOSITORY } from '../../../src/modules/journal/application/ports/trip-journal-repository.port';
import { TRIP_REPOSITORY } from '../../../src/modules/trips/application/ports/trip-repository.port';
import { USER_REPOSITORY } from '../../../src/modules/users/application/ports/user-repository.port';
import { dispatchRequest } from '../../support/dispatch-request';
import { InMemoryJournalAssetStorage } from '../../support/in-memory-journal-asset-storage';
import { InMemoryTripJournalAssetRepository } from '../../support/in-memory-trip-journal-asset-repository';
import { InMemoryTripJournalRepository } from '../../support/in-memory-trip-journal-repository';
import { InMemoryTripRepository } from '../../support/in-memory-trip-repository';
import { InMemoryUserRepository } from '../../support/in-memory-user-repository';

describe('Journal integration', () => {
  let app: INestApplication;
  let expressApp: Express;
  let httpServer: Parameters<typeof request>[0];
  let assetRepository: InMemoryTripJournalAssetRepository;
  let assetStorage: InMemoryJournalAssetStorage;
  let tripRepository: InMemoryTripRepository;
  let journalRepository: InMemoryTripJournalRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(USER_REPOSITORY)
      .useClass(InMemoryUserRepository)
      .overrideProvider(TRIP_REPOSITORY)
      .useClass(InMemoryTripRepository)
      .overrideProvider(TRIP_JOURNAL_ASSET_REPOSITORY)
      .useClass(InMemoryTripJournalAssetRepository)
      .overrideProvider(JOURNAL_ASSET_STORAGE)
      .useClass(InMemoryJournalAssetStorage)
      .overrideProvider(TRIP_JOURNAL_REPOSITORY)
      .useClass(InMemoryTripJournalRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useLogger(false);
    setupApp(app);
    await app.init();

    expressApp = app.getHttpAdapter().getInstance() as Express;
    httpServer = app.getHttpServer() as Parameters<typeof request>[0];
    assetRepository = app.get<InMemoryTripJournalAssetRepository>(
      TRIP_JOURNAL_ASSET_REPOSITORY,
    );
    assetStorage = app.get<InMemoryJournalAssetStorage>(JOURNAL_ASSET_STORAGE);
    tripRepository = app.get<InMemoryTripRepository>(TRIP_REPOSITORY);
    journalRepository = app.get<InMemoryTripJournalRepository>(
      TRIP_JOURNAL_REPOSITORY,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    assetRepository.clear();
    assetStorage.clear();
    tripRepository.clear();
    journalRepository.clear();
  });

  it('returns an empty journal scene, then saves and reloads owner journal data', async () => {
    const traveler = await registerUser(expressApp, 'journal@example.com');
    const tripId = await createTrip(expressApp, traveler.accessToken);

    const emptyJournalResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/journal`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const emptyJournalBody = emptyJournalResponse.body as {
      success: boolean;
      data: {
        journal: {
          id: string | null;
          page: {
            width: number;
            height: number;
            background: {
              style: string;
            };
          };
          objects: unknown[];
        };
      };
    };

    expect(emptyJournalResponse.statusCode).toBe(200);
    expect(emptyJournalBody.success).toBe(true);
    expect(emptyJournalBody.data.journal.id).toBeNull();
    expect(emptyJournalBody.data.journal.page).toEqual({
      width: 1200,
      height: 1600,
      background: {
        style: 'paper-cream',
      },
    });
    expect(emptyJournalBody.data.journal.objects).toEqual([]);

    const saveJournalResponse = await dispatchRequest(expressApp, {
      method: 'PUT',
      path: `/api/v1/trips/${tripId}/journal`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        sceneVersion: 1,
        page: {
          width: 1200,
          height: 1600,
          background: {
            style: 'paper-cream',
          },
        },
        objects: [
          {
            id: 'obj-note-1',
            type: 'note',
            x: 120,
            y: 180,
            width: 320,
            height: 220,
            rotation: -4,
            zIndex: 1,
            props: {
              text: 'Quan cafe nho gan pho co.',
              color: '#fff4c7',
            },
          },
        ],
      },
    });
    const saveJournalBody = saveJournalResponse.body as {
      success: boolean;
      data: {
        journal: {
          id: string;
          objects: Array<{
            id: string;
            locked: boolean;
            props: {
              text: string;
            };
          }>;
        };
      };
    };

    expect(saveJournalResponse.statusCode).toBe(200);
    expect(saveJournalBody.success).toBe(true);
    expect(saveJournalBody.data.journal.id).toBe('journal-1');
    expect(saveJournalBody.data.journal.objects[0]).toEqual(
      expect.objectContaining({
        id: 'obj-note-1',
        locked: false,
        props: {
          text: 'Quan cafe nho gan pho co.',
          color: '#fff4c7',
        },
      }),
    );

    const savedJournalResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/journal`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const savedJournalBody = savedJournalResponse.body as {
      data: {
        journal: {
          id: string;
          objects: Array<{
            id: string;
          }>;
        };
      };
    };

    expect(savedJournalResponse.statusCode).toBe(200);
    expect(savedJournalBody.data.journal.id).toBe('journal-1');
    expect(
      savedJournalBody.data.journal.objects.map((object) => object.id),
    ).toEqual(['obj-note-1']);

    const listJournalResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/journals/mine',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const listJournalBody = listJournalResponse.body as {
      success: boolean;
      data: Array<{
        trip: {
          id: string;
        };
        journal: {
          id: string;
        };
      }>;
    };

    expect(listJournalResponse.statusCode).toBe(200);
    expect(listJournalBody.success).toBe(true);
    expect(listJournalBody.data).toHaveLength(1);
    expect(listJournalBody.data[0]?.trip.id).toBe(tripId);
    expect(listJournalBody.data[0]?.journal.id).toBe('journal-1');

    const deleteJournalResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: `/api/v1/trips/${tripId}/journal`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });

    expect(deleteJournalResponse.statusCode).toBe(204);

    const listAfterDeleteResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/journals/mine',
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const listAfterDeleteBody = listAfterDeleteResponse.body as {
      data: unknown[];
    };

    expect(listAfterDeleteResponse.statusCode).toBe(200);
    expect(listAfterDeleteBody.data).toEqual([]);
  });

  it('does not expose another user trip journal', async () => {
    const owner = await registerUser(expressApp, 'journal.owner@example.com');
    const stranger = await registerUser(
      expressApp,
      'journal.stranger@example.com',
    );
    const tripId = await createTrip(expressApp, owner.accessToken);

    const response = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/journal`,
      headers: {
        authorization: `Bearer ${stranger.accessToken}`,
      },
    });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(response.statusCode).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('TRIP_NOT_FOUND');
  });

  it('uploads a journal image asset for the owner and serves the stored file', async () => {
    const traveler = await registerUser(
      expressApp,
      'journal.asset@example.com',
    );
    const tripId = await createTrip(expressApp, traveler.accessToken);
    const fileBuffer = Buffer.from('fake-png-content');

    const uploadResponse = await request(httpServer)
      .post(`/api/v1/trips/${tripId}/journal/assets`)
      .set('Authorization', `Bearer ${traveler.accessToken}`)
      .attach('file', fileBuffer, {
        contentType: 'image/png',
        filename: 'hoi-an-memory.png',
      });
    const uploadBody = uploadResponse.body as {
      success: boolean;
      data: {
        asset: {
          id: string;
          tripId: string;
          fileName: string;
          contentType: string;
          byteSize: number;
          url: string;
        };
      };
    };

    expect(uploadResponse.statusCode).toBe(201);
    expect(uploadBody.success).toBe(true);
    expect(uploadBody.data.asset).toEqual(
      expect.objectContaining({
        byteSize: fileBuffer.byteLength,
        contentType: 'image/png',
        fileName: 'hoi-an-memory.png',
        id: 'journal-asset-1',
        tripId,
      }),
    );
    expect(uploadBody.data.asset.url).toMatch(/^\/journal-assets\/.+/);

    const listResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/journal/assets`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const listBody = listResponse.body as {
      success: boolean;
      data: {
        assets: Array<{
          id: string;
          fileName: string;
          url: string;
        }>;
      };
    };

    expect(listResponse.statusCode).toBe(200);
    expect(listBody.success).toBe(true);
    expect(listBody.data.assets).toHaveLength(1);
    expect(listBody.data.assets[0]).toEqual(
      expect.objectContaining({
        fileName: 'hoi-an-memory.png',
        id: uploadBody.data.asset.id,
        url: uploadBody.data.asset.url,
      }),
    );

    const assetResponse = await request(httpServer).get(
      `/api/v1${uploadBody.data.asset.url}`,
    );

    expect(assetResponse.statusCode).toBe(200);
    expect(assetResponse.headers['content-type']).toContain('image/png');
    expect(assetResponse.body).toEqual(fileBuffer);

    const deleteResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: `/api/v1/trips/${tripId}/journal/assets/${uploadBody.data.asset.id}`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });

    expect(deleteResponse.statusCode).toBe(204);

    const listAfterDeleteResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/journal/assets`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
    });
    const listAfterDeleteBody = listAfterDeleteResponse.body as {
      data: {
        assets: unknown[];
      };
    };

    expect(listAfterDeleteResponse.statusCode).toBe(200);
    expect(listAfterDeleteBody.data.assets).toEqual([]);

    const deletedAssetResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1${uploadBody.data.asset.url}`,
    });
    const deletedAssetBody = deletedAssetResponse.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(deletedAssetResponse.statusCode).toBe(404);
    expect(deletedAssetBody.success).toBe(false);
    expect(deletedAssetBody.error.code).toBe('JOURNAL_ASSET_NOT_FOUND');
  });

  it('does not let another user manage assets for an owned trip', async () => {
    const owner = await registerUser(
      expressApp,
      'journal.asset.owner@example.com',
    );
    const stranger = await registerUser(
      expressApp,
      'journal.asset.stranger@example.com',
    );
    const tripId = await createTrip(expressApp, owner.accessToken);

    const uploadResponse = await request(httpServer)
      .post(`/api/v1/trips/${tripId}/journal/assets`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .attach('file', Buffer.from('fake-png-content'), {
        contentType: 'image/png',
        filename: 'owner-memory.png',
      });
    const uploadBody = uploadResponse.body as {
      data: {
        asset: {
          id: string;
        };
      };
    };

    expect(uploadResponse.statusCode).toBe(201);

    const response = await request(httpServer)
      .post(`/api/v1/trips/${tripId}/journal/assets`)
      .set('Authorization', `Bearer ${stranger.accessToken}`)
      .attach('file', Buffer.from('fake-png-content'), {
        contentType: 'image/png',
        filename: 'not-yours.png',
      });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(response.statusCode).toBe(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('TRIP_NOT_FOUND');

    const listResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/trips/${tripId}/journal/assets`,
      headers: {
        authorization: `Bearer ${stranger.accessToken}`,
      },
    });
    const listBody = listResponse.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(listResponse.statusCode).toBe(404);
    expect(listBody.success).toBe(false);
    expect(listBody.error.code).toBe('TRIP_NOT_FOUND');

    const deleteResponse = await dispatchRequest(expressApp, {
      method: 'DELETE',
      path: `/api/v1/trips/${tripId}/journal/assets/${uploadBody.data.asset.id}`,
      headers: {
        authorization: `Bearer ${stranger.accessToken}`,
      },
    });
    const deleteBody = deleteResponse.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(deleteResponse.statusCode).toBe(404);
    expect(deleteBody.success).toBe(false);
    expect(deleteBody.error.code).toBe('TRIP_NOT_FOUND');
  });

  it('serves shared journals publicly while blocking private journals', async () => {
    const traveler = await registerUser(
      expressApp,
      'journal.share@example.com',
    );
    const sharedTripId = await createTrip(
      expressApp,
      traveler.accessToken,
      'private',
    );
    const privateTripId = await createTrip(
      expressApp,
      traveler.accessToken,
      'private',
    );

    await dispatchRequest(expressApp, {
      method: 'PUT',
      path: `/api/v1/trips/${sharedTripId}/journal`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        sceneVersion: 1,
        page: {
          width: 1200,
          height: 1600,
          background: {
            style: 'paper-cream',
          },
        },
        objects: [
          {
            id: 'obj-public-note-1',
            type: 'note',
            x: 140,
            y: 220,
            width: 360,
            height: 220,
            rotation: 2,
            zIndex: 1,
            props: {
              text: 'Mot trang nhat ky co the chia se.',
            },
          },
        ],
      },
    });

    const shareJournalResponse = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/trips/${sharedTripId}/journal`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        visibility: 'public',
      },
    });
    const shareJournalBody = shareJournalResponse.body as {
      data: {
        journal: {
          visibility: string;
        };
      };
    };

    expect(shareJournalResponse.statusCode).toBe(200);
    expect(shareJournalBody.data.journal.visibility).toBe('public');

    const sharedResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/public/trips/${sharedTripId}/journal`,
    });
    const sharedBody = sharedResponse.body as {
      success: boolean;
      data: {
        trip: {
          id: string;
          visibility: string;
        };
        journal: {
          id: string;
          visibility: string;
          objects: Array<{
            id: string;
          }>;
        };
      };
    };

    expect(sharedResponse.statusCode).toBe(200);
    expect(sharedBody.success).toBe(true);
    expect(sharedBody.data.trip.id).toBe(sharedTripId);
    expect(sharedBody.data.trip.visibility).toBe('private');
    expect(sharedBody.data.journal.id).toBe('journal-1');
    expect(sharedBody.data.journal.visibility).toBe('public');
    expect(sharedBody.data.journal.objects.map((object) => object.id)).toEqual([
      'obj-public-note-1',
    ]);

    const publicJournalsResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: '/api/v1/public/journals',
    });
    const publicJournalsBody = publicJournalsResponse.body as {
      data: Array<{
        trip: {
          id: string;
        };
        journal: {
          visibility: string;
        };
      }>;
    };

    expect(publicJournalsResponse.statusCode).toBe(200);
    expect(publicJournalsBody.data).toHaveLength(1);
    expect(publicJournalsBody.data[0]?.trip.id).toBe(sharedTripId);
    expect(publicJournalsBody.data[0]?.journal.visibility).toBe('public');

    const privateResponse = await dispatchRequest(expressApp, {
      method: 'GET',
      path: `/api/v1/public/trips/${privateTripId}/journal`,
    });
    const privateBody = privateResponse.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(privateResponse.statusCode).toBe(403);
    expect(privateBody.success).toBe(false);
    expect(privateBody.error.code).toBe('PERMISSION_DENIED');
  });

  it('rejects obsolete link-only journal visibility', async () => {
    const traveler = await registerUser(
      expressApp,
      'journal.visibility.invalid@example.com',
    );
    const tripId = await createTrip(expressApp, traveler.accessToken);

    const response = await dispatchRequest(expressApp, {
      method: 'PATCH',
      path: `/api/v1/trips/${tripId}/journal`,
      headers: {
        authorization: `Bearer ${traveler.accessToken}`,
      },
      body: {
        visibility: 'unlisted',
      },
    });
    const body = response.body as {
      success: boolean;
      error: {
        code: string;
      };
    };

    expect(response.statusCode).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('BAD_REQUEST');
  });
});

async function registerUser(expressApp: Express, email: string) {
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/auth/register',
    body: {
      email,
      password: 'password123',
      displayName: 'Journal Traveler',
    },
  });
  const body = response.body as {
    data: {
      tokens: {
        accessToken: string;
      };
    };
  };

  return {
    accessToken: body.data.tokens.accessToken,
  };
}

async function createTrip(
  expressApp: Express,
  accessToken: string,
  visibility: 'private' | 'public' = 'private',
) {
  const response = await dispatchRequest(expressApp, {
    method: 'POST',
    path: '/api/v1/trips',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body: {
      name: 'Hoi An Journal Trip',
      startDate: '2026-07-12',
      endDate: '2026-07-15',
      budgetMode: 'manual',
      manualBudgetAmount: 5000000,
      manualBudgetCurrency: 'VND',
      visibility,
    },
  });
  const body = response.body as {
    data: {
      id: string;
    };
  };

  return body.data.id;
}
