import type { AgentExtension, AfterToolCallHandler } from '@mavis/agent-runtime';

export interface RequestMediaImageEncoding {
  readonly maxWidth: number;
  readonly maxHeight: number;
  readonly maxBase64Bytes: number;
}

export type RequestMediaEncodeResult =
  | {
      readonly kind: 'resized';
      readonly data: string;
      readonly mimeType: string;
      readonly dimensionNote?: string;
    }
  | { readonly kind: 'unchanged' }
  | { readonly kind: 'unavailable' };

export interface RequestMediaEncodingExtensionOptions {
  readonly getImageEncoding: () => RequestMediaImageEncoding;
  /**
   * Re-encodes one image within the given limits. The host supplies this so the
   * extension does not depend on the image runtime; it returns `unavailable`
   * when the processor cannot load.
   */
  readonly encodeImage: (
    bytes: Uint8Array,
    mimeType: string,
    encoding: RequestMediaImageEncoding,
  ) => Promise<RequestMediaEncodeResult>;
  readonly id?: string;
  readonly description?: string;
}

const IMAGE_UNAVAILABLE_TEXT = '[Image omitted: image processing runtime is unavailable.]';

/**
 * Re-encodes tool result images that exceed `requestMedia.image` limits before
 * the next provider request. Images already within the limits are untouched;
 * when the image runtime is unavailable the image becomes a text notice, which
 * keeps the request valid instead of failing on an oversized payload.
 */
export function requestMediaEncodingExtension(
  options: RequestMediaEncodingExtensionOptions,
): AgentExtension {
  const afterToolCall: AfterToolCallHandler = async (toolContext) => {
    const original = toolContext.result.content;
    if (!original.some((block) => block.type === 'image')) return undefined;

    const encoding = options.getImageEncoding();
    type ContentBlock = (typeof original)[number];
    const content: ContentBlock[] = [];
    let changed = false;
    for (const block of original) {
      if (block.type !== 'image' || typeof block.data !== 'string' || typeof block.mimeType !== 'string') {
        content.push(block);
        continue;
      }
      const result = await options.encodeImage(
        Buffer.from(block.data, 'base64'),
        block.mimeType,
        encoding,
      );
      if (result.kind === 'unchanged') {
        content.push(block);
        continue;
      }
      changed = true;
      if (result.kind === 'unavailable') {
        content.push({ type: 'text', text: IMAGE_UNAVAILABLE_TEXT });
        continue;
      }
      const resized = { ...block, data: result.data, mimeType: result.mimeType };
      content.push(resized);
      if (result.dimensionNote) content.push({ type: 'text', text: result.dimensionNote });
    }

    return changed ? { content, details: toolContext.result.details } : undefined;
  };

  return {
    id: options.id ?? 'request-media',
    description:
      options.description ??
      'Re-encode tool result images that exceed the configured request media limits.',
    init(pi) {
      pi.on('after_tool_call', afterToolCall);
    },
  };
}
