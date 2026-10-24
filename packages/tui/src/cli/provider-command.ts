import { McodeProviderApplication } from '../provider/application.js';
import type { McodeProviderApiFormat, McodeProviderSnapshot } from '../provider/contract.js';
import { prepareTuiDataDir } from '../runtime/data-dir.js';
import { createTuiRuntime, shutdownTuiRuntime } from '../runtime/lifecycle.js';
import { formatTuiActionFailure } from '../user-facing-failure.js';
import { cliText } from './copy.js';

export type McodeProviderCliRequest =
  | { readonly action: 'list'; readonly json?: boolean }
  | {
      readonly action: 'add';
      readonly name: string;
      readonly baseUrl: string;
      readonly apiFormat: McodeProviderApiFormat;
      readonly models: readonly string[];
      readonly contextLimit?: number;
      readonly outputLimit?: number;
      readonly supportImage?: boolean;
      readonly apiKeyEnv?: string;
      readonly saveAndUse?: boolean;
    }
  | { readonly action: 'remove'; readonly providerId: string; readonly confirmed: boolean }
  | {
      readonly action: 'test';
      readonly providerId: string;
      readonly modelId?: string;
      readonly json?: boolean;
    }
  | { readonly action: 'set-minimax-key'; readonly apiKeyEnv?: string }
  | { readonly action: 'use'; readonly source: 'token_plan' | 'minimax_api_key' };

interface McodeProviderCommandContext {
  readonly application: McodeProviderApplication;
  shutdown(): Promise<void>;
}

export interface RunMcodeProviderCommandOptions {
  readonly version: string;
  readonly request: McodeProviderCliRequest;
  readonly environment?: Readonly<Record<string, string | undefined>>;
  readonly workspaceDir?: string;
  readonly lane?: string;
  readonly createContext?: (lane?: string) => Promise<McodeProviderCommandContext>;
}

export async function runMcodeProviderCommand(
  options: RunMcodeProviderCommandOptions,
): Promise<string> {
  const context = options.createContext
    ? await options.createContext(options.lane)
    : await createProviderCommandContext(options.version, options.workspaceDir, options.lane);
  try {
    const { request } = options;
    if (request.action === 'list') {
      return formatSnapshot(await context.application.snapshot(), Boolean(request.json));
    }
    if (request.action === 'add') {
      const envName = request.apiKeyEnv?.trim() || 'MCODE_PROVIDER_API_KEY';
      const apiKey = (options.environment ?? process.env)[envName]?.trim();
      if (!apiKey) {
        throw new Error(
          cliText('cli.provider.apiKeyMissing', { envName }),
        );
      }
      const input = {
        name: request.name,
        baseUrl: request.baseUrl,
        apiKey,
        apiFormat: request.apiFormat,
        models: request.models.map((modelId) => ({
          modelId,
          ...(request.supportImage ? { capabilities: { support_image: true } } : {}),
          ...(request.contextLimit !== undefined || request.outputLimit !== undefined
            ? {
                limit: {
                  ...(request.contextLimit !== undefined ? { context: request.contextLimit } : {}),
                  ...(request.outputLimit !== undefined ? { output: request.outputLimit } : {}),
                },
              }
            : {}),
        })),
      };
      if (request.saveAndUse) {
        const modelId = request.models[0];
        if (!modelId) throw new Error(cliText('cli.provider.modelRequired'));
        const result = await context.application.saveCandidate({
          ...input,
          modelId,
          saveAndUse: true,
        });
        if (!result.success) {
          throw new Error(
            formatTuiActionFailure(
              result.status?.lastErrorMessage ??
                result.status?.state ??
                cliText('cli.provider.connectionUnavailable'),
              {
                summary: cliText('cli.provider.connectionTestFailed'),
                nextStep: cliText('cli.provider.connectionTestNextStep'),
              },
            ),
          );
        }
        return cliText('cli.provider.addedAndSelected', { name: request.name });
      }
      await context.application.create(input);
      return cliText('cli.provider.added', { name: request.name });
    }
    if (request.action === 'remove') {
      if (!request.confirmed) {
        throw new Error(cliText('cli.provider.removeNeedsYes'));
      }
      await context.application.remove(request.providerId);
      return cliText('cli.provider.removed', { id: request.providerId });
    }
    if (request.action === 'test') {
      if (request.providerId === 'minimax_oauth') {
        const message = cliText('cli.provider.oauthManagedByLogin');
        if (request.json) {
          return JSON.stringify(
            {
              success: false,
              status: { state: 'unsupported', lastErrorMessage: message },
            },
            null,
            2,
          );
        }
        return formatTuiActionFailure(message, {
          summary: cliText('cli.provider.oauthTestSkipped'),
          nextStep: cliText('cli.provider.oauthTestNextStep'),
        });
      }
      const result = await context.application.test(request.providerId, request.modelId);
      if (request.json) return JSON.stringify(result, null, 2);
      return result.success
        ? cliText('cli.provider.available', {
            provider: `${request.providerId}${request.modelId ? `/${request.modelId}` : ''}`,
          })
        : formatTuiActionFailure(result.status.lastErrorMessage ?? result.status.state, {
            summary: cliText('cli.provider.testFailed'),
            nextStep: cliText('cli.provider.testNextStep'),
          });
    }
    if (request.action === 'set-minimax-key') {
      const envName = request.apiKeyEnv?.trim() || 'MCODE_PROVIDER_API_KEY';
      const apiKey = (options.environment ?? process.env)[envName]?.trim();
      if (!apiKey) {
        throw new Error(cliText('cli.provider.minimaxApiKeyMissing', { envName }));
      }
      await context.application.setMiniMaxApiKey(apiKey);
      return cliText('cli.provider.apiKeySaved');
    }
    await context.application.setMiniMaxSource(request.source);
    return request.source === 'token_plan'
      ? cliText('cli.provider.usingTokenPlan')
      : cliText('cli.provider.usingApiKey');
  } finally {
    await context.shutdown();
  }
}

async function createProviderCommandContext(
  version: string,
  workspaceDir = process.cwd(),
  lane?: string,
): Promise<McodeProviderCommandContext> {
  const runtime = await createTuiRuntime({
    dataDir: await prepareTuiDataDir(),
    workspaceDir,
    version,
    surface: 'headless',
    ...(lane ? { lane } : {}),
  });
  return {
    application: new McodeProviderApplication(runtime.adapter),
    shutdown: async () => {
      await shutdownTuiRuntime(runtime);
    },
  };
}

function formatSnapshot(snapshot: McodeProviderSnapshot, json: boolean): string {
  if (json) return JSON.stringify(snapshot, null, 2);
  const lines = snapshot.providers.map((provider) => {
    const state = provider.active ? 'active' : provider.enabled ? 'enabled' : 'disabled';
    const credential =
      provider.kind === 'minimax-oauth'
        ? 'managed login'
        : provider.hasApiKey
          ? (provider.maskedApiKey ?? 'key saved')
          : 'no key';
    return `${provider.active ? '*' : ' '} ${provider.providerId}\t${state}\t${credential}`;
  });
  return lines.join('\n');
}
