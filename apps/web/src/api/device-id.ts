const DEVICE_ID_STORAGE_KEY = 'game-dashboard.device-id';
const DEVICE_ID_BYTE_COUNT = 16;
// The format this browser makes, which the server accepts. A stored ID in any other format is
// replaced.
const DEVICE_ID_PATTERN = /^[0-9a-f]{32}$/;

/**
 * The random ID this browser sends so the server knows which device holds the lock on a save
 * (PS-18). It is made once and kept in local storage.
 */
export function getDeviceId(storage: Storage = window.localStorage): string {
  const storedId = storage.getItem(DEVICE_ID_STORAGE_KEY);
  if (storedId !== null && DEVICE_ID_PATTERN.test(storedId)) {
    return storedId;
  }
  // crypto.randomUUID only works on HTTPS pages, and the game is served over plain HTTP on the
  // local network, so the ID is built from getRandomValues, which works everywhere.
  const randomBytes = crypto.getRandomValues(new Uint8Array(DEVICE_ID_BYTE_COUNT));
  const newId = Array.from(randomBytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  storage.setItem(DEVICE_ID_STORAGE_KEY, newId);
  return newId;
}
