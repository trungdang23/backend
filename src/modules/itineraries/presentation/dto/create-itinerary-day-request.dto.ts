import { IsString, Matches } from 'class-validator';

import { ISO_DATE_REGEX } from '../../../trips/domain/trip-date-range';

export class CreateItineraryDayRequestDto {
  @IsString()
  @Matches(ISO_DATE_REGEX)
  date!: string;
}
