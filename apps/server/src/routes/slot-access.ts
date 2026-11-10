import type { StoredSave } from '../database/save-slots-store.js';
import { HttpError } from '../http-error.js';

/** Throws when the slot number is above the configured number of slots. */
export function checkSlotNumber(slotNumber: number, saveSlotsPerGame: number): void {
  if (slotNumber > saveSlotsPerGame) {
    throw new HttpError(
      404,
      'unknown-slot',
      `Slot ${String(slotNumber)} does not exist. There are ${String(saveSlotsPerGame)} slots`,
    );
  }
}

export function requireSave(save: StoredSave | null, slotNumber: number): StoredSave {
  if (save === null) {
    throw new HttpError(404, 'empty-slot', `Slot ${String(slotNumber)} is empty`);
  }
  return save;
}
