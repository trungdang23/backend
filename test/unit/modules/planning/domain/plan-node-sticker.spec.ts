import { PlanNodeSticker } from '../../../../../src/modules/planning/domain/plan-node-sticker';

describe('PlanNodeSticker domain', () => {
  it('creates a sticker placement with normalized editor metadata', () => {
    const sticker = PlanNodeSticker.create({
      nodeId: 'node-1',
      stickerKey: 'camera',
      x: 2500,
      y: 7500,
      rotation: -12,
      scale: 110,
      zIndex: 3,
    });

    expect(sticker.nodeId).toBe('node-1');
    expect(sticker.stickerKey).toBe('camera');
    expect(sticker.x).toBe(2500);
    expect(sticker.y).toBe(7500);
    expect(sticker.rotation).toBe(-12);
    expect(sticker.scale).toBe(110);
    expect(sticker.zIndex).toBe(3);
  });

  it('rejects out-of-frame coordinates', () => {
    expect(() =>
      PlanNodeSticker.create({
        nodeId: 'node-1',
        stickerKey: 'camera',
        x: 10001,
        y: 5000,
      }),
    ).toThrow('Sticker x must be an integer from 0 to 10000.');
  });

  it('rejects unsupported sticker keys', () => {
    expect(() =>
      PlanNodeSticker.create({
        nodeId: 'node-1',
        stickerKey: 'camera sticker',
        x: 5000,
        y: 5000,
      }),
    ).toThrow(
      'Sticker key may only contain letters, numbers, underscores, and hyphens.',
    );
  });
});
