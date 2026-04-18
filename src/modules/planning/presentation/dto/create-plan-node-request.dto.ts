import { Type } from 'class-transformer';
import {
  IsIn,
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
  ISO_DATE_TIME_REGEX,
  MAX_PLAN_NODE_NOTES_LENGTH,
  MAX_PLAN_NODE_TITLE_LENGTH,
  PLAN_NODE_TYPES,
} from '../../domain/plan-node';
import { MAX_TRIP_BUDGET_AMOUNT } from '../../../trips/domain/trip-budget';
import { MAX_TRIP_COVER_IMAGE_URL_LENGTH } from '../../../trips/domain/trip';

export class CreatePlanNodeRequestDto {
  @IsString()
  @MinLength(1)
  tripId!: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  parentId?: string | null;

  @IsString()
  @IsIn(PLAN_NODE_TYPES)
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PLAN_NODE_TITLE_LENGTH)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_PLAN_NODE_NOTES_LENGTH)
  notes?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ISO_DATE_TIME_REGEX)
  startAt?: string | null;

  @IsOptional()
  @IsString()
  @Matches(ISO_DATE_TIME_REGEX)
  endAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_TRIP_BUDGET_AMOUNT)
  costAmount?: number | null;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{3}$/)
  costCurrency?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_TRIP_COVER_IMAGE_URL_LENGTH)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  imageUrl?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number;
}
