import { chmodSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase } from './open-database.js';

describe('openDatabase', () => {
  const createdFolders: string[] = [];

  afterEach(() => {
    for (const folder of createdFolders.splice(0)) {
      chmodSync(folder, 0o700);
      rmSync(folder, { recursive: true, force: true });
    }
  });

  function makeTempFolder(): string {
    const folder = mkdtempSync(join(tmpdir(), 'open-database-test-'));
    createdFolders.push(folder);
    return folder;
  }

  it('creates the data folder and the database file', () => {
    const dataDir = join(makeTempFolder(), 'nested', 'data');
    const database = openDatabase(dataDir);
    expect(database.isOpen).toBe(true);
    database.close();
  });

  // Root can write to any folder, so this case cannot be shown when the tests run as root.
  it.skipIf(process.getuid?.() === 0)('names the folder when it is not writable', () => {
    const dataDir = makeTempFolder();
    chmodSync(dataDir, 0o500);
    expect(() => openDatabase(dataDir)).toThrow(`The data folder ${dataDir} is not writable`);
  });
});
