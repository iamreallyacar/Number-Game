import { MAX_DIRECTION_COMPONENT, type Direction } from './player-input.js';
import type { ClientMessage } from './messages.js';
import { failMessage, readExactFields, readFiniteNumber } from './read-message-fields.js';
import { readStoredFields } from '@local/stored-values';
import { isUpgradeId } from './upgrades.js';

const WHAT = 'client message';

function readDirectionComponent(value: unknown, name: string): number {
  const component = readFiniteNumber(value, WHAT, name);
  if (Math.abs(component) > MAX_DIRECTION_COMPONENT) {
    failMessage(
      WHAT,
      `${name} must be between -${String(MAX_DIRECTION_COMPONENT)} and ${String(MAX_DIRECTION_COMPONENT)}`,
    );
  }
  return component;
}

function parseDirection(value: unknown): Direction | null {
  if (value === null) {
    return null;
  }
  const fields = readExactFields(value, WHAT, ['x', 'y']);
  return {
    x: readDirectionComponent(fields.get('x'), 'x'),
    y: readDirectionComponent(fields.get('y'), 'y'),
  };
}

/**
 * Checks a message a browser sent, which the server must never trust. Throws `InvalidMessageError`
 * for anything that is not exactly a message of `ClientMessage`.
 */
export function parseClientMessage(value: unknown): ClientMessage {
  const type = readStoredFields(value)?.get('type');
  if (type === 'set-direction') {
    const fields = readExactFields(value, WHAT, ['type', 'direction']);
    return { type, direction: parseDirection(fields.get('direction')) };
  }
  if (type === 'choose-upgrade') {
    const fields = readExactFields(value, WHAT, ['type', 'upgradeId']);
    const upgradeId = fields.get('upgradeId');
    if (!isUpgradeId(upgradeId)) {
      failMessage(WHAT, 'upgradeId is not a known upgrade');
    }
    return { type, upgradeId };
  }
  return failMessage(WHAT, "type must be 'set-direction' or 'choose-upgrade'");
}
