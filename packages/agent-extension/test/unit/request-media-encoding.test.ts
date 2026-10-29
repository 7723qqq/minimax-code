import { describe, expect, it } from 'bun:test';
import type { AfterToolCallHandler } from '@mavis/agent-runtime';
import {
  requestMediaEncodingExtension,
  type RequestMediaEncodingExtensionOptions,
} from '../../src/request-media-encoding.js';

const encoding = { maxWidth: 2_000, maxHeight: 2_000, maxBase64Bytes: 4_718_592 };

function capture(options: RequestMediaEncodingExtensionOptions): AfterToolCallHandler {
  const handlers = new Map<string, (...args: never[]) => unknown>();
  requestMediaEncodingExtension(options).init({
    on: (event: string, handler: (...args: never[]) => unknown) => {
      handlers.set(event, handler);
    },
  } as never);
  return handlers.get('after_tool_call') as unknown as AfterToolCallHandler;
}

function image(data = 'b2xk', mimeType = 'image/png') {
  return { type: 'image' as const, data, mimeType };
}

function toolContext(content: unknown[], details: unknown = { marker: true }) {
  return { result: { content, details } } as unknown as Parameters<AfterToolCallHandler>[0];
}

const ctx = {} as never;

describe('requestMediaEncodingExtension', () => {
  it('replaces a resized image and appends the dimension note', async () => {
    const calls: unknown[] = [];
    const handler = capture({
      getImageEncoding: () => encoding,
      encodeImage: async (bytes, mimeType, received) => {
        calls.push({ bytes: Buffer.from(bytes).toString(), mimeType, received });
        return {
          kind: 'resized',
          data: 'bmV3',
          mimeType: 'image/jpeg',
          dimensionNote: '[Image resized to 100x50.]',
        };
      },
    });

    await expect(handler(toolContext([image()]), undefined, ctx)).resolves.toEqual({
      content: [
        { type: 'image', data: 'bmV3', mimeType: 'image/jpeg' },
        { type: 'text', text: '[Image resized to 100x50.]' },
      ],
      details: { marker: true },
    });
    expect(calls).toEqual([{ bytes: 'old', mimeType: 'image/png', received: encoding }]);
  });

  it('returns undefined when every image is already within the limits', async () => {
    const handler = capture({
      getImageEncoding: () => encoding,
      encodeImage: async () => ({ kind: 'unchanged' }),
    });
    await expect(handler(toolContext([image()]), undefined, ctx)).resolves.toBeUndefined();
  });

  it('replaces an image with a text notice when the processor is unavailable', async () => {
    const handler = capture({
      getImageEncoding: () => encoding,
      encodeImage: async () => ({ kind: 'unavailable' }),
    });
    await expect(handler(toolContext([image()]), undefined, ctx)).resolves.toEqual({
      content: [{ type: 'text', text: '[Image omitted: image processing runtime is unavailable.]' }],
      details: { marker: true },
    });
  });

  it('leaves non-image blocks and unchanged images untouched', async () => {
    const handler = capture({
      getImageEncoding: () => encoding,
      encodeImage: async () => ({ kind: 'unchanged' }),
    });
    await expect(
      handler(toolContext([{ type: 'text', text: 'result' }, image()]), undefined, ctx),
    ).resolves.toBeUndefined();
  });

  it('re-encodes every image and omits the note when dimensions are unchanged', async () => {
    const handler = capture({
      getImageEncoding: () => encoding,
      encodeImage: async (_bytes, _mimeType) => ({
        kind: 'resized',
        data: 'bmV3',
        mimeType: 'image/png',
      }),
    });
    await expect(
      handler(toolContext([image('b25l'), image('dHdv')]), undefined, ctx),
    ).resolves.toEqual({
      content: [
        { type: 'image', data: 'bmV3', mimeType: 'image/png' },
        { type: 'image', data: 'bmV3', mimeType: 'image/png' },
      ],
      details: { marker: true },
    });
  });
});
