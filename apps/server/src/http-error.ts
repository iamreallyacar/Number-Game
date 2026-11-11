import type { ApiErrorBody } from '@local/game-server-api';
import type { FastifyInstance } from 'fastify';

/** An error the client caused or should know about. The error handler turns it into a response. */
export class HttpError extends Error {
  override readonly name = 'HttpError';

  constructor(
    readonly statusCode: number,
    readonly errorCode: string,
    message: string,
    readonly reason?: string,
  ) {
    super(message);
  }

  toBody(): ApiErrorBody {
    const body = { error: this.errorCode, message: this.message };
    return this.reason === undefined ? body : { ...body, reason: this.reason };
  }
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send(error.toBody());
    }
    if (error instanceof Error && 'validation' in error) {
      const body: ApiErrorBody = { error: 'invalid-request', message: error.message };
      return reply.code(400).send(body);
    }
    const clientErrorStatusCode = readClientErrorStatusCode(error);
    if (clientErrorStatusCode !== null && error instanceof Error) {
      const body: ApiErrorBody = { error: 'invalid-request', message: error.message };
      return reply.code(clientErrorStatusCode).send(body);
    }
    request.log.error(error, 'Unexpected error while handling a request');
    const body: ApiErrorBody = {
      error: 'internal-error',
      message: 'Something went wrong on the server',
    };
    return reply.code(500).send(body);
  });
}

/** Fastify marks requests it refuses itself, such as a broken JSON body, with a 4xx status code. */
function readClientErrorStatusCode(error: unknown): number | null {
  if (typeof error !== 'object' || error === null || !('statusCode' in error)) {
    return null;
  }
  const { statusCode } = error;
  return typeof statusCode === 'number' && statusCode >= 400 && statusCode < 500
    ? statusCode
    : null;
}
