import type { DatabaseSync } from 'node:sqlite';
import { readChangedRowCount, readTextColumn } from './row-values.js';

/** Player IDs are unique without regard to letter case, so 'Sam' and 'sam' cannot both exist. */
export class PlayersStore {
  constructor(private readonly database: DatabaseSync) {}

  listPlayerIds(): string[] {
    return this.database
      .prepare('SELECT player_id FROM players ORDER BY player_id')
      .all()
      .map((row) => readTextColumn(row, 'player_id'));
  }

  /** Returns false when the player ID already exists. */
  createPlayer(playerId: string, createdAt: string): boolean {
    const result = this.database
      .prepare('INSERT INTO players (player_id, created_at) VALUES (?, ?) ON CONFLICT DO NOTHING')
      .run(playerId, createdAt);
    return readChangedRowCount(result) === 1;
  }

  /** Finds a player ID in any letter case and returns it as it was created, or null. */
  findPlayerId(playerId: string): string | null {
    const row = this.database
      .prepare('SELECT player_id FROM players WHERE player_id = ?')
      .get(playerId);
    return row === undefined ? null : readTextColumn(row, 'player_id');
  }
}
