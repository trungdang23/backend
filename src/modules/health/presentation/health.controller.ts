import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';

import type { HealthSnapshot } from '../application/health.service';
import { HealthService } from '../application/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOkResponse({
    description: 'Returns the current application health snapshot.',
  })
  @ApiServiceUnavailableResponse({
    description: 'Returned when the application cannot reach the database.',
  })
  getHealth(): Promise<HealthSnapshot> {
    return this.healthService.getSnapshot();
  }
}
