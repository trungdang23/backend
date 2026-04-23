import { Module } from '@nestjs/common';

import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TripsModule } from '../trips/trips.module';
import { PLAN_NODE_REPOSITORY } from './application/ports/plan-node-repository.port';
import { PLAN_NODE_STICKER_REPOSITORY } from './application/ports/plan-node-sticker-repository.port';
import { CreatePlanNodeService } from './application/services/create-plan-node.service';
import { DeletePlanNodeService } from './application/services/delete-plan-node.service';
import { GetPlanNodeStickersService } from './application/services/get-plan-node-stickers.service';
import { GetPublicTripPlannerService } from './application/services/get-public-trip-planner.service';
import { GetTripPlannerService } from './application/services/get-trip-planner.service';
import { SavePlanNodeStickersService } from './application/services/save-plan-node-stickers.service';
import { UpdatePlanNodeService } from './application/services/update-plan-node.service';
import { PrismaPlanNodeRepository } from './infrastructure/prisma/prisma-plan-node.repository';
import { PrismaPlanNodeStickerRepository } from './infrastructure/prisma/prisma-plan-node-sticker.repository';
import { PlanningController } from './presentation/planning.controller';
import { PublicPlanningController } from './presentation/public-planning.controller';

@Module({
  imports: [AuthModule, PrismaModule, TripsModule],
  controllers: [PlanningController, PublicPlanningController],
  providers: [
    CreatePlanNodeService,
    DeletePlanNodeService,
    GetPlanNodeStickersService,
    GetPublicTripPlannerService,
    GetTripPlannerService,
    SavePlanNodeStickersService,
    UpdatePlanNodeService,
    {
      provide: PLAN_NODE_REPOSITORY,
      useClass: PrismaPlanNodeRepository,
    },
    {
      provide: PLAN_NODE_STICKER_REPOSITORY,
      useClass: PrismaPlanNodeStickerRepository,
    },
  ],
  exports: [PLAN_NODE_REPOSITORY, PLAN_NODE_STICKER_REPOSITORY],
})
export class PlanningModule {}
