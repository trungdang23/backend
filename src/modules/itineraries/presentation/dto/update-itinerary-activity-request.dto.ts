import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  MAX_ITINERARY_ACTIVITY_LOCATION_LENGTH,
  MAX_ITINERARY_ACTIVITY_NOTES_LENGTH,
  MAX_ITINERARY_ACTIVITY_TITLE_LENGTH,
  TIME_OF_DAY_REGEX,
} from '../../domain/itinerary-activity';
import { MAX_TRIP_BUDGET_AMOUNT } from '../../../trips/domain/trip-budget';

export class UpdateItineraryActivityRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_ITINERARY_ACTIVITY_TITLE_LENGTH)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_OF_DAY_REGEX)
  startsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ITINERARY_ACTIVITY_LOCATION_LENGTH)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ITINERARY_ACTIVITY_NOTES_LENGTH)
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_TRIP_BUDGET_AMOUNT)
  costAmount?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{3}$/)
  costCurrency?: string;
}
