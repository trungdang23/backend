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
  MAX_TRIP_DESTINATION_LENGTH,
  MAX_TRIP_NAME_LENGTH,
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
