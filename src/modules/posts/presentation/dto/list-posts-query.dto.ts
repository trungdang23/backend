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
  DEFAULT_POST_SORT,
  POST_SORT_FIELDS,
} from '../../application/post-sort';

const POST_SORT_OPTIONS = POST_SORT_FIELDS.flatMap((field) => [
  `${field},asc`,
  `${field},desc`,
]);

export class ListPostsQueryDto {
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  size?: number;

  @ApiPropertyOptional({
    default: `${DEFAULT_POST_SORT.field},${DEFAULT_POST_SORT.direction}`,
    enum: POST_SORT_OPTIONS,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sort?: string;
}
