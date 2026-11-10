export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly dataDir: string;
  readonly saveSlotsPerGame: number;
}

export class ConfigError extends Error {
  override readonly name = 'ConfigError';
}

// Defaults match the Configuration table in README.md and .env.example.
const DEFAULT_SETTINGS = {
  HOST: '0.0.0.0',
  PORT: '3000',
  DATA_DIR: './data',
  SAVE_SLOTS_PER_GAME: '10',
} as const;

type SettingName = keyof typeof DEFAULT_SETTINGS;

function readSetting(env: NodeJS.ProcessEnv, name: SettingName): string {
  const value = env[name];
  if (value === undefined) {
    return DEFAULT_SETTINGS[name];
  }
  if (value.trim() === '') {
    throw new ConfigError(
      `${name} is set but empty. Remove it to use the default or give it a value`,
    );
  }
  return value.trim();
}

function readWholeNumberSetting(
  env: NodeJS.ProcessEnv,
  name: SettingName,
  minimum: number,
  maximum: number,
): number {
  const text = readSetting(env, name);
  const value = Number(text);
  if (!/^\d+$/.test(text) || value < minimum || value > maximum) {
    throw new ConfigError(
      `${name} must be a whole number from ${String(minimum)} to ${String(maximum)}, got '${text}'`,
    );
  }
  return value;
}

/** Reads every setting from the environment. Unset settings use the default, invalid ones throw. */
export function readConfig(env: NodeJS.ProcessEnv): ServerConfig {
  return {
    host: readSetting(env, 'HOST'),
    port: readWholeNumberSetting(env, 'PORT', 1, 65535),
    dataDir: readSetting(env, 'DATA_DIR'),
    saveSlotsPerGame: readWholeNumberSetting(env, 'SAVE_SLOTS_PER_GAME', 1, 100),
  };
}
