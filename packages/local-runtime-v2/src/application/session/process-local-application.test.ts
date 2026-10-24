import { waitFor } from '../../../../../test/bun-test-setup.js';
import { describe, expect, it, mock } from 'bun:test';

import type { LocalRuntimeApplication } from "./process-local-application-contract.js";
import { createProcessLocalApplication } from "./process-local-application.js";

describe("createProcessLocalApplication account and usage", () => {
  it("uses the recovered model route for account login checks while preserving live token presence", async () => {
    const application = createProcessLocalApplication({
      eventBus: { subscribe: mock(() => () => undefined) },
      skills: {} as never,
      plugins: {} as never,
      workspace: {} as never,
      plan: {} as never,
      peripherals: {
        account: {
          getStatus: async () => ({
            selection: {
              providerId: "custom_provider:minimax-legacy-2",
              modelId: "retired",
            },
            provider: {
              id: "custom_provider:minimax-legacy-2",
              authMode: "api-key",
            },
            auth: { tokenPresent: false },
          }),
        },
      } as never,
      modelProvider: {
        application: {
          list: async () => [
            {
              providerId: "minimax",
              modelId: "MiniMax-M3",
              providerKind: "minimax-managed",
              selected: true,
            },
          ],
        } as never,
        providers: { getMinimaxModelSource: () => "token_plan" } as never,
        listProviderPresets: mock(async () => []),
        oauth: { getStatus: mock(), startLogin: mock() } as never,
      },
    });
    await expect(
      application.account?.getStatus({ sessionId: "old-session" }),
    ).resolves.toMatchObject({
      selection: { providerId: "minimax", modelId: "MiniMax-M3" },
      provider: { id: "minimax", authMode: "managed-login" },
      modelSource: "token-plan",
      auth: { tokenPresent: false },
    });
  });
  it("projects committed usage notifications through the process-local boundary", async () => {
    let notify: ((sessionId: string) => void) | undefined;
    const unsubscribe = mock();
    const abortController = new AbortController();
    const application = createProcessLocalApplication({
      eventBus: { subscribe: mock(() => () => undefined) },
      usageCommits: {
        subscribe: (listener) => {
          notify = listener;
          return unsubscribe;
        },
      },
      skills: {} as never,
      plugins: {} as never,
      workspace: {} as never,
      plan: {} as never,
      peripherals: { account: { getStatus: mock() } } as never,
      modelProvider: {
        application: {} as never,
        providers: { getMinimaxModelSource: mock() } as never,
      } as never,
    });

    const iterator = application.usage?.watchCommits(abortController.signal);
    const next = iterator?.next();
    await waitFor(() => expect(notify).toBeTypeOf("function"));
    notify?.("session-1");

    await expect(next).resolves.toEqual({ done: false, value: "session-1" });
    abortController.abort();
    await iterator?.return(undefined);
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it("reports the builtin MiniMax API-key route as BYOK account access", async () => {
    const getStatus = mock(async () => ({
      selection: { providerId: "minimax", modelId: "MiniMax-M3" },
      provider: { id: "minimax", authMode: "managed-login" },
      auth: { tokenPresent: false },
    }));
    const getMinimaxModelSource = mock(() => "minimax_api_key" as const);
    const application = createProcessLocalApplication({
      eventBus: { subscribe: mock(() => () => undefined) },
      skills: {} as never,
      plugins: {} as never,
      workspace: {} as never,
      plan: {} as never,
      peripherals: { account: { getStatus } } as never,
      modelProvider: {
        application: {} as never,
        providers: { getMinimaxModelSource } as never,
        listProviderPresets: mock(async () => []),
        oauth: { getStatus: mock(), startLogin: mock() } as never,
      },
    });

    await expect(
      application.account?.getStatus({ sessionId: "session-1" }),
    ).resolves.toMatchObject({
      selection: { providerId: "minimax", modelId: "MiniMax-M3" },
      provider: { id: "minimax", authMode: "managed-login" },
      auth: { tokenPresent: false },
      modelSource: "byok",
    });
    expect(getStatus).toHaveBeenCalledWith({ sessionId: "session-1" });
  });
});

describe("createProcessLocalApplication capabilities", () => {
  it("projects the V2 model owner with the other process-local capabilities", async () => {
    const skills = { listSkills: mock(), listRuntimeSkills: mock() };
    const workspace = { git: { getMetadata: mock() } };
    const plugins = {
      refresh: mock(),
      listMarketplacePlugins: mock(),
      listInstalledPlugins: mock(),
      installPlugin: mock(),
      uninstallPlugin: mock(),
      enablePlugin: mock(),
      disablePlugin: mock(),
    };
    const peripherals = {
      mcp: { listLocalMcpServers: mock(), listMcpCapabilities: mock() },
      goals: {
        isEnabled: mock(),
        get: mock(),
        create: mock(),
        patch: mock(),
        clear: mock(),
      },
      questionnaires: { getPending: mock(), reply: mock(), dismiss: mock() },
      permissions: { listPending: mock(), reply: mock() },
      account: { getStatus: mock() },
      diagnostics: { getRuntimeSnapshot: mock() },
      configuration: { getPermissionMode: mock(), setPermissionMode: mock() },
    };
    const modelApplication = {
      list: mock(async () => []),
      select: mock(async () => true),
    };
    const modelProviders = {
      listUserProviders: mock(() => []),
      getMinimaxApiKeyStatus: mock(() => ({ hasApiKey: false })),
      getMinimaxModelSource: mock(() => "token_plan" as const),
      setMinimaxModelSource: mock(async () => "minimax_api_key" as const),
      upsertMinimaxApiKey: mock(),
      createUserProvider: mock(),
      discoverUserModelsCandidate: mock(async () => [{ modelId: "latest" }]),
      saveUserModelProviderCandidate: mock(async () => ({
        ok: true,
        provider: { providerId: "custom_provider:openai" },
      })),
      updateUserProvider: mock(),
      deleteUserProvider: mock(),
      testProvider: mock(async () => ({
        ok: true,
        status: { state: "available" },
      })),
      testModel: mock(async () => ({
        ok: true,
        status: { state: "available" },
      })),
    };
    const listProviderPresets = mock(async () => [
      {
        providerId: "openai",
        name: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        apiFormat: "openai-responses" as const,
        models: [{ modelId: "gpt-5.6", toolCall: true }],
      },
    ]);
    const oauth = {
      cancelLogin: mock(() => ({
        state: "disconnected" as const,
        providerId: "openai-codex" as const,
      })),
      getStatus: mock(() => ({
        state: "disconnected" as const,
        providerId: "openai-codex" as const,
      })),
      startLogin: mock(async () => ({
        state: "pending" as const,
        providerId: "openai-codex" as const,
        authUrl: "https://auth.example",
      })),
    };

    const application = createProcessLocalApplication({
      eventBus: { subscribe: mock(() => () => undefined) },
      skills: skills as LocalRuntimeApplication["skills"],
      plugins,
      workspace,
      plan: { isEntryEnabled: mock(() => true) },
      peripherals: peripherals as never,
      modelProvider: {
        application: modelApplication as never,
        providers: modelProviders as never,
        listProviderPresets,
        oauth,
      },
    });

    expect(application).not.toHaveProperty("sessions");
    expect(application.skills).toBeDefined();
    await application.skills.listRuntimeSkills({ workspaceDir: "/repo" });
    expect(skills.listRuntimeSkills).toHaveBeenCalledWith({
      workspaceDir: "/repo",
    });
    expect(application.plugins).toBe(plugins);
    expect(application.workspace).toBe(workspace);
    expect(application.goals).toBe(peripherals.goals);
    expect(application.questionnaires).toBe(peripherals.questionnaires);
    expect(application.plan?.isEntryEnabled()).toBe(true);
    expect(application.permissions).toBe(peripherals.permissions);
    await expect(application.models?.list()).resolves.toEqual([]);
    expect(modelApplication.list).toHaveBeenCalledOnce();
    await expect(
      application.modelProviders?.getMiniMaxModelSource(),
    ).resolves.toBe("token_plan");
    expect(modelProviders.getMinimaxModelSource).toHaveBeenCalledOnce();
    await expect(
      application.modelProviders?.listProviderPresets(),
    ).resolves.toEqual([
      expect.objectContaining({
        providerId: "openai",
        apiFormat: "openai-responses",
      }),
    ]);
    await expect(
      application.modelProviders?.getCodexOAuthStatus(),
    ).resolves.toEqual({
      state: "disconnected",
      providerId: "openai-codex",
    });
    await expect(
      application.modelProviders?.startCodexOAuthLogin({
        method: "device_code",
      }),
    ).resolves.toEqual({
      state: "pending",
      providerId: "openai-codex",
      authUrl: "https://auth.example",
    });
    expect(listProviderPresets).toHaveBeenCalledOnce();
    expect(oauth.getStatus).toHaveBeenCalledOnce();
    expect(oauth.startLogin).toHaveBeenCalledWith({ method: "device_code" });
    await application.modelProviders?.cancelCodexOAuthLogin("attempt-1");
    expect(oauth.cancelLogin).toHaveBeenCalledWith("attempt-1");
    await expect(
      application.modelProviders?.saveCandidate({
        candidate: {
          name: "OpenAI",
          baseUrl: "https://api.openai.com/v1",
          apiKey: "sk-test",
          apiFormat: "openai-responses",
          models: [{ modelId: "gpt-5.6", reasoning: true }],
        },
        modelId: "gpt-5.6",
        saveAndUse: true,
      }),
    ).resolves.toMatchObject({ success: true });
    expect(modelProviders.saveUserModelProviderCandidate).toHaveBeenCalledWith({
      candidate: {
        name: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "sk-test",
        apiFormat: "openai-responses",
        models: [{ modelId: "gpt-5.6", reasoning: true }],
      },
      modelId: "gpt-5.6",
      saveAndUse: true,
    });
    const savedCandidate = {
      providerId: "custom_provider:work",
      expectedRevision: "rev-1",
      baseUrl: "https://models.example/v1",
    };
    await expect(
      application.modelProviders?.discoverCandidate(savedCandidate),
    ).resolves.toEqual([{ modelId: "latest" }]);
    expect(modelProviders.discoverUserModelsCandidate).toHaveBeenCalledWith(
      savedCandidate,
    );
    await application.modelProviders?.saveCandidate({
      candidate: {
        ...savedCandidate,
        models: [{ modelId: "latest", configurationSource: "discovered" }],
      },
      skipConnectionTest: true,
      saveAndUse: false,
    });
    expect(
      modelProviders.saveUserModelProviderCandidate,
    ).toHaveBeenLastCalledWith({
      candidate: {
        ...savedCandidate,
        models: [{ modelId: "latest", configurationSource: "discovered" }],
      },
      skipConnectionTest: true,
      saveAndUse: false,
    });
    expect(application.events.watch).toEqual(expect.any(Function));
  });
});
