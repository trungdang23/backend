import { Injectable } from '@nestjs/common';
import type { Prisma, Trip as PrismaTrip } from '@prisma/client';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Trip } from '../../domain/trip';
import type {
  CreateTripRecordInput,
  FindTripForUserInput,
  ListTripsForUserInput,
  ListTripsForUserResult,
  TripRepositoryPort,
} from '../../application/ports/trip-repository.port';

@Injectable()
export class PrismaTripRepository implements TripRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTripRecordInput): Promise<Trip> {
    const record = await this.prisma.trip.create({
      data: {
        userId: input.userId,
        name: input.name,
        destination: input.destination ?? null,
        summaryNotes: input.summaryNotes ?? null,
        coverImageUrl: input.coverImageUrl ?? null,
        startDate: input.startDate,
        endDate: input.endDate,
        timezone: input.timezone ?? null,
        budgetAmount: input.budgetAmount,
        budgetCurrency: input.budgetCurrency,
        budgetMode: input.budgetMode,
        manualBudgetAmount: input.manualBudgetAmount ?? null,
        manualBudgetCurrency: input.manualBudgetCurrency ?? null,
        visibility: input.visibility,
      },
    });

    return toTrip(record);
  }

  async findByIdForUser(input: FindTripForUserInput): Promise<Trip | null> {
    const record = await this.prisma.trip.findFirst({
      where: {
        id: input.tripId,
        userId: input.userId,
      },
    });

    return record === null ? null : toTrip(record);
  }

  async findById(tripId: string): Promise<Trip | null> {
    const record = await this.prisma.trip.findUnique({
      where: {
        id: tripId,
      },
    });

    return record === null ? null : toTrip(record);
  }

  async listByUser(
    input: ListTripsForUserInput,
  ): Promise<ListTripsForUserResult> {
    const [records, totalElements] = await this.prisma.$transaction([
      this.prisma.trip.findMany({
        where: {
          userId: input.userId,
        },
        orderBy: buildTripOrderBy(input.sort),
        skip: input.page * input.size,
        take: input.size,
      }),
      this.prisma.trip.count({
        where: {
          userId: input.userId,
        },
      }),
    ]);

    return {
      trips: records.map((record) => toTrip(record)),
      totalElements,
    };
  }

  async update(trip: Trip): Promise<Trip> {
    const record = await this.prisma.trip.update({
      where: {
        id: trip.id,
      },
      data: {
        name: trip.name,
        destination: trip.destination,
        summaryNotes: trip.summaryNotes,
        coverImageUrl: trip.coverImageUrl,
        startDate: trip.startDate,
        endDate: trip.endDate,
        timezone: trip.timezone,
        budgetAmount: trip.budgetAmount,
        budgetCurrency: trip.budgetCurrency,
        budgetMode: trip.budgetMode,
        manualBudgetAmount: trip.manualBudgetAmount,
        manualBudgetCurrency: trip.manualBudgetCurrency,
        visibility: trip.visibility,
        updatedAt: trip.updatedAt,
      },
    });

    return toTrip(record);
  }

  async delete(input: FindTripForUserInput): Promise<Trip | null> {
    return await this.prisma.$transaction(async (transaction) => {
      const record = await transaction.trip.findFirst({
        where: {
          id: input.tripId,
          userId: input.userId,
        },
      });

      if (record === null) {
        return null;
      }

      await transaction.trip.delete({
        where: {
          id: record.id,
        },
      });

      return toTrip(record);
    });
  }
}

function toTrip(record: PrismaTrip): Trip {
  return Trip.create({
    id: record.id,
    userId: record.userId,
    name: record.name,
    destination: record.destination,
    summaryNotes: record.summaryNotes,
    coverImageUrl: record.coverImageUrl,
    startDate: record.startDate,
    endDate: record.endDate,
    timezone: record.timezone,
    budgetAmount: record.budgetAmount,
    budgetCurrency: record.budgetCurrency,
    budgetMode: record.budgetMode,
    manualBudgetAmount: record.manualBudgetAmount,
    manualBudgetCurrency: record.manualBudgetCurrency,
    visibility: record.visibility,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function buildTripOrderBy(
  sort: ListTripsForUserInput['sort'],
): Prisma.TripOrderByWithRelationInput[] {
  const primaryOrderBy: Prisma.TripOrderByWithRelationInput = {
    [sort.field]: sort.direction,
  };

  if (sort.field === 'createdAt' || sort.field === 'updatedAt') {
    return [primaryOrderBy, { id: 'asc' }];
  }

  return [primaryOrderBy, { createdAt: 'desc' }, { id: 'asc' }];
}
