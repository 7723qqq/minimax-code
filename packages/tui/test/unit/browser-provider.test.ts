import { describe, expect, it } from 'bun:test';
import { resolveTuiBrowserProviderOptions } from '../../src/runtime/browser-provider.js';

const enabled = { beta: { browserUseTooling: true } } as const;

describe('resolveTuiBrowserProviderOptions', () => {
  it('requires the browser tooling beta flag', () => {
    expect(
      resolveTuiBrowserProviderOptions('/data', { beta: { browserUseTooling: false } }, {}),
    ).toBeUndefined();
    expect(
      resolveTuiBrowserProviderOptions('/data', {}, { MCODE_BROWSER_USE_SWIFTSHADER: 'true' }),
    ).toBeUndefined();
  });

  it('adds the SwiftShader launch arguments only when requested', () => {
    expect(resolveTuiBrowserProviderOptions('/data', enabled, {})).toEqual({ dataDir: '/data' });
    expect(
      resolveTuiBrowserProviderOptions('/data', enabled, {
        MCODE_BROWSER_USE_SWIFTSHADER: 'TRUE',
      }),
    ).toEqual({
      dataDir: '/data',
      extraArgs: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    });
    expect(
      resolveTuiBrowserProviderOptions('/data', enabled, {
        MCODE_BROWSER_USE_SWIFTSHADER: 'false',
      }),
    ).toEqual({ dataDir: '/data' });
  });

  it('prefers the environment Chrome path over the config path', () => {
    const configured = { ...enabled, browser: { chromePath: '/chrome' } };
    expect(resolveTuiBrowserProviderOptions('/data', configured, {})).toEqual({
      dataDir: '/data',
      chromePath: '/chrome',
    });
    expect(
      resolveTuiBrowserProviderOptions('/data', configured, { MCODE_CHROME_PATH: '/env-chrome' }),
    ).toEqual({ dataDir: '/data', chromePath: '/env-chrome' });
  });
});
