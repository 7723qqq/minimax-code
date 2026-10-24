import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

// `bun test` runs every file of a suite in one process, and `mock.module()`
// replaces the module for that whole process. Snapshot the real module before
// replacing it and put it back in `afterAll`, so the replacement never leaks
// into the files that run after this one.
const actualAgentToolsDesktop = { ...(await import('@mavis/agent-tools/desktop')) };

// `mock.module()` replaces the desktop Matrix module for the whole graph. Bun
// evaluates the factory lazily, so the plain `const` is picked up as-is.
const desktopMocks = {
  createMatrixMcpRuntime: mock(
    (options: { workspaceRoot: string }) =>
      ({
        tools: [],
        workspaceRoot: options.workspaceRoot,
        createContext: () => ({
          sessionId: 'test',
          turnId: 'test',
          workspaceRoot: options.workspaceRoot,
        }),
      }) as unknown,
  ),
  buildMatrixMcpToolDescriptors: mock(() => [
    {
      name: 'web_search',
      description: 'Matrix web search',
      inputSchema: { type: 'object' },
    },
  ]),
  // Declared explicitly instead of being inherited from the real module: the
  // real Matrix endpoint resolution must not decide this test's expectations,
  // and the dist build can also be stale (dist/desktop/ missing matrix-env.js
  // after the PI MCP src split).
  getDesktopMatrixEndpoint: mock((env: NodeJS.ProcessEnv = {}) => {
    const region = env.MAVIS_REGION === 'cn' ? 'cn' : 'en';
    const buildEnv = env.MAVIS_BUILD_ENV === 'prod' ? 'prod' : 'test';
    const managed: Record<'en' | 'cn', Record<'test' | 'prod', string>> = {
      en: {
        test: 'https://matrix-overseas-test.example.invalid',
        prod: 'https://matrix-overseas.example.invalid',
      },
      cn: {
        test: 'https://matrix-test.example.invalid',
        prod: 'https://matrix.example.invalid',
      },
    };
    return { baseUrl: managed[region][buildEnv], managed: true };
  }),
};

mock.module('@mavis/agent-tools/desktop', () => ({
  ...actualAgentToolsDesktop,
  createMatrixMcpRuntime: desktopMocks.createMatrixMcpRuntime,
  buildMatrixMcpToolDescriptors: desktopMocks.buildMatrixMcpToolDescriptors,
  getDesktopMatrixEndpoint: desktopMocks.getDesktopMatrixEndpoint,
}));

afterAll(() => {
  mock.module('@mavis/agent-tools/desktop', () => actualAgentToolsDesktop);
});

/**
 * Import a fresh copy of the module under test.
 *
 * Bun has no module-registry reset, so the copy is selected with a unique
 * query string: Bun treats a different query as a different module and
 * evaluates it again. That gives every test its own module-level descriptor
 * cache.
 */
let moduleGeneration = 0;
async function importBuiltinMatrix() {
  moduleGeneration += 1;
  return await import(`./builtin-matrix.js?generation=${moduleGeneration}`);
}

const ORIGINAL_ENV = {
  MAVIS_REGION: process.env.MAVIS_REGION,
  MAVIS_BUILD_ENV: process.env.MAVIS_BUILD_ENV,
  MAVIS_MATRIX_MCP_STDIO_ENTRYPOINT: process.env.MAVIS_MATRIX_MCP_STDIO_ENTRYPOINT,
};

function restoreEnv(key: keyof typeof ORIGINAL_ENV): void {
  const value = ORIGINAL_ENV[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

describe('builtin Matrix MCP server config', () => {
  beforeEach(() => {
    desktopMocks.createMatrixMcpRuntime.mockClear();
    desktopMocks.buildMatrixMcpToolDescriptors.mockClear();
    process.env.MAVIS_REGION = 'en';
    process.env.MAVIS_BUILD_ENV = 'test';
    process.env.MAVIS_MATRIX_MCP_STDIO_ENTRYPOINT = process.execPath;
  });

  afterEach(() => {
    restoreEnv('MAVIS_REGION');
    restoreEnv('MAVIS_BUILD_ENV');
    restoreEnv('MAVIS_MATRIX_MCP_STDIO_ENTRYPOINT');
  });

  it('marks the stdio child so packaged Electron runs it as Node', async () => {
    const { buildBuiltinMatrixServerConfig } = await importBuiltinMatrix();

    const config = buildBuiltinMatrixServerConfig({ workspaceRoot: '/workspace/current' });

    expect(config.env).toMatchObject({
      MAVIS_REGION: 'en',
      MAVIS_BUILD_ENV: 'test',
      MAVIS_MATRIX_WORKSPACE_ROOT: '/workspace/current',
      ELECTRON_RUN_AS_NODE: '1',
    });
  });

  it.each([undefined, 'qa'])(
    'omits an invalid raw build env from the Matrix child (%s)',
    async (buildEnv) => {
      if (buildEnv === undefined) delete process.env.MAVIS_BUILD_ENV;
      else process.env.MAVIS_BUILD_ENV = buildEnv;

      const { buildBuiltinMatrixServerConfig } = await importBuiltinMatrix();
      const config = buildBuiltinMatrixServerConfig({
        workspaceRoot: '/workspace/current',
        routingContext: { bedrockLane: 'lane-a' },
      });

      expect(config.env?.MAVIS_BUILD_ENV).toBeUndefined();
      expect(config.env?.MAVIS_MATRIX_BEDROCK_LANE).toBe('lane-a');
    },
  );

  it('uses the same Matrix runtime env for cached tool descriptors', async () => {
    const { buildBuiltinMatrixServerConfig } = await importBuiltinMatrix();

    buildBuiltinMatrixServerConfig({ workspaceRoot: '/workspace/current' });

    expect(desktopMocks.createMatrixMcpRuntime).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceRoot: '/workspace/current',
        baseUrl: 'https://matrix-overseas-test.example.invalid',
      }),
    );
  });

  it('keeps the Builtin Matrix web search name unprefixed for Local model tools', async () => {
    const { buildBuiltinMatrixServerConfig } = await importBuiltinMatrix();
    const { buildNativeToolName } = await import('./config.js');
    const config = buildBuiltinMatrixServerConfig({ workspaceRoot: '/workspace/current' });

    expect(config.tools?.map((tool) => tool.name)).toContain('web_search');
    expect(buildNativeToolName('matrix', 'web_search', config)).toBe('web_search');
  });

  it('narrows the built-in Matrix tools to web_search when webSearchOnly is set', async () => {
    // mcode-tools owns the media/generation Matrix tools but not web_search, so
    // the Matrix MCP is narrowed to web_search only. The descriptor list is
    // cached on first build, so a single mocked return covers both calls.
    desktopMocks.buildMatrixMcpToolDescriptors.mockReturnValueOnce([
      { name: 'web_search', description: 'Matrix web search', inputSchema: { type: 'object' } },
      {
        name: 'image_synthesize',
        description: 'Matrix image synthesize',
        inputSchema: { type: 'object' },
      },
    ]);
    const { buildBuiltinMatrixServerConfig } = await importBuiltinMatrix();

    const full = buildBuiltinMatrixServerConfig({ workspaceRoot: '/workspace/current' });
    expect(full.tools?.map((tool) => tool.name)).toEqual(['web_search', 'image_synthesize']);

    const narrowed = buildBuiltinMatrixServerConfig(
      { workspaceRoot: '/workspace/current' },
      { webSearchOnly: true },
    );
    expect(narrowed.tools?.map((tool) => tool.name)).toEqual(['web_search']);
  });

  it('injects the dataDir assets subtree — never the dataDir root — as extra input root (TS-10)', async () => {
    const { buildBuiltinMatrixServerConfig, buildBuiltinMatrixTokenOverrides } =
      await importBuiltinMatrix();
    const dataDir = join(tmpdir(), 'matrix-builtin-data');
    const expectedAssets = join(dataDir, 'v2', 'assets');

    const config = buildBuiltinMatrixServerConfig({ workspaceRoot: '/workspace/current', dataDir });
    const overrides = buildBuiltinMatrixTokenOverrides({
      workspaceRoot: '/workspace/current',
      dataDir,
      authContext: { accessToken: 'token' },
    });

    expect(config.env?.MAVIS_MATRIX_EXTRA_INPUT_ROOTS).toBe(expectedAssets);
    expect(overrides.env?.MAVIS_MATRIX_EXTRA_INPUT_ROOTS).toBe(expectedAssets);
  });

  it('omits the extra input root without dataDir and keeps connectionKey dataDir-free (TS-10)', async () => {
    const { buildBuiltinMatrixServerConfig, buildBuiltinMatrixTokenOverrides } =
      await importBuiltinMatrix();

    const config = buildBuiltinMatrixServerConfig({ workspaceRoot: '/workspace/current' });
    const without = buildBuiltinMatrixTokenOverrides({ workspaceRoot: '/workspace/current' });
    const withDataDir = buildBuiltinMatrixTokenOverrides({
      workspaceRoot: '/workspace/current',
      dataDir: join(tmpdir(), 'matrix-builtin-data'),
    });

    expect(config.env?.MAVIS_MATRIX_EXTRA_INPUT_ROOTS).toBeUndefined();
    expect(without.env?.MAVIS_MATRIX_EXTRA_INPUT_ROOTS).toBeUndefined();
    expect(withDataDir.connectionKey).toBe(without.connectionKey);
  });

  it('scopes the built-in Matrix child key by the managed routing lane', async () => {
    const { buildBuiltinMatrixTokenOverrides } = await importBuiltinMatrix();
    const base = { workspaceRoot: '/workspace/current', authContext: { accessToken: 'token' } };
    const clear = buildBuiltinMatrixTokenOverrides(base).connectionKey;
    const laneA = buildBuiltinMatrixTokenOverrides({
      ...base,
      routingContext: { bedrockLane: 'lane-a' },
    }).connectionKey;
    const laneB = buildBuiltinMatrixTokenOverrides({
      ...base,
      routingContext: { bedrockLane: 'lane-b' },
    }).connectionKey;

    expect(laneA).not.toBe(clear);
    expect(laneB).not.toBe(laneA);
    expect(laneB).not.toBe(clear);
  });

  it('does not resolve a missing Matrix stdio entrypoint', async () => {
    process.env.MAVIS_MATRIX_MCP_STDIO_ENTRYPOINT = join(
      tmpdir(),
      `missing-matrix-mcp-stdio-${process.pid}.js`,
    );
    const { resolveMatrixMcpStdioEntrypoint } = await importBuiltinMatrix();

    expect(resolveMatrixMcpStdioEntrypoint()).toBeUndefined();
    expect(resolveMatrixMcpStdioEntrypoint()).toBeUndefined();
  });

  it('resolves an override Matrix stdio entrypoint when the file exists', async () => {
    const tmp = await mkdtemp(join(tmpdir(), 'matrix-mcp-entrypoint-'));
    try {
      const entrypoint = join(tmp, 'matrix-mcp-stdio.js');
      await writeFile(entrypoint, '#!/usr/bin/env node\n', 'utf8');
      process.env.MAVIS_MATRIX_MCP_STDIO_ENTRYPOINT = entrypoint;
      const { resolveMatrixMcpStdioEntrypoint } = await importBuiltinMatrix();

      expect(resolveMatrixMcpStdioEntrypoint()).toBe(entrypoint);
      expect(resolveMatrixMcpStdioEntrypoint()).toBeTruthy();
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('resolves the standalone Matrix stdio entrypoint next to cli.js', async () => {
    delete process.env.MAVIS_MATRIX_MCP_STDIO_ENTRYPOINT;
    const tmp = await mkdtemp(join(tmpdir(), 'matrix-mcp-bundled-entrypoint-'));
    try {
      const cliEntry = join(tmp, 'cli.js');
      const entrypoint = join(tmp, 'matrix-mcp-stdio.js');
      await writeFile(cliEntry, '#!/usr/bin/env node\n', 'utf8');
      await writeFile(entrypoint, '#!/usr/bin/env node\n', 'utf8');
      const { resolveMatrixMcpStdioEntrypoint } = await importBuiltinMatrix();

      expect(resolveMatrixMcpStdioEntrypoint(pathToFileURL(cliEntry).href)).toBe(entrypoint);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });

  it('keeps resolving the packaged Electron Matrix stdio entrypoint from agent-tools', async () => {
    delete process.env.MAVIS_MATRIX_MCP_STDIO_ENTRYPOINT;
    const tmp = await mkdtemp(join(tmpdir(), 'matrix-mcp-electron-entrypoint-'));
    try {
      const runtimeEntry = join(
        tmp,
        'node_modules/@mavis/local-runtime-v2/dist/service/mcp/runtime/builtin-matrix.js',
      );
      const entrypoint = join(
        tmp,
        'node_modules/@mavis/agent-tools/dist/desktop/matrix-mcp-stdio.js',
      );
      await mkdir(dirname(entrypoint), { recursive: true });
      await writeFile(entrypoint, '#!/usr/bin/env node\n', 'utf8');
      const { resolveMatrixMcpStdioEntrypoint } = await importBuiltinMatrix();

      expect(resolveMatrixMcpStdioEntrypoint(pathToFileURL(runtimeEntry).href)).toBe(entrypoint);
    } finally {
      await rm(tmp, { recursive: true, force: true });
    }
  });
});
