import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TRIP_REPOSITORY } from './application/ports/trip-repository.port';
import { CreateTripService } from './application/services/create-trip.service';
import { DeleteTripService } from './application/services/delete-trip.service';
import { GetTripDetailService } from './application/services/get-trip-detail.service';
import { ListTripsService } from './application/services/list-trips.service';
import { UpdateTripService } from './application/services/update-trip.service';
import { PrismaTripRepository } from './infrastructure/prisma/prisma-trip.repository';
import { TripsController } from './presentation/trips.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [TripsController],
  providers: [
    CreateTripService,
    DeleteTripService,
    GetTripDetailService,
    ListTripsService,
    UpdateTripService,
    {
      provide: TRIP_REPOSITORY,
      useClass: PrismaTripRepository,
    },
  ],
  exports: [TRIP_REPOSITORY],
})
export class TripsModule {}
