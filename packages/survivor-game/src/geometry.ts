export interface Vector {
  readonly x: number;
  readonly y: number;
}

export function squaredDistanceBetween(first: Vector, second: Vector): number {
  const deltaX = first.x - second.x;
  const deltaY = first.y - second.y;
  return deltaX * deltaX + deltaY * deltaY;
}

export function distanceBetween(first: Vector, second: Vector): number {
  return Math.sqrt(squaredDistanceBetween(first, second));
}

/** The candidate closest to the point. The first one wins a tie, so the result is deterministic. */
export function nearestTo<Candidate extends Vector>(
  point: Vector,
  candidates: readonly Candidate[],
): Candidate | null {
  let nearest: Candidate | null = null;
  let nearestSquaredDistance = Infinity;
  for (const candidate of candidates) {
    const squaredDistance = squaredDistanceBetween(point, candidate);
    if (squaredDistance < nearestSquaredDistance) {
      nearest = candidate;
      nearestSquaredDistance = squaredDistance;
    }
  }
  return nearest;
}

/** Throws on a missing item, which only a bug in the calling code can cause. */
export function itemAt<Item>(items: readonly Item[], index: number): Item {
  const item = items[index];
  if (item === undefined) {
    throw new RangeError(`No item at index ${String(index)} of ${String(items.length)} items`);
  }
  return item;
}
