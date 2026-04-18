import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { CreatePlanNodeService } from '../application/services/create-plan-node.service';
import { DeletePlanNodeService } from '../application/services/delete-plan-node.service';
import { GetTripPlannerService } from '../application/services/get-trip-planner.service';
import { UpdatePlanNodeService } from '../application/services/update-plan-node.service';
import { CreatePlanNodeRequestDto } from './dto/create-plan-node-request.dto';
import { PlanNodeResponseDto } from './dto/plan-node-response.dto';
import { TripPlannerResponseDto } from './dto/trip-planner-response.dto';
import { UpdatePlanNodeRequestDto } from './dto/update-plan-node-request.dto';

@ApiTags('planning')
@ApiBearerAuth()
@Controller()
@UseGuards(AccessTokenAuthGuard)
export class PlanningController {
  constructor(
    private readonly createPlanNode: CreatePlanNodeService,
    private readonly deletePlanNode: DeletePlanNodeService,
    private readonly getTripPlanner: GetTripPlannerService,
    private readonly updatePlanNode: UpdatePlanNodeService,
  ) {}

  @Get('trips/:tripId/planner')
  async getPlanner(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('tripId') tripId: string,
  ) {
    const result = await this.getTripPlanner.execute({
      userId: authenticatedUser.userId,
      tripId,
    });

    return TripPlannerResponseDto.from(result);
  }

  @Post('nodes')
  async createNode(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() input: CreatePlanNodeRequestDto,
  ) {
    const node = await this.createPlanNode.execute({
      userId: authenticatedUser.userId,
      tripId: input.tripId,
      parentId: input.parentId,
      type: input.type,
      title: input.title,
      notes: input.notes,
      startAt: input.startAt,
      endAt: input.endAt,
      costAmount: input.costAmount,
      costCurrency: input.costCurrency,
      imageUrl: input.imageUrl,
      sortOrder: input.sortOrder,
    });

    return PlanNodeResponseDto.from(node);
  }

  @Patch('nodes/:nodeId')
  async updateNode(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('nodeId') nodeId: string,
    @Body() input: UpdatePlanNodeRequestDto,
  ) {
    const node = await this.updatePlanNode.execute({
      userId: authenticatedUser.userId,
      nodeId,
      type: input.type,
      title: input.title,
      notes: input.notes,
      startAt: input.startAt,
      endAt: input.endAt,
      costAmount: input.costAmount,
      costCurrency: input.costCurrency,
      imageUrl: input.imageUrl,
      sortOrder: input.sortOrder,
    });

    return PlanNodeResponseDto.from(node);
  }

  @Delete('nodes/:nodeId')
  @HttpCode(204)
  async deleteNode(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Param('nodeId') nodeId: string,
  ) {
    await this.deletePlanNode.execute({
      userId: authenticatedUser.userId,
      nodeId,
    });
  }
}
