import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { buildSuccessResponse } from '../../../app/http/api-response';
import {
  ApiErrorEnvelopeResponse,
  ApiPaginatedSuccessEnvelopeResponse,
  ApiSuccessEnvelopeResponse,
} from '../../../app/http/swagger-response.decorators';
import type { AuthenticatedUser } from '../../auth/application/authenticated-user';
import { Public } from '../../auth/presentation/decorators/public.decorator';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';
import { AccessTokenAuthGuard } from '../../auth/presentation/guards/access-token-auth.guard';
import { CreatePostService } from '../application/services/create-post.service';
import { GetPostDetailService } from '../application/services/get-post-detail.service';
import { ListPublicPostsService } from '../application/services/list-public-posts.service';
import { ListUserPostsService } from '../application/services/list-user-posts.service';
import { CreatePostRequestDto } from './dto/create-post-request.dto';
import { ListPostsQueryDto } from './dto/list-posts-query.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { formatPostSort, parsePostSort } from './post-sort-query';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly createPost: CreatePostService,
    private readonly getPostDetail: GetPostDetailService,
    private readonly listPublicPosts: ListPublicPostsService,
    private readonly listUserPosts: ListUserPostsService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AccessTokenAuthGuard)
  @ApiOperation({ summary: 'Create a public post owned by the authenticated user.' })
  @ApiSuccessEnvelopeResponse(PostResponseDto, {
    description: 'Returns the newly created post.',
    status: 201,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for the post payload.',
    status: 400,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  @ApiErrorEnvelopeResponse({
    description: 'The referenced trip is not accessible for post creation.',
    status: 404,
  })
  async create(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Body() input: CreatePostRequestDto,
  ) {
    const post = await this.createPost.execute({
      userId: authenticatedUser.userId,
      title: input.title,
      content: input.content,
      coverImageUrl: input.coverImageUrl,
      tripId: input.tripId,
    });

    return PostResponseDto.from(post);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List public posts available for discovery.' })
  @ApiPaginatedSuccessEnvelopeResponse(
    PostResponseDto,
    'Returns public posts with pagination metadata.',
  )
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for one or more post query parameters.',
    status: 400,
  })
  async list(@Query() query: ListPostsQueryDto) {
    const page = query.page ?? 0;
    const size = query.size ?? 12;
    const sort = parsePostSort(query.sort);
    const result = await this.listPublicPosts.execute({
      page,
      size,
      sort,
    });

    return buildSuccessResponse(
      result.posts.map((post) => PostResponseDto.from(post)),
      {
        page,
        size,
        sort: formatPostSort(sort),
        totalElements: result.totalElements,
        totalPages: Math.ceil(result.totalElements / size),
      },
    );
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(AccessTokenAuthGuard)
  @ApiOperation({ summary: 'List posts owned by the authenticated user.' })
  @ApiPaginatedSuccessEnvelopeResponse(
    PostResponseDto,
    'Returns the authenticated user posts with pagination metadata.',
  )
  @ApiErrorEnvelopeResponse({
    description: 'Validation failed for one or more post query parameters.',
    status: 400,
  })
  @ApiErrorEnvelopeResponse({
    description: 'Authentication is required.',
    status: 401,
  })
  async listMine(
    @CurrentUser() authenticatedUser: AuthenticatedUser,
    @Query() query: ListPostsQueryDto,
  ) {
    const page = query.page ?? 0;
    const size = query.size ?? 12;
    const sort = parsePostSort(query.sort);
    const result = await this.listUserPosts.execute({
      userId: authenticatedUser.userId,
      page,
      size,
      sort,
    });

    return buildSuccessResponse(
      result.posts.map((post) => PostResponseDto.from(post)),
      {
        page,
        size,
        sort: formatPostSort(sort),
        totalElements: result.totalElements,
        totalPages: Math.ceil(result.totalElements / size),
      },
    );
  }

  @Get(':postId')
  @Public()
  @ApiOperation({ summary: 'Get a public post by id.' })
  @ApiSuccessEnvelopeResponse(PostResponseDto, {
    description: 'Returns the requested public post.',
  })
  @ApiErrorEnvelopeResponse({
    description: 'The requested public post does not exist.',
    status: 404,
  })
  async detail(@Param('postId') postId: string) {
    const post = await this.getPostDetail.execute(postId);

    return PostResponseDto.from(post);
  }
}
