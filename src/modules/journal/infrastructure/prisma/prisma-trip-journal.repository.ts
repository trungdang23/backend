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
      },
      update: {
        sceneVersion: journal.sceneVersion,
        page: toInputJson(journal.page),
        objects: toInputJson(journal.objects),
      },
    });

    return toTripJournal(record);
  }
}

function toTripJournal(record: PrismaTripJournal): TripJournal {
  return TripJournal.create({
    id: record.id,
    tripId: record.tripId,
    sceneVersion: record.sceneVersion,
    page: record.page as unknown as JournalPage,
    objects: record.objects as unknown as JournalSceneObject[],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}
