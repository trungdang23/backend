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
import {
  ApiBearerAuth,
  ApiNoContentResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import {
  ApiErrorEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
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
  @ApiOperation({ summary: 'Get the full planner tree for an owned trip.' })
  @ApiSuccessEnvelopeResponse(TripPlannerResponseDto, {
    description: 'Returns the owned trip and its full planner node tree.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested trip does not exist for the authenticated user.',
    status: 404,
  })
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
  @ApiOperation({ summary: 'Create a planner node inside an owned trip.' })
  @ApiSuccessEnvelopeResponse(PlanNodeResponseDto, {
    description: 'Returns the newly created planner node.',
    status: 201,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for the planner node payload.',
    status: 400,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The target trip or parent node does not exist for the authenticated user.',
    status: 404,
  })
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
  @ApiOperation({ summary: 'Update an owned planner node.' })
  @ApiSuccessEnvelopeResponse(PlanNodeResponseDto, {
    description: 'Returns the updated planner node.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for the planner node update payload.',
    status: 400,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested planner node does not exist for the authenticated user.',
    status: 404,
  })
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
  @ApiOperation({ summary: 'Delete an owned planner node.' })
  @ApiNoContentResponse({
    description: 'Deletes the planner node and any owned descendants.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested planner node does not exist for the authenticated user.',
    status: 404,
  })
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
