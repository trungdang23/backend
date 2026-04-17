import { ApiProperty } from '@nestjs/swagger';

import type { TripItineraryResult } from '../../application/services/get-trip-itinerary.service';
import { ItineraryDayResponseDto } from './itinerary-day-response.dto';

export class TripItineraryResponseDto {
  @ApiProperty()
  tripId!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty({ type: [ItineraryDayResponseDto] })
  days!: ItineraryDayResponseDto[];

  static from(result: TripItineraryResult): TripItineraryResponseDto {
    return {
      tripId: result.trip.id,
      startDate: result.trip.startDate,
      endDate: result.trip.endDate,
      days: result.days.map((aggregate) =>
        ItineraryDayResponseDto.fromAggregate(aggregate),
      ),
    };
  }
}
