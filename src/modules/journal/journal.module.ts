import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TripsModule } from '../trips/trips.module';
import { JOURNAL_ASSET_STORAGE } from './application/ports/journal-asset-storage.port';
import { TRIP_JOURNAL_ASSET_REPOSITORY } from './application/ports/trip-journal-asset-repository.port';
import { TRIP_JOURNAL_REPOSITORY } from './application/ports/trip-journal-repository.port';
import { DeleteTripJournalService } from './application/services/delete-trip-journal.service';
import { GetTripJournalAssetFileService } from './application/services/get-trip-journal-asset-file.service';
import { GetPublicTripJournalService } from './application/services/get-public-trip-journal.service';
import { GetTripJournalService } from './application/services/get-trip-journal.service';
import { ListPublicJournalsService } from './application/services/list-public-journals.service';
import { ListUserJournalsService } from './application/services/list-user-journals.service';
import { SaveTripJournalService } from './application/services/save-trip-journal.service';
import { UpdateTripJournalVisibilityService } from './application/services/update-trip-journal-visibility.service';
import { UploadTripJournalAssetService } from './application/services/upload-trip-journal-asset.service';
import { PrismaTripJournalAssetRepository } from './infrastructure/prisma/prisma-trip-journal-asset.repository';
import { PrismaTripJournalRepository } from './infrastructure/prisma/prisma-trip-journal.repository';
import { LocalJournalAssetStorage } from './infrastructure/storage/local-journal-asset.storage';
import { JournalAssetController } from './presentation/journal-asset.controller';
import { JournalController } from './presentation/journal.controller';
import { PublicJournalController } from './presentation/public-journal.controller';

@Module({
  imports: [AuthModule, PrismaModule, TripsModule],
  controllers: [
    JournalAssetController,
    JournalController,
    PublicJournalController,
  ],
  providers: [
    DeleteTripJournalService,
    GetTripJournalAssetFileService,
    GetPublicTripJournalService,
    GetTripJournalService,
    ListPublicJournalsService,
    ListUserJournalsService,
    SaveTripJournalService,
    UpdateTripJournalVisibilityService,
    UploadTripJournalAssetService,
    {
      provide: JOURNAL_ASSET_STORAGE,
      useClass: LocalJournalAssetStorage,
    },
    {
      provide: TRIP_JOURNAL_ASSET_REPOSITORY,
      useClass: PrismaTripJournalAssetRepository,
    },
    {
      provide: TRIP_JOURNAL_REPOSITORY,
      useClass: PrismaTripJournalRepository,
    },
  ],
  exports: [
    JOURNAL_ASSET_STORAGE,
    TRIP_JOURNAL_ASSET_REPOSITORY,
    TRIP_JOURNAL_REPOSITORY,
  ],
})
export class JournalModule {}
