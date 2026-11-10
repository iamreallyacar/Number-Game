import type { DatabaseSync } from 'node:sqlite';

/** Runs the work so that either all of its writes are saved or none are. */
export function runInTransaction<Result>(database: DatabaseSync, work: () => Result): Result {
  database.exec('BEGIN');
  try {
    const result = work();
    database.exec('COMMIT');
    return result;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}
