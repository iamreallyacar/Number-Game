import { balance, SURVIVOR_GAME_ID, type RunStateReport } from '@local/survivor-game';
import { describe, expect, it } from 'vitest';
import { createGameRegistry } from './create-game-registry.js';
import { survivorGameServerModule } from './survivor-game.js';

function readState(report: string): RunStateReport {
  const message = JSON.parse(report) as { type: string; state: RunStateReport };
  expect(message.type).toBe('state');
  return message.state;
}

function playerX(state: RunStateReport, playerId: string): number {
  const player = state.players.find((candidate) => candidate.playerId === playerId);
  if (player === undefined) {
    throw new Error(`No player ${playerId}`);
  }
  return player.x;
}

describe('Survivor Game server module', () => {
  it('is registered as a room game with the limits of the rules package', () => {
    const game = createGameRegistry().getRoomGame(SURVIVOR_GAME_ID);
    expect(game).toMatchObject({
      kind: 'room',
      minPlayers: 1,
      maxPlayers: 4,
      stepRate: balance.STEP_RATE,
      emptyRunSeconds: balance.EMPTY_RUN_SECONDS,
      socketPlayerIdParameter: 'playerId',
      categories: ['1', '2', '3', '4'],
    });
  });

  it('moves a player who holds a direction and keeps holding it', () => {
    const session = survivorGameServerModule.startRun(['Sam'], 1);
    const before = playerX(readState(session.stateReport()), 'Sam');
    expect(
      session.receiveMessage('Sam', '{"type":"set-direction","direction":{"x":1,"y":0}}'),
    ).toBeNull();
    session.step(new Set(['Sam']));
    session.step(new Set(['Sam']));
    const after = playerX(readState(session.stateReport()), 'Sam');
    expect(after).toBeGreaterThan(before);
    session.step(new Set(['Sam']));
    expect(playerX(readState(session.stateReport()), 'Sam')).toBeGreaterThan(after);
  });

  it('stands a dropped player still and forgets the direction they held', () => {
    const session = survivorGameServerModule.startRun(['Sam', 'Ana'], 1);
    session.receiveMessage('Sam', '{"type":"set-direction","direction":{"x":1,"y":0}}');
    session.step(new Set(['Ana']));
    const whileDropped = playerX(readState(session.stateReport()), 'Sam');
    session.resetInput('Sam');
    session.step(new Set(['Sam', 'Ana']));
    expect(playerX(readState(session.stateReport()), 'Sam')).toBe(whileDropped);
  });

  it('refuses a choice that is not in an open offer, and a message it cannot read', () => {
    const session = survivorGameServerModule.startRun(['Sam'], 1);
    const noOffer = session.receiveMessage(
      'Sam',
      '{"type":"choose-upgrade","upgradeId":"healing"}',
    );
    expect(JSON.parse(noOffer ?? 'null')).toMatchObject({
      type: 'message-refused',
      reason: 'no-open-offer',
    });
    for (const unreadable of ['nope', '{"type":"fly"}', '{"type":"set-direction","direction":1}']) {
      expect(JSON.parse(session.receiveMessage('Sam', unreadable) ?? 'null')).toMatchObject({
        type: 'message-refused',
        reason: 'unreadable-message',
      });
    }
  });

  it('ends an abandoned run with a run-ended report, and a result with one category', () => {
    const session = survivorGameServerModule.startRun(['Sam', 'Ana'], 1);
    session.step(new Set(['Sam']));
    expect(session.isOver()).toBe(false);
    session.endAsAbandoned();
    expect(session.isOver()).toBe(true);
    expect(JSON.parse(session.runEndedReport())).toMatchObject({
      type: 'run-ended',
      reason: 'abandoned',
      summary: { category: '2' },
    });
    const { summary, storedDetails } = session.finishedResult();
    expect(summary.category).toBe('2');
    expect(storedDetails.detailsVersion).toBe(1);
    expect(survivorGameServerModule.readSummaryDetails(storedDetails)).toEqual(summary.details);
  });

  it('refuses to report the end of a run that has not ended', () => {
    const session = survivorGameServerModule.startRun(['Sam'], 1);
    expect(() => session.runEndedReport()).toThrow('has not ended');
  });
});
