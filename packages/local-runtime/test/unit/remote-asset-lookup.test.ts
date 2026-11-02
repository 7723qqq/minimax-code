import { describe, expect, it } from 'bun:test';
import { pinnedLookup } from '../../src/assets/remote-source.js';

type LookupAllCallback = (
  error: NodeJS.ErrnoException | null,
  resolved: unknown,
  family?: number,
) => void;
type LookupAll = (
  hostname: string,
  options: { readonly all: boolean },
  callback: LookupAllCallback,
) => void;

describe('pinnedLookup', () => {
  const pinned = { address: '93.184.216.34', family: 4 as const };

  it('answers the single-address contract', () => {
    let result: unknown;
    pinnedLookup(pinned)('example.test', { family: 4 }, (error, resolved, family) => {
      result = { error, resolved, family };
    });
    expect(result).toEqual({ error: null, resolved: '93.184.216.34', family: 4 });
  });

  it('answers Bun autoSelectFamily with an address array', () => {
    let result: unknown;
    (pinnedLookup(pinned) as unknown as LookupAll)(
      'example.test',
      { all: true },
      (error, resolved) => {
        result = { error, resolved };
      },
    );
    expect(result).toEqual({
      error: null,
      resolved: [{ address: '93.184.216.34', family: 4 }],
    });
  });
});
