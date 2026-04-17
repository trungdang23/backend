import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TripsModule } from '../trips/trips.module';
import { ITINERARY_REPOSITORY } from './application/ports/itinerary-repository.port';
import { AddItineraryActivityService } from './application/services/add-itinerary-activity.service';
import { AddItineraryDayService } from './application/services/add-itinerary-day.service';
import { GetTripItineraryService } from './application/services/get-trip-itinerary.service';
import { UpdateItineraryActivityService } from './application/services/update-itinerary-activity.service';
import { PrismaItineraryRepository } from './infrastructure/prisma/prisma-itinerary.repository';
import { ItinerariesController } from './presentation/itineraries.controller';

@Module({
  imports: [AuthModule, PrismaModule, TripsModule],
  controllers: [ItinerariesController],
  providers: [
    AddItineraryActivityService,
    AddItineraryDayService,
    GetTripItineraryService,
    UpdateItineraryActivityService,
    {
      provide: ITINERARY_REPOSITORY,
      useClass: PrismaItineraryRepository,
    },
  ],
  exports: [ITINERARY_REPOSITORY],
})
export class ItinerariesModule {}
