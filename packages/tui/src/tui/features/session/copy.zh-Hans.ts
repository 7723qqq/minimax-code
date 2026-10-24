import type { SessionCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the session browser.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 */
export const ZH_HANS_SESSION_COPY = {
  'session.error.currentUnavailable': '当前会话在此不可用。可直接使用 /rename <title> 重命名。',
  'session.scope.workspace': '当前工作区',
  'session.scope.all': '全部会话',
  'session.status.searching': '正在搜索已保存的会话…',
  'session.status.loadingMore': '正在加载更多会话…',
  'session.filter.hint': '可按标题、ID、工作区、模型、状态或分支过滤',
  'session.status.noMatches': '没有匹配的会话。',
  'session.empty.noSessionsInWorkspace': '此工作区没有{view}会话。',
  'session.viewWord.recent': '最近',
  'session.viewWord.archived': '已归档',
  'session.title.untitled': '未命名会话',
  'session.workspace.unknown': '未知工作区',
  'session.hint.rename': 'Ctrl+U 清除 · Enter 保存 · Esc 取消',
  'session.hint.enterEsc': 'Enter · Esc',
  'session.footer.scope.all': '全部',
  'session.footer.scope.current': '当前',
  'session.footer.action.new': '新建',
  'session.footer.action.rename': '重命名',
  'session.footer.action.archive': '归档',
  'session.footer.action.restore': '恢复',
  'session.footer.action.switch': '切换',
  'session.footer.view.archived': '已归档',
  'session.footer.view.recent': '最近',
  'session.footer.move': '↑↓ 移动',
  'session.footer.moreAvailable': '还有更多会话 · Ctrl+L 更多',
  'session.footer.close': 'Esc 关闭',
  'session.rename.title': '会话 / 重命名会话',
  'session.archive.title': '归档会话？',
  'session.archive.unknownSession': '未知会话',
  'session.archive.historyNote': '历史记录仍可在已归档中找到。',
  'session.archive.hint': 'Enter 归档 · Esc 取消',
  'session.status.loadingAll': '正在加载全部会话…',
  'session.status.loadingWorkspace': '正在加载当前工作区…',
  'session.error.scopeChanged': '无法更改会话范围。',
  'session.action.retry': '重试。',
  'session.error.scopePreserved': '当前会话列表未发生变化。',
  'session.status.allLoadedWorkspace': '已加载全部会话 · 当前工作区没有新会话。',
  'session.status.loadedNoneInWorkspace.one':
    '{count} 个会话已加载，当前工作区没有新会话 · Ctrl+A 显示全部。',
  'session.status.loadedNoneInWorkspace.many':
    '{count} 个会话已加载，当前工作区没有新会话 · Ctrl+A 显示全部。',
  'session.status.loadedMore.one': '已加载 {count} 个更多会话{scope}。',
  'session.status.loadedMore.many': '已加载 {count} 个更多会话{scope}。',
  'session.scopeSuffix.workspace': '（当前工作区）',
  'session.status.allMatchesLoaded': '已加载全部匹配的会话。',
  'session.error.emptyTitle': '会话标题不能为空。',
  'session.status.titleUnchanged': '会话标题未发生变化。',
  'session.status.renamed': '已重命名为 {title}。',
  'session.status.working': '处理中…',
  'session.status.restored': '会话已恢复。',
  'session.status.archived': '会话已归档。',
  'session.error.notSaved': '会话更改未保存。',
  'session.error.unchanged': '现有会话未发生变化。',
} as const satisfies Readonly<Record<SessionCopyKey, string>>;
