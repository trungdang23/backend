import { ApiProperty } from '@nestjs/swagger';

import type { TripPlannerResult } from '../../application/services/get-trip-planner.service';
import { TripResponseDto } from '../../../trips/presentation/dto/trip-response.dto';
import { PlanNodeResponseDto } from './plan-node-response.dto';

class TripPlannerPayloadDto {
  @ApiProperty({ type: TripResponseDto })
  trip!: TripResponseDto;

  @ApiProperty({ type: [PlanNodeResponseDto] })
  nodes!: PlanNodeResponseDto[];
}

export class TripPlannerResponseDto {
  @ApiProperty({ type: TripPlannerPayloadDto })
  data!: TripPlannerPayloadDto;

  static from(result: TripPlannerResult): TripPlannerPayloadDto {
    return {
      trip: TripResponseDto.from(result.trip),
      nodes: result.nodes.map((node) => PlanNodeResponseDto.from(node)),
    };
  }
}
