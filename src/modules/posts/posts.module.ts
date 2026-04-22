import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { TripsModule } from '../trips/trips.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { POST_REPOSITORY } from './application/ports/post-repository.port';
import { CreatePostService } from './application/services/create-post.service';
import { GetPostDetailService } from './application/services/get-post-detail.service';
import { ListPublicPostsService } from './application/services/list-public-posts.service';
import { ListUserPostsService } from './application/services/list-user-posts.service';
import { PostReadModelHydratorService } from './application/services/post-read-model-hydrator.service';
import { PrismaPostRepository } from './infrastructure/prisma/prisma-post.repository';
import { PostsController } from './presentation/posts.controller';

@Module({
  imports: [AuthModule, PrismaModule, TripsModule, UsersModule],
  controllers: [PostsController],
  providers: [
    CreatePostService,
    GetPostDetailService,
    ListPublicPostsService,
    ListUserPostsService,
    PostReadModelHydratorService,
    {
      provide: POST_REPOSITORY,
      useClass: PrismaPostRepository,
    },
  ],
  exports: [POST_REPOSITORY],
})
export class PostsModule {}
