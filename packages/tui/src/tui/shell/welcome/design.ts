import { shellText } from '../copy.js';

/**
 * Token that marks where the paste-image shortcut belongs.
 *
 * The welcome banner is built before the keybinding registry is known, so the
 * catalog keeps this token in place and the banner replaces it with the
 * formatted shortcut once the registry is available.
 */
export const MINIMAX_CODE_WELCOME_PASTE_IMAGE_SHORTCUT = '{paste-image-shortcut}';

/** Shape of the welcome banner content. */
export interface TuiWelcomeDesign {
  readonly sectionTitles: { readonly tips: string; readonly news: string };
  readonly tipPool: readonly string[];
  readonly wide: { readonly tips: readonly string[]; readonly news: readonly string[] };
  readonly stacked: { readonly tips: readonly string[]; readonly news: readonly string[] };
  readonly compact: { readonly tips: readonly string[]; readonly news: readonly string[] };
  readonly hero: {
    readonly fullMinWidth: number;
    readonly mediumMinWidth: number;
    readonly microMinWidth: number;
    readonly fallbackTitle: string;
  };
}

/**
 * Welcome banner content.
 *
 * The wording lives in the shell catalog, so every copy-bearing member is a
 * getter: the banner renders in the language that is active when it is drawn
 * rather than the one that was active when the module was loaded. The hero
 * metrics are layout constants and stay plain values.
 */
export const MINIMAX_CODE_WELCOME_DESIGN: TuiWelcomeDesign = {
  get sectionTitles() {
    return {
      tips: shellText('welcome.section.tips'),
      news: shellText('welcome.section.news'),
    };
  },
  get tipPool() {
    return [
      shellText('welcome.tip.sayWhatYouWant'),
      shellText('welcome.tip.filesAndImages'),
      shellText('welcome.tip.init'),
      shellText('welcome.tip.plan'),
      shellText('welcome.tip.context'),
      shellText('welcome.tip.sessions'),
      shellText('welcome.tip.history'),
      shellText('welcome.tip.goal'),
      shellText('welcome.tip.permission'),
      shellText('welcome.tip.feedback'),
      shellText('welcome.tip.checkin'),
    ];
  },
  get wide() {
    return {
      tips: [
        shellText('welcome.tip.sayWhatYouWant'),
        shellText('welcome.tip.filesAndImages'),
        shellText('welcome.tip.init'),
        shellText('welcome.tip.checkin'),
      ],
      news: [
        shellText('welcome.news.followUps'),
        shellText('welcome.news.context'),
        shellText('welcome.news.feedback'),
      ],
    };
  },
  get stacked() {
    return {
      tips: [
        shellText('welcome.tip.sayWhatYouWant'),
        shellText('welcome.tip.stackedFiles'),
        shellText('welcome.tip.stackedCheckin'),
      ],
      news: [
        shellText('welcome.news.stackedFollowUps'),
        shellText('welcome.news.stackedContextFeedback'),
      ],
    };
  },
  get compact() {
    return {
      tips: [
        shellText('welcome.tip.compactFiles'),
        shellText('welcome.tip.compactInit'),
        shellText('welcome.tip.compactCheckin'),
      ],
      news: [
        shellText('welcome.news.compactFollowUps'),
        shellText('welcome.news.compactContextFeedback'),
      ],
    };
  },
  hero: {
    fullMinWidth: 91,
    mediumMinWidth: 44,
    microMinWidth: 11,
    fallbackTitle: 'M',
  },
};

export const MINIMAX_CODE_TERMINAL_WORDMARK = [
  '███╗   ███╗██╗███╗   ██╗██╗███╗   ███╗ █████╗ ██╗  ██╗     ██████╗ ██████╗ ██████╗ ███████╗',
  '████╗ ████║██║████╗  ██║██║████╗ ████║██╔══██╗╚██╗██╔╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝',
  '██╔████╔██║██║██╔██╗ ██║██║██╔████╔██║███████║ ╚███╔╝     ██║     ██║   ██║██║  ██║█████╗',
  '██║╚██╔╝██║██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║ ██╔██╗     ██║     ██║   ██║██║  ██║██╔══╝',
  '██║ ╚═╝ ██║██║██║ ╚████║██║██║ ╚═╝ ██║██║  ██║██╔╝ ██╗    ╚██████╗╚██████╔╝██████╔╝███████╗',
  '╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝     ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝',
] as const;

export const MINIMAX_CODE_TERMINAL_MEDIUM_WORDMARK = [
  '███╗   ███╗ ██████╗ ██████╗ ██████╗ ███████╗',
  '████╗ ████║██╔════╝██╔═══██╗██╔══██╗██╔════╝',
  '██╔████╔██║██║     ██║   ██║██║  ██║█████╗',
  '██║╚██╔╝██║██║     ██║   ██║██║  ██║██╔══╝',
  '██║ ╚═╝ ██║╚██████╗╚██████╔╝██████╔╝███████╗',
  '╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝',
] as const;

export const MINIMAX_CODE_TERMINAL_MICRO_WORDMARK = [
  '███╗   ███╗',
  '████╗ ████║',
  '██╔████╔██║',
  '██║╚██╔╝██║',
  '██║ ╚═╝ ██║',
  '╚═╝     ╚═╝',
] as const;
