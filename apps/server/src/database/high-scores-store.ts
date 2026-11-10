import type { DatabaseSync, SQLOutputValue } from 'node:sqlite';
import { readIntegerColumn, readTextColumn } from './row-values.js';

/** One finished game. `category` is what high scores are filtered by, such as the difficulty. */
export interface GameResult {
  readonly gameId: string;
  readonly playerId: string;
  readonly score: number;
  readonly category: string;
  /** Extra facts the game wants shown next to the score, such as stage and width, as JSON. */
  readonly detailsJson: string;
  /** The game's format version of `detailsJson`, so older details can be upgraded. */
  readonly detailsVersion: number;
  readonly finishedAt: string;
}

function toGameResult(row: Record<string, SQLOutputValue>): GameResult {
  return {
    gameId: readTextColumn(row, 'game_id'),
    playerId: readTextColumn(row, 'player_id'),
    score: readIntegerColumn(row, 'score'),
    category: readTextColumn(row, 'category'),
    detailsJson: readTextColumn(row, 'details_json'),
    detailsVersion: readIntegerColumn(row, 'details_version'),
    finishedAt: readTextColumn(row, 'finished_at'),
  };
}

export class HighScoresStore {
  constructor(private readonly database: DatabaseSync) {}

  insertResult(result: GameResult): void {
    this.database
      .prepare(
        `INSERT INTO high_scores
           (game_id, player_id, score, category, details_json, details_version, finished_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        result.gameId,
        result.playerId,
        result.score,
        result.category,
        result.detailsJson,
        result.detailsVersion,
        result.finishedAt,
      );
  }

  /** Best results first. Ties go to whoever got there first. A null category means all of them. */
  listTopResults(gameId: string, category: string | null, limit: number): GameResult[] {
    return this.database
      .prepare(
        `SELECT * FROM high_scores
         WHERE game_id = ? AND (? IS NULL OR category = ?)
         ORDER BY score DESC, finished_at ASC
         LIMIT ?`,
      )
      .all(gameId, category, category, limit)
      .map(toGameResult);
  }

  /** The best result of one player in each category they have played. */
  listPersonalBests(gameId: string, playerId: string): GameResult[] {
    return this.database
      .prepare(
        `SELECT * FROM (
           SELECT *, ROW_NUMBER() OVER (
             PARTITION BY category ORDER BY score DESC, finished_at ASC
           ) AS rank_in_category
           FROM high_scores WHERE game_id = ? AND player_id = ?
         )
         WHERE rank_in_category = 1
         ORDER BY category`,
      )
      .all(gameId, playerId)
      .map(toGameResult);
  }
}
