import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginatedCollectionMetaDto {
  @ApiProperty({ example: 0 })
  page!: number;

  @ApiProperty({ example: 20 })
  size!: number;

  @ApiProperty({ example: 'createdAt,desc' })
  sort!: string;

  @ApiProperty({ example: 42 })
  totalElements!: number;

  @ApiProperty({ example: 3 })
  totalPages!: number;
}

export class ApiErrorPayloadResponseDto {
  @ApiProperty({ example: 'TRIP_NOT_FOUND' })
  code!: string;

  @ApiProperty({ example: 'Trip not found.' })
  message!: string;

  @ApiPropertyOptional({
    description: 'Optional machine-readable error details.',
    nullable: true,
    type: Object,
  })
  details?: unknown;

  @ApiPropertyOptional({
    description: 'Request path associated with the failure.',
    example: '/api/v1/trips/trip-123',
    nullable: true,
  })
  path?: string;

  @ApiProperty({ example: '2026-05-09T06:30:00.000Z' })
  timestamp!: string;
}

export class ApiErrorEnvelopeResponseDto {
  @ApiProperty({ example: false })
  success!: false;

  @ApiProperty({ type: () => ApiErrorPayloadResponseDto })
  error!: ApiErrorPayloadResponseDto;
}
