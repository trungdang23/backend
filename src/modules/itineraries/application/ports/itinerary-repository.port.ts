import type { ItineraryActivity } from '../../domain/itinerary-activity';
import type { ItineraryDay } from '../../domain/itinerary-day';

export const ITINERARY_REPOSITORY = Symbol('ITINERARY_REPOSITORY');

export interface ItineraryDayAggregate {
  day: ItineraryDay;
  activities: ItineraryActivity[];
}

export interface CreateItineraryDayRecordInput {
  tripId: string;
  date: string;
}

export interface FindItineraryDayByDateInput {
  tripId: string;
  date: string;
}

export interface FindItineraryDayAggregateInput {
  tripId: string;
  dayId: string;
}

export interface ListTripItineraryInput {
  tripId: string;
}

export interface CreateItineraryActivityRecordInput {
  itineraryDayId: string;
  title: string;
  startsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount: number;
  costCurrency: string;
  position: number;
}

export interface ItineraryRepositoryPort {
  createDay(input: CreateItineraryDayRecordInput): Promise<ItineraryDay>;
  findDayByDateForTrip(
    input: FindItineraryDayByDateInput,
  ): Promise<ItineraryDay | null>;
  findDayAggregateByIdForTrip(
    input: FindItineraryDayAggregateInput,
  ): Promise<ItineraryDayAggregate | null>;
  listDayAggregatesByTrip(
    input: ListTripItineraryInput,
  ): Promise<ItineraryDayAggregate[]>;
  createActivity(
    input: CreateItineraryActivityRecordInput,
  ): Promise<ItineraryActivity>;
  updateActivity(activity: ItineraryActivity): Promise<ItineraryActivity>;
}
