import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  DEFAULT_TRIP_SORT,
  TRIP_SORT_FIELDS,
} from '../../application/trip-sort';

const TRIP_SORT_OPTIONS = TRIP_SORT_FIELDS.flatMap((field) => [
  `${field},asc`,
  `${field},desc`,
]);

export class ListTripsQueryDto {
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number;

  @ApiPropertyOptional({
    default: `${DEFAULT_TRIP_SORT.field},${DEFAULT_TRIP_SORT.direction}`,
    enum: TRIP_SORT_OPTIONS,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sort?: string;
}
