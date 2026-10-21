/**
 * Plugin manager copy.
 *
 * The English catalog is the only source of truth for the key shape; the
 * zh-Hans catalog is typed against it, so a missing translation is a compile
 * error rather than an `undefined` on screen.
 *
 * Keyboard names (`Enter`, `Space`, `Delete`, `Ctrl+R`) and command names
 * (`/login`, `mcode plugin`) stay in English in every locale.
 */
/**
 * English copy for the plugin manager.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_PLUGIN_COPY = {
  browsePlugins: 'Browse MiniMax Official and Local plugins · Installed {installed} of {total}',
  noMatchingPlugins: 'No matching plugins',
  footerActions: 'Enter install · Space enable/disable · Delete remove · Ctrl+R refresh',
  authRequiredNextStep: 'Run /login, then retry.',
  detailsNextStep: 'Retry or run mcode plugin for details.',
  refreshingCatalogs: 'Refreshing Plugin catalogs…',
  catalogsRefreshed: 'Plugin catalogs refreshed.',
  upgradeNextStep: 'Retry or run mcode plugin marketplace upgrade.',
} as const;

/** Every key the plugin manager catalog defines. */
export type PluginCopyKey = keyof typeof EN_PLUGIN_COPY;
