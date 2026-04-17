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
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount: number;
  costCurrency: string;
  position: number;
  imageUrls: string[];
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

export interface FindNextDayPositionInput {
  tripId: string;
  date: string;
}

export interface FindNextActivityPositionInput {
  dayId: string;
}

export interface CreateItineraryActivityRecordInput {
  itineraryDayId: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  location?: string | null;
  notes?: string | null;
  costAmount: number;
  costCurrency: string;
  position: number;
  imageUrls: string[];
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
  findNextDayPositionForDate(
    input: FindNextDayPositionInput,
  ): Promise<number>;
  createActivity(
    input: CreateItineraryActivityRecordInput,
  ): Promise<ItineraryActivity>;
  findNextActivityPositionForDay(
    input: FindNextActivityPositionInput,
  ): Promise<number>;
  updateDay(day: ItineraryDay): Promise<ItineraryDay>;
  deleteDay(dayId: string): Promise<void>;
  updateActivity(activity: ItineraryActivity): Promise<ItineraryActivity>;
  deleteActivity(activityId: string): Promise<void>;
}
