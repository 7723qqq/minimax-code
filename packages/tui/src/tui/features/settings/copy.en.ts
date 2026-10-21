/**
 * English copy for the settings pickers.
 *
 * This catalog belongs to the settings surfaces that own their own wording
 * (the hotkey editor and the theme chooser). The English object is the only
 * source of truth for key shape: the Chinese catalog is typed against it, so a
 * missing translation fails `pnpm typecheck` instead of rendering an empty line.
 */
/**
 * English copy for the hotkey and theme pickers.
 *
 * The English object is the only source of truth for key shape: the zh-Hans
 * catalog is typed against it, so a missing translation is a compile error
 * rather than a blank line in the interface.
 */
export const EN_SETTINGS_ITEM_COPY = {
  // Hotkeys picker
  'hotkeys.title': 'Keyboard Shortcuts',
  'hotkeys.unbound': 'Unbound',
  'hotkeys.footer.list': '↑↓ select · Enter modify · r reset · Esc close',
  'hotkeys.footer.editing': 'Press a key · Enter save · Backspace clear · Esc cancel',
  'hotkeys.capture.pressCombination': 'Press a key combination…',
  'hotkeys.capture.unbound': 'Unbound · press Enter to save',
  'hotkeys.capture.captured': 'Captured: {key}',
  'hotkeys.status.saving': 'Saving…',
  'hotkeys.status.saved': 'Saved {id}.',
  'hotkeys.status.reset': 'Reset {id} to default.',
  'hotkeys.error.pressKeyFirst': 'Press a key first, or use Backspace to clear it.',
  'hotkeys.error.conflict': 'Conflict: {key} is used by {ids}.',
  'hotkeys.conflictSeparator': ' and ',

  // Theme picker
  'theme.title': 'Theme',
  'theme.empty': 'No themes available.',
  'theme.error.save': 'Could not save the theme selection.',
  'theme.meta.available': '{count} available',
  'theme.appearance.label': 'Appearance',
  'theme.appearance.auto': 'auto ({appearance})',
  'theme.appearance.lightPinned': 'light (pinned)',
  'theme.appearance.darkPinned': 'dark (pinned)',
  'theme.appearanceValue.light': 'light',
  'theme.appearanceValue.dark': 'dark',
  'theme.source.label': 'Source',
  'theme.source.custom': 'custom file',
  'theme.source.builtIn': 'built-in',
  'theme.about.label': 'About',
  'theme.palette.label': 'Palette',
  'theme.currentBadge': ' current ',
  'theme.footer.saving': 'Saving…',
  'theme.footer.full': '↑↓ theme · ←→ appearance · Enter save · Esc cancel',
  'theme.footer.compact': '↑↓ ←→ · Enter · Esc',
} as const;

/** Every key the hotkey and theme pickers catalog defines. */
export type SettingsItemCopyKey = keyof typeof EN_SETTINGS_ITEM_COPY;
