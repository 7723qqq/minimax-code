import { Buffer } from 'node:buffer';
import type { TuiTextClipboardWriter } from '../../host/clipboard-text.js';
import type { Terminal } from '../engine/public.js';
import type { TerminalCapabilities } from './terminal-capabilities.js';
import { shellText } from '../shell/copy.js';

const ESC = '\u001B';
const BEL = '\u0007';
// Keep this aligned with the vendored Pi clipboard fallback. Large OSC 52
// payloads can desynchronize terminal rendering before the client sees them.
const MAX_OSC52_ENCODED_LENGTH = 100_000;

export function createTuiTextClipboardWriter(options: {
  readonly terminal: Pick<Terminal, 'write'>;
  readonly capabilities: TerminalCapabilities;
  readonly nativeWriter: TuiTextClipboardWriter;
}): TuiTextClipboardWriter {
  if (!options.capabilities.isTTY || options.capabilities.transport !== 'ssh') {
    return options.nativeWriter;
  }
  return async (text) => {
    const payload = Buffer.from(text, 'utf8').toString('base64');
    if (payload.length > MAX_OSC52_ENCODED_LENGTH) {
      throw new Error(shellText('platform.clipboard.tooLarge'));
    }
    options.terminal.write(`${ESC}]52;c;${payload}${BEL}`);
  };
}
