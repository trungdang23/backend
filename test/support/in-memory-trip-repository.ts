import type {
  CreateTripRecordInput,
  FindTripForUserInput,
  ListPublicTripsInput,
  ListTripsForUserInput,
  ListTripsForUserResult,
  TripRepositoryPort,
} from '../../src/modules/trips/application/ports/trip-repository.port';
import type { TripSort } from '../../src/modules/trips/application/trip-sort';
import { Trip } from '../../src/modules/trips/domain/trip';

export class InMemoryTripRepository implements TripRepositoryPort {
  private readonly trips = new Map<string, Trip>();

  create(input: CreateTripRecordInput): Promise<Trip> {
    const createdAt = new Date();
    const trip = Trip.create({
      id: `trip-${this.trips.size + 1}`,
      userId: input.userId,
      name: input.name,
      destination: input.destination,
      summaryNotes: input.summaryNotes,
      coverImageUrl: input.coverImageUrl,
      startDate: input.startDate,
      endDate: input.endDate,
      timezone: input.timezone,
      budgetAmount: input.budgetAmount,
      budgetCurrency: input.budgetCurrency,
      budgetMode: input.budgetMode,
      manualBudgetAmount: input.manualBudgetAmount,
      manualBudgetCurrency: input.manualBudgetCurrency,
      visibility: input.visibility,
      createdAt,
      updatedAt: createdAt,
    });

    this.trips.set(trip.id, trip);

    return Promise.resolve(trip);
  }

  findByIdForUser(input: FindTripForUserInput): Promise<Trip | null> {
    const trip = this.trips.get(input.tripId);

    if (trip === undefined || trip.userId !== input.userId) {
      return Promise.resolve(null);
    }

    return Promise.resolve(trip);
  }

  findById(tripId: string): Promise<Trip | null> {
    return Promise.resolve(this.trips.get(tripId) ?? null);
  }

  listPublic(input: ListPublicTripsInput): Promise<ListTripsForUserResult> {
    const filteredTrips = Array.from(this.trips.values())
      .filter((trip) => trip.visibility === 'public')
      .sort(createTripComparator(input.sort));

    const offset = input.page * input.size;

    return Promise.resolve({
      trips: filteredTrips.slice(offset, offset + input.size),
      totalElements: filteredTrips.length,
    });
  }

  listByUser(input: ListTripsForUserInput): Promise<ListTripsForUserResult> {
    const filteredTrips = Array.from(this.trips.values())
      .filter((trip) => trip.userId === input.userId)
      .sort(createTripComparator(input.sort));

    const offset = input.page * input.size;

    return Promise.resolve({
      trips: filteredTrips.slice(offset, offset + input.size),
      totalElements: filteredTrips.length,
    });
  }

  update(trip: Trip): Promise<Trip> {
    this.trips.set(trip.id, trip);

    return Promise.resolve(trip);
  }

  delete(input: FindTripForUserInput): Promise<Trip | null> {
    const trip = this.trips.get(input.tripId);

    if (trip === undefined || trip.userId !== input.userId) {
      return Promise.resolve(null);
    }

    this.trips.delete(trip.id);

    return Promise.resolve(trip);
  }

  clear(): void {
    this.trips.clear();
  }
}

function createTripComparator(sort: TripSort) {
  return (left: Trip, right: Trip): number => {
    const primaryComparison = compareValues(
      resolveTripSortValue(left, sort),
      resolveTripSortValue(right, sort),
    );

    if (primaryComparison !== 0) {
      return sort.direction === 'asc'
        ? primaryComparison
        : primaryComparison * -1;
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

function resolveTripSortValue(trip: Trip, sort: TripSort): number | string {
  switch (sort.field) {
    case 'createdAt':
      return trip.createdAt.getTime();
    case 'name':
      return trip.name;
    case 'startDate':
      return trip.startDate;
    case 'updatedAt':
      return trip.updatedAt.getTime();
  }
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
