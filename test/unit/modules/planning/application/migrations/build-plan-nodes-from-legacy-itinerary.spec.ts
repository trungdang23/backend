import {
  buildPlanNodesFromLegacyItinerary,
  LEGACY_ITINERARY_ACTIVITY_NODE_ID_PREFIX,
  LEGACY_ITINERARY_DAY_COST_NODE_ID_PREFIX,
  LEGACY_ITINERARY_DAY_LOCATION_NODE_ID_PREFIX,
  LEGACY_ITINERARY_DAY_NODE_ID_PREFIX,
} from '../../../../../../src/modules/planning/application/migrations/build-plan-nodes-from-legacy-itinerary';
import { ItineraryActivity } from '../../../../../../src/modules/itineraries/domain/itinerary-activity';
import { ItineraryDay } from '../../../../../../src/modules/itineraries/domain/itinerary-day';

describe('buildPlanNodesFromLegacyItinerary', () => {
  it('maps day, location, activities, and day-level cost into deterministic plan nodes', () => {
    const day = createDay({
      id: 'day-1',
      date: '2026-07-12',
      title: 'Ngay 1',
      startsAt: '08:00',
      endsAt: '21:00',
      location: 'Da Nang',
      notes: 'Nhan phong som',
      costAmount: 300000,
      costCurrency: 'VND',
      position: 2,
      imageUrls: [
        'https://example.com/day-cover.jpg',
        'https://example.com/day-extra.jpg',
      ],
      createdAt: new Date('2026-07-01T08:00:00.000Z'),
      updatedAt: new Date('2026-07-01T10:00:00.000Z'),
    });
    const breakfast = createActivity({
      id: 'activity-1',
      itineraryDayId: day.id,
      title: 'An sang',
      startsAt: '08:30',
      endsAt: '09:15',
      location: 'Hem 42',
      notes: 'Bun cha ca',
      costAmount: 0,
      costCurrency: 'VND',
      position: 2,
      imageUrls: [
        'https://example.com/breakfast.jpg',
        'https://example.com/breakfast-extra.jpg',
      ],
      createdAt: new Date('2026-07-01T08:30:00.000Z'),
      updatedAt: new Date('2026-07-01T08:45:00.000Z'),
    });
    const checkin = createActivity({
      id: 'activity-2',
      itineraryDayId: day.id,
      title: 'Check-in khach san',
      startsAt: '14:00',
      endsAt: null,
      location: null,
      notes: null,
      costAmount: 500000,
      costCurrency: 'usd',
      position: 1,
      imageUrls: [],
      createdAt: new Date('2026-07-01T09:00:00.000Z'),
      updatedAt: new Date('2026-07-01T09:30:00.000Z'),
    });

    const result = buildPlanNodesFromLegacyItinerary({
      tripId: 'trip-1',
      dayAggregates: [
        {
          day,
          activities: [breakfast, checkin],
        },
      ],
    });

    expect(result.nodes.map((node) => node.id)).toEqual([
      `${LEGACY_ITINERARY_DAY_NODE_ID_PREFIX}${day.id}`,
      `${LEGACY_ITINERARY_DAY_LOCATION_NODE_ID_PREFIX}${day.id}`,
      `${LEGACY_ITINERARY_ACTIVITY_NODE_ID_PREFIX}${checkin.id}`,
      `${LEGACY_ITINERARY_ACTIVITY_NODE_ID_PREFIX}${breakfast.id}`,
      `${LEGACY_ITINERARY_DAY_COST_NODE_ID_PREFIX}${day.id}`,
    ]);

    expect(result.nodes[0]).toMatchObject({
      tripId: 'trip-1',
      parentId: null,
      type: 'day',
      title: 'Ngay 1',
      notes: 'Nhan phong som',
      startAt: '2026-07-12T08:00',
      endAt: '2026-07-12T21:00',
      imageUrl: 'https://example.com/day-cover.jpg',
      sortOrder: 0,
      depth: 0,
      costAmount: null,
      costCurrency: null,
    });

    expect(result.nodes[1]).toMatchObject({
      parentId: `${LEGACY_ITINERARY_DAY_NODE_ID_PREFIX}${day.id}`,
      type: 'location',
      title: 'Da Nang',
      sortOrder: 0,
      depth: 1,
    });

    expect(result.nodes[2]).toMatchObject({
      type: 'activity',
      title: 'Check-in khach san',
      startAt: '2026-07-12T14:00',
      endAt: null,
      notes: null,
      costAmount: 500000,
      costCurrency: 'USD',
      sortOrder: 1,
      depth: 1,
    });

    expect(result.nodes[3]).toMatchObject({
      type: 'activity',
      title: 'An sang',
      startAt: '2026-07-12T08:30',
      endAt: '2026-07-12T09:15',
      notes: 'Địa điểm: Hem 42\n\nBun cha ca',
      costAmount: null,
      costCurrency: null,
      imageUrl: 'https://example.com/breakfast.jpg',
      sortOrder: 2,
      depth: 1,
    });

    expect(result.nodes[4]).toMatchObject({
      type: 'note',
      title: 'Chi phí ngày',
      costAmount: 300000,
      costCurrency: 'VND',
      sortOrder: 3,
      depth: 1,
    });

    expect(result.summary).toEqual({
      dayNodeCount: 1,
      locationNodeCount: 1,
      activityNodeCount: 2,
      costNoteNodeCount: 1,
      costBearingNodeCount: 2,
    });
    expect(result.warnings).toEqual([
      expect.objectContaining({
        code: 'LEGACY_ITINERARY_DAY_EXTRA_IMAGES_DROPPED',
        sourceType: 'day',
        sourceId: 'day-1',
        tripId: 'trip-1',
        droppedImageCount: 1,
      }),
      expect.objectContaining({
        code: 'LEGACY_ITINERARY_ACTIVITY_EXTRA_IMAGES_DROPPED',
        sourceType: 'activity',
        sourceId: 'activity-1',
        tripId: 'trip-1',
        droppedImageCount: 1,
      }),
    ]);
  });

  it('sorts day aggregates deterministically and skips zero-cost day notes', () => {
    const earlierDay = createDay({
      id: 'day-early',
      date: '2026-07-11',
      title: 'Ngay 1',
      costAmount: 0,
      costCurrency: 'VND',
      position: 3,
      createdAt: new Date('2026-07-01T07:00:00.000Z'),
      updatedAt: new Date('2026-07-01T07:00:00.000Z'),
    });
    const laterDay = createDay({
      id: 'day-late',
      date: '2026-07-12',
      title: 'Ngay 2',
      costAmount: 0,
      costCurrency: 'VND',
      position: 1,
      createdAt: new Date('2026-07-01T08:00:00.000Z'),
      updatedAt: new Date('2026-07-01T08:00:00.000Z'),
    });

    const result = buildPlanNodesFromLegacyItinerary({
      tripId: 'trip-2',
      dayAggregates: [
        {
          day: laterDay,
          activities: [],
        },
        {
          day: earlierDay,
          activities: [],
        },
      ],
    });

    expect(result.nodes.map((node) => [node.id, node.sortOrder])).toEqual([
      [`${LEGACY_ITINERARY_DAY_NODE_ID_PREFIX}${earlierDay.id}`, 0],
      [`${LEGACY_ITINERARY_DAY_NODE_ID_PREFIX}${laterDay.id}`, 1],
    ]);
    expect(result.summary.costNoteNodeCount).toBe(0);
    expect(result.summary.costBearingNodeCount).toBe(0);
    expect(result.warnings).toEqual([]);
  });
});

function createDay(
  overrides: Partial<{
    id: string;
    tripId: string;
    date: string;
    title: string;
    startsAt: string | null;
    endsAt: string | null;
    location: string | null;
    notes: string | null;
    costAmount: number;
    costCurrency: string;
    position: number;
    imageUrls: string[];
    createdAt: Date;
    updatedAt: Date;
  }> = {},
): ItineraryDay {
  return ItineraryDay.create({
    id: overrides.id ?? 'day-default',
    tripId: overrides.tripId ?? 'trip-default',
    date: overrides.date ?? '2026-07-12',
    title: overrides.title ?? 'Ngay mac dinh',
    startsAt: overrides.startsAt ?? null,
    endsAt: overrides.endsAt ?? null,
    location: overrides.location ?? null,
    notes: overrides.notes ?? null,
    costAmount: overrides.costAmount ?? 0,
    costCurrency: overrides.costCurrency ?? 'VND',
    position: overrides.position ?? 1,
    imageUrls: overrides.imageUrls ?? [],
    tripStartDate: overrides.date ?? '2026-07-12',
    tripEndDate: overrides.date ?? '2026-07-12',
    createdAt: overrides.createdAt ?? new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-07-01T00:00:00.000Z'),
  });
}

function createActivity(
  overrides: Partial<{
    id: string;
    itineraryDayId: string;
    title: string;
    startsAt: string | null;
    endsAt: string | null;
    location: string | null;
    notes: string | null;
    costAmount: number;
    costCurrency: string;
    position: number;
    imageUrls: string[];
    createdAt: Date;
    updatedAt: Date;
  }> = {},
): ItineraryActivity {
  return ItineraryActivity.create({
    id: overrides.id ?? 'activity-default',
    itineraryDayId: overrides.itineraryDayId ?? 'day-default',
    title: overrides.title ?? 'Hoat dong mac dinh',
    startsAt: overrides.startsAt ?? null,
    endsAt: overrides.endsAt ?? null,
    location: overrides.location ?? null,
    notes: overrides.notes ?? null,
    costAmount: overrides.costAmount ?? 0,
    costCurrency: overrides.costCurrency ?? 'VND',
    position: overrides.position ?? 1,
    imageUrls: overrides.imageUrls ?? [],
    createdAt: overrides.createdAt ?? new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-07-01T00:00:00.000Z'),
  });
}
