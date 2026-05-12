import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { PostReadModel } from '../../application/post-read-model';
import { POST_VISIBILITIES } from '../../domain/post';

class PostAuthorSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  displayName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl!: string | null;
}

class PostTripSummaryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;
}

export class PostResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional({ nullable: true })
  tripId!: string | null;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiPropertyOptional({ nullable: true })
  coverImageUrl!: string | null;

  @ApiProperty({ enum: POST_VISIBILITIES })
  visibility!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: PostAuthorSummaryDto })
  author!: PostAuthorSummaryDto;

  @ApiPropertyOptional({ type: PostTripSummaryDto, nullable: true })
  trip!: PostTripSummaryDto | null;

  static from(post: PostReadModel): PostResponseDto {
    return {
      id: post.id,
      userId: post.userId,
      tripId: post.tripId,
      title: post.title,
      content: post.content,
      coverImageUrl: post.coverImageUrl,
      visibility: post.visibility,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      author: {
        id: post.author.id,
        displayName: post.author.displayName,
        avatarUrl: post.author.avatarUrl,
      },
      trip:
        post.trip === null
          ? null
          : {
              id: post.trip.id,
              name: post.trip.name,
              coverImageUrl: post.trip.coverImageUrl,
            },
    };
  }
}
