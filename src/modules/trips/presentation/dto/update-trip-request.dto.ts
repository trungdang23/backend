import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import {
  MAX_TRIP_COVER_IMAGE_URL_LENGTH,
  MAX_TRIP_DESTINATION_LENGTH,
  MAX_TRIP_NAME_LENGTH,
  MAX_TRIP_SUMMARY_NOTES_LENGTH,
  MAX_TRIP_TIMEZONE_LENGTH,
} from '../../domain/trip';
import { MAX_TRIP_BUDGET_AMOUNT } from '../../domain/trip-budget';
import { ISO_DATE_REGEX } from '../../domain/trip-date-range';

export class UpdateTripRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TRIP_NAME_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TRIP_DESTINATION_LENGTH)
  destination?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TRIP_SUMMARY_NOTES_LENGTH)
  summaryNotes?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TRIP_COVER_IMAGE_URL_LENGTH)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ISO_DATE_REGEX)
  startDate?: string;

  @IsOptional()
  @IsString()
  @Matches(ISO_DATE_REGEX)
  endDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TRIP_TIMEZONE_LENGTH)
  timezone?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_TRIP_BUDGET_AMOUNT)
  budgetAmount?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{3}$/)
  budgetCurrency?: string;
}
