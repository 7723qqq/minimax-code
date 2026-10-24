import { panelLayout } from '../../widgets/panel-frame.js';
import { matchesKey, parseKey, type KeyId } from '../../engine/public.js';
import type { Component } from '../../rendering/component.js';
import {
  tuiChalk as chalk,
  tuiColors as colors,
  tuiSelectListTheme as theme,
} from '../../theme/runtime.js';
import { SelectList, type SelectItem } from '../../widgets/select-list.js';
import type {
  TuiKeybindingConflict,
  TuiKeybindingOverride,
  TuiKeybindingRegistry,
} from '../../shell/keybindings.js';
import { settingsItemText } from './copy.js';

export interface TuiHotkeysPickerOptions {
  readonly registry: TuiKeybindingRegistry;
  readonly getUserOverrides: () => Readonly<Record<string, TuiKeybindingOverride>>;
  readonly saveUserOverrides: (
    overrides: Readonly<Record<string, TuiKeybindingOverride>>,
  ) => Promise<void> | void;
  readonly onClose: () => void;
  readonly requestRender?: () => void;
}

/** Pi-style shortcut list with an explicit key-capture edit state. */
export class TuiHotkeysPicker implements Component {
  readonly fullscreenViewport = true;
  readonly handlesViewportKeys = true;
  private list: SelectList;
  private selectedIndex = 0;
  private editing = false;
  private pendingKey: KeyId | undefined;
  private clearPending = false;
  private busy = false;
  private error: string | undefined;
  private status: string | undefined;

  constructor(private readonly options: TuiHotkeysPickerOptions) {
    this.list = this.createList();
  }

  handleInput(data: string): void {
    if (this.busy) {
      if (matchesKey(data, 'escape')) this.options.onClose();
      return;
    }
    if (this.editing) {
      this.handleCapture(data);
      return;
    }
    if (matchesKey(data, 'escape') || matchesKey(data, 'ctrl+c')) {
      this.options.onClose();
      return;
    }
    if (matchesKey(data, 'enter') || matchesKey(data, 'space')) {
      this.beginCapture();
      return;
    }
    if (matchesKey(data, 'r')) {
      void this.resetSelected();
      return;
    }
    this.list.handleInput(data);
  }

  invalidate(): void {
    this.list.invalidate();
  }

  render(width: number): string[] {
    return this.renderViewport(width, 24);
  }

  renderViewport(width: number, height: number): string[] {
    const selected = this.selectedDefinition();
    const keys = selected ? this.formatKeys(selected.id) : settingsItemText('hotkeys.unbound');
    const layout = panelLayout(
      width,
      height,
      this.editing
        ? settingsItemText('hotkeys.footer.editing')
        : settingsItemText('hotkeys.footer.list'),
    );
    const details = [
      ...(selected && layout.bodyHeight >= 6
        ? [chalk.hex(colors.muted)(`${selected.id} · ${selected.when} · ${keys}`)]
        : []),
      ...(this.editing ? this.renderCapture() : []),
      ...(this.error ? [chalk.hex(colors.warning)(this.error)] : []),
      ...(this.status ? [chalk.hex(colors.signal)(this.status)] : []),
    ];
    return layout.render({
      title: settingsItemText('hotkeys.title'),
      body: [
        ...this.list.renderViewport(
          layout.contentWidth,
          Math.max(1, layout.bodyHeight - details.length),
        ),
        ...details,
      ],
    });
  }

  private createList(): SelectList {
    const definitions = this.options.registry
      .list()
      .filter((definition) => definition.description && definition.helpOrder !== undefined)
      .sort((left, right) => (left.helpOrder ?? 0) - (right.helpOrder ?? 0));
    const items: SelectItem[] = definitions.map((definition) => ({
      value: definition.id,
      label: this.formatKeys(definition.id),
      description: `${definition.id} · ${definition.description}`,
    }));
    const list = new SelectList(items, Math.min(Math.max(items.length, 1), 12), theme, {
      minPrimaryColumnWidth: 14,
      maxPrimaryColumnWidth: 28,
    });
    list.setSelectedIndex(Math.min(this.selectedIndex, Math.max(items.length - 1, 0)));
    list.onSelect = () => undefined;
    list.onCancel = () => this.options.onClose();
    list.onSelectionChange = (item) => {
      const index = items.findIndex((candidate) => candidate.value === item.value);
      if (index >= 0) this.selectedIndex = index;
    };
    return list;
  }

  private selectedDefinition() {
    const id = this.list.getSelectedItem()?.value;
    return id ? this.options.registry.get(id) : undefined;
  }

  private formatKeys(id: string): string {
    const keys = this.options.registry.keys(id);
    return keys.length > 0
      ? keys.map((key) => this.options.registry.format(key)).join(' / ')
      : settingsItemText('hotkeys.unbound');
  }

  private beginCapture(): void {
    this.editing = true;
    this.pendingKey = undefined;
    this.clearPending = false;
    this.error = undefined;
    this.status = undefined;
    this.options.requestRender?.();
  }

  private handleCapture(data: string): void {
    if (matchesKey(data, 'escape')) {
      this.editing = false;
      this.pendingKey = undefined;
      this.clearPending = false;
      this.error = undefined;
      this.options.requestRender?.();
      return;
    }
    if (matchesKey(data, 'enter')) {
      void this.saveCapture();
      return;
    }
    if (matchesKey(data, 'backspace') || matchesKey(data, 'delete')) {
      this.pendingKey = undefined;
      this.clearPending = true;
      this.error = undefined;
      this.options.requestRender?.();
      return;
    }
    const parsed = parseKey(data);
    if (!parsed) return;
    this.pendingKey = parsed as KeyId;
    this.clearPending = false;
    this.error = undefined;
    this.options.requestRender?.();
  }

  private async saveCapture(): Promise<void> {
    const selected = this.selectedDefinition();
    if (!selected) return;
    const next = { ...this.options.getUserOverrides() };
    if (this.clearPending) next[selected.id] = [];
    else if (this.pendingKey) next[selected.id] = this.pendingKey;
    else {
      this.error = settingsItemText('hotkeys.error.pressKeyFirst');
      this.options.requestRender?.();
      return;
    }
    const conflicts = this.options.registry.findConflicts(next);
    const relevant = conflicts.filter((conflict) => conflict.ids.includes(selected.id));
    const conflict = relevant[0];
    if (conflict) {
      this.error = formatConflict(conflict);
      this.options.requestRender?.();
      return;
    }
    this.busy = true;
    this.error = undefined;
    this.status = undefined;
    this.options.requestRender?.();
    try {
      await this.options.saveUserOverrides(next);
      this.editing = false;
      this.pendingKey = undefined;
      this.clearPending = false;
      this.status = settingsItemText('hotkeys.status.saved', { id: selected.id });
      this.list = this.createList();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.busy = false;
      this.options.requestRender?.();
    }
  }

  private async resetSelected(): Promise<void> {
    const selected = this.selectedDefinition();
    if (!selected) return;
    const next = { ...this.options.getUserOverrides() };
    delete next[selected.id];
    this.busy = true;
    this.error = undefined;
    this.status = undefined;
    this.options.requestRender?.();
    try {
      await this.options.saveUserOverrides(next);
      this.status = settingsItemText('hotkeys.status.reset', { id: selected.id });
      this.list = this.createList();
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
    } finally {
      this.busy = false;
      this.options.requestRender?.();
    }
  }

  private renderCapture(): string[] {
    if (this.busy) return [chalk.hex(colors.muted)(settingsItemText('hotkeys.status.saving'))];
    if (this.clearPending) {
      return [chalk.hex(colors.warning)(settingsItemText('hotkeys.capture.unbound'))];
    }
    return [
      chalk.hex(colors.signal)(
        this.pendingKey
          ? settingsItemText('hotkeys.capture.captured', {
              key: this.options.registry.format(this.pendingKey),
            })
          : settingsItemText('hotkeys.capture.pressCombination'),
      ),
    ];
  }
}

function formatConflict(conflict: TuiKeybindingConflict): string {
  return settingsItemText('hotkeys.error.conflict', {
    key: conflict.key,
    ids: conflict.ids.join(settingsItemText('hotkeys.conflictSeparator')),
  });
}
