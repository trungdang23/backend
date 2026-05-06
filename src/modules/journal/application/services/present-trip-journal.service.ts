import { Inject, Injectable } from '@nestjs/common';

import {
  TRIP_JOURNAL_ASSET_REPOSITORY,
  type TripJournalAssetRepositoryPort,
} from '../ports/trip-journal-asset-repository.port';
import type { TripJournalResult } from './get-trip-journal.service';
import { TripJournal } from '../../domain/trip-journal';
import type { JournalSceneObject } from '../../domain/trip-journal';
import type { TripJournalAsset } from '../../domain/trip-journal-asset';
import { JournalAssetUrlSigningService } from './journal-asset-url-signing.service';

@Injectable()
export class PresentTripJournalService {
  constructor(
    @Inject(TRIP_JOURNAL_ASSET_REPOSITORY)
    private readonly assetRepository: TripJournalAssetRepositoryPort,
    private readonly journalAssetUrlSigning: JournalAssetUrlSigningService,
  ) {}

  async present(result: TripJournalResult): Promise<TripJournalResult> {
    const [presentedResult] = await this.presentMany([result]);

    return presentedResult;
  }

  async presentMany(results: TripJournalResult[]): Promise<TripJournalResult[]> {
    if (results.length === 0) {
      return [];
    }

    const assetsByTripId = await this.loadAssetsByTripId(results);

    return results.map((result) => ({
      trip: result.trip,
      journal: this.presentJournal(
        result.journal,
        assetsByTripId.get(result.trip.id) ??
          new Map<string, TripJournalAsset>(),
      ),
    }));
  }

  private async loadAssetsByTripId(
    results: TripJournalResult[],
  ): Promise<Map<string, Map<string, TripJournalAsset>>> {
    const uniqueTripIds = Array.from(
      new Set(results.map((result) => result.trip.id)),
    );
    const assetEntries = await Promise.all(
      uniqueTripIds.map(async (tripId) => {
        const assets = await this.assetRepository.listByTripId(tripId);

        return [
          tripId,
          new Map(
            assets.flatMap((asset) =>
              asset.id === null ? [] : [[asset.id, asset] as const],
            ),
          ),
        ] as const;
      }),
    );

    return new Map(assetEntries);
  }

  private presentJournal(
    journal: TripJournal,
    assetsById: Map<string, TripJournalAsset>,
  ): TripJournal {
    return TripJournal.create({
      id: journal.id,
      tripId: journal.tripId,
      sceneVersion: journal.sceneVersion,
      page: journal.page,
      objects: journal.objects.map((object) =>
        this.presentObject(object, assetsById),
      ),
      visibility: journal.visibility,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt,
    });
  }

  private presentObject(
    object: JournalSceneObject,
    assetsById: Map<string, TripJournalAsset>,
  ): JournalSceneObject {
    if (object.type !== 'photo') {
      return object;
    }

    const assetId = getStringProp(object.props, 'assetId');
    const currentImageUrl = getStringProp(object.props, 'imageUrl');
    const currentSrc = getStringProp(object.props, 'src');
    const publicId =
      (assetId === null ? null : assetsById.get(assetId)?.publicId) ??
      extractJournalAssetPublicId(currentImageUrl) ??
      extractJournalAssetPublicId(currentSrc);

    if (publicId === null) {
      return object;
    }

    const signedPath = this.journalAssetUrlSigning.createSignedPath(publicId);
    const nextProps: Record<string, unknown> = {
      ...object.props,
      imageUrl: signedPath,
    };

    if (
      currentSrc !== null &&
      extractJournalAssetPublicId(currentSrc) !== null
    ) {
      nextProps.src = signedPath;
    }

    return {
      ...object,
      props: nextProps,
    };
  }
}

function getStringProp(
  props: Record<string, unknown>,
  key: string,
): string | null {
  const value = props[key];

  if (typeof value !== 'string') {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length === 0 ? null : normalizedValue;
}

function extractJournalAssetPublicId(url: string | null): string | null {
  if (url === null) {
    return null;
  }

  try {
    const parsedUrl = new URL(url, 'http://journal.local');
    const matchedPath = parsedUrl.pathname.match(/\/journal-assets\/([^/]+)$/);

    return matchedPath?.[1] === undefined
      ? null
      : decodeURIComponent(matchedPath[1]);
  } catch {
    return null;
  }
}
