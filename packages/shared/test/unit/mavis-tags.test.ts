import { describe, expect, it } from 'bun:test';

import {
  containsMavisPairedBlock,
  containsMavisProgressBlock,
  containsMavisThinkingBlock,
  extractVisibleContent,
  isThinkingOrProgressOnly,
  stripMavisProgressTags,
  stripMavisTagsForIm,
  stripMavisThinkingTags,
} from '../../src/mavis-tags.js';

describe('stripMavisThinkingTags', () => {
  it('removes thinking blocks entirely and trims', () => {
    expect(stripMavisThinkingTags('<mavis-thinking>trace</mavis-thinking>answer')).toBe('answer');
    expect(stripMavisThinkingTags('a <mavis-thinking attr="1">t</mavis-thinking> b')).toBe('a  b');
  });
});

describe('stripMavisProgressTags', () => {
  it('keeps the inner text and prevents visual fusion', () => {
    expect(stripMavisProgressTags('<mavis-progress>tests running</mavis-progress>Done.')).toBe(
      'tests running Done.',
    );
  });
});

describe('extractVisibleContent', () => {
  it('drops thinking and unwraps progress', () => {
    expect(
      extractVisibleContent(
        '<mavis-thinking>t</mavis-thinking><mavis-progress>p</mavis-progress>body',
      ),
    ).toBe('p body');
  });

  it('returns empty string when nothing visible remains', () => {
    expect(extractVisibleContent('<mavis-thinking>t</mavis-thinking>')).toBe('');
  });
});

describe('isThinkingOrProgressOnly', () => {
  it('is true for thinking-only, progress-only and mixed-only content', () => {
    expect(isThinkingOrProgressOnly('<mavis-thinking>t</mavis-thinking>')).toBe(true);
    expect(isThinkingOrProgressOnly('<mavis-progress>p</mavis-progress>')).toBe(true);
    expect(
      isThinkingOrProgressOnly('<mavis-thinking>t</mavis-thinking><mavis-progress>p</mavis-progress>'),
    ).toBe(true);
  });

  it('is false when plain text is present or the input is empty', () => {
    expect(isThinkingOrProgressOnly('<mavis-progress>p</mavis-progress>real')).toBe(false);
    expect(isThinkingOrProgressOnly('')).toBe(false);
    expect(isThinkingOrProgressOnly('   ')).toBe(false);
  });
});

describe('stripMavisTagsForIm', () => {
  it('removes every paired mavis block, nested innermost-first', () => {
    expect(
      stripMavisTagsForIm(
        '<mavis-thinking>outer <mavis-progress>inner</mavis-progress></mavis-thinking>kept',
      ),
    ).toBe('kept');
  });

  it('drops progress inner text on IM and keeps plain text', () => {
    expect(stripMavisTagsForIm('a<mavis-progress>p</mavis-progress>b')).toBe('ab');
  });
});

describe('contains* helpers', () => {
  it('detect blocks without global-regex lastIndex flips', () => {
    const content = '<mavis-thinking>t</mavis-thinking>';
    // Calling twice must not flip the result (the g-flag .test() pitfall the
    // helpers exist to avoid).
    expect(containsMavisThinkingBlock(content)).toBe(true);
    expect(containsMavisThinkingBlock(content)).toBe(true);
    expect(containsMavisProgressBlock(content)).toBe(false);
    expect(containsMavisPairedBlock(content)).toBe(true);
    expect(containsMavisPairedBlock('plain')).toBe(false);
  });
});
