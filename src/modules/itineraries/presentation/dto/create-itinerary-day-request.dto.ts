import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
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
  MAX_ITINERARY_DAY_IMAGE_COUNT,
  MAX_ITINERARY_DAY_LOCATION_LENGTH,
  MAX_ITINERARY_DAY_NOTES_LENGTH,
  MAX_ITINERARY_DAY_TITLE_LENGTH,
  TIME_OF_DAY_REGEX,
} from '../../domain/itinerary-day';
import { ISO_DATE_REGEX } from '../../../trips/domain/trip-date-range';
import { MAX_TRIP_COVER_IMAGE_URL_LENGTH } from '../../../trips/domain/trip';
import { MAX_TRIP_BUDGET_AMOUNT } from '../../../trips/domain/trip-budget';

export class CreateItineraryDayRequestDto {
  @IsString()
  @Matches(ISO_DATE_REGEX)
  date!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_ITINERARY_DAY_TITLE_LENGTH)
  title!: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_OF_DAY_REGEX)
  startsAt?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_OF_DAY_REGEX)
  endsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ITINERARY_DAY_LOCATION_LENGTH)
  location?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ITINERARY_DAY_NOTES_LENGTH)
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

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_ITINERARY_DAY_IMAGE_COUNT)
  @IsString({ each: true })
  @MaxLength(MAX_TRIP_COVER_IMAGE_URL_LENGTH, { each: true })
  imageUrls?: string[];
}
