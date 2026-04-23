import { randomUUID } from 'node:crypto';

import { DomainError } from '../../../shared/domain/domain-error';
import { Entity } from '../../../shared/domain/entity';

export const MAX_PLAN_NODE_STICKERS = 60;
export const MAX_PLAN_NODE_STICKER_KEY_LENGTH = 64;
export const PLAN_NODE_STICKER_COORDINATE_MAX = 10000;
export const PLAN_NODE_STICKER_ROTATION_MIN = -180;
export const PLAN_NODE_STICKER_ROTATION_MAX = 180;
export const PLAN_NODE_STICKER_SCALE_MIN = 50;
export const PLAN_NODE_STICKER_SCALE_MAX = 180;
export const PLAN_NODE_STICKER_Z_INDEX_MAX = 1000;
export const PLAN_NODE_STICKER_KEY_REGEX = /^[a-z0-9_-]+$/i;

interface PlanNodeStickerProps extends Record<string, unknown> {
  id: string;
  nodeId: string;
  stickerKey: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanNodeStickerInput {
  id?: string;
  nodeId: string;
  stickerKey: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
  zIndex?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PlanNodeSticker extends Entity<PlanNodeStickerProps> {
  private constructor(props: PlanNodeStickerProps) {
    super(props);
  }

  static create(input: PlanNodeStickerInput): PlanNodeSticker {
    const createdAt = ensureDate(input.createdAt ?? new Date(), 'Created at');
    const updatedAt = ensureDate(input.updatedAt ?? createdAt, 'Updated at');

    return new PlanNodeSticker({
      id: normalizeIdentifier(input.id ?? randomUUID(), 'Plan node sticker id'),
      nodeId: normalizeIdentifier(input.nodeId, 'Plan node id'),
      stickerKey: normalizeStickerKey(input.stickerKey),
      x: normalizeCoordinate(input.x, 'Sticker x'),
      y: normalizeCoordinate(input.y, 'Sticker y'),
      rotation: normalizeRangeInteger(
        input.rotation ?? 0,
        'Sticker rotation',
        PLAN_NODE_STICKER_ROTATION_MIN,
        PLAN_NODE_STICKER_ROTATION_MAX,
      ),
      scale: normalizeRangeInteger(
        input.scale ?? 100,
        'Sticker scale',
        PLAN_NODE_STICKER_SCALE_MIN,
        PLAN_NODE_STICKER_SCALE_MAX,
      ),
      zIndex: normalizeRangeInteger(
        input.zIndex ?? 0,
        'Sticker z index',
        0,
        PLAN_NODE_STICKER_Z_INDEX_MAX,
      ),
      createdAt,
      updatedAt,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get nodeId(): string {
    return this.props.nodeId;
  }

  get stickerKey(): string {
    return this.props.stickerKey;
  }

  get x(): number {
    return this.props.x;
  }

  get y(): number {
    return this.props.y;
  }

  get rotation(): number {
    return this.props.rotation;
  }

  get scale(): number {
    return this.props.scale;
  }

  get zIndex(): number {
    return this.props.zIndex;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}

function normalizeIdentifier(value: string, label: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError(`${label} is required.`);
  }

  return normalizedValue;
}

function normalizeStickerKey(value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    throw new DomainError('Sticker key is required.');
  }

  if (normalizedValue.length > MAX_PLAN_NODE_STICKER_KEY_LENGTH) {
    throw new DomainError(
      `Sticker key must be at most ${MAX_PLAN_NODE_STICKER_KEY_LENGTH} characters.`,
    );
  }

  if (!PLAN_NODE_STICKER_KEY_REGEX.test(normalizedValue)) {
    throw new DomainError(
      'Sticker key may only contain letters, numbers, underscores, and hyphens.',
    );
  }

  return normalizedValue;
}

function normalizeCoordinate(value: number, label: string): number {
  return normalizeRangeInteger(
    value,
    label,
    0,
    PLAN_NODE_STICKER_COORDINATE_MAX,
  );
}

function normalizeRangeInteger(
  value: number,
  label: string,
  min: number,
  max: number,
): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new DomainError(`${label} must be an integer from ${min} to ${max}.`);
  }

  return value;
}

function ensureDate(value: Date, label: string): Date {
  if (Number.isNaN(value.getTime())) {
    throw new DomainError(`${label} must be valid.`);
  }

  return value;
}
