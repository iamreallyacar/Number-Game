import type { RawData, WebSocket } from 'ws';
import { HttpError } from '../http-error.js';
import { roomParamsSchema } from '../request-schemas.js';
import type { GameRegistry } from '../games/game-registry.js';
import type { RegisteredRoomGame } from '../games/room-game.js';
import { CLOSE_CODES, type RoomSocket } from '../rooms/room-socket.js';
import { FrameRateLimit } from '../rooms/frame-rate-limit.js';
import type { RoomRunner } from '../rooms/room-runner.js';
import { SOCKET_FRAME_WINDOW_MS, SOCKET_MAX_FRAMES_PER_WINDOW } from '../rooms/room-timing.js';
import type { SocketWatchdog, WatchedSocket } from '../rooms/socket-watchdog.js';
import type { StepScheduler } from '../rooms/step-loop.js';
import type { TypedFastify } from '../typed-fastify.js';

export interface RoomSocketRouteDependencies {
  readonly games: GameRegistry;
  readonly runner: RoomRunner;
  readonly watchdog: SocketWatchdog;
  /** Gives the clock that the frame limit of each socket counts with. */
  readonly scheduler: StepScheduler;
}

function readText(data: RawData): string {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString('utf8');
  }
  return Buffer.isBuffer(data) ? data.toString('utf8') : new TextDecoder().decode(data);
}

function readPlayerId(requestUrl: string, parameterName: string): string | undefined {
  return (
    new URL(requestUrl, 'http://placeholder.invalid').searchParams.get(parameterName) ?? undefined
  );
}

function findRoomGameOrNull(games: GameRegistry, gameId: string): RegisteredRoomGame | null {
  try {
    return games.getRoomGame(gameId);
  } catch (error) {
    if (error instanceof HttpError) {
      return null;
    }
    throw error;
  }
}

function toRoomSocket(socket: WebSocket): RoomSocket {
  return {
    send: (text) => {
      socket.send(text);
    },
    close: (code, reason) => {
      socket.close(code, reason);
    },
  };
}

function toWatchedSocket(socket: WebSocket): WatchedSocket {
  return {
    ping: () => {
      socket.ping();
    },
    terminate: () => {
      socket.terminate();
    },
    get bufferedBytes() {
      return socket.bufferedAmount;
    },
  };
}

/** The WebSocket of a running room. The room and the player are named in the URL (PL-22). */
export function registerRoomSocketRoutes(
  app: TypedFastify,
  { games, runner, watchdog, scheduler }: RoomSocketRouteDependencies,
): void {
  app.get(
    '/api/games/:gameId/rooms/:roomId/socket',
    { websocket: true, schema: { params: roomParamsSchema } },
    (socket, request) => {
      const { gameId, roomId } = request.params;
      const game = findRoomGameOrNull(games, gameId);
      const playerId =
        game === null ? undefined : readPlayerId(request.url, game.socketPlayerIdParameter);
      if (game === null || playerId === undefined) {
        socket.close(CLOSE_CODES.roomOrPlayerNotFound, 'There is no such room or player');
        return;
      }

      const roomSocket = toRoomSocket(socket);
      const outcome = runner.connect(game.id, roomId, playerId, roomSocket);
      if (!outcome.accepted) {
        socket.close(outcome.closeCode, outcome.closeReason);
        return;
      }
      const watch = watchdog.watch(toWatchedSocket(socket));
      const frameLimit = new FrameRateLimit({
        now: () => scheduler.now(),
        maxFramesPerWindow: SOCKET_MAX_FRAMES_PER_WINDOW,
        windowMilliseconds: SOCKET_FRAME_WINDOW_MS,
      });
      let isOverLimit = false;
      socket.on('pong', () => {
        watch.pongReceived();
      });
      socket.on('message', (data: RawData) => {
        if (isOverLimit) {
          return;
        }
        if (!frameLimit.allowFrame()) {
          isOverLimit = true;
          // Dropped at once, since the close handshake of a flooding client may never finish.
          runner.disconnect(roomId, playerId, roomSocket);
          socket.close(CLOSE_CODES.tooManyMessages, 'Too many messages');
          return;
        }
        runner.receiveMessage(roomId, playerId, roomSocket, readText(data));
      });
      socket.on('error', (error: Error) => {
        request.log.error(error, 'A room WebSocket failed');
      });
      socket.on('close', () => {
        watch.unwatch();
        runner.disconnect(roomId, playerId, roomSocket);
      });
    },
  );
}
