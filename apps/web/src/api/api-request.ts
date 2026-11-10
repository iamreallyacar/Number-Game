import { apiErrorBodySchema } from '@local/game-server-api';
import type { Static, TSchema } from 'typebox';
import { Value } from 'typebox/value';

/** The server answered with an error body: `{ error, message, reason? }`. */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly status: number,
    readonly errorCode: string,
    message: string,
    readonly reason: string | null,
  ) {
    super(message);
  }
}

/** The request never got an answer, for example because the server or the network is down. */
export class NetworkError extends Error {
  override readonly name = 'NetworkError';
}

export interface ApiRequest {
  readonly method: 'GET' | 'POST' | 'DELETE';
  readonly path: string;
  readonly body?: unknown;
  readonly deviceId?: string;
}

async function sendRequest(request: ApiRequest): Promise<Response> {
  const headers: Record<string, string> = {};
  if (request.body !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (request.deviceId !== undefined) {
    headers['x-device-id'] = request.deviceId;
  }
  try {
    return await fetch(request.path, {
      method: request.method,
      headers,
      ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
    });
  } catch (error) {
    throw new NetworkError('Could not reach the game server. Check the network connection', {
      cause: error,
    });
  }
}

async function readJson(response: Response, request: ApiRequest): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(`The server sent an answer that is not JSON for ${request.path}`, {
      cause: error,
    });
  }
}

async function throwApiError(response: Response, request: ApiRequest): Promise<never> {
  const body = await readJson(response, request).catch(() => null);
  if (Value.Check(apiErrorBodySchema, body)) {
    throw new ApiError(response.status, body.error, body.message, body.reason ?? null);
  }
  throw new ApiError(
    response.status,
    'unexpected-error',
    `The server answered ${request.method} ${request.path} with status ${String(response.status)}`,
    null,
  );
}

/** Sends a request and checks the answer against the schema, so a wrong answer fails loudly. */
export async function requestJson<ResponseSchema extends TSchema>(
  request: ApiRequest,
  responseSchema: ResponseSchema,
): Promise<Static<ResponseSchema>> {
  const response = await sendRequest(request);
  if (!response.ok) {
    return throwApiError(response, request);
  }
  const body = await readJson(response, request);
  if (!Value.Check(responseSchema, body)) {
    throw new Error(`The server sent an answer of the wrong shape for ${request.path}`);
  }
  return body;
}

/** Sends a request whose successful answer has no body. */
export async function requestWithoutBody(request: ApiRequest): Promise<void> {
  const response = await sendRequest(request);
  if (!response.ok) {
    await throwApiError(response, request);
  }
}

/** A message for the player that explains any error from a request. */
export function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
