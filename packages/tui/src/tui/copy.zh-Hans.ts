import type { TuiTranslations } from './copy.en.js';

/**
 * Simplified Chinese copy for the TUI surfaces that do not own a dedicated
 * catalog.
 *
 * The `satisfies` clause is the completeness check: a key present in the
 * English catalog but absent here fails `pnpm typecheck`.
 *
 * Chinese is denser than English, so a few compact labels carry the same
 * wording as their full form. The keys stay apart because the English pair
 * differs, and the placeholder sets stay identical either way.
 */
export const ZH_HANS_TUI_COPY = {
  // Agent team
  'agentTeam.activity.thinking': '思考中',
  'agentTeam.activity.responding': '回复中',
  'agentTeam.activity.starting': '启动中',
  'agentTeam.activity.waitingForInput': '等待输入',
  'agentTeam.activity.reading': '读取中',
  'agentTeam.activity.searching': '搜索中',
  'agentTeam.activity.editing': '编辑中',
  'agentTeam.activity.writing': '写入中',
  'agentTeam.activity.runningTests': '运行测试',
  'agentTeam.activity.runningCommand': '运行命令',
  'agentTeam.activity.usingTool': '使用 {tool}',
  'agentTeam.heading.title': 'Agent 团队',
  'agentTeam.header.summary': 'Agent · 共 {count} 个',
  'agentTeam.overflow': '└ … 还有 {count} 个',
  'agentTeam.marker.current': '当前',
  'agentTeam.empty': '暂无委派的 Agent',
  'agentTeam.footer.hint': '↑↓ 选择 · PgUp/PgDn 滚动 · Enter 打开对话记录 · Esc 返回',
  'agentTeam.fallback.agentName': '子 Agent',
  'agentTeam.fallback.task': '委派任务',
  'agentTeam.fallback.failed': 'Agent 执行失败',
  'agentTeam.fallback.tool': '工具',

  // Background work
  'backgroundWork.title': '任务',
  'backgroundWork.empty': '暂无后台任务',
  'backgroundWork.detail.unavailable': '后台任务不可用',
  'backgroundWork.detail.changed': 'Runtime 任务列表已变化，按 Esc 返回。',
  'backgroundWork.detail.heading': '后台任务 · {status}',
  'backgroundWork.detail.taskId': '任务 ID',
  'backgroundWork.detail.error': '错误',
  'backgroundWork.detail.command': '命令',
  'backgroundWork.detail.description': '描述',
  'backgroundWork.detail.hint': 'PgUp/PgDn 滚动 · Esc 返回 · Q 关闭',
  'backgroundWork.action.openTranscript': 'Enter 打开对话记录',
  'backgroundWork.action.inspect': 'Enter 查看详情',
  'backgroundWork.footer.hint': '↑↓ 选择 · PgUp/PgDn 滚动 · {action} · Esc 返回',
  'backgroundWork.footer.hintNoAction': '↑↓ 选择 · PgUp/PgDn 滚动 · Esc 返回',
  'backgroundWork.entry.agent': '[Agent]',
  'backgroundWork.entry.bash': '[Bash]',
  'backgroundWork.entry.workflow': '[Workflow]',
  'backgroundWork.entry.custom': '[Custom]',

  // Shared status labels
  'status.done': '已完成',
  'status.failed': '失败',
  'status.running': '运行中',
  'status.stopped': '已停止',
  'status.queued': '排队中',
  'status.waiting': '等待中',
  'status.cancelled': '已取消',
  'status.succeeded': '成功',
  'status.stopping': '停止中',
  'status.lost': '已丢失',

  // Shared counters
  'count.total': '{count} 个',
  'count.active': '{count} 个进行中',
  'count.running': '{count} 个运行中',
  'count.waiting': '{count} 个等待中',
  'count.queued': '{count} 个排队中',
  'count.done': '{count} 个已完成',
  'count.failed': '{count} 个失败',
  'count.stopped': '{count} 个已停止',
  'count.agents.one': '{count} 个 Agent',
  'count.agents.many': '{count} 个 Agent',
  'count.tools': '{count} 个工具',

  // Settings list
  'settingsList.hint.search': '输入以搜索 · Enter/Space 修改 · Esc 取消',
  'settingsList.hint.change': 'Enter/Space 修改 · Esc 取消',

  // Side session
  'sideSession.reject.noSession': '请先打开一个 Session，再开始旁支对话。',
  'sideSession.reject.nested': '已有一个旁支对话，请按 Ctrl+C 返回后再开启新的。',
  'sideSession.reject.noBoundary': '当前 Session 尚未就绪，请稍后重试。',
  'sideSession.label.forSide': '{shortcut} 切换到旁支',
  'sideSession.label.fromMain': '主 Session 的旁支对话',
  'sideSession.label.toMain': '{shortcut} 切换到主对话',
  'sideSession.label.toClose': '{shortcut} 关闭',
  'sideSession.parent.needsInput': '主对话需要输入',
  'sideSession.parent.needsApproval': '主对话需要审批',
  'sideSession.parent.failed': '主对话失败',
  'sideSession.parent.interrupted': '主对话已中断',
  'sideSession.parent.finished': '主对话已完成',

  // Application action failures
  'app.session.openFailed': '无法打开该对话。',
  'app.session.continueFailed': '无法继续最近的对话。',
  'app.session.retryAfterReconnect': '连接恢复后请重试。',
  'app.agents.refreshFailed': '无法刷新委派的 Agent。',
  'app.agents.updateAfterReconnect': '连接恢复后状态会自动更新。',
  'app.messageRestored': '已停止 · 消息已恢复到输入框。',

  // History and hook projections
  'projection.hook.title': 'Hook',
  'projection.hook.titleWithEvent': 'Hook · {event}',
} as const satisfies TuiTranslations;
