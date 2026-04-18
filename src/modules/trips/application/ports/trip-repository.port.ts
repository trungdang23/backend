import type { Trip } from '../../domain/trip';
import type { TripSort } from '../trip-sort';

export const TRIP_REPOSITORY = Symbol('TRIP_REPOSITORY');

export interface CreateTripRecordInput {
  userId: string;
  name: string;
  destination?: string | null;
  summaryNotes?: string | null;
  coverImageUrl?: string | null;
  startDate: string;
  endDate: string;
  timezone?: string | null;
  budgetAmount: number;
  budgetCurrency: string;
  budgetMode: string;
  manualBudgetAmount?: number | null;
  manualBudgetCurrency?: string | null;
  visibility: string;
}

export interface FindTripForUserInput {
  tripId: string;
  userId: string;
}

export interface ListTripsForUserInput {
  userId: string;
  page: number;
  size: number;
  sort: TripSort;
}

export interface ListTripsForUserResult {
  trips: Trip[];
  totalElements: number;
}

export interface TripRepositoryPort {
  create(input: CreateTripRecordInput): Promise<Trip>;
  findByIdForUser(input: FindTripForUserInput): Promise<Trip | null>;
  listByUser(input: ListTripsForUserInput): Promise<ListTripsForUserResult>;
  update(trip: Trip): Promise<Trip>;
  delete(input: FindTripForUserInput): Promise<Trip | null>;
}
