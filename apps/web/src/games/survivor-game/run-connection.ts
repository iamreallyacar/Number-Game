import {
  InvalidMessageError,
  parseServerMessage,
  type ClientMessage,
  type Direction,
  type MessageRefusedMessage,
  type RunEndedMessage,
  type RunStateReport,
  type UpgradeId,
} from '@local/survivor-game';
import {
  ReconnectingSocket,
  type ConnectionStatus,
  type WebSocketLike,
} from '../../rooms/reconnecting-socket.js';

export interface RunConnectionOptions {
  readonly url: string;
  readonly createSocket: (url: string) => WebSocketLike;
  /** The player ID of this page, whose character must be in every state the server sends. */
  readonly ownPlayerId: string;
  readonly onState: (state: RunStateReport) => void;
  readonly onRunEnded: (message: RunEndedMessage) => void;
  readonly onRefused: (message: MessageRefusedMessage) => void;
  readonly onStatus: (status: ConnectionStatus) => void;
}

/**
 * The page's connection to a run: the shared reconnecting socket, with every message from the
 * server checked by the rules package (SG-57, SG-58). A message that cannot be read, or a state
 * without the player's own character, stops the connection and says so, since drawing on would
 * show something false.
 */
export class RunConnection {
  private readonly socket: ReconnectingSocket;
  private hasEnded = false;
  private isClosedByPage = false;

  constructor(private readonly options: RunConnectionOptions) {
    this.socket = new ReconnectingSocket({
      url: options.url,
      createSocket: options.createSocket,
      onText: (text) => {
        this.handleText(text);
      },
      onStatus: (status) => {
        this.handleStatus(status);
      },
    });
  }

  start(): void {
    this.socket.start();
  }

  /** Closes for good. The page does this when it goes away. */
  close(): void {
    this.isClosedByPage = true;
    this.socket.close();
  }

  sendDirection(direction: Direction | null): boolean {
    return this.send({ type: 'set-direction', direction });
  }

  chooseUpgrade(upgradeId: UpgradeId): boolean {
    return this.send({ type: 'choose-upgrade', upgradeId });
  }

  private send(message: ClientMessage): boolean {
    return this.socket.send(JSON.stringify(message));
  }

  private handleStatus(status: ConnectionStatus): void {
    if (status.kind === 'finished' && !this.hasEnded && !this.isClosedByPage) {
      this.options.onStatus({
        kind: 'stopped',
        reason: 'The connection closed before the result of the run arrived.',
      });
      return;
    }
    this.options.onStatus(status);
  }

  private handleText(text: string): void {
    let message: ReturnType<typeof parseServerMessage>;
    try {
      message = parseServerMessage(JSON.parse(text));
    } catch (error) {
      if (error instanceof InvalidMessageError || error instanceof SyntaxError) {
        this.stopWith('The server sent a message this page cannot read.', error);
        return;
      }
      throw error;
    }
    switch (message.type) {
      case 'state':
        this.deliverState(message.state, () => {
          this.options.onState(message.state);
        });
        return;
      case 'run-ended':
        this.deliverState(message.state, () => {
          this.hasEnded = true;
          this.options.onRunEnded(message);
          this.close();
        });
        return;
      case 'message-refused':
        this.options.onRefused(message);
        return;
    }
  }

  private deliverState(state: RunStateReport, deliver: () => void): void {
    if (state.players.some((player) => player.playerId === this.options.ownPlayerId)) {
      deliver();
    } else {
      this.stopWith(
        `Player '${this.options.ownPlayerId}' is not a character in this run.`,
        new Error('The state of the run has no character for this page'),
      );
    }
  }

  private stopWith(reason: string, cause: unknown): void {
    console.error(reason, cause);
    this.isClosedByPage = true;
    this.socket.close();
    this.options.onStatus({ kind: 'stopped', reason });
  }
}
