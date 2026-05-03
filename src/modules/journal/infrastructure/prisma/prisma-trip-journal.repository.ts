import { Injectable } from '@nestjs/common';
import type { Prisma, TripJournal as PrismaTripJournal } from '@prisma/client';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  type JournalPage,
  type JournalSceneObject,
  TripJournal,
} from '../../domain/trip-journal';
import type { TripJournalRepositoryPort } from '../../application/ports/trip-journal-repository.port';

@Injectable()
export class PrismaTripJournalRepository
  implements TripJournalRepositoryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findByTripId(tripId: string): Promise<TripJournal | null> {
    const record = await this.prisma.tripJournal.findUnique({
      where: {
        tripId,
      },
    });

    return record === null ? null : toTripJournal(record);
  }

  async listByUserId(userId: string): Promise<TripJournal[]> {
    const records = await this.prisma.tripJournal.findMany({
      where: {
        trip: {
          userId,
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });

    return records.map((record) => toTripJournal(record));
  }

  async listPublic(): Promise<TripJournal[]> {
    const records = await this.prisma.tripJournal.findMany({
      where: {
        visibility: 'public',
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }],
    });

    return records.map((record) => toTripJournal(record));
  }

  async upsert(journal: TripJournal): Promise<TripJournal> {
    const record = await this.prisma.tripJournal.upsert({
      where: {
        tripId: journal.tripId,
      },
      create: {
        tripId: journal.tripId,
        sceneVersion: journal.sceneVersion,
        page: toInputJson(journal.page),
        objects: toInputJson(journal.objects),
        visibility: journal.visibility,
      },
      update: {
        sceneVersion: journal.sceneVersion,
        page: toInputJson(journal.page),
        objects: toInputJson(journal.objects),
      },
    });

    return toTripJournal(record);
  }

  async updateVisibilityByTripId(
    tripId: string,
    visibility: string,
  ): Promise<TripJournal> {
    const emptyJournal = TripJournal.createEmpty({
      tripId,
      visibility,
    });
    const record = await this.prisma.tripJournal.upsert({
      where: {
        tripId,
      },
      create: {
        tripId,
        sceneVersion: emptyJournal.sceneVersion,
        page: toInputJson(emptyJournal.page),
        objects: toInputJson(emptyJournal.objects),
        visibility: emptyJournal.visibility,
      },
      update: {
        visibility: emptyJournal.visibility,
      },
    });

    return toTripJournal(record);
  }

  async deleteByTripId(tripId: string): Promise<boolean> {
    const result = await this.prisma.tripJournal.deleteMany({
      where: {
        tripId,
      },
    });

    return result.count > 0;
  }
}

function toTripJournal(record: PrismaTripJournal): TripJournal {
  return TripJournal.create({
    id: record.id,
    tripId: record.tripId,
    sceneVersion: record.sceneVersion,
    page: record.page as unknown as JournalPage,
    objects: record.objects as unknown as JournalSceneObject[],
    visibility: record.visibility,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
