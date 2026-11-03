import { readImageEncodedContent } from '@mavis/agent-core/tools';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Bun semantics: Bun 1.4.4 gives mock factories no importOriginal, and its
// mock.module mutates the already-loaded module namespace in place, so the
// original exports are captured before registration (same pattern as
// packages/agent-tools/test/desktop/local-bash-output.test.ts).
beforeAll(async () => {
  const real = await import('@earendil-works/pi-coding-agent/image-resize');
  const realExports = { ...real };
  const unavailable = real.ImageProcessorUnavailableError;
  vi.mock('@earendil-works/pi-coding-agent/image-resize', () => ({
    ...realExports,
    resizeImage: vi.fn(() => Promise.reject(new unavailable())),
  }));
});

const { encodeRequestImage, encodeRequestImageBlocks } = await import('../src/index.js');

describe('image processor unavailable', () => {
  it('replaces a tool result image over the limits with the Read tool note', async () => {
    const blocks = [
      { type: 'text', text: 'Read image file [image/png]' },
      { type: 'image', data: 'AAAA', mimeType: 'image/png' },
    ];

    const output = await encodeRequestImageBlocks(blocks);
    expect(output).toEqual([
      { type: 'text', text: 'Read image file [image/png]' },
      { type: 'text', text: '[Image omitted: image processing runtime is unavailable.]' },
    ]);
    expect(readImageEncodedContent(output, JSON.stringify(blocks))).toEqual([
      { mimeType: 'image/png', omittedReason: 'processor_unavailable' },
    ]);
  });

  it('keeps the original for callers that encode a single image', async () => {
    await expect(
      encodeRequestImage(Buffer.from('AAAA', 'base64'), 'image/png'),
    ).resolves.toBeUndefined();
  });
});
