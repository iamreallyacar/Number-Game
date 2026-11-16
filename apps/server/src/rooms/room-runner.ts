import type { FastifyBaseLogger } from 'fastify';
import type { HighScoresStore } from '../database/high-scores-store.js';
import type { RegisteredRoomGame, RoomRunSession } from '../games/room-game.js';
import type { Room, RoomStore } from './room-store.js';
import { CLOSE_CODES, type RoomSocket } from './room-socket.js';
import { startStepLoop, type StepLoop, type StepScheduler } from './step-loop.js';

export interface RoomRunnerDependencies {
  readonly rooms: RoomStore;
  readonly highScores: HighScoresStore;
  readonly scheduler: StepScheduler;
  readonly logger: Pick<FastifyBaseLogger, 'error'>;
}

export type ConnectionOutcome =
  | { readonly accepted: true }
  | { readonly accepted: false; readonly closeCode: number; readonly closeReason: string };

interface ActiveRun {
  readonly game: RegisteredRoomGame;
  readonly room: Room;
  readonly session: RoomRunSession;
  loop: StepLoop | null;
  stepsTaken: number;
  stepsWithNobodyConnected: number;
  resultStored: boolean;
  finished: boolean;
}

/** Steps every running room, and connects, drops, and rejoins the players of each (PL-22). */
export class RoomRunner {
  private readonly activeRuns = new Map<string, ActiveRun>();

  constructor(private readonly dependencies: RoomRunnerDependencies) {}

  /** Starts the run of a waiting room, and its step loop. */
  startRun(game: RegisteredRoomGame, room: Room, seed: number): void {
    const session = game.startRun(room.playerIds, seed);
    const activeRun: ActiveRun = {
      game,
      room,
      session,
      loop: null,
      stepsTaken: 0,
      stepsWithNobodyConnected: 0,
      resultStored: false,
      finished: false,
    };
    room.status = 'running';
    this.activeRuns.set(room.roomId, activeRun);
    activeRun.loop = startStepLoop({
      scheduler: this.dependencies.scheduler,
      stepRate: game.stepRate,
      runStep: () => {
        this.guard(activeRun, () => {
          this.stepRun(activeRun);
        });
      },
    });
  }

  /** Connects a player to the run of a room, or says why that cannot be done (SG-45). */
  connect(gameId: string, roomId: string, playerId: string, socket: RoomSocket): ConnectionOutcome {
    const room = this.dependencies.rooms.find(gameId, roomId);
    if (!room?.playerIds.includes(playerId)) {
      return refusal(CLOSE_CODES.roomOrPlayerNotFound, 'There is no such room or player');
    }
    const activeRun = this.activeRuns.get(roomId);
    if (room.status !== 'running' || activeRun === undefined) {
      return refusal(CLOSE_CODES.roomNotStarted, 'The room has not started');
    }
    if (room.connections.has(playerId)) {
      return refusal(CLOSE_CODES.alreadyConnected, 'This player is already connected');
    }
    room.connections.set(playerId, socket);
    activeRun.stepsWithNobodyConnected = 0;
    this.guard(activeRun, () => {
      socket.send(activeRun.session.stateReport());
    });
    return { accepted: true };
  }

  /** Reads one text frame from a connected player. A refusal is answered to that player only. */
  receiveMessage(roomId: string, playerId: string, socket: RoomSocket, text: string): void {
    const activeRun = this.activeRuns.get(roomId);
    if (activeRun?.room.connections.get(playerId) !== socket) {
      return;
    }
    this.guard(activeRun, () => {
      const refusalText = activeRun.session.receiveMessage(playerId, text);
      if (refusalText !== null) {
        socket.send(refusalText);
      }
    });
  }

  /** Marks the player as dropped: the character stands still until the player connects again. */
  disconnect(roomId: string, playerId: string, socket: RoomSocket): void {
    const activeRun = this.activeRuns.get(roomId);
    if (activeRun?.room.connections.get(playerId) !== socket) {
      return;
    }
    activeRun.room.connections.delete(playerId);
    activeRun.session.resetInput(playerId);
  }

  /** Stops every loop and closes every connection. Called when the app closes. */
  shutDown(): void {
    for (const activeRun of [...this.activeRuns.values()]) {
      this.tearDown(activeRun, CLOSE_CODES.goingAway, 'The server is shutting down');
    }
  }

  private stepRun(activeRun: ActiveRun): void {
    const { game, room, session } = activeRun;
    session.step(new Set(room.connections.keys()));
    activeRun.stepsTaken += 1;
    if (activeRun.stepsTaken % game.stepsPerReport === 0) {
      const report = session.stateReport();
      for (const socket of room.connections.values()) {
        socket.send(report);
      }
    }
    if (room.connections.size === 0) {
      activeRun.stepsWithNobodyConnected += 1;
      if (activeRun.stepsWithNobodyConnected >= game.emptyRunSeconds * game.stepRate) {
        session.endAsAbandoned();
      }
    } else {
      activeRun.stepsWithNobodyConnected = 0;
    }
    if (session.isOver()) {
      this.finishRun(activeRun);
    }
  }

  /** Stores the result, tells the players, and deletes the room (SG-48 to SG-50). */
  private finishRun(activeRun: ActiveRun): void {
    const { room, session } = activeRun;
    if (!activeRun.resultStored) {
      activeRun.resultStored = true;
      this.storeResult(activeRun);
    }
    const report = session.runEndedReport();
    for (const socket of room.connections.values()) {
      socket.send(report);
    }
    this.tearDown(activeRun, CLOSE_CODES.normal, 'The run has ended');
  }

  private storeResult({ game, room, session }: ActiveRun): void {
    try {
      const { summary, storedDetails } = session.finishedResult();
      this.dependencies.highScores.insertResult({
        gameId: game.id,
        playerIds: room.playerIds,
        score: summary.score,
        category: summary.category,
        ...storedDetails,
        finishedAt: new Date().toISOString(),
      });
    } catch (error) {
      this.dependencies.logger.error(
        { err: error, roomId: room.roomId },
        'The result of a finished run could not be stored',
      );
    }
  }

  /** Runs work for one run, so an error in it ends that run and nothing else. */
  private guard(activeRun: ActiveRun, work: () => void): void {
    try {
      work();
    } catch (error) {
      this.failRun(activeRun, error);
    }
  }

  private failRun(activeRun: ActiveRun, error: unknown): void {
    if (activeRun.finished) {
      return;
    }
    const { logger } = this.dependencies;
    logger.error({ err: error, roomId: activeRun.room.roomId }, 'A run failed and was ended');
    activeRun.loop?.stop();
    try {
      if (!activeRun.session.isOver()) {
        activeRun.session.endAsAbandoned();
      }
      this.finishRun(activeRun);
    } catch (secondError) {
      logger.error(
        { err: secondError, roomId: activeRun.room.roomId },
        'A failed run could not be ended cleanly, so its room was closed',
      );
      this.tearDown(activeRun, CLOSE_CODES.serverError, 'The run failed');
    }
  }

  private tearDown(activeRun: ActiveRun, closeCode: number, closeReason: string): void {
    if (activeRun.finished) {
      return;
    }
    activeRun.finished = true;
    activeRun.loop?.stop();
    const sockets = [...activeRun.room.connections.values()];
    activeRun.room.connections.clear();
    this.activeRuns.delete(activeRun.room.roomId);
    this.dependencies.rooms.delete(activeRun.room);
    for (const socket of sockets) {
      socket.close(closeCode, closeReason);
    }
  }
}

function refusal(closeCode: number, closeReason: string): ConnectionOutcome {
  return { accepted: false, closeCode, closeReason };
}
