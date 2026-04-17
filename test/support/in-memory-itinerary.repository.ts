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
} from '../../src/modules/itineraries/application/ports/itinerary-repository.port';
import { ItineraryActivity } from '../../src/modules/itineraries/domain/itinerary-activity';
import { ItineraryDay } from '../../src/modules/itineraries/domain/itinerary-day';

export class InMemoryItineraryRepository implements ItineraryRepositoryPort {
  private readonly activities = new Map<string, ItineraryActivity>();
  private readonly days = new Map<string, ItineraryDay>();

  createDay(input: CreateItineraryDayRecordInput): Promise<ItineraryDay> {
    const createdAt = new Date();
    const day = ItineraryDay.create({
      id: `itinerary-day-${this.days.size + 1}`,
      tripId: input.tripId,
      date: input.date,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      notes: input.notes,
      costAmount: input.costAmount,
      costCurrency: input.costCurrency,
      position: input.position,
      imageUrls: input.imageUrls,
      tripStartDate: input.date,
      tripEndDate: input.date,
      createdAt,
      updatedAt: createdAt,
    });

    this.days.set(day.id, day);

    return Promise.resolve(day);
  }

  findDayByDateForTrip(
    input: FindItineraryDayByDateInput,
  ): Promise<ItineraryDay | null> {
    const day =
      Array.from(this.days.values())
        .filter(
          (candidate) =>
            candidate.tripId === input.tripId && candidate.date === input.date,
        )
        .sort(createDayComparator())[0] ?? null;

    return Promise.resolve(day);
  }

  findDayAggregateByIdForTrip(
    input: FindItineraryDayAggregateInput,
  ): Promise<ItineraryDayAggregate | null> {
    const day = this.days.get(input.dayId);

    if (day === undefined || day.tripId !== input.tripId) {
      return Promise.resolve(null);
    }

    return Promise.resolve({
      day,
      activities: this.listActivitiesForDay(day.id),
    });
  }

  listDayAggregatesByTrip(
    input: ListTripItineraryInput,
  ): Promise<ItineraryDayAggregate[]> {
    const aggregates = Array.from(this.days.values())
      .filter((day) => day.tripId === input.tripId)
      .sort(createDayComparator())
      .map((day) => ({
        day,
        activities: this.listActivitiesForDay(day.id),
      }));

    return Promise.resolve(aggregates);
  }

  findNextDayPositionForDate(
    input: FindNextDayPositionInput,
  ): Promise<number> {
    const maxPosition = Array.from(this.days.values())
      .filter(
        (day) => day.tripId === input.tripId && day.date === input.date,
      )
      .reduce((currentMax, day) => Math.max(currentMax, day.position), 0);

    return Promise.resolve(maxPosition + 1);
  }

  createActivity(
    input: CreateItineraryActivityRecordInput,
  ): Promise<ItineraryActivity> {
    const createdAt = new Date();
    const activity = ItineraryActivity.create({
      id: `itinerary-activity-${this.activities.size + 1}`,
      itineraryDayId: input.itineraryDayId,
      title: input.title,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      location: input.location,
      notes: input.notes,
      costAmount: input.costAmount,
      costCurrency: input.costCurrency,
      position: input.position,
      imageUrls: input.imageUrls,
      createdAt,
      updatedAt: createdAt,
    });

    this.activities.set(activity.id, activity);

    return Promise.resolve(activity);
  }

  findNextActivityPositionForDay(
    input: FindNextActivityPositionInput,
  ): Promise<number> {
    const maxPosition = Array.from(this.activities.values())
      .filter((activity) => activity.itineraryDayId === input.dayId)
      .reduce((currentMax, activity) => Math.max(currentMax, activity.position), 0);

    return Promise.resolve(maxPosition + 1);
  }

  updateDay(day: ItineraryDay): Promise<ItineraryDay> {
    this.days.set(day.id, day);

    return Promise.resolve(day);
  }

  deleteDay(dayId: string): Promise<void> {
    this.days.delete(dayId);

    for (const activity of Array.from(this.activities.values())) {
      if (activity.itineraryDayId === dayId) {
        this.activities.delete(activity.id);
      }
    }

    return Promise.resolve();
  }

  updateActivity(activity: ItineraryActivity): Promise<ItineraryActivity> {
    this.activities.set(activity.id, activity);

    return Promise.resolve(activity);
  }

  deleteActivity(activityId: string): Promise<void> {
    this.activities.delete(activityId);

    return Promise.resolve();
  }

  clear(): void {
    this.activities.clear();
    this.days.clear();
  }

  private listActivitiesForDay(dayId: string): ItineraryActivity[] {
    return Array.from(this.activities.values())
      .filter((activity) => activity.itineraryDayId === dayId)
      .sort(createActivityComparator());
  }
}

function createDayComparator() {
  return (left: ItineraryDay, right: ItineraryDay): number => {
    const dateComparison = compareValues(left.date, right.date);

    if (dateComparison !== 0) {
      return dateComparison;
    }

    const positionComparison = compareValues(left.position, right.position);

    if (positionComparison !== 0) {
      return positionComparison;
    }

    const createdAtComparison = compareValues(
      left.createdAt.getTime(),
      right.createdAt.getTime(),
    );

    if (createdAtComparison !== 0) {
      return createdAtComparison;
    }

    return compareValues(left.id, right.id);
  };
}

function createActivityComparator() {
  return (left: ItineraryActivity, right: ItineraryActivity): number => {
    const positionComparison = compareValues(left.position, right.position);

    if (positionComparison !== 0) {
      return positionComparison;
    }

    const createdAtComparison = compareValues(
      left.createdAt.getTime(),
      right.createdAt.getTime(),
    );

    if (createdAtComparison !== 0) {
      return createdAtComparison;
    }

    return compareValues(left.id, right.id);
  };
}

function compareValues(left: number | string, right: number | string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}
