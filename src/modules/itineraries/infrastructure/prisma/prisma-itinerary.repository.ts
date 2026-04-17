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
  FindNextActivityPositionInput,
  FindNextDayPositionInput,
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
        title: input.title,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        location: input.location ?? null,
        notes: input.notes ?? null,
        costAmount: input.costAmount,
        costCurrency: input.costCurrency,
        position: input.position,
        imageUrls: input.imageUrls,
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
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
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
      orderBy: [
        { date: 'asc' },
        { position: 'asc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
      include: {
        activities: {
          orderBy: [{ position: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        },
      },
    });

    return records.map((record) => toItineraryDayAggregate(record));
  }

  async findNextDayPositionForDate(
    input: FindNextDayPositionInput,
  ): Promise<number> {
    const maxPositionRecord = await this.prisma.tripItineraryDay.findFirst({
      where: {
        tripId: input.tripId,
        date: input.date,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    return (maxPositionRecord?.position ?? 0) + 1;
  }

  async createActivity(
    input: CreateItineraryActivityRecordInput,
  ): Promise<ItineraryActivity> {
    const record = await this.prisma.tripItineraryActivity.create({
      data: {
        itineraryDayId: input.itineraryDayId,
        title: input.title,
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        location: input.location ?? null,
        notes: input.notes ?? null,
        costAmount: input.costAmount,
        costCurrency: input.costCurrency,
        position: input.position,
        imageUrls: input.imageUrls,
      },
    });

    return toItineraryActivity(record);
  }

  async findNextActivityPositionForDay(
    input: FindNextActivityPositionInput,
  ): Promise<number> {
    const maxPositionRecord = await this.prisma.tripItineraryActivity.findFirst({
      where: {
        itineraryDayId: input.dayId,
      },
      orderBy: {
        position: 'desc',
      },
      select: {
        position: true,
      },
    });

    return (maxPositionRecord?.position ?? 0) + 1;
  }

  async updateDay(day: ItineraryDay): Promise<ItineraryDay> {
    const record = await this.prisma.tripItineraryDay.update({
      where: {
        id: day.id,
      },
      data: {
        date: day.date,
        title: day.title,
        startsAt: day.startsAt,
        endsAt: day.endsAt,
        location: day.location,
        notes: day.notes,
        costAmount: day.costAmount,
        costCurrency: day.costCurrency,
        position: day.position,
        imageUrls: day.imageUrls,
        updatedAt: day.updatedAt,
      },
    });

    return toItineraryDay(record);
  }

  async deleteDay(dayId: string): Promise<void> {
    await this.prisma.tripItineraryDay.delete({
      where: {
        id: dayId,
      },
    });
  }

  async updateActivity(activity: ItineraryActivity): Promise<ItineraryActivity> {
    const record = await this.prisma.tripItineraryActivity.update({
      where: {
        id: activity.id,
      },
      data: {
        title: activity.title,
        startsAt: activity.startsAt,
        endsAt: activity.endsAt,
        location: activity.location,
        notes: activity.notes,
        costAmount: activity.costAmount,
        costCurrency: activity.costCurrency,
        position: activity.position,
        imageUrls: activity.imageUrls,
        updatedAt: activity.updatedAt,
      },
    });

    return toItineraryActivity(record);
  }

  async deleteActivity(activityId: string): Promise<void> {
    await this.prisma.tripItineraryActivity.delete({
      where: {
        id: activityId,
      },
    });
  }
}

function toItineraryDay(record: PrismaTripItineraryDay): ItineraryDay {
  return ItineraryDay.create({
    id: record.id,
    tripId: record.tripId,
    date: record.date,
    title: record.title,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    location: record.location,
    notes: record.notes,
    costAmount: record.costAmount,
    costCurrency: record.costCurrency,
    position: record.position,
    imageUrls: record.imageUrls,
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
    endsAt: record.endsAt,
    location: record.location,
    notes: record.notes,
    costAmount: record.costAmount,
    costCurrency: record.costCurrency,
    position: record.position,
    imageUrls: record.imageUrls,
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
