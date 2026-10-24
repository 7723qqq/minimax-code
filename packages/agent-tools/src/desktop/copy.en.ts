/**
 * English copy for the website deploy tool's user-facing failures.
 *
 * These messages describe something the user can act on — a path that does not
 * exist, a directory that is not a built site, an archive the backend rejected —
 * so they follow the interface language. The tool descriptions and parameter
 * docs in `builtin-defs.ts` are deliberately not here: those are model
 * instructions, and translating them would change what the model is told.
 *
 * Messages that address the model itself ("report this to the user", "retry the
 * same call") are also not here. They are routing instructions for the assistant,
 * not product copy the user reads.
 *
 * The English object defines the key shape; the zh-Hans catalog is typed against
 * it, so a missing translation is a compile error rather than English text
 * appearing in a localized interface.
 */
export const EN_WEBSITE_DEPLOY_COPY = {
  'path.outsideWorkspace':
    "Cannot deploy: '{path}' is outside the workspace or invalid. " +
    'Pass a path that lives under the current working directory.',
  'path.missing':
    "Cannot deploy: '{path}' does not exist. website_deploy needs a built " +
    'static site (a bundler dist/ output). Run the build step first, then pass the ' +
    'output directory path.',
  'path.unreadable':
    "Cannot deploy: unable to read '{path}'. Check the path and permissions, then retry.",
  'path.notDirectory':
    "Cannot deploy: '{path}' is not a directory. Pass the path to the built site " +
    'directory (containing index.html), not a single file.',
  'entry.missing':
    "Cannot deploy: '{path}' has no index.html at the root. website_deploy needs a " +
    'built static site (a bundler dist/ output, e.g. from `vite build` / `next export`), ' +
    'not source code or an unbuilt project. The site will not load without it.',
  'entry.unreadable':
    "Cannot deploy: unable to read '{path}/index.html'. Check the file is present " +
    'and readable, then retry.',
  'entry.notRegularFile':
    "Cannot deploy: '{path}/index.html' is not a regular file (it is a directory or " +
    'symlink). The deploy packager skips symlinks, so the published site would be ' +
    'missing its root index.html — make sure the build produced a real index.html file.',
  'archive.tooLarge': 'The site archive is too large to publish.',
  'sourceArchive.tooLarge': 'Website source archive is too large.',
  'content.rejected': 'The site content did not pass review, so it was not published.',
  'nodeId.invalid': 'Cannot deploy: node_id must be a non-empty exact string.',
  'aborted.beforeStart': 'Deploy was aborted before it started.',
  'sourcePath.required': 'Cannot deploy: source_path is required.',
  'sourcePath.empty': 'Cannot deploy: source_path must not be empty.',
  'sourcePath.outsideWorkspace':
    "Cannot deploy: '{path}' is outside the workspace or invalid. " +
    'Pass a source path that lives under the current working directory.',
  'sourcePath.missing': "Cannot deploy: '{path}' does not exist.",
  'sourcePath.unreadable': "Cannot deploy: unable to read '{path}'.",
  'sourcePath.notDirectory': "Cannot deploy: '{path}' is not a real directory.",
  'sourcePath.unsafe': 'Cannot deploy: unable to resolve the source directory safely.',
  'sourcePath.nested': 'Cannot deploy: source_path cannot be nested inside the built site directory.',
} as const;

/** Key type of the website deploy copy catalog. */
export type WebsiteDeployCopyKey = keyof typeof EN_WEBSITE_DEPLOY_COPY;
