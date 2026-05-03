import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TripsModule } from '../trips/trips.module';
import { TRIP_JOURNAL_REPOSITORY } from './application/ports/trip-journal-repository.port';
import { GetTripJournalService } from './application/services/get-trip-journal.service';
import { SaveTripJournalService } from './application/services/save-trip-journal.service';
import { PrismaTripJournalRepository } from './infrastructure/prisma/prisma-trip-journal.repository';
import { JournalController } from './presentation/journal.controller';

@Module({
  imports: [AuthModule, PrismaModule, TripsModule],
  controllers: [JournalController],
  providers: [
    GetTripJournalService,
    SaveTripJournalService,
    {
      provide: TRIP_JOURNAL_REPOSITORY,
      useClass: PrismaTripJournalRepository,
    },
  ],
  exports: [TRIP_JOURNAL_REPOSITORY],
})
export class JournalModule {}
