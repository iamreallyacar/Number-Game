import { Type } from 'typebox';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, NetworkError, requestJson } from './api-request.js';

const answerSchema = Type.Object({ value: Type.Number() });

function answerWith(status: number, body: unknown): void {
  vi.stubGlobal('fetch', () => Promise.resolve(Response.json(body, { status })));
}

describe('requestJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the body and device ID, and returns a checked answer', async () => {
    const fetchSpy = vi.fn(() => Promise.resolve(Response.json({ value: 4 })));
    vi.stubGlobal('fetch', fetchSpy);
    const answer = await requestJson(
      { method: 'POST', path: '/api/thing', body: { a: 1 }, deviceId: 'device-1' },
      answerSchema,
    );
    expect(answer).toEqual({ value: 4 });
    expect(fetchSpy).toHaveBeenCalledWith('/api/thing', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-device-id': 'device-1' },
      body: '{"a":1}',
    });
  });

  it('turns an error body into an ApiError with its code and reason', async () => {
    answerWith(422, { error: 'move-refused', message: 'Move refused', reason: 'not-a-pair' });
    const request = requestJson({ method: 'GET', path: '/api/thing' }, answerSchema);
    await expect(request).rejects.toEqual(
      new ApiError(422, 'move-refused', 'Move refused', 'not-a-pair'),
    );
  });

  it('fails loudly when the answer has the wrong shape', async () => {
    answerWith(200, { value: 'four' });
    const request = requestJson({ method: 'GET', path: '/api/thing' }, answerSchema);
    await expect(request).rejects.toThrow('wrong shape');
  });

  it('reports a NetworkError when the server cannot be reached', async () => {
    vi.stubGlobal('fetch', () => Promise.reject(new TypeError('Failed to fetch')));
    const request = requestJson({ method: 'GET', path: '/api/thing' }, answerSchema);
    await expect(request).rejects.toBeInstanceOf(NetworkError);
  });
});
