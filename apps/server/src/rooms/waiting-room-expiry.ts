import { WAITING_ROOM_MEMBER_EXPIRY_MS, WAITING_ROOM_SWEEP_INTERVAL_MS } from './room-timing.js';
import { startRepeatingTimer } from './repeating-timer.js';
import type { RoomStore } from './room-store.js';
import type { StepScheduler } from './step-loop.js';

/** Starts removing the members of waiting rooms who stopped being seen. Returns the stop function. */
export function startWaitingRoomExpiry(rooms: RoomStore, scheduler: StepScheduler): () => void {
  return startRepeatingTimer(scheduler, WAITING_ROOM_SWEEP_INTERVAL_MS, () => {
    rooms.removeUnseenMembers(WAITING_ROOM_MEMBER_EXPIRY_MS);
  });
}
