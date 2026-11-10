/** Turns a stored value written in one format version into the next version. */
export type StoredFormatUpgrade = (stored: unknown) => unknown;

/** Entry 0 of an upgrade list turns version 1 into version 2, so the newest is the length + 1. */
export function currentFormatVersion(upgrades: readonly StoredFormatUpgrade[]): number {
  return upgrades.length + 1;
}

/** Runs every upgrade from the stored version up to the newest one, in order. */
export function upgradeStoredValue(
  stored: unknown,
  storedVersion: number,
  upgrades: readonly StoredFormatUpgrade[],
): unknown {
  const newestVersion = currentFormatVersion(upgrades);
  if (!Number.isSafeInteger(storedVersion) || storedVersion < 1 || storedVersion > newestVersion) {
    throw new Error(
      `format version ${String(storedVersion)} is unknown. This server knows versions 1 to ` +
        String(newestVersion),
    );
  }
  return upgrades.slice(storedVersion - 1).reduce((value, upgrade) => upgrade(value), stored);
}
