/**
 * The form of a player ID used to compare IDs without regard to letter case. The ID pattern
 * allows no combining marks, so lower-casing is enough and no Unicode normalisation is needed.
 */
export function foldPlayerId(playerId: string): string {
  return playerId.toLowerCase();
}
