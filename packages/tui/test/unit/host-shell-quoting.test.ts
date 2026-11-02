import { describe, expect, it } from 'bun:test';

import {
  buildCmdShellArgv,
  quoteCmdShellArg,
} from '../../src/host/external-editor.js';

describe('cmd.exe shell argv quoting', () => {
  it('passes bare segments through untouched', () => {
    expect(quoteCmdShellArg('plain')).toBe('plain');
    expect(quoteCmdShellArg('C:\\no\\spaces\\x.exe')).toBe('C:\\no\\spaces\\x.exe');
  });

  it('wraps segments with spaces or quotes and doubles embedded quotes', () => {
    expect(quoteCmdShellArg('hello world')).toBe('"hello world"');
    expect(quoteCmdShellArg('say "hi" there')).toBe('"say ""hi"" there"');
    expect(quoteCmdShellArg('C:\\path with space\\x.exe')).toBe('"C:\\path with space\\x.exe"');
  });

  it('doubles trailing backslashes so the closing quote stays literal', () => {
    expect(quoteCmdShellArg('C:\\dir with space\\')).toBe('"C:\\dir with space\\\\"');
  });

  it('builds the /d /s /c argv with the line wrapped once for /s to strip', () => {
    expect(buildCmdShellArgv('echo', ['hello world'], 'cmd.exe')).toEqual([
      'cmd.exe',
      '/d',
      '/s',
      '/c',
      '"echo "hello world""',
    ]);
  });
});
