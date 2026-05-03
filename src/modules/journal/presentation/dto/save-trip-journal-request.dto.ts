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
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_JOURNAL_BACKGROUND_STYLE_LENGTH)
  style!: string;
}

class JournalPageRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(320)
  @Max(4000)
  width!: number;

  @Type(() => Number)
  @IsInt()
  @Min(320)
  @Max(5000)
  height!: number;

  @ValidateNested()
  @Type(() => JournalPageBackgroundRequestDto)
  background!: JournalPageBackgroundRequestDto;
}

class JournalSceneObjectRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_JOURNAL_OBJECT_ID_LENGTH)
  id!: string;

  @IsString()
  @IsIn(JOURNAL_OBJECT_TYPES)
  type!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(-4000)
  @Max(8000)
  x!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-4000)
  @Max(9000)
  y!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4000)
  width!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4000)
  height!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(-360)
  @Max(360)
  rotation!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  zIndex!: number;

  @IsOptional()
  @IsBoolean()
  locked?: boolean;

  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;
}

export class SaveTripJournalRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  sceneVersion!: number;

  @ValidateNested()
  @Type(() => JournalPageRequestDto)
  page!: JournalPageRequestDto;

  @IsArray()
  @ArrayMaxSize(MAX_JOURNAL_OBJECTS)
  @ValidateNested({ each: true })
  @Type(() => JournalSceneObjectRequestDto)
  objects!: JournalSceneObjectRequestDto[];
}
