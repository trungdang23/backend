import { Module } from '@nestjs/common';

import { AppConfigService } from '../../app/config/app-config.service';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TRIP_REPOSITORY } from './application/ports/trip-repository.port';
import { CreateTripService } from './application/services/create-trip.service';
import { DeleteTripService } from './application/services/delete-trip.service';
import { GetPublicTripDetailService } from './application/services/get-public-trip-detail.service';
import { GetTripDetailService } from './application/services/get-trip-detail.service';
import { ListPublicTripsService } from './application/services/list-public-trips.service';
import { ListTripsService } from './application/services/list-trips.service';
import { TripAuthorPresenterService } from './application/services/trip-author-presenter.service';
import { UpdateTripService } from './application/services/update-trip.service';
import { PrismaTripRepository } from './infrastructure/prisma/prisma-trip.repository';
import { PublicTripsController } from './presentation/public-trips.controller';
import { TripsController } from './presentation/trips.controller';

@Module({
  imports: [AuthModule, PrismaModule, UsersModule],
  controllers: [PublicTripsController, TripsController],
  providers: [
    AppConfigService,
    CreateTripService,
    DeleteTripService,
    GetPublicTripDetailService,
    GetTripDetailService,
    ListPublicTripsService,
    ListTripsService,
    TripAuthorPresenterService,
    UpdateTripService,
    {
      provide: TRIP_REPOSITORY,
      useClass: PrismaTripRepository,
    },
  ],
  exports: [TRIP_REPOSITORY, TripAuthorPresenterService],
})
export class TripsModule {}
