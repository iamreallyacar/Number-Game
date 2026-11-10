import { getShape } from '@local/block-game';
import { describe, expect, it } from 'vitest';
import { describeShape } from './describe-shape.js';

describe('describeShape', () => {
  it('counts the blocks and gives the size of the bounding box', () => {
    expect(describeShape(getShape('single'))).toBe('1 block, 1 wide, 1 tall');
    expect(describeShape(getShape('l-wide-top-foot-left'))).toBe('4 blocks, 3 wide, 2 tall');
  });
});
