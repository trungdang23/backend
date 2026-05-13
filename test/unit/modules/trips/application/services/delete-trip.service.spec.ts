import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { NotFoundException } from '@nestjs/common';

import type { AppConfigService } from '../../../../../../src/app/config/app-config.service';
import { resolveJournalAssetFilePath } from '../../../../../../src/modules/journal/infrastructure/storage/journal-asset-storage-path';
import type { TripRepositoryPort } from '../../../../../../src/modules/trips/application/ports/trip-repository.port';
import { DeleteTripService } from '../../../../../../src/modules/trips/application/services/delete-trip.service';
import { Trip } from '../../../../../../src/modules/trips/domain/trip';

describe('DeleteTripService', () => {
  let journalAssetStorageDir: string;
  let config: AppConfigService;

  beforeEach(async () => {
    journalAssetStorageDir = await mkdtemp(
      path.join(tmpdir(), 'journey-delete-trip-'),
    );
    config = {
      appName: 'journey-backend',
      journalAssetStorageDir,
    } as AppConfigService;
  });

  afterEach(async () => {
    await rm(journalAssetStorageDir, { force: true, recursive: true });
  });

  it('deletes the trip and cleans up stored journal asset files', async () => {
    const trip = createTrip();
    const storageKeys = ['journal-asset-01.png', 'journal-asset-02.png'];
    const findByIdForUser = jest.fn().mockResolvedValue(trip);
    const listJournalAssetStorageKeysByTripIdForUser = jest
      .fn()
      .mockResolvedValue(storageKeys);
    const deleteTrip = jest.fn().mockResolvedValue(trip);

    await Promise.all(
      storageKeys.map((storageKey) =>
        writeFile(resolveJournalAssetFilePath(config, storageKey), 'asset'),
      ),
    );

    const tripRepository = {
      findByIdForUser,
      listJournalAssetStorageKeysByTripIdForUser,
      delete: deleteTrip,
    } as unknown as TripRepositoryPort;
    const service = new DeleteTripService(config, tripRepository);

    await expect(
      service.execute({
        userId: trip.userId,
        tripId: trip.id,
      }),
    ).resolves.toBe(trip);

    expect(listJournalAssetStorageKeysByTripIdForUser).toHaveBeenCalledWith({
      tripId: trip.id,
      userId: trip.userId,
    });
    await expectFileMissing(storageKeys[0]);
    await expectFileMissing(storageKeys[1]);
  });

  it('rejects when the owned trip does not exist', async () => {
    const findByIdForUser = jest.fn().mockResolvedValue(null);
    const listJournalAssetStorageKeysByTripIdForUser = jest.fn();
    const deleteTrip = jest.fn();
    const tripRepository = {
      findByIdForUser,
      listJournalAssetStorageKeysByTripIdForUser,
      delete: deleteTrip,
    } as unknown as TripRepositoryPort;
    const service = new DeleteTripService(config, tripRepository);

    await expect(
      service.execute({
        userId: 'missing-user',
        tripId: 'missing-trip',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(deleteTrip).not.toHaveBeenCalled();
    expect(listJournalAssetStorageKeysByTripIdForUser).not.toHaveBeenCalled();
  });

  it('does not fail trip deletion when journal asset file cleanup throws', async () => {
    const trip = createTrip();
    const findByIdForUser = jest.fn().mockResolvedValue(trip);
    const listJournalAssetStorageKeysByTripIdForUser = jest
      .fn()
      .mockResolvedValue(['missing-asset.png']);
    const deleteTrip = jest.fn().mockResolvedValue(trip);
    const tripRepository = {
      findByIdForUser,
      listJournalAssetStorageKeysByTripIdForUser,
      delete: deleteTrip,
    } as unknown as TripRepositoryPort;
    const service = new DeleteTripService(config, tripRepository);

    await expect(
      service.execute({
        userId: trip.userId,
        tripId: trip.id,
      }),
    ).resolves.toBe(trip);
  });

  async function expectFileMissing(storageKey: string) {
    await expect(
      access(resolveJournalAssetFilePath(config, storageKey)),
    ).rejects.toThrow();
  }
});

function createTrip() {
  return Trip.create({
    id: 'trip-01',
    userId: 'user-01',
    name: 'Hoi An Cleanup Trip',
    startDate: '2026-07-12',
    endDate: '2026-07-15',
    budgetMode: 'manual',
    manualBudgetAmount: 5_000_000,
    manualBudgetCurrency: 'VND',
    visibility: 'private',
  });
}
