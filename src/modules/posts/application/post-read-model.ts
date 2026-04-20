export interface PostAuthorSummary {
  id: string;
  displayName: string | null;
}

export interface PostTripSummary {
  id: string;
  name: string;
  coverImageUrl: string | null;
}

export interface PostReadModel {
  id: string;
  userId: string;
  tripId: string | null;
  title: string;
  content: string;
  coverImageUrl: string | null;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  author: PostAuthorSummary;
  trip: PostTripSummary | null;
}
