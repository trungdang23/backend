import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { HealthSnapshot } from '../../application/health.service';

class HealthDatabaseCheckDto {
  @ApiProperty({ example: 'up' })
  status!: 'up';
}

export class HealthSnapshotResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 'journey-backend' })
  service!: string;

  @ApiProperty({ example: 'production' })
  environment!: string;

  @ApiProperty({ example: '0.1.0' })
  version!: string;

  @ApiPropertyOptional({ example: 'abc123def', nullable: true })
  releaseSha!: string | null;

  @ApiProperty({ example: '2026-05-12T00:00:00.000Z' })
  timestamp!: string;

  @ApiProperty({ type: () => HealthDatabaseCheckDto })
  checks!: {
    database: {
      status: 'up';
    };
  };

  static from(snapshot: HealthSnapshot): HealthSnapshotResponseDto {
    const dto = new HealthSnapshotResponseDto();
    dto.status = snapshot.status;
    dto.service = snapshot.service;
    dto.environment = snapshot.environment;
    dto.version = snapshot.version;
    dto.releaseSha = snapshot.releaseSha;
    dto.timestamp = snapshot.timestamp;
    dto.checks = snapshot.checks;
    return dto;
  }
}
