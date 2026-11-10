import { describe, expect, it } from 'vitest';
import { getDeviceId } from './device-id.js';

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length(): number {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

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
