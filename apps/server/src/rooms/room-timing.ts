// Every interval and limit of the connection checks and the waiting room expiry, in one place.

/** How often every connected socket is pinged, and checked for a pong to the ping before. */
export const SOCKET_PING_INTERVAL_MS = 5_000;

/** A socket with more than this many bytes waiting to be sent is not keeping up, and is dropped. */
export const SOCKET_MAX_BUFFERED_BYTES = 1_000_000;

/** A socket that sends more than this many frames within one window is closed with code 1008. */
export const SOCKET_MAX_FRAMES_PER_WINDOW = 120;
export const SOCKET_FRAME_WINDOW_MS = 1_000;

/** A member of a waiting room who was not seen for this long is removed, as if they left. */
export const WAITING_ROOM_MEMBER_EXPIRY_MS = 30_000;

/** How often the waiting rooms are checked for members who were not seen. */
export const WAITING_ROOM_SWEEP_INTERVAL_MS = 5_000;
