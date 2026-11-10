import { describe, expect, it } from 'vitest';
import { MemoryStorage } from '../test-support/memory-storage.js';
import { getDeviceId } from './device-id.js';

describe('getDeviceId', () => {
  it('makes an ID the server accepts and keeps it', () => {
    const storage = new MemoryStorage();
    const firstId = getDeviceId(storage);
    expect(firstId).toMatch(/^[A-Za-z0-9-]{8,64}$/);
    expect(getDeviceId(storage)).toBe(firstId);
  });

  it('replaces a stored ID that the server would refuse', () => {
    const storage = new MemoryStorage();
    storage.setItem('game-dashboard.device-id', 'bad id!');
    expect(getDeviceId(storage)).toMatch(/^[0-9a-f]{32}$/);
  });
});
