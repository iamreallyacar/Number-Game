import type { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import { readChangedRowCount, readIntegerColumn, readTextColumn } from './row-values.js';

/** A used save slot. Empty slots have no row in the database. */
export interface StoredSave {
  readonly gameId: string;
  readonly slotNumber: number;
  readonly playerId: string;
  readonly stateJson: string;
  /** The game's format version of `stateJson`, so older states can be upgraded. */
  readonly stateVersion: number;
  /** The device that opened the save most recently. Only it may change the save (PS-18). */
  readonly lockedDeviceId: string;
  readonly lastPlayedAt: string;
}

export interface SaveUpdate {
  readonly stateJson: string;
  readonly stateVersion: number;
  readonly lockedDeviceId: string;
  readonly lastPlayedAt: string;
}

function toStoredSave(row: Record<string, SQLOutputValue>): StoredSave {
  return {
    gameId: readTextColumn(row, 'game_id'),
    slotNumber: readIntegerColumn(row, 'slot_number'),
    playerId: readTextColumn(row, 'player_id'),
    stateJson: readTextColumn(row, 'state_json'),
    stateVersion: readIntegerColumn(row, 'state_version'),
    lockedDeviceId: readTextColumn(row, 'locked_device_id'),
    lastPlayedAt: readTextColumn(row, 'last_played_at'),
  };
}

export class SaveSlotsStore {
  constructor(private readonly database: DatabaseSync) {}

  listSaves(gameId: string): StoredSave[] {
    return this.database
      .prepare('SELECT * FROM save_slots WHERE game_id = ? ORDER BY slot_number')
      .all(gameId)
      .map(toStoredSave);
  }

  findSave(gameId: string, slotNumber: number): StoredSave | null {
    const row = this.database
      .prepare('SELECT * FROM save_slots WHERE game_id = ? AND slot_number = ?')
      .get(gameId, slotNumber);
    return row === undefined ? null : toStoredSave(row);
  }

  /** Returns false when the slot is already in use. */
  insertSave(save: StoredSave): boolean {
    const result = this.database
      .prepare(
        `INSERT INTO save_slots
           (game_id, slot_number, player_id, state_json, state_version, locked_device_id,
            last_played_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT DO NOTHING`,
      )
      .run(
        save.gameId,
        save.slotNumber,
        save.playerId,
        save.stateJson,
        save.stateVersion,
        save.lockedDeviceId,
        save.lastPlayedAt,
      );
    return readChangedRowCount(result) === 1;
  }

  updateSave(gameId: string, slotNumber: number, update: SaveUpdate): void {
    const result = this.database
      .prepare(
        `UPDATE save_slots
         SET state_json = ?, state_version = ?, locked_device_id = ?, last_played_at = ?
         WHERE game_id = ? AND slot_number = ?`,
      )
      .run(
        update.stateJson,
        update.stateVersion,
        update.lockedDeviceId,
        update.lastPlayedAt,
        gameId,
        slotNumber,
      );
    if (readChangedRowCount(result) !== 1) {
      throw new Error(`Save slot ${String(slotNumber)} of ${gameId} vanished while being updated`);
    }
  }

  /** Returns false when the slot was already empty. */
  deleteSave(gameId: string, slotNumber: number): boolean {
    const result = this.database
      .prepare('DELETE FROM save_slots WHERE game_id = ? AND slot_number = ?')
      .run(gameId, slotNumber);
    return readChangedRowCount(result) === 1;
  }
}
