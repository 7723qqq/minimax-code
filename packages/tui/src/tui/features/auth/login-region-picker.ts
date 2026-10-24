import { panelLayout } from '../../widgets/panel-frame.js';
import type { MavisRegion } from '@mavis/config';
import type { Component } from '../../rendering/component.js';
import {
  tuiChalk as chalk,
  tuiColors as colors,
  tuiSelectListTheme as theme,
} from '../../theme/runtime.js';
import { SelectList } from '../../widgets/select-list.js';
import { authText, type AuthCopyKey } from './copy.js';

const LOGIN_REGIONS: readonly {
  value: MavisRegion;
  labelKey: AuthCopyKey;
  descriptionKey: AuthCopyKey;
}[] = [
  { value: 'cn', labelKey: 'regionChinaLabel', descriptionKey: 'regionChinaDescription' },
  { value: 'en', labelKey: 'regionGlobalLabel', descriptionKey: 'regionGlobalDescription' },
];

export class TuiLoginRegionPicker implements Component {
  readonly fullscreenViewport = true;
  readonly handlesViewportKeys = true;
  private readonly list: SelectList;

  constructor(onSelect: (region: MavisRegion) => void, onCancel: () => void) {
    this.list = new SelectList(
      LOGIN_REGIONS.map((region) => ({
        value: region.value,
        label: authText(region.labelKey),
        description: authText(region.descriptionKey),
      })),
      LOGIN_REGIONS.length,
      theme,
      {
        minPrimaryColumnWidth: 16,
        maxPrimaryColumnWidth: 24,
      },
    );
    this.list.onSelect = (item) => onSelect(item.value as MavisRegion);
    this.list.onCancel = onCancel;
  }

  handleInput(data: string): void {
    this.list.handleInput(data);
  }

  invalidate(): void {
    this.list.invalidate();
  }

  render(width: number): string[] {
    return this.renderViewport(width, 20);
  }

  renderViewport(width: number, height: number): string[] {
    const layout = panelLayout(width, height, authText('selectContinueCancel'));
    const helper =
      layout.bodyHeight >= 4 ? [chalk.hex(colors.muted)(authText('singleRegionOnly'))] : [];
    return layout.render({
      title: authText('chooseRegion'),
      body: [
        ...helper,
        ...this.list.renderViewport(layout.contentWidth, layout.bodyHeight - helper.length),
      ],
    });
  }
}
