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
  ValidateNested,
} from 'class-validator';

import {
  MAX_PLAN_NODE_STICKERS,
  MAX_PLAN_NODE_STICKER_KEY_LENGTH,
  PLAN_NODE_STICKER_COORDINATE_MAX,
  PLAN_NODE_STICKER_KEY_REGEX,
  PLAN_NODE_STICKER_ROTATION_MAX,
  PLAN_NODE_STICKER_ROTATION_MIN,
  PLAN_NODE_STICKER_SCALE_MAX,
  PLAN_NODE_STICKER_SCALE_MIN,
  PLAN_NODE_STICKER_Z_INDEX_MAX,
} from '../../domain/plan-node-sticker';

export class SavePlanNodeStickerPlacementRequestDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  id?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(MAX_PLAN_NODE_STICKER_KEY_LENGTH)
  @Matches(PLAN_NODE_STICKER_KEY_REGEX)
  stickerKey!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(PLAN_NODE_STICKER_COORDINATE_MAX)
  x!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(PLAN_NODE_STICKER_COORDINATE_MAX)
  y!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PLAN_NODE_STICKER_ROTATION_MIN)
  @Max(PLAN_NODE_STICKER_ROTATION_MAX)
  rotation?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PLAN_NODE_STICKER_SCALE_MIN)
  @Max(PLAN_NODE_STICKER_SCALE_MAX)
  scale?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(PLAN_NODE_STICKER_Z_INDEX_MAX)
  zIndex?: number;
}

export class SavePlanNodeStickersRequestDto {
  @IsArray()
  @ArrayMaxSize(MAX_PLAN_NODE_STICKERS)
  @ValidateNested({ each: true })
  @Type(() => SavePlanNodeStickerPlacementRequestDto)
  stickers!: SavePlanNodeStickerPlacementRequestDto[];
}
