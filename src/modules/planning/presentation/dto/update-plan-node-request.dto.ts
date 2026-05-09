import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdatePlanNodeRequestDto {
  @ApiPropertyOptional({ enum: PLAN_NODE_TYPES })
  @IsOptional()
  @IsString()
  @IsIn(PLAN_NODE_TYPES)
  type?: string;

  @ApiPropertyOptional({ maxLength: MAX_PLAN_NODE_TITLE_LENGTH })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PLAN_NODE_TITLE_LENGTH)
  title?: string;

  @ApiPropertyOptional({ maxLength: MAX_PLAN_NODE_NOTES_LENGTH, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_PLAN_NODE_NOTES_LENGTH)
  notes?: string | null;

  @ApiPropertyOptional({ example: '2026-07-12T09:00', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(ISO_DATE_TIME_REGEX)
  startAt?: string | null;

  @ApiPropertyOptional({ example: '2026-07-12T11:00', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(ISO_DATE_TIME_REGEX)
  endAt?: string | null;

  @ApiPropertyOptional({ minimum: 0, maximum: MAX_TRIP_BUDGET_AMOUNT, nullable: true })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_TRIP_BUDGET_AMOUNT)
  costAmount?: number | null;

  @ApiPropertyOptional({ example: 'VND', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z]{3}$/)
  costCurrency?: string | null;

  @ApiPropertyOptional({
    maxLength: MAX_TRIP_COVER_IMAGE_URL_LENGTH,
    nullable: true,
    format: 'uri',
  })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_TRIP_COVER_IMAGE_URL_LENGTH)
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
  })
  imageUrl?: string | null;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
