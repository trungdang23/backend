import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import {
  JOURNAL_OBJECT_TYPES,
  MAX_JOURNAL_BACKGROUND_STYLE_LENGTH,
  MAX_JOURNAL_OBJECT_ID_LENGTH,
  MAX_JOURNAL_OBJECTS,
} from '../../domain/trip-journal';

class JournalPageBackgroundRequestDto {
  @ApiProperty({
    example: 'paper-cream',
    maxLength: MAX_JOURNAL_BACKGROUND_STYLE_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_JOURNAL_BACKGROUND_STYLE_LENGTH)
  style!: string;
}

class JournalPageRequestDto {
  @ApiProperty({ example: 1200, minimum: 320, maximum: 4000 })
  @Type(() => Number)
  @IsInt()
  @Min(320)
  @Max(4000)
  width!: number;

  @ApiProperty({ example: 1600, minimum: 320, maximum: 5000 })
  @Type(() => Number)
  @IsInt()
  @Min(320)
  @Max(5000)
  height!: number;

  @ApiProperty({ type: JournalPageBackgroundRequestDto })
  @ValidateNested()
  @Type(() => JournalPageBackgroundRequestDto)
  background!: JournalPageBackgroundRequestDto;
}

class JournalSceneObjectRequestDto {
  @ApiProperty({ example: 'obj-note-1', maxLength: MAX_JOURNAL_OBJECT_ID_LENGTH })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_JOURNAL_OBJECT_ID_LENGTH)
  id!: string;

  @ApiProperty({ enum: JOURNAL_OBJECT_TYPES, example: 'note' })
  @IsString()
  @IsIn(JOURNAL_OBJECT_TYPES)
  type!: string;

  @ApiProperty({ example: 120, minimum: -4000, maximum: 8000 })
  @Type(() => Number)
  @IsNumber()
  @Min(-4000)
  @Max(8000)
  x!: number;

  @ApiProperty({ example: 180, minimum: -4000, maximum: 9000 })
  @Type(() => Number)
  @IsNumber()
  @Min(-4000)
  @Max(9000)
  y!: number;

  @ApiProperty({ example: 320, minimum: 1, maximum: 4000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4000)
  width!: number;

  @ApiProperty({ example: 220, minimum: 1, maximum: 4000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4000)
  height!: number;

  @ApiProperty({ example: -4, minimum: -360, maximum: 360 })
  @Type(() => Number)
  @IsNumber()
  @Min(-360)
  @Max(360)
  rotation!: number;

  @ApiProperty({ example: 1, minimum: 0, maximum: 10000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  zIndex!: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @ApiPropertyOptional({
    type: Object,
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;
}

export class SaveTripJournalRequestDto {
  @ApiProperty({ example: 1, minimum: 1, maximum: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  sceneVersion!: number;

  @ApiProperty({ type: JournalPageRequestDto })
  @ValidateNested()
  @Type(() => JournalPageRequestDto)
  page!: JournalPageRequestDto;

  @ApiProperty({
    type: [JournalSceneObjectRequestDto],
    maxItems: MAX_JOURNAL_OBJECTS,
  })
  @IsArray()
  @ArrayMaxSize(MAX_JOURNAL_OBJECTS)
  @ValidateNested({ each: true })
  @Type(() => JournalSceneObjectRequestDto)
  objects!: JournalSceneObjectRequestDto[];
}
