import { Type } from 'class-transformer';
import {
  IsInt,
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

export class CreateTripRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TRIP_NAME_LENGTH)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TRIP_DESTINATION_LENGTH)
  destination!: string;

  @IsString()
  @Matches(ISO_DATE_REGEX)
  startDate!: string;

  @IsString()
  @Matches(ISO_DATE_REGEX)
  endDate!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TRIP_TIMEZONE_LENGTH)
  timezone!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_TRIP_BUDGET_AMOUNT)
  budgetAmount!: number;

  @IsString()
  @Matches(/^[a-zA-Z]{3}$/)
  budgetCurrency!: string;
}
