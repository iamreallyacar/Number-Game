import { describe, expect, it } from 'vitest';
import { ConfigError, readConfig } from './config.js';

describe('readConfig', () => {
  it('uses the documented defaults when nothing is set', () => {
    expect(readConfig({})).toEqual({
      host: '0.0.0.0',
      port: 3000,
      dataDir: './data',
      saveSlotsPerGame: 10,
    });
  });

  it('reads every setting', () => {
    const env = {
      HOST: '127.0.0.1',
      PORT: '8080',
      DATA_DIR: '/srv/data',
      SAVE_SLOTS_PER_GAME: '4',
    };
    expect(readConfig(env)).toEqual({
      host: '127.0.0.1',
      port: 8080,
      dataDir: '/srv/data',
      saveSlotsPerGame: 4,
    });
  });

  it.each([
    { env: { PORT: 'abc' }, message: 'PORT' },
    { env: { PORT: '70000' }, message: 'PORT' },
    { env: { PORT: '3000.5' }, message: 'PORT' },
    { env: { SAVE_SLOTS_PER_GAME: '0' }, message: 'SAVE_SLOTS_PER_GAME' },
    { env: { DATA_DIR: '  ' }, message: 'DATA_DIR is set but empty' },
  ])('stops with a clear error for $env', ({ env, message }) => {
    expect(() => readConfig(env)).toThrow(ConfigError);
    expect(() => readConfig(env)).toThrow(message);
  });
});
