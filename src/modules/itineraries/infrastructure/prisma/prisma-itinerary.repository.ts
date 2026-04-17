import { Injectable } from '@nestjs/common';
import type {
  TripItineraryActivity as PrismaTripItineraryActivity,
  TripItineraryDay as PrismaTripItineraryDay,
} from '@prisma/client';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ItineraryActivity } from '../../domain/itinerary-activity';
import { ItineraryDay } from '../../domain/itinerary-day';
import type {
  CreateItineraryActivityRecordInput,
  CreateItineraryDayRecordInput,
  FindItineraryDayAggregateInput,
  FindItineraryDayByDateInput,
  ItineraryDayAggregate,
  ItineraryRepositoryPort,
  ListTripItineraryInput,
} from '../../application/ports/itinerary-repository.port';

type PrismaDayRecord = PrismaTripItineraryDay & {
  activities: PrismaTripItineraryActivity[];
};

@Injectable()
export class PrismaItineraryRepository implements ItineraryRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createDay(input: CreateItineraryDayRecordInput): Promise<ItineraryDay> {
    const record = await this.prisma.tripItineraryDay.create({
      data: {
        tripId: input.tripId,
        date: input.date,
      },
    });

    return toItineraryDay(record);
  }

  async findDayByDateForTrip(
    input: FindItineraryDayByDateInput,
  ): Promise<ItineraryDay | null> {
    const record = await this.prisma.tripItineraryDay.findFirst({
      where: {
        tripId: input.tripId,
        date: input.date,
      },
    });

    return record === null ? null : toItineraryDay(record);
  }

  async findDayAggregateByIdForTrip(
    input: FindItineraryDayAggregateInput,
  ): Promise<ItineraryDayAggregate | null> {
    const record = await this.prisma.tripItineraryDay.findFirst({
      where: {
        id: input.dayId,
        tripId: input.tripId,
      },
      include: {
        activities: {
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return record === null ? null : toItineraryDayAggregate(record);
  }

  async listDayAggregatesByTrip(
    input: ListTripItineraryInput,
  ): Promise<ItineraryDayAggregate[]> {
    const records = await this.prisma.tripItineraryDay.findMany({
      where: {
        tripId: input.tripId,
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      include: {
        activities: {
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return records.map((record) => toItineraryDayAggregate(record));
  }

  async createActivity(
    input: CreateItineraryActivityRecordInput,
  ): Promise<ItineraryActivity> {
    const record = await this.prisma.tripItineraryActivity.create({
      data: {
        itineraryDayId: input.itineraryDayId,
        title: input.title,
        startsAt: input.startsAt ?? null,
        location: input.location ?? null,
        notes: input.notes ?? null,
        costAmount: input.costAmount,
        costCurrency: input.costCurrency,
        position: input.position,
      },
    });

    return toItineraryActivity(record);
  }

  async updateActivity(activity: ItineraryActivity): Promise<ItineraryActivity> {
    const record = await this.prisma.tripItineraryActivity.update({
      where: {
        id: activity.id,
      },
      data: {
        title: activity.title,
        startsAt: activity.startsAt,
        location: activity.location,
        notes: activity.notes,
        costAmount: activity.costAmount,
        costCurrency: activity.costCurrency,
        position: activity.position,
        updatedAt: activity.updatedAt,
      },
    });

    return toItineraryActivity(record);
  }
}

function toItineraryDay(record: PrismaTripItineraryDay): ItineraryDay {
  return ItineraryDay.create({
    id: record.id,
    tripId: record.tripId,
    date: record.date,
    tripStartDate: record.date,
    tripEndDate: record.date,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function toItineraryActivity(
  record: PrismaTripItineraryActivity,
): ItineraryActivity {
  return ItineraryActivity.create({
    id: record.id,
    itineraryDayId: record.itineraryDayId,
    title: record.title,
    startsAt: record.startsAt,
    location: record.location,
    notes: record.notes,
    costAmount: record.costAmount,
    costCurrency: record.costCurrency,
    position: record.position,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function toItineraryDayAggregate(record: PrismaDayRecord): ItineraryDayAggregate {
  return {
    day: toItineraryDay(record),
    activities: record.activities.map((activity) => toItineraryActivity(activity)),
  };
}
