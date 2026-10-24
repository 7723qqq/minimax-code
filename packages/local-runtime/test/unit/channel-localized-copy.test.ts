import { afterEach, describe, expect, it } from 'bun:test';

import { channelRouteBrokenReceiptText } from '../../src/channels/channel-im-receipts.js';
import { formatQueuedNoticeText } from '../../src/channels/channel-queue-drain.js';
import { formatToolSummary } from '../../src/channels/message-format.js';
import { buildPermissionCard, buildPermissionResolvedCard } from '../../src/channels/adapters/feishu/feishu-permission-card.js';
import { buildQuestionnaireSubmittedCard } from '../../src/channels/adapters/feishu/feishu-card.js';
import { buildReplyCard, buildThinkingCard } from '../../src/channels/adapters/feishu/feishu-reply-card.js';
import { telegramText } from '../../src/channels/adapters/telegram/telegram-copy.js';
import {
  formatTelegramQuestionnairePrompt,
  formatTelegramStepPrompt,
} from '../../src/channels/adapters/telegram/telegram-questionnaire.js';
import { feishuText } from '../../src/channels/adapters/feishu/feishu-copy.js';
import { wechatText } from '../../src/channels/adapters/wechat/wechat-copy.js';
import { buildArchivedRootSessionTitle } from '../../src/sessions/archived-session-title.js';
import { formatPermissionText } from '../../src/channels/adapters/wechat/wechat-permission.js';
import { formatQuestionnaireText } from '../../src/channels/adapters/wechat/wechat-questionnaire.js';
import { placeholderMediaTags } from '@mavis/shared';
import { acceptedFindingSummaryText, reviewText } from '../../src/review/review-copy.js';
import { createCatalogSet, translate } from '@mavis/shared/i18n';

const originalLocale = process.env.MCODE_LOCALE;

afterEach(() => {
  if (originalLocale === undefined) delete process.env.MCODE_LOCALE;
  else process.env.MCODE_LOCALE = originalLocale;
});

function withLocale(locale: string): void {
  process.env.MCODE_LOCALE = locale;
}

describe('channel receipt localization', () => {
  it('follows the runtime locale for the locale-driven codes', () => {
    withLocale('en-US');
    expect(channelRouteBrokenReceiptText('feishu', 'CHANNEL_IM_AGENT_UNAVAILABLE')).toMatch(
      /The Agent bound to this chat/,
    );
    withLocale('zh-CN');
    expect(channelRouteBrokenReceiptText('feishu', 'CHANNEL_IM_AGENT_UNAVAILABLE')).toMatch(
      /你绑定的 Agent/,
    );
  });

  it('keeps the historical transport convention for binding codes', () => {
    // This rule predates the catalog and must not follow the runtime locale:
    // Telegram is English, every other transport Chinese.
    withLocale('en-US');
    expect(channelRouteBrokenReceiptText('feishu', 'CHANNEL_BINDING_STALE')).toMatch(/你绑定的 Agent/);
    withLocale('zh-CN');
    expect(channelRouteBrokenReceiptText('telegram', 'CHANNEL_BINDING_STALE')).toMatch(
      /The Agent bound to this chat/,
    );
  });

  it('interpolates the queue count in both languages', () => {
    expect(formatQueuedNoticeText(3, 'en-US')).toBe('⏳ Queued — 3 ahead. Please wait…');
    expect(formatQueuedNoticeText(1, 'zh-CN')).toBe(
      '⏳ 已加入队列，前方还有 1 条消息，请稍候...',
    );
  });
});

describe('Feishu card localization', () => {
  const permission = {
    toolName: 'bash',
    toolDescription: 'Run a shell command',
    reason: 'needs approval',
    ruleContents: [],
  } as never;

  it('renders the permission ask in both languages', () => {
    withLocale('en-US');
    const en = JSON.stringify(buildPermissionCard(permission));
    expect(en).toContain('Tool authorization request');
    expect(en).toContain('Allow once');
    expect(en).toContain('Always allow');
    expect(en).toContain('Deny');

    withLocale('zh-CN');
    const zh = JSON.stringify(buildPermissionCard(permission));
    expect(zh).toContain('工具授权请求');
    expect(zh).toContain('仅本次允许');
    expect(zh).toContain('始终允许');
    expect(zh).toContain('拒绝');
  });

  it('renders the resolved permission tag in both languages', () => {
    withLocale('en-US');
    expect(JSON.stringify(buildPermissionResolvedCard(permission, 'allow'))).toContain('Authorized');
    withLocale('zh-CN');
    expect(JSON.stringify(buildPermissionResolvedCard(permission, 'allow'))).toContain('已授权');
  });

  it('renders questionnaire and reply cards in both languages', () => {
    withLocale('en-US');
    expect(JSON.stringify(buildQuestionnaireSubmittedCard({ id: 'q', title: 'Pick' } as never, 's'))).toContain(
      'Submitted',
    );
    expect(JSON.stringify(buildThinkingCard())).toContain('Thinking');
    expect(JSON.stringify(buildReplyCard('ok'))).toContain('Reply');

    withLocale('zh-CN');
    expect(JSON.stringify(buildQuestionnaireSubmittedCard({ id: 'q', title: 'Pick' } as never, 's'))).toContain(
      '已提交',
    );
    expect(JSON.stringify(buildThinkingCard())).toContain('思考中');
    expect(JSON.stringify(buildReplyCard('ok'))).toContain('回复');
  });
});

describe('WeChat copy keeps its documented zh-Hans default', () => {
  it('renders Chinese regardless of the runtime locale', () => {
    withLocale('en-US');
    const questionnaire = formatQuestionnaireText({
      title: 'Title',
      steps: [{ id: 's', question: 'Q', options: [] }],
    } as never);
    expect(questionnaire).toContain('【请补充信息】');
    expect(questionnaire).toContain('（请直接输入文字作答）');

    const permission = formatPermissionText({
      toolName: 'bash',
      reason: 'r',
      ruleContents: [],
    } as never);
    expect(permission).toContain('【权限请求】');
    expect(permission).toContain('回复 /allow');
  });
});

describe('Telegram copy', () => {
  it('renders both languages through the catalog', () => {
    expect(telegramText('questionnaire.expired', undefined, 'en-US')).toBe(
      'This questionnaire has expired',
    );
    expect(telegramText('questionnaire.expired', undefined, 'zh-CN')).toBe('这个问卷已过期');
    expect(telegramText('questionnaire.selected', { label: 'A' }, 'en-US')).toBe('✓ Selected A');
  });
});

describe('media placeholders follow the locale', () => {
  it('renders both languages', () => {
    expect(placeholderMediaTags('<media caption="Diagram" />', 'en-US')).toBe('[Media: Diagram]');
    expect(placeholderMediaTags('<media caption="图表" />', 'zh-CN')).toBe('[媒体: 图表]');
    expect(placeholderMediaTags('<media />', 'en-US')).toBe('[Media]');
    expect(placeholderMediaTags('<deliver-assets><media /><media /></deliver-assets>', 'en-US')).toBe(
      '[2 delivered assets]',
    );
  });
});

describe('code review copy', () => {
  it('renders conclusions in both languages', () => {
    expect(reviewText('en', 'conclusion.none')).toBe('No reportable issues were found.');
    expect(reviewText('zh-CN', 'conclusion.none')).toBe('未发现需要报告的问题。');
  });

  it('uses the singular form for one finding in both languages', () => {
    expect(acceptedFindingSummaryText('en', 1)).toBe('Found 1 issue that requires attention.');
    expect(acceptedFindingSummaryText('en', 2)).toBe('Found 2 issues that require attention.');
    expect(acceptedFindingSummaryText('zh-CN', 1)).toBe('发现 1 个需要处理的问题。');
    expect(acceptedFindingSummaryText('zh-CN', 3)).toBe('发现 3 个需要处理的问题。');
  });
});

describe('catalog fallback safety', () => {
  it('never returns undefined for an unknown catalog name', () => {
    const set = createCatalogSet({ k: 'K' } as const, { 'zh-Hans': { k: 'K-zh' } });
    expect(translate(set, 'de', 'k')).toBe('K');
  });
});

describe('Telegram questionnaire rendering', () => {
  const renderable = {
    title: 'Setup',
    steps: [
      { id: 's1', question: 'Pick a colour', selectionMode: 'multiple', options: [] },
      { id: 's2', question: 'Pick a size', options: [] },
    ],
  } as never;

  it('renders the per-step prompt in both languages', () => {
    withLocale('en-US');
    const en = formatTelegramStepPrompt(renderable, 0);
    expect(en).toContain('Questionnaire: Setup');
    expect(en).toContain('Question 1/2');
    expect(en).toContain('one single choice per question');

    withLocale('zh-CN');
    const zh = formatTelegramStepPrompt(renderable, 0);
    expect(zh).toContain('问卷：Setup');
    expect(zh).toContain('问题 1/2');
    expect(zh).toContain('按单选逐题处理');
  });

  it('renders the fallback prompt from the same catalog', () => {
    // Both prompt shapes used to hard-code opposite languages in one file.
    withLocale('en-US');
    const en = formatTelegramQuestionnairePrompt(renderable);
    expect(en).toContain('Q1: Pick a colour');
    expect(en).toContain('Choose one or more options below.');

    withLocale('zh-CN');
    expect(formatTelegramQuestionnairePrompt(renderable)).toContain('问题 1：Pick a colour');
  });
});

describe('attachment and resource failures', () => {
  it('localizes the Telegram media send failure placeholder', () => {
    expect(telegramText('attachment.sendFailed', { name: 'a.png' }, 'en-US')).toBe(
      '[Media send failed: a.png]',
    );
    expect(telegramText('attachment.sendFailed', { name: 'a.png' }, 'zh-CN')).toBe(
      '[媒体发送失败: a.png]',
    );
  });

  it('keeps the WeChat media failure in its documented default language', () => {
    withLocale('en-US');
    expect(wechatText('attachment.sendFailed', { name: 'a.png', message: 'boom' })).toBe(
      '[媒体发送失败: a.png — boom]',
    );
    expect(wechatText('attachment.sendFailed', { name: 'a.png', message: 'boom' }, 'en-US')).toBe(
      '[Media send failed: a.png — boom]',
    );
  });

  it('localizes the Feishu resource and submit failures', () => {
    expect(feishuText('resource.receiveFailed', undefined, 'en-US')).toMatch(/could not be received/);
    expect(feishuText('resource.receiveFailed', undefined, 'zh-CN')).toMatch(/没能接收成功/);
    expect(feishuText('toast.submitFailed', undefined, 'en-US')).toBe(
      'Submission failed. Please try again later.',
    );
    expect(feishuText('toast.submitFailed', undefined, 'zh-CN')).toBe('提交失败，请稍后再试');
  });
});

describe('archive title prefix', () => {
  it('composes the same shared-catalog prefix local-runtime-v2 uses', () => {
    expect(buildArchivedRootSessionTitle({ fallbackName: 'Main', locale: 'en-US' })).toBe(
      'Memory archive: Main',
    );
    expect(buildArchivedRootSessionTitle({ fallbackName: 'Main', locale: 'zh-CN' })).toBe(
      '记忆归档：Main',
    );
    expect(
      buildArchivedRootSessionTitle({ oldTitle: 'Bug hunt', fallbackName: 'Main', locale: 'zh-CN' }),
    ).toBe('记忆归档：Bug hunt');
  });
});

describe('tool-call summary header', () => {
  it('follows the locale instead of a hard-coded Chinese header', () => {
    expect(formatToolSummary(new Map(), 'en-US')).toBe('🔧 Tool calls');
    expect(formatToolSummary(new Map(), 'zh-CN')).toBe('🔧 工具调用');
  });
});
