import { ApiProperty } from '@nestjs/swagger';

import type { TripPlannerResult } from '../../application/services/get-trip-planner.service';
import { TripResponseDto } from '../../../trips/presentation/dto/trip-response.dto';
import { PlanNodeResponseDto } from './plan-node-response.dto';

export class TripPlannerResponseDto {
  @ApiProperty({ type: TripResponseDto })
  trip!: TripResponseDto;

  @ApiProperty({ type: [PlanNodeResponseDto] })
  nodes!: PlanNodeResponseDto[];

  static from(result: TripPlannerResult): TripPlannerResponseDto {
    return {
      trip: TripResponseDto.from(result.trip),
      nodes: result.nodes.map((node) => PlanNodeResponseDto.from(node)),
    };
  }
}
