import { Injectable } from '@nestjs/common';
import type { Prisma, TripJournalRevision as PrismaTripJournalRevision } from '@prisma/client';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type { TripJournalRevisionRepositoryPort } from '../../application/ports/trip-journal-revision-repository.port';
import { TripJournalRevision } from '../../domain/trip-journal-revision';
import type { JournalPage, JournalSceneObject } from '../../domain/trip-journal';

@Injectable()
export class PrismaTripJournalRevisionRepository
  implements TripJournalRevisionRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async create(revision: TripJournalRevision): Promise<TripJournalRevision> {
    const record = await this.prisma.tripJournalRevision.create({
      data: {
        tripId: revision.tripId,
        sceneVersion: revision.sceneVersion,
        page: toInputJson(revision.page),
        objects: toInputJson(revision.objects),
      },
    });

    return toTripJournalRevision(record);
  }

  async findByIdForTrip(
    tripId: string,
    revisionId: string,
  ): Promise<TripJournalRevision | null> {
    const record = await this.prisma.tripJournalRevision.findFirst({
      where: {
        id: revisionId,
        tripId,
      },
    });

    return record === null ? null : toTripJournalRevision(record);
  }

  async listByTripId(
    tripId: string,
    limit: number,
  ): Promise<TripJournalRevision[]> {
    const records = await this.prisma.tripJournalRevision.findMany({
      where: {
        tripId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit,
    });

    return records.map((record) => toTripJournalRevision(record));
  }

  async deleteByTripId(tripId: string): Promise<number> {
    const result = await this.prisma.tripJournalRevision.deleteMany({
      where: {
        tripId,
      },
    });

    return result.count;
  }
}

function toTripJournalRevision(
  record: PrismaTripJournalRevision,
): TripJournalRevision {
  return TripJournalRevision.create({
    id: record.id,
    tripId: record.tripId,
    sceneVersion: record.sceneVersion,
    page: record.page as unknown as JournalPage,
    objects: record.objects as unknown as JournalSceneObject[],
    createdAt: record.createdAt,
  });
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
