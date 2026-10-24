import type { WebsiteDeployCopyKey } from './copy.en.js';

/**
 * Simplified Chinese copy for the website deploy tool's user-facing failures.
 *
 * The `satisfies` clause is the completeness check: a key present in the English
 * catalog but absent here fails `pnpm typecheck`.
 *
 * Product names and identifiers stay in English: `website_deploy`, `index.html`,
 * `node_id`, `vite build`, `next export` are literal values the user types or
 * files the tool looks for, so translating them would make the message
 * misleading. `{path}` carries a filesystem path and is never translated.
 */
export const ZH_HANS_WEBSITE_DEPLOY_COPY = {
  'path.outsideWorkspace':
    '无法部署：{path} 不在工作区内，或路径无效。请传入位于当前工作目录下的路径。',
  'path.missing':
    '无法部署：{path} 不存在。website_deploy 需要已构建的静态站点（打包器输出的 dist/ 目录）。' +
    '请先执行构建，再传入输出目录路径。',
  'path.unreadable': '无法部署：读取 {path} 失败。请检查路径与权限后重试。',
  'path.notDirectory':
    '无法部署：{path} 不是目录。请传入已构建站点的目录路径（包含 index.html），而不是单个文件。',
  'entry.missing':
    '无法部署：{path} 根目录下没有 index.html。website_deploy 需要已构建的静态站点' +
    '（打包器输出的 dist/ 目录，例如 `vite build` / `next export`），' +
    '而不是源码或未构建的项目。缺少它站点将无法加载。',
  'entry.unreadable': '无法部署：读取 {path}/index.html 失败。请确认文件存在且可读后重试。',
  'entry.notRegularFile':
    '无法部署：{path}/index.html 不是常规文件（是目录或符号链接）。' +
    '部署打包会跳过符号链接，因此发布后的站点将缺少根 index.html — ' +
    '请确认构建产出了真实的 index.html 文件。',
  'archive.tooLarge': '站点压缩包过大，无法发布。',
  'sourceArchive.tooLarge': '站点源码压缩包过大。',
  'content.rejected': '站点内容未通过审核，因此未发布。',
  'nodeId.invalid': '无法部署：node_id 必须是非空的精确字符串。',
  'aborted.beforeStart': '部署在开始前已被取消。',
  'sourcePath.required': '无法部署：必须提供 source_path。',
  'sourcePath.empty': '无法部署：source_path 不能为空。',
  'sourcePath.outsideWorkspace':
    '无法部署：{path} 不在工作区内，或路径无效。请传入位于当前工作目录下的源码路径。',
  'sourcePath.missing': '无法部署：{path} 不存在。',
  'sourcePath.unreadable': '无法部署：读取 {path} 失败。',
  'sourcePath.notDirectory': '无法部署：{path} 不是真实目录。',
  'sourcePath.unsafe': '无法部署：无法安全解析源码目录。',
  'sourcePath.nested': '无法部署：source_path 不能嵌套在已构建站点的目录内。',
} satisfies Record<WebsiteDeployCopyKey, string>;
