import { Injectable } from '@nestjs/common';
import type { Post as PrismaPost, Prisma } from '@prisma/client';

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import type {
  CreatePostRecordInput,
  ListPublicPostsInput,
  ListPublicPostsResult,
  PostRepositoryPort,
} from '../../application/ports/post-repository.port';
import { Post } from '../../domain/post';

@Injectable()
export class PrismaPostRepository implements PostRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePostRecordInput): Promise<Post> {
    const record = await this.prisma.post.create({
      data: {
        userId: input.userId,
        tripId: input.tripId ?? null,
        title: input.title,
        content: input.content,
        coverImageUrl: input.coverImageUrl ?? null,
        visibility: input.visibility,
      },
    });

    return toPost(record);
  }

  async findById(postId: string): Promise<Post | null> {
    const record = await this.prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    return record === null ? null : toPost(record);
  }

  async listPublic(input: ListPublicPostsInput): Promise<ListPublicPostsResult> {
    const [records, totalElements] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where: {
          visibility: 'public',
        },
        orderBy: buildPostOrderBy(input.sort),
        skip: input.page * input.size,
        take: input.size,
      }),
      this.prisma.post.count({
        where: {
          visibility: 'public',
        },
      }),
    ]);

    return {
      posts: records.map((record) => toPost(record)),
      totalElements,
    };
  }
}

function toPost(record: PrismaPost): Post {
  return Post.create({
    id: record.id,
    userId: record.userId,
    tripId: record.tripId,
    title: record.title,
    content: record.content,
    coverImageUrl: record.coverImageUrl,
    visibility: record.visibility,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

function buildPostOrderBy(
  sort: ListPublicPostsInput['sort'],
): Prisma.PostOrderByWithRelationInput[] {
  const primaryOrderBy: Prisma.PostOrderByWithRelationInput = {
    [sort.field]: sort.direction,
  };

  return [primaryOrderBy, { id: 'asc' }];
}
