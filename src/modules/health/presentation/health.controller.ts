import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiErrorEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import { HealthService } from '../application/health.service';
import { HealthSnapshotResponseDto } from './dto/health-snapshot-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get the application health snapshot.' })
  @ApiSuccessEnvelopeResponse(HealthSnapshotResponseDto, {
    description: 'Returns the current application health snapshot.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Returned when the application cannot reach the database.',
    status: 503,
  })
  async getHealth() {
    const snapshot = await this.healthService.getSnapshot();

    return HealthSnapshotResponseDto.from(snapshot);
  }
}
