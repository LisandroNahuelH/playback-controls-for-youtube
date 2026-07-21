import { getI18nMessageSafe } from './runtime-i18n';
import { applyVolumeBoost } from './volume-boost/apply-volume-boost';
import { createVolumeBoostState } from './volume-boost/create-volume-boost-state';
import { resetVolumeBoost } from './volume-boost/reset-volume-boost';
import { resumeVolumeBoostContext } from './volume-boost/resume-volume-boost-context';
import { YOUTUBE_MORE_VIDEOS_LABELS } from './youtube-native-ui-labels';
import {
  CONTROL_BAR_SECTION_IDS,
  CONTROL_BAR_SECTION_STORAGE_KEY,
  DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS,
  adjustMediaVolume,
  clampMediaVolume,
  formatMediaVolumePercent,
  normalizeControlBarSectionVisibility,
  type ControlBarSectionId,
  type ControlBarSectionVisibility
} from '../shared/control-bar-sections';
import { MAX_NATIVE_MEDIA_VOLUME } from '../shared/media-volume-limits';

const SENTINEL_KEY = '__youtube_playback_speed_controls__';
const HOST_ATTR = 'data-playback-controls-for-youtube-host';
const GLOBAL_STYLE_ID = 'playback-controls-for-youtube-tm-global-style';
const PINNED_PLAYER_CLASS = 'yt-playback-speed-controls-pinned';
const MUSIC_MODE_CLASS = 'yt-playback-speed-controls-music-mode';
const MIN_PLAYBACK_RATE = 0.25;
const MAX_PLAYBACK_RATE = 4;
const STEP = 0.05;
const LARGE_STEP = 0.1;
const VOLUME_STEP = 0.1;
const VOLUME_LARGE_STEP = 0.2;
const SEEK_STEP_SECONDS = 15;
const SEEK_LARGE_STEP_SECONDS = 30;
const SEEK_EXTRA_LARGE_STEP_SECONDS = 60;
const FAST_SEEK_PLAYBACK_RATE = 4;
const SEEK_COUNTDOWN_INTERVAL_MS = 100;
const FAST_SEEK_CAPTION_MAX_LINES = 8;
const INITIAL_PLAYBACK_RATE_RESET_WINDOW_MS = 5000;
const INITIAL_PLAYBACK_RATE_RESET_INTERVAL_MS = 250;
const QUALITY_RETRY_DELAY_MS = 250;
const QUALITY_MENU_WAIT_MS = 750;
const MUSIC_MODE_TARGET_RESOLUTION = 144;
const QUALITY_TARGETS = [1080] as const;
const QUALITY_CYCLE = [240, 360, 480, 720, 1080] as const;
const HOST_BOTTOM_OFFSET_PX = 68;
const HOST_HEIGHT_PX = 42;
const PLAYBACK_POSITIONS_STORAGE_KEY = 'youtubePlaybackPositions';
const PLAYBACK_POSITION_SAVE_INTERVAL_MS = 10000;
const MIN_PLAYBACK_POSITION_SECONDS = 1;
const PLAYBACK_POSITION_END_MARGIN_SECONDS = 5;
const MAX_STORED_PLAYBACK_POSITIONS = 200;
const PLAYBACK_POSITION_RESTORE_RETRY_MS = 350;
const PLAYBACK_POSITION_RESTORE_TIMEOUT_MS = 12000;
const PLAYBACK_POSITION_RESTORE_STABLE_MS = 3500;
const PLAYBACK_POSITION_RESTORE_TOLERANCE_SECONDS = 0.75;
const PLAYBACK_POSITION_RESTORE_OFFSET_SECONDS = 3;
const INITIAL_SCAN_RETRY_MS = 500;
const INITIAL_SCAN_MAX_RETRIES = 40;
const RESCUE_SCAN_INTERVAL_MS = 1500;
const RESCUE_SCAN_DURATION_MS = 60000;
const YT_NAVIGATE_SCAN_DELAY_MS = 300;
const CONTROLS_THEME_STORAGE_KEY = 'playbackControlsForYoutubeTheme';
const DEFAULT_CONTROLS_THEME_ID = 'classic';

type ControlsThemeId = 'classic' | 'dark' | 'youtube' | 'ocean' | 'rose';

interface ControlsThemeTokens {
  barBackground: string;
  barBorder: string;
  barShadow: string;
  buttonBackground: string;
  buttonText: string;
  buttonBorder: string;
  buttonHoverBackground: string;
  activeBackground: string;
  activeBorder: string;
  activeText: string;
  activeShadow: string;
  focusRing: string;
  dividerColor: string;
  borderRadius: string;
}

interface ControlsTheme {
  id: ControlsThemeId;
  tokens: ControlsThemeTokens;
}

const CONTENT_CONTROLS_THEMES: Record<ControlsThemeId, ControlsTheme> = {
  classic: {
    id: 'classic',
    tokens: {
      barBackground: 'rgba(204, 204, 204, 0.96)',
      barBorder: 'rgba(0, 0, 0, 0.22)',
      barShadow: '0 2px 10px rgba(0, 0, 0, 0.28)',
      buttonBackground: '#ffffff',
      buttonText: '#111111',
      buttonBorder: 'rgba(0, 0, 0, 0.16)',
      buttonHoverBackground: '#f1f1f1',
      activeBackground: '#e6f3ff',
      activeBorder: '#3ea6ff',
      activeText: '#065fd4',
      activeShadow: '0 0 0 1px rgba(255, 255, 255, 0.35), 0 0 12px rgba(62, 166, 255, 0.55)',
      focusRing: '#3ea6ff',
      dividerColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: '999px'
    }
  },
  dark: {
    id: 'dark',
    tokens: {
      barBackground: 'rgba(22, 24, 28, 0.94)',
      barBorder: 'rgba(255, 255, 255, 0.16)',
      barShadow: '0 8px 22px rgba(0, 0, 0, 0.46)',
      buttonBackground: '#2c3038',
      buttonText: '#f7f7f7',
      buttonBorder: 'rgba(255, 255, 255, 0.14)',
      buttonHoverBackground: '#3a404b',
      activeBackground: '#263f5f',
      activeBorder: '#7ab7ff',
      activeText: '#eaf4ff',
      activeShadow: '0 0 0 1px rgba(122, 183, 255, 0.32), 0 0 14px rgba(122, 183, 255, 0.38)',
      focusRing: '#7ab7ff',
      dividerColor: 'rgba(255, 255, 255, 0.38)',
      borderRadius: '999px'
    }
  },
  youtube: {
    id: 'youtube',
    tokens: {
      barBackground: 'rgba(20, 20, 20, 0.94)',
      barBorder: 'rgba(255, 255, 255, 0.14)',
      barShadow: '0 6px 18px rgba(0, 0, 0, 0.4)',
      buttonBackground: '#ffffff',
      buttonText: '#0f0f0f',
      buttonBorder: 'rgba(255, 255, 255, 0.18)',
      buttonHoverBackground: '#ffe7e7',
      activeBackground: '#ff0033',
      activeBorder: '#ff5c75',
      activeText: '#ffffff',
      activeShadow: '0 0 0 1px rgba(255, 255, 255, 0.3), 0 0 14px rgba(255, 0, 51, 0.46)',
      focusRing: '#ff5c75',
      dividerColor: 'rgba(255, 255, 255, 0.42)',
      borderRadius: '999px'
    }
  },
  ocean: {
    id: 'ocean',
    tokens: {
      barBackground: 'rgba(219, 245, 255, 0.95)',
      barBorder: 'rgba(14, 116, 144, 0.28)',
      barShadow: '0 5px 18px rgba(8, 47, 73, 0.24)',
      buttonBackground: '#f8fdff',
      buttonText: '#0f2e3d',
      buttonBorder: 'rgba(14, 116, 144, 0.2)',
      buttonHoverBackground: '#d9f4ff',
      activeBackground: '#0e7490',
      activeBorder: '#22d3ee',
      activeText: '#ffffff',
      activeShadow: '0 0 0 1px rgba(255, 255, 255, 0.34), 0 0 13px rgba(34, 211, 238, 0.44)',
      focusRing: '#0891b2',
      dividerColor: 'rgba(15, 46, 61, 0.42)',
      borderRadius: '14px'
    }
  },
  rose: {
    id: 'rose',
    tokens: {
      barBackground: 'rgba(255, 232, 236, 0.96)',
      barBorder: 'rgba(190, 24, 93, 0.22)',
      barShadow: '0 5px 18px rgba(131, 24, 67, 0.22)',
      buttonBackground: '#ffffff',
      buttonText: '#4a102b',
      buttonBorder: 'rgba(190, 24, 93, 0.18)',
      buttonHoverBackground: '#ffe0ea',
      activeBackground: '#be185d',
      activeBorder: '#fb7185',
      activeText: '#ffffff',
      activeShadow: '0 0 0 1px rgba(255, 255, 255, 0.36), 0 0 13px rgba(251, 113, 133, 0.42)',
      focusRing: '#e11d48',
      dividerColor: 'rgba(74, 16, 43, 0.4)',
      borderRadius: '10px'
    }
  }
};

const QUALITY_LABEL_TO_RESOLUTION: Record<string, number> = {
  auto: Number.NaN,
  default: Number.NaN,
  highres: 4320,
  hd4320: 4320,
  hd2880: 2880,
  hd2160: 2160,
  hd1440: 1440,
  hd1080: 1080,
  hd720: 720,
  large: 480,
  medium: 360,
  small: 240,
  tiny: 144
};

function getControlsTheme(value: unknown): ControlsTheme {
  return typeof value === 'string' && value in CONTENT_CONTROLS_THEMES
    ? CONTENT_CONTROLS_THEMES[value as ControlsThemeId]
    : CONTENT_CONTROLS_THEMES[DEFAULT_CONTROLS_THEME_ID];
}

function getControlsThemeCssProperties(theme: ControlsTheme): Record<string, string> {
  return {
    '--yt-controls-bar-background': theme.tokens.barBackground,
    '--yt-controls-bar-border': theme.tokens.barBorder,
    '--yt-controls-bar-shadow': theme.tokens.barShadow,
    '--yt-controls-button-background': theme.tokens.buttonBackground,
    '--yt-controls-button-text': theme.tokens.buttonText,
    '--yt-controls-button-border': theme.tokens.buttonBorder,
    '--yt-controls-button-hover-background': theme.tokens.buttonHoverBackground,
    '--yt-controls-active-background': theme.tokens.activeBackground,
    '--yt-controls-active-border': theme.tokens.activeBorder,
    '--yt-controls-active-text': theme.tokens.activeText,
    '--yt-controls-active-shadow': theme.tokens.activeShadow,
    '--yt-controls-focus-ring': theme.tokens.focusRing,
    '--yt-controls-divider-color': theme.tokens.dividerColor,
    '--yt-controls-border-radius': theme.tokens.borderRadius
  };
}

export interface YouTubePlaybackSpeedControlsHandle {
  destroy(): void;
}

export interface YouTubePlaybackSpeedControlsDependencies {
  document?: Document;
  window?: Window;
  logger?: Pick<Console, 'warn' | 'error' | 'info'>;
  storage?: YouTubePlaybackSpeedControlsStorage | null;
}

export interface YouTubePlaybackSpeedControlsStorage {
  get(keys: string | string[] | Record<string, unknown> | null, callback: (items: Record<string, unknown>) => void): void;
  set(items: Record<string, unknown>, callback?: () => void): void;
}

interface ControlState {
  video: HTMLVideoElement | null;
  controlsRoot: HTMLElement | null;
  playerContainer: HTMLElement | null;
}

type QualitySelectionRequest =
  | { kind: 'auto' }
  | { kind: 'resolution'; requestedResolution: number };

export interface YouTubeQualityChoice {
  label: string;
  resolution: number | null;
  element: HTMLElement;
}

interface StoredPlaybackPosition {
  url: string;
  time: number;
  duration: number | null;
  updatedAt: number;
}

type PlaybackPositionStore = Record<string, StoredPlaybackPosition>;

interface ActivePlaybackPositionRestore {
  video: HTMLVideoElement;
  videoId: string;
  entry: StoredPlaybackPosition;
  deadlineAt: number;
  stableSince: number | null;
  reachedPosition: boolean;
  timer: number | null;
  cleanup(): void;
}

interface ActiveSeekCountdown {
  video: HTMLVideoElement;
  targetTime: number;
  button: HTMLButtonElement | null;
  buttonLabel: string;
  deltaSeconds: number;
  previousPlaybackRate: number;
  wasPaused: boolean;
  timer: number | null;
}

interface ActiveFastSeekCaptions {
  video: HTMLVideoElement;
  playerContainer: HTMLElement;
  nativeCaptionContainer: HTMLElement | null;
  overlay: HTMLElement;
  lines: string[];
  lineKeys: Set<string>;
  lastNormalizedText: string;
  observer: MutationObserver | null;
}

function getResolvedDocument(deps: YouTubePlaybackSpeedControlsDependencies): Document | undefined {
  return deps.document ?? globalThis.document;
}

function getResolvedWindow(deps: YouTubePlaybackSpeedControlsDependencies): Window | undefined {
  return deps.window ?? globalThis.window;
}

function clampPlaybackRate(rate: number): number {
  if (!Number.isFinite(rate)) {
    return 1;
  }

  return Math.min(MAX_PLAYBACK_RATE, Math.max(MIN_PLAYBACK_RATE, Math.round(rate * 100) / 100));
}

function formatPlaybackRate(rate: number | null | undefined): string {
  return `${clampPlaybackRate(rate ?? 1).toFixed(2)}x`;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function isAutoQualityLabel(label: string): boolean {
  return normalizeText(label).startsWith('auto');
}

export function normalizeYouTubeQualityText(text: string): number | null {
  const normalized = normalizeText(text);
  if (!normalized) {
    return null;
  }

  const aliasResolution = QUALITY_LABEL_TO_RESOLUTION[normalized];
  if (typeof aliasResolution === 'number' && !Number.isNaN(aliasResolution)) {
    return aliasResolution;
  }

  const match =
    normalized.match(/(\d{3,4})\s*p\b/) ??
    normalized.match(/hd(\d{3,4})\b/) ??
    normalized.match(/(\d{3,4})/);

  if (!match) {
    return null;
  }

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function chooseAutoQualityOption(
  options: ReadonlyArray<Pick<YouTubeQualityChoice, 'label' | 'resolution' | 'element'>>
): YouTubeQualityChoice | null {
  const autoOption = options.find((option) => isAutoQualityLabel(option.label));
  return autoOption ? { label: autoOption.label, resolution: null, element: autoOption.element } : null;
}

export function chooseClosestQualityOption(
  requestedResolution: number,
  options: ReadonlyArray<Pick<YouTubeQualityChoice, 'label' | 'resolution' | 'element'>>
): YouTubeQualityChoice | null {
  let bestNumericOption: YouTubeQualityChoice | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const option of options) {
    if (option.resolution === null) {
      continue;
    }

    const distance = Math.abs(option.resolution - requestedResolution);
    if (
      !bestNumericOption ||
      distance < bestDistance ||
      (distance === bestDistance && option.resolution < (bestNumericOption.resolution ?? Number.POSITIVE_INFINITY))
    ) {
      bestNumericOption = { label: option.label, resolution: option.resolution, element: option.element };
      bestDistance = distance;
    }
  }

  if (bestNumericOption) {
    return bestNumericOption;
  }

  return chooseAutoQualityOption(options);
}

export function adjustPlaybackRate(currentRate: number, delta: number): number {
  return clampPlaybackRate(currentRate + delta);
}

function isValidYouTubeVideoId(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{6,128}$/.test(value);
}

export function getYouTubeVideoIdFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url, 'https://www.youtube.com');
    const watchVideoId = parsedUrl.searchParams.get('v');
    if (isValidYouTubeVideoId(watchVideoId)) {
      return watchVideoId;
    }

    const [route, candidate] = parsedUrl.pathname.split('/').filter(Boolean);
    if ((route === 'shorts' || route === 'embed' || route === 'live') && isValidYouTubeVideoId(candidate)) {
      return candidate;
    }
  } catch {
    return null;
  }

  return null;
}

export function isMainWatchPlaybackPage(url: string): boolean {
  try {
    const parsedUrl = new URL(url, 'https://www.youtube.com');
    const route = parsedUrl.pathname.split('/').filter(Boolean)[0];
    return route === 'watch' && getYouTubeVideoIdFromUrl(url) !== null;
  } catch {
    return false;
  }
}

function isEligibleWatchPlayer(player: HTMLElement | null): boolean {
  if (!player) {
    return false;
  }

  if (player.id !== 'movie_player' && !player.closest('#movie_player')) {
    return false;
  }

  if (player.closest('ytd-thumbnail, ytd-playlist-thumbnail, #thumbnail')) {
    return false;
  }

  return true;
}

export function parseYouTubeTimeParam(value: string | null | undefined): number | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim().toLowerCase();
  if (!trimmedValue) {
    return null;
  }

  if (/^\d+(?:\.\d+)?s?$/.test(trimmedValue)) {
    const seconds = Number(trimmedValue.replace(/s$/, ''));
    return Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : null;
  }

  const match = trimmedValue.match(/^(?:(\d+(?:\.\d+)?)h)?(?:(\d+(?:\.\d+)?)m)?(?:(\d+(?:\.\d+)?)s)?$/);
  if (!match || (!match[1] && !match[2] && !match[3])) {
    return null;
  }

  const hours = match[1] ? Number(match[1]) : 0;
  const minutes = match[2] ? Number(match[2]) : 0;
  const seconds = match[3] ? Number(match[3]) : 0;
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  return Number.isFinite(totalSeconds) && totalSeconds >= 0 ? Math.floor(totalSeconds) : null;
}

export function getPlaybackTimeFromUrl(url: string): number | null {
  try {
    const parsedUrl = new URL(url, 'https://www.youtube.com');
    return parseYouTubeTimeParam(parsedUrl.searchParams.get('t'));
  } catch {
    return null;
  }
}

export function buildYouTubeWatchUrlWithTime(currentUrl: string, videoId: string, timeSeconds: number): string {
  const safeTimeSeconds = Math.max(0, Math.floor(Number.isFinite(timeSeconds) ? timeSeconds : 0));
  const parsedUrl = new URL(currentUrl, 'https://www.youtube.com');
  parsedUrl.pathname = '/watch';
  parsedUrl.searchParams.set('v', videoId);
  parsedUrl.searchParams.set('t', `${safeTimeSeconds}s`);
  parsedUrl.hash = '';

  return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
}

export function findActiveVideo(document: Document): HTMLVideoElement | null {
  const pageUrl = document.defaultView?.location.href;
  if (!pageUrl || !isMainWatchPlaybackPage(pageUrl)) {
    return null;
  }

  const videos = Array.from(document.querySelectorAll<HTMLVideoElement>('video'));
  return chooseBestVideoCandidate(document, videos);
}

export function findPlayerContainer(document: Document, video: HTMLVideoElement | null): HTMLElement | null {
  const pageUrl = document.defaultView?.location.href;
  if (!pageUrl || !isMainWatchPlaybackPage(pageUrl)) {
    return null;
  }

  if (video) {
    const player = video.closest<HTMLElement>('#movie_player, .html5-video-player');
    if (player && isEligibleWatchPlayer(player)) {
      return player.id === 'movie_player' ? player : (player.closest<HTMLElement>('#movie_player') ?? player);
    }
  }

  return chooseBestPlayerCandidate(document, Array.from(document.querySelectorAll<HTMLElement>('#movie_player, .html5-video-player')));
}

export function findControlsRoot(document: Document, video: HTMLVideoElement | null): HTMLElement | null {
  const player = findPlayerContainer(document, video);
  if (player) {
    const nestedControls = player?.querySelector<HTMLElement>('.ytp-chrome-bottom');
    if (nestedControls) {
      return nestedControls;
    }
  }

  return document.querySelector<HTMLElement>('#movie_player .ytp-chrome-bottom, .html5-video-player .ytp-chrome-bottom');
}

function getElementVisibilityScore(document: Document, element: Element | null): number {
  if (!element || !element.isConnected) {
    return Number.NEGATIVE_INFINITY;
  }

  let score = 0;
  const view = document.defaultView;
  const style = view?.getComputedStyle(element);
  if (style?.display === 'none' || style?.visibility === 'hidden' || style?.opacity === '0') {
    score -= 10000;
  }

  const rect = element.getBoundingClientRect();
  const hasUsableBox = rect.width > 0 && rect.height > 0;
  if (hasUsableBox) {
    score += 1000 + Math.min(rect.width * rect.height, 1_000_000) / 1000;
  }

  return score;
}

function getPlayerPreferenceScore(player: HTMLElement | null): number {
  if (!player) {
    return 0;
  }

  let score = 0;
  if (player.id === 'movie_player') {
    score += 100;
  }

  if (player.classList.contains('html5-video-player')) {
    score += 50;
  }

  return score;
}

function chooseBestVideoCandidate(document: Document, videos: HTMLVideoElement[]): HTMLVideoElement | null {
  let bestVideo: HTMLVideoElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const video of videos) {
    const player = video.closest<HTMLElement>('#movie_player, .html5-video-player');
    if (!isEligibleWatchPlayer(player)) {
      continue;
    }

    const score =
      getElementVisibilityScore(document, video) +
      (player ? getElementVisibilityScore(document, player) : 0) +
      getPlayerPreferenceScore(player);

    if (!bestVideo || score > bestScore) {
      bestVideo = video;
      bestScore = score;
    }
  }

  return bestVideo;
}

function chooseBestPlayerCandidate(document: Document, players: HTMLElement[]): HTMLElement | null {
  let bestPlayer: HTMLElement | null = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const player of players) {
    if (!isEligibleWatchPlayer(player)) {
      continue;
    }

    const score = getElementVisibilityScore(document, player) + getPlayerPreferenceScore(player);
    if (!bestPlayer || score > bestScore) {
      bestPlayer = player;
      bestScore = score;
    }
  }

  return bestPlayer;
}

function getSettingsMenuItemForQuality(settingsMenu: HTMLElement): HTMLElement | null {
  const items = settingsMenu.querySelectorAll<HTMLElement>('.ytp-menuitem');
  return items.length > 0 ? items[items.length - 1] : null;
}

function getQualityOptionsFromMenu(qualityMenu: HTMLElement): YouTubeQualityChoice[] {
  return Array.from(qualityMenu.querySelectorAll<HTMLElement>('.ytp-menuitem'))
    .map((element) => {
      const label = normalizeText(element.textContent ?? '');
      if (!label) {
        return null;
      }

      const resolution = normalizeYouTubeQualityText(label);
      if (resolution === null && !isAutoQualityLabel(label)) {
        return null;
      }

      return { label, resolution, element };
    })
    .filter((option): option is YouTubeQualityChoice => option !== null);
}

function findYouTubeSubtitlesButton(playerContainer: HTMLElement | null): HTMLButtonElement | null {
  return playerContainer?.querySelector<HTMLButtonElement>('.ytp-subtitles-button') ?? null;
}

function findYouTubeCaptionContainer(playerContainer: HTMLElement | null): HTMLElement | null {
  return playerContainer?.querySelector<HTMLElement>('.ytp-caption-window-container') ?? null;
}

function waitForElement<T extends Element>(
  window: Window,
  root: ParentNode,
  selector: string,
  timeoutMs: number
): Promise<T | null> {
  const immediate = root.querySelector<T>(selector);
  if (immediate) {
    return Promise.resolve(immediate);
  }

  return new Promise((resolve) => {
    const observedNode = root instanceof Document ? root.documentElement : (root as unknown as Node);
    const observer = new MutationObserver(() => {
      const element = root.querySelector<T>(selector);
      if (element) {
        cleanup();
        resolve(element);
      }
    });

    const timeoutId = window.setTimeout(() => {
      cleanup();
      resolve(null);
    }, timeoutMs);

    const cleanup = () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };

    observer.observe(observedNode, {
      childList: true,
      subtree: true
    });
  });
}

function createLocalStorageAdapter(window: Window): YouTubePlaybackSpeedControlsStorage | null {
  try {
    const localStorage = window.localStorage;
    const readItem = (key: string): unknown => {
      const rawValue = localStorage.getItem(PLAYBACK_POSITIONS_STORAGE_KEY);
      if (key === PLAYBACK_POSITIONS_STORAGE_KEY) {
        return rawValue ? JSON.parse(rawValue) : undefined;
      }

      return undefined;
    };

    return {
      get(keys, callback) {
        try {
          if (typeof keys === 'string') {
            callback({ [keys]: readItem(keys) });
            return;
          }

          if (Array.isArray(keys)) {
            callback(Object.fromEntries(keys.map((key) => [key, readItem(key)])));
            return;
          }

          if (keys && typeof keys === 'object') {
            callback(Object.fromEntries(Object.entries(keys).map(([key, fallbackValue]) => [key, readItem(key) ?? fallbackValue])));
            return;
          }

          callback({
            [PLAYBACK_POSITIONS_STORAGE_KEY]: readItem(PLAYBACK_POSITIONS_STORAGE_KEY)
          });
        } catch {
          callback({});
        }
      },
      set(items, callback) {
        try {
          for (const [key, value] of Object.entries(items)) {
            if (typeof value === 'undefined') {
              localStorage.removeItem(key);
            } else if (key === PLAYBACK_POSITIONS_STORAGE_KEY) {
              localStorage.setItem(key, JSON.stringify(value));
            }
          }
        } catch {
          // Ignore storage failures so playback controls keep working.
        }

        callback?.();
      }
    };
  } catch {
    return null;
  }
}

function getResolvedStorage(
  deps: YouTubePlaybackSpeedControlsDependencies,
  window: Window
): YouTubePlaybackSpeedControlsStorage | null {
  if ('storage' in deps) {
    return deps.storage ?? null;
  }

  return createLocalStorageAdapter(window);
}

function normalizePlaybackPositionStore(value: unknown): PlaybackPositionStore {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const store: PlaybackPositionStore = {};
  for (const [videoId, rawEntry] of Object.entries(value as Record<string, unknown>)) {
    if (!isValidYouTubeVideoId(videoId) || !rawEntry || typeof rawEntry !== 'object' || Array.isArray(rawEntry)) {
      continue;
    }

    const entry = rawEntry as Record<string, unknown>;
    const time = Number(entry.time);
    if (!Number.isFinite(time) || time < MIN_PLAYBACK_POSITION_SECONDS) {
      continue;
    }

    const duration = Number(entry.duration);
    const updatedAt = Number(entry.updatedAt);
    const rawUrl = typeof entry.url === 'string' ? entry.url : '';
    const url =
      rawUrl && getYouTubeVideoIdFromUrl(rawUrl) === videoId
        ? buildYouTubeWatchUrlWithTime(rawUrl, videoId, time)
        : buildYouTubeWatchUrlWithTime(`https://www.youtube.com/watch?v=${videoId}`, videoId, time);

    store[videoId] = {
      url,
      time,
      duration: Number.isFinite(duration) && duration > 0 ? duration : null,
      updatedAt: Number.isFinite(updatedAt) ? updatedAt : 0
    };
  }

  return store;
}

function prunePlaybackPositionStore(store: PlaybackPositionStore): PlaybackPositionStore {
  const entries = Object.entries(store).sort(([, left], [, right]) => right.updatedAt - left.updatedAt);
  return Object.fromEntries(entries.slice(0, MAX_STORED_PLAYBACK_POSITIONS));
}

function readPlaybackPositionStore(
  storage: YouTubePlaybackSpeedControlsStorage | null,
  logger: Pick<Console, 'warn' | 'error' | 'info'>
): Promise<PlaybackPositionStore> {
  if (!storage) {
    return Promise.resolve({});
  }

  return new Promise((resolve) => {
    try {
      storage.get(PLAYBACK_POSITIONS_STORAGE_KEY, (items) => {
        resolve(normalizePlaybackPositionStore(items?.[PLAYBACK_POSITIONS_STORAGE_KEY]));
      });
    } catch (error) {
      logger.warn?.(error instanceof Error ? error.message : 'Could not read the saved video position.');
      resolve({});
    }
  });
}

function writePlaybackPositionStore(
  storage: YouTubePlaybackSpeedControlsStorage | null,
  store: PlaybackPositionStore,
  logger: Pick<Console, 'warn' | 'error' | 'info'>
): void {
  if (!storage) {
    return;
  }

  try {
    storage.set({ [PLAYBACK_POSITIONS_STORAGE_KEY]: prunePlaybackPositionStore(store) });
  } catch (error) {
    logger.warn?.(error instanceof Error ? error.message : 'Could not save the video position.');
  }
}

function getVideoDuration(video: HTMLVideoElement): number | null {
  return Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null;
}

function isNearVideoEnd(time: number, duration: number | null): boolean {
  return duration !== null && time >= Math.max(MIN_PLAYBACK_POSITION_SECONDS, duration - PLAYBACK_POSITION_END_MARGIN_SECONDS);
}

function shouldSavePlaybackPosition(video: HTMLVideoElement): boolean {
  const time = video.currentTime;
  return Number.isFinite(time) && time >= MIN_PLAYBACK_POSITION_SECONDS && !isNearVideoEnd(time, getVideoDuration(video));
}

function shouldClearPlaybackPosition(video: HTMLVideoElement): boolean {
  const time = video.currentTime;
  return video.ended || (Number.isFinite(time) && isNearVideoEnd(time, getVideoDuration(video)));
}

function shouldRestorePlaybackPosition(entry: StoredPlaybackPosition, video: HTMLVideoElement): boolean {
  return (
    entry.time >= MIN_PLAYBACK_POSITION_SECONDS &&
    !isNearVideoEnd(entry.time, getVideoDuration(video) ?? entry.duration)
  );
}

function getPlaybackPositionRestoreTime(entry: StoredPlaybackPosition): number {
  return Math.max(0, entry.time - PLAYBACK_POSITION_RESTORE_OFFSET_SECONDS);
}

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.closest('[contenteditable="true"], [role="textbox"]') !== null
  );
}

async function ensureQualityMenuVisible(
  window: Window,
  playerContainer: HTMLElement
): Promise<HTMLElement | null> {
  const existingMenu = playerContainer.querySelector<HTMLElement>('.ytp-quality-menu');
  if (existingMenu) {
    return existingMenu;
  }

  const settingsButton = playerContainer.querySelector<HTMLElement>('.ytp-settings-button');
  if (!settingsButton) {
    return null;
  }

  settingsButton.click();

  const settingsMenu = await waitForElement<HTMLElement>(window, playerContainer, '.ytp-settings-menu', QUALITY_MENU_WAIT_MS);
  if (!settingsMenu) {
    return null;
  }

  const qualityMenuItem = getSettingsMenuItemForQuality(settingsMenu);
  if (!qualityMenuItem) {
    return null;
  }

  qualityMenuItem.click();
  return waitForElement<HTMLElement>(window, playerContainer, '.ytp-quality-menu', QUALITY_MENU_WAIT_MS);
}

export function startYouTubePlaybackSpeedControls(
  deps: YouTubePlaybackSpeedControlsDependencies = {}
): YouTubePlaybackSpeedControlsHandle {
  const resolvedDocument = getResolvedDocument(deps);
  const resolvedWindow = getResolvedWindow(deps);
  if (!resolvedDocument || !resolvedWindow) {
    return { destroy() {} };
  }

  const doc = resolvedDocument;
  const win = resolvedWindow;
  const globalWindow = win as Window & Record<string, unknown>;
  const existing = globalWindow[SENTINEL_KEY];
  if (existing && typeof existing === 'object' && 'destroy' in existing) {
    return existing as YouTubePlaybackSpeedControlsHandle;
  }

  let disposed = false;
  let scanQueued = false;
  let controlsState: ControlState = { video: null, controlsRoot: null, playerContainer: null };
  let boundVideo: HTMLVideoElement | null = null;
  let observer: MutationObserver | null = null;
  let qualityAttemptInFlight = false;
  let qualityRetryTimer: number | null = null;
  let qualityRequestToken = 0;
  let pendingQualityRequest: QualitySelectionRequest | null = null;
  let selectedQualityRequest: QualitySelectionRequest | null = null;
  let playbackPositionVideo: HTMLVideoElement | null = null;
  let playbackPositionVideoId: string | null = null;
  let playbackPositionSaveTimer: number | null = null;
  let playbackPositionRestore: ActivePlaybackPositionRestore | null = null;
  let playbackPositionSaveSuppressedUntil = 0;
  let activeSeekCountdown: ActiveSeekCountdown | null = null;
  let activeFastSeekCaptions: ActiveFastSeekCaptions | null = null;
  let initialPlaybackRateResetVideo: HTMLVideoElement | null = null;
  let initialPlaybackRateResetTimer: number | null = null;
  let initialPlaybackRateResetUntil = 0;
  let qualityCycleIndex = QUALITY_CYCLE.length - 1;
  let controlsPinned = false;
  let pinnedPlayerContainer: HTMLElement | null = null;
  let boundNativeSubtitlesButton: HTMLButtonElement | null = null;
  let musicModeEnabled = false;
  let musicModePlayerContainer: HTMLElement | null = null;
  let musicModeOverlay: HTMLElement | null = null;
  let musicModeVideoKey: string | null = null;
  let initialScanRetryTimer: number | null = null;
  let initialScanRetryCount = 0;
  let rescueScanTimer: number | null = null;
  let visibleControlBarSections: ControlBarSectionVisibility = DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS;

  const logger = deps.logger ?? console;
  const volumeBoostState = createVolumeBoostState(win, logger);
  let desiredVolume: number | null = null;
  let suppressNativeVolumeSyncUntil = 0;
  const storage = getResolvedStorage(deps, win);
  const host = doc.createElement('div');
  host.setAttribute(HOST_ATTR, '1');

  function applyHostLayoutStyles(): void {
    const importantStyles: Record<string, string> = {
      position: 'absolute',
      left: '0',
      right: '0',
      top: 'auto',
      bottom: `${HOST_BOTTOM_OFFSET_PX}px`,
      'z-index': '2147483647',
      width: '100%',
      height: `${HOST_HEIGHT_PX}px`,
      'box-sizing': 'border-box',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      overflow: 'visible'
    };

    for (const [propertyName, propertyValue] of Object.entries(importantStyles)) {
      host.style.setProperty(propertyName, propertyValue, 'important');
    }
  }

  applyHostLayoutStyles();

  function ensurePlayerContainerCanAnchorHost(playerContainer: HTMLElement): void {
    const position = win.getComputedStyle(playerContainer).position;
    if (!position || position === 'static') {
      playerContainer.style.setProperty('position', 'relative', 'important');
    }
  }

  const moreVideosHideSelectors = YOUTUBE_MORE_VIDEOS_LABELS.flatMap((label) => {
    const escapedLabel = label.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return [
      `.html5-video-player.ytp-fullscreen .ytp-button[aria-label="${escapedLabel}"]`,
      `.html5-video-player.ytp-fullscreen .ytp-button[title="${escapedLabel}"]`
    ];
  }).join(',\n    ');

  const globalStyle = doc.createElement('style');
  globalStyle.id = GLOBAL_STYLE_ID;
  globalStyle.textContent = `
    .html5-video-player.ytp-fullscreen .ytp-fullscreen-grid-expand-button,
    ${moreVideosHideSelectors} {
      display: none !important;
    }

    .html5-video-player.${PINNED_PLAYER_CLASS} .ytp-chrome-bottom,
    .html5-video-player.${PINNED_PLAYER_CLASS} .ytp-chrome-top,
    .html5-video-player.${PINNED_PLAYER_CLASS} .ytp-chrome-controls,
    .html5-video-player.${PINNED_PLAYER_CLASS} .ytp-gradient-bottom,
    .html5-video-player.${PINNED_PLAYER_CLASS} .ytp-gradient-top,
    .html5-video-player.${PINNED_PLAYER_CLASS} .ytp-progress-bar-container {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      transform: none !important;
    }

    .html5-video-player.${PINNED_PLAYER_CLASS} .ytp-chrome-bottom {
      bottom: 0 !important;
    }

    .html5-video-player [${HOST_ATTR}] {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      transition: opacity 160ms ease, visibility 160ms ease;
    }

    .html5-video-player.ytp-autohide:not(.${PINNED_PLAYER_CLASS}) [${HOST_ATTR}] {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    .html5-video-player.${PINNED_PLAYER_CLASS} [${HOST_ATTR}] {
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    .html5-video-player.yt-playback-speed-fast-seek-captions .ytp-caption-window-container {
      opacity: 0 !important;
      visibility: hidden !important;
    }

    .html5-video-player.${MUSIC_MODE_CLASS} video {
      opacity: 0 !important;
      visibility: hidden !important;
    }

    .yt-playback-speed-music-overlay {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: block;
      background-color: #050505;
      background-position: center;
      background-repeat: no-repeat;
      background-size: contain;
      pointer-events: none;
    }

    .yt-playback-speed-music-overlay::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.34));
    }

    .yt-playback-speed-fast-seek-caption-overlay {
      position: absolute;
      left: 50%;
      bottom: 58px;
      z-index: 9998;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      width: min(86%, 960px);
      transform: translateX(-50%);
      pointer-events: none;
      color: #fff;
      font-family: Roboto, Arial, sans-serif;
      font-size: clamp(18px, 2.3vw, 32px);
      font-weight: 500;
      line-height: 1.28;
      text-align: center;
      text-shadow: 0 0 2px #000, 0 0 4px #000;
    }

    .yt-playback-speed-fast-seek-caption-overlay[data-visible="true"] {
      display: flex;
    }

    .yt-playback-speed-fast-seek-caption-line {
      width: max-content;
      max-width: 100%;
      box-sizing: border-box;
      padding: 2px 6px;
      border-radius: 2px;
      background: rgba(8, 8, 8, 0.82);
      white-space: normal;
      overflow-wrap: anywhere;
    }
  `;
  doc.getElementById(GLOBAL_STYLE_ID)?.remove();
  (doc.head ?? doc.documentElement).append(globalStyle);

  const shadow = host.attachShadow({ mode: 'open' });
  const style = doc.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      display: flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
      position: absolute;
      left: 0;
      bottom: ${HOST_BOTTOM_OFFSET_PX}px;
      z-index: 9999;
      width: 100%;
      height: ${HOST_HEIGHT_PX}px;
      box-sizing: border-box;
      padding: 0 8px;
      overflow: visible;
      pointer-events: auto;
    }

    .yt-speed-root {
      display: flex;
      align-items: center;
      align-self: center;
      gap: 8px;
      max-width: 100%;
      margin: 0;
      padding: 4px 6px;
      border: 1px solid var(--yt-controls-bar-border);
      border-radius: var(--yt-controls-border-radius);
      background: var(--yt-controls-bar-background);
      box-shadow: var(--yt-controls-bar-shadow);
      line-height: 1;
      font-family: Roboto, Arial, sans-serif;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      pointer-events: auto;
    }

    .yt-speed-root::-webkit-scrollbar {
      display: none;
    }

    .yt-seek-group,
    .yt-speed-group,
    .yt-volume-group,
    .yt-quality-group,
    .yt-music-group,
    .yt-captions-group,
    .yt-pin-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
    }

    .yt-seek-group {
      justify-content: center;
    }

    .yt-seek-group .yt-speed-button[aria-pressed="true"] {
      transform: translateY(1px);
      outline: 2px solid var(--yt-controls-focus-ring);
      outline-offset: 1px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.32);
    }

    .yt-speed-button {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--yt-controls-button-border);
      border-radius: var(--yt-controls-border-radius);
      min-width: 42px;
      height: 28px;
      padding: 0 10px;
      background: var(--yt-controls-button-background);
      color: var(--yt-controls-button-text);
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease;
      user-select: none;
    }

    .yt-seek-button-15 {
      background: var(--yt-controls-button-background);
    }

    .yt-seek-button-rewind-30 {
      background: #ffb3b3;
      border-color: #ff8585;
      color: #111111;
    }

    .yt-seek-button-rewind-60 {
      background: #ff7777;
      border-color: #f05252;
      color: #111111;
    }

    .yt-seek-button-forward-30 {
      background: #b9f6c7;
      border-color: #82e69a;
      color: #111111;
    }

    .yt-seek-button-forward-60 {
      background: #72d987;
      border-color: #43bd5c;
      color: #111111;
    }

    .yt-speed-rate {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 52px;
      height: 28px;
      padding: 0 10px;
      border: 1px solid var(--yt-controls-button-border);
      border-radius: var(--yt-controls-border-radius);
      background: var(--yt-controls-button-background);
      color: var(--yt-controls-button-text);
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease;
      user-select: none;
    }

    .yt-speed-rate[aria-pressed="true"] {
      transform: translateY(1px);
      outline: 2px solid var(--yt-controls-focus-ring);
      outline-offset: 1px;
      background: var(--yt-controls-active-background);
      border-color: var(--yt-controls-active-border);
      color: var(--yt-controls-active-text);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.24);
    }

    [data-role="volume-indicator"] {
      align-items: center;
      justify-content: center;
      min-width: 64px;
      width: 64px;
      height: 28px;
      padding: 0 8px;
      font-size: 12px;
      line-height: 1;
      text-align: center;
      letter-spacing: 0.02em;
    }

    [data-role="volume-indicator"][data-volume-boost-level="1"] {
      background: #ffe8ef;
      border-color: #fac8d6;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="2"] {
      background: #ffe1ea;
      border-color: #f6b5c8;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="3"] {
      background: #ffd9e3;
      border-color: #f2a9bd;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="4"] {
      background: #ffd1dc;
      border-color: #ee9db2;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="5"] {
      background: #ffc8d4;
      border-color: #ea91a7;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="6"] {
      background: #ffbecb;
      border-color: #e6849c;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="7"] {
      background: #ffb4c2;
      border-color: #e27791;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="8"] {
      background: #ffa9b8;
      border-color: #de6a86;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="9"] {
      background: #ff9dad;
      border-color: #da5d7b;
      color: #5f1630;
    }

    [data-role="volume-indicator"][data-volume-boost-level="10"] {
      background: #ff90a1;
      border-color: #d65070;
      color: #5f1630;
    }

    .yt-volume-group .yt-speed-button {
      min-width: 64px;
      width: 64px;
      padding: 0 8px;
    }

    .yt-volume-group .yt-speed-rate {
      cursor: pointer;
      pointer-events: auto;
    }

    .yt-speed-divider {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--yt-controls-divider-color);
      font-size: 14px;
      font-weight: 400;
      line-height: 1;
      padding: 0 2px;
      user-select: none;
      pointer-events: none;
      align-self: center;
    }

    .yt-quality-button,
    .yt-captions-button {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--yt-controls-button-border);
      border-radius: var(--yt-controls-border-radius);
      min-width: 46px;
      height: 28px;
      padding: 0 8px;
      background: var(--yt-controls-button-background);
      color: var(--yt-controls-button-text);
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease;
      user-select: none;
    }

    .yt-quality-button[aria-pressed="true"],
    .yt-captions-button[aria-pressed="true"] {
      background: var(--yt-controls-active-background);
      border-color: var(--yt-controls-active-border);
      color: var(--yt-controls-active-text);
      box-shadow: var(--yt-controls-active-shadow);
    }

    .yt-captions-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .yt-music-button,
    .yt-pin-button {
      appearance: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      min-width: 30px;
      height: 28px;
      padding: 0;
      border: 1px solid var(--yt-controls-button-border);
      border-radius: var(--yt-controls-border-radius);
      background: var(--yt-controls-button-background);
      color: var(--yt-controls-button-text);
      cursor: pointer;
      transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease, color 120ms ease;
      user-select: none;
    }

    .yt-music-button svg,
    .yt-pin-button svg {
      width: 15px;
      height: 15px;
      display: block;
      pointer-events: none;
    }

    .yt-music-button[aria-pressed="true"],
    .yt-pin-button[aria-pressed="true"] {
      background: var(--yt-controls-active-background);
      border-color: var(--yt-controls-active-border);
      color: var(--yt-controls-active-text);
      box-shadow: var(--yt-controls-active-shadow);
    }

    .yt-speed-button:hover {
      background: var(--yt-controls-button-hover-background);
      border-color: var(--yt-controls-active-border);
      transform: translateY(-1px);
    }

    .yt-seek-button-15:hover {
      background: var(--yt-controls-button-hover-background);
    }

    .yt-seek-button-rewind-30:hover {
      background: #ffa0a0;
      border-color: #ff7474;
    }

    .yt-seek-button-rewind-60:hover {
      background: #ff6767;
      border-color: #e84747;
    }

    .yt-seek-button-forward-30:hover {
      background: #a7f0b8;
      border-color: #70da89;
    }

    .yt-seek-button-forward-60:hover {
      background: #62ce78;
      border-color: #39ad52;
    }

    .yt-speed-rate:hover {
      background: var(--yt-controls-button-hover-background);
      border-color: var(--yt-controls-active-border);
      transform: translateY(-1px);
    }

    .yt-quality-button:hover,
    .yt-captions-button:hover:not(:disabled) {
      background: var(--yt-controls-button-hover-background);
      border-color: var(--yt-controls-active-border);
      transform: translateY(-1px);
    }

    .yt-quality-button[aria-pressed="true"]:hover,
    .yt-captions-button[aria-pressed="true"]:hover {
      background: var(--yt-controls-active-background);
      border-color: var(--yt-controls-active-border);
    }

    .yt-music-button:hover,
    .yt-pin-button:hover {
      background: var(--yt-controls-button-hover-background);
      border-color: var(--yt-controls-active-border);
      transform: translateY(-1px);
    }

    .yt-music-button[aria-pressed="true"]:hover,
    .yt-pin-button[aria-pressed="true"]:hover {
      background: var(--yt-controls-active-background);
      border-color: var(--yt-controls-active-border);
    }

    .yt-speed-button:active {
      transform: translateY(0);
    }

    .yt-speed-rate:active {
      transform: translateY(0);
    }

    .yt-quality-button:active,
    .yt-captions-button:active {
      transform: translateY(0);
    }

    .yt-music-button:active,
    .yt-pin-button:active {
      transform: translateY(0);
    }

    .yt-speed-button:focus-visible {
      outline: 2px solid var(--yt-controls-focus-ring);
      outline-offset: 2px;
    }

    .yt-speed-rate:focus-visible {
      outline: 2px solid var(--yt-controls-focus-ring);
      outline-offset: 2px;
    }

    .yt-quality-button:focus-visible,
    .yt-captions-button:focus-visible {
      outline: 2px solid var(--yt-controls-focus-ring);
      outline-offset: 2px;
    }

    .yt-music-button:focus-visible,
    .yt-pin-button:focus-visible {
      outline: 2px solid var(--yt-controls-focus-ring);
      outline-offset: 2px;
    }
  `;

  const root = doc.createElement('div');
  root.className = 'yt-speed-root';

  function applyControlsThemePreference(value: unknown): void {
    const theme = getControlsTheme(value);
    root.dataset.theme = theme.id;
    for (const [propertyName, propertyValue] of Object.entries(getControlsThemeCssProperties(theme))) {
      root.style.setProperty(propertyName, propertyValue);
    }
  }

  function getChromeStorageArea(): chrome.storage.StorageArea | null {
    return globalThis.chrome?.storage?.local ?? null;
  }

  function readStoredControlsThemePreference(): Promise<unknown> {
    const storageArea = getChromeStorageArea();
    if (!storageArea) {
      return Promise.resolve(DEFAULT_CONTROLS_THEME_ID);
    }

    return new Promise((resolve) => {
      try {
        storageArea.get({ [CONTROLS_THEME_STORAGE_KEY]: DEFAULT_CONTROLS_THEME_ID }, (items) => {
          try {
            resolve(items?.[CONTROLS_THEME_STORAGE_KEY] ?? DEFAULT_CONTROLS_THEME_ID);
          } catch {
            resolve(DEFAULT_CONTROLS_THEME_ID);
          }
        });
      } catch {
        resolve(DEFAULT_CONTROLS_THEME_ID);
      }
    });
  }

  function onControlsThemeStorageChanged(
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: chrome.storage.AreaName
  ): void {
    if (areaName !== 'local') {
      return;
    }

    const themeChange = changes[CONTROLS_THEME_STORAGE_KEY];
    if (themeChange) {
      applyControlsThemePreference(themeChange.newValue);
    }
  }

  function bindControlsThemePreferenceStorage(): void {
    try {
      globalThis.chrome?.storage?.onChanged?.addListener(onControlsThemeStorageChanged);
    } catch {
      // Ignore unavailable extension APIs; the default theme keeps the controls usable.
    }
  }

  function unbindControlsThemePreferenceStorage(): void {
    try {
      globalThis.chrome?.storage?.onChanged?.removeListener(onControlsThemeStorageChanged);
    } catch {
      // Ignore unavailable extension APIs during teardown.
    }
  }

  function readStoredControlBarSectionPreference(): Promise<unknown> {
    const storageArea = getChromeStorageArea();
    if (!storageArea) {
      return Promise.resolve(DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS);
    }

    return new Promise((resolve) => {
      try {
        storageArea.get({ [CONTROL_BAR_SECTION_STORAGE_KEY]: DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS }, (items) => {
          resolve(items?.[CONTROL_BAR_SECTION_STORAGE_KEY] ?? DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS);
        });
      } catch {
        resolve(DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS);
      }
    });
  }

  applyControlsThemePreference(DEFAULT_CONTROLS_THEME_ID);
  bindControlsThemePreferenceStorage();
  void readStoredControlsThemePreference().then((value) => {
    if (!disposed) {
      applyControlsThemePreference(value);
    }
  });

  const seekGroup = doc.createElement('div');
  seekGroup.className = 'yt-seek-group';
  seekGroup.dataset.role = 'seek-group';

  const speedGroup = doc.createElement('div');
  speedGroup.className = 'yt-speed-group';
  speedGroup.dataset.role = 'speed-group';

  const decreaseButton = doc.createElement('button');
  decreaseButton.type = 'button';
  decreaseButton.className = 'yt-speed-button';
  decreaseButton.textContent = getI18nMessageSafe('speedDecreaseLabel');
  decreaseButton.title = getI18nMessageSafe('speedDecreaseTitle');

  const rewindButton = doc.createElement('button');
  rewindButton.type = 'button';
  rewindButton.className = 'yt-speed-button yt-seek-button-15';
  rewindButton.setAttribute('aria-pressed', 'false');
  rewindButton.textContent = getI18nMessageSafe('seekRewind15Label');
  rewindButton.title = getI18nMessageSafe('seekRewind15Title');

  const rewindLargeButton = doc.createElement('button');
  rewindLargeButton.type = 'button';
  rewindLargeButton.className = 'yt-speed-button yt-seek-button-rewind-30';
  rewindLargeButton.setAttribute('aria-pressed', 'false');
  rewindLargeButton.textContent = getI18nMessageSafe('seekRewind30Label');
  rewindLargeButton.title = getI18nMessageSafe('seekRewind30Title');

  const rewindExtraLargeButton = doc.createElement('button');
  rewindExtraLargeButton.type = 'button';
  rewindExtraLargeButton.className = 'yt-speed-button yt-seek-button-rewind-60';
  rewindExtraLargeButton.setAttribute('aria-pressed', 'false');
  rewindExtraLargeButton.textContent = getI18nMessageSafe('seekRewind60Label');
  rewindExtraLargeButton.title = getI18nMessageSafe('seekRewind60Title');

  const increaseButton = doc.createElement('button');
  increaseButton.type = 'button';
  increaseButton.className = 'yt-speed-button';
  increaseButton.textContent = getI18nMessageSafe('speedIncreaseLabel');
  increaseButton.title = getI18nMessageSafe('speedIncreaseTitle');

  const forwardButton = doc.createElement('button');
  forwardButton.type = 'button';
  forwardButton.className = 'yt-speed-button yt-seek-button-15';
  forwardButton.setAttribute('aria-pressed', 'false');
  forwardButton.textContent = getI18nMessageSafe('seekForward15Label');
  forwardButton.title = getI18nMessageSafe('seekForward15Title');

  const forwardLargeButton = doc.createElement('button');
  forwardLargeButton.type = 'button';
  forwardLargeButton.className = 'yt-speed-button yt-seek-button-forward-30';
  forwardLargeButton.setAttribute('aria-pressed', 'false');
  forwardLargeButton.textContent = getI18nMessageSafe('seekForward30Label');
  forwardLargeButton.title = getI18nMessageSafe('seekForward30Title');

  const forwardExtraLargeButton = doc.createElement('button');
  forwardExtraLargeButton.type = 'button';
  forwardExtraLargeButton.className = 'yt-speed-button yt-seek-button-forward-60';
  forwardExtraLargeButton.setAttribute('aria-pressed', 'false');
  forwardExtraLargeButton.textContent = getI18nMessageSafe('seekForward60Label');
  forwardExtraLargeButton.title = getI18nMessageSafe('seekForward60Title');

  const rateIndicator = doc.createElement('button');
  rateIndicator.type = 'button';
  rateIndicator.className = 'yt-speed-rate';
  rateIndicator.dataset.role = 'rate-indicator';
  rateIndicator.setAttribute('aria-live', 'polite');
  rateIndicator.setAttribute('aria-atomic', 'true');
  rateIndicator.setAttribute('aria-pressed', 'false');
  rateIndicator.setAttribute('aria-label', getI18nMessageSafe('rateResetAriaLabel'));
  rateIndicator.title = getI18nMessageSafe('rateResetTitle');
  rateIndicator.textContent = formatPlaybackRate(1);

  const divider = doc.createElement('span');
  divider.className = 'yt-speed-divider';
  divider.dataset.role = 'divider';
  divider.setAttribute('aria-hidden', 'true');
  divider.textContent = '|';

  const qualityGroup = doc.createElement('div');
  qualityGroup.className = 'yt-quality-group';
  qualityGroup.dataset.role = 'quality-group';

  const volumeGroup = doc.createElement('div');
  volumeGroup.className = 'yt-volume-group';
  volumeGroup.dataset.role = 'volume-group';

  const musicGroup = doc.createElement('div');
  musicGroup.className = 'yt-music-group';
  musicGroup.dataset.role = 'music-group';

  const captionsGroup = doc.createElement('div');
  captionsGroup.className = 'yt-captions-group';
  captionsGroup.dataset.role = 'captions-group';

  const pinGroup = doc.createElement('div');
  pinGroup.className = 'yt-pin-group';
  pinGroup.dataset.role = 'pin-group';

  const sectionGroups: Record<ControlBarSectionId, HTMLElement> = {
    time: seekGroup,
    speed: speedGroup,
    volume: volumeGroup,
    quality: qualityGroup,
    music: musicGroup,
    captions: captionsGroup,
    pin: pinGroup
  };

  function renderVisibleControlBarSections(): void {
    const visibleGroups = CONTROL_BAR_SECTION_IDS.filter((sectionId) => visibleControlBarSections[sectionId]).map(
      (sectionId) => sectionGroups[sectionId]
    );
    const children = visibleGroups.flatMap((group, index) => (index === 0 ? [group] : [divider.cloneNode(true), group]));

    for (const sectionId of CONTROL_BAR_SECTION_IDS) {
      const group = sectionGroups[sectionId];
      const visible = visibleControlBarSections[sectionId];
      group.hidden = !visible;
      group.dataset.visible = visible ? 'true' : 'false';
    }

    root.replaceChildren(...children);
  }

  function applyControlBarSectionPreference(value: unknown): void {
    visibleControlBarSections = normalizeControlBarSectionVisibility(value);
    renderVisibleControlBarSections();
  }

  function onControlBarSectionStorageChanged(
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: chrome.storage.AreaName
  ): void {
    if (areaName !== 'local') {
      return;
    }

    const sectionChange = changes[CONTROL_BAR_SECTION_STORAGE_KEY];
    if (sectionChange) {
      applyControlBarSectionPreference(sectionChange.newValue);
    }
  }

  function bindControlBarSectionPreferenceStorage(): void {
    try {
      globalThis.chrome?.storage?.onChanged?.addListener(onControlBarSectionStorageChanged);
    } catch {
      // Ignore unavailable extension APIs; default visible sections keep controls usable.
    }
  }

  function unbindControlBarSectionPreferenceStorage(): void {
    try {
      globalThis.chrome?.storage?.onChanged?.removeListener(onControlBarSectionStorageChanged);
    } catch {
      // Ignore unavailable extension APIs during teardown.
    }
  }

  function bindRateButton(button: HTMLButtonElement, clickDelta: number, contextMenuDelta: number): void {
    const applyClickDelta = (event: MouseEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      applyRateDelta(clickDelta);
    };

    const applyContextMenuDelta = (event: MouseEvent): void => {
      event.preventDefault();
      event.stopPropagation();
      applyRateDelta(contextMenuDelta);
    };

    button.addEventListener('click', applyClickDelta);
    button.addEventListener('contextmenu', applyContextMenuDelta);
  }

  function suppressNativeVolumeSync(): void {
    suppressNativeVolumeSyncUntil = Date.now() + 500;
  }

  function setNativeVolume(video: HTMLVideoElement, volume: number): void {
    const nativeVolume = Math.min(MAX_NATIVE_MEDIA_VOLUME, clampMediaVolume(volume));
    if (video.volume === nativeVolume) return;
    suppressNativeVolumeSync();
    video.volume = nativeVolume;
  }

  function applyDesiredVolume(video: HTMLVideoElement): void {
    const nextDesiredVolume = clampMediaVolume(desiredVolume ?? video.volume);
    const boostApplied = applyVolumeBoost(volumeBoostState, video, nextDesiredVolume);
    desiredVolume = boostApplied ? nextDesiredVolume : MAX_NATIVE_MEDIA_VOLUME;
    setNativeVolume(video, desiredVolume);
    updateVolumeIndicator(video);
  }

  async function applyVolumeDelta(delta: number): Promise<void> {
    const activeVideo = controlsState.video ?? boundVideo ?? findActiveVideo(doc);
    if (!activeVideo) {
      logger.warn?.('Could not find the active YouTube video.');
      return;
    }

    const shouldUnmute = delta > 0 && activeVideo.muted;
    desiredVolume = adjustMediaVolume(desiredVolume ?? activeVideo.volume, delta);
    applyDesiredVolume(activeVideo);
    if (shouldUnmute) {
      suppressNativeVolumeSync();
      activeVideo.muted = false;
    }
    await resumeVolumeBoostContext(volumeBoostState);
    updateVolumeIndicator(activeVideo);
  }

  function resetVolumeToDefault(): void {
    const activeVideo = controlsState.video ?? boundVideo ?? findActiveVideo(doc);
    if (!activeVideo) {
      logger.warn?.('Could not find the active YouTube video.');
      return;
    }

    desiredVolume = 1;
    applyDesiredVolume(activeVideo);
    if (activeVideo.muted) {
      suppressNativeVolumeSync();
      activeVideo.muted = false;
    }
    updateVolumeIndicator(activeVideo);
  }

  function bindVolumeButton(button: HTMLButtonElement, clickDelta: number, contextMenuDelta: number): void {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void applyVolumeDelta(clickDelta);
    });
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      void applyVolumeDelta(contextMenuDelta);
    });
  }

  function bindSeekButton(button: HTMLButtonElement, deltaSeconds: number, enableRightClickFastSeek = true): void {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      seekBySeconds(deltaSeconds);
    });

    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!enableRightClickFastSeek) {
        return;
      }

      if (activeSeekCountdown?.button === button) {
        clearSeekCountdown();
        return;
      }

      seekBySecondsWithCountdown(deltaSeconds, button);
    });
  }

  bindRateButton(decreaseButton, -STEP, -LARGE_STEP);

  bindSeekButton(rewindButton, -SEEK_STEP_SECONDS, false);
  bindSeekButton(rewindLargeButton, -SEEK_LARGE_STEP_SECONDS, false);
  bindSeekButton(rewindExtraLargeButton, -SEEK_EXTRA_LARGE_STEP_SECONDS, false);

  bindRateButton(increaseButton, STEP, LARGE_STEP);

  bindSeekButton(forwardButton, SEEK_STEP_SECONDS);
  bindSeekButton(forwardLargeButton, SEEK_LARGE_STEP_SECONDS);
  bindSeekButton(forwardExtraLargeButton, SEEK_EXTRA_LARGE_STEP_SECONDS);

  rateIndicator.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    resetPlaybackRate();
  });

  const volumeDecreaseButton = doc.createElement('button');
  volumeDecreaseButton.type = 'button';
  volumeDecreaseButton.className = 'yt-speed-button';
  volumeDecreaseButton.dataset.role = 'volume-button';
  volumeDecreaseButton.textContent = getI18nMessageSafe('volumeDecreaseLabel');
  volumeDecreaseButton.title = getI18nMessageSafe('volumeDecreaseTitle');

  const volumeIndicator = doc.createElement('button');
  volumeIndicator.type = 'button';
  volumeIndicator.className = 'yt-speed-rate';
  volumeIndicator.dataset.role = 'volume-indicator';
  volumeIndicator.setAttribute('aria-live', 'polite');
  volumeIndicator.setAttribute('aria-atomic', 'true');
  volumeIndicator.textContent = formatMediaVolumePercent(1);
  volumeIndicator.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    resetVolumeToDefault();
  });

  const volumeIncreaseButton = doc.createElement('button');
  volumeIncreaseButton.type = 'button';
  volumeIncreaseButton.className = 'yt-speed-button';
  volumeIncreaseButton.dataset.role = 'volume-button';
  volumeIncreaseButton.textContent = getI18nMessageSafe('volumeIncreaseLabel');
  volumeIncreaseButton.title = getI18nMessageSafe('volumeIncreaseTitle');

  bindVolumeButton(volumeDecreaseButton, -VOLUME_STEP, -VOLUME_LARGE_STEP);
  bindVolumeButton(volumeIncreaseButton, VOLUME_STEP, VOLUME_LARGE_STEP);
  volumeGroup.append(volumeDecreaseButton, volumeIndicator, volumeIncreaseButton);

  const autoButton = doc.createElement('button');
  autoButton.type = 'button';
  autoButton.className = 'yt-quality-button';
  autoButton.dataset.role = 'quality-button';
  autoButton.dataset.requestedQuality = 'auto';
  autoButton.setAttribute('aria-pressed', 'false');
  autoButton.textContent = getI18nMessageSafe('qualityAutoLabel');
  autoButton.title = getI18nMessageSafe('qualityAutoTitle');
  autoButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    requestAutoQualitySelection();
  });

  qualityGroup.append(autoButton);

  for (const targetResolution of QUALITY_TARGETS) {
    const button = doc.createElement('button');
    button.type = 'button';
    button.className = 'yt-quality-button';
    button.dataset.role = 'quality-button';
    button.dataset.requestedQuality = 'resolution';
    button.dataset.requestedResolution = String(targetResolution);
    button.setAttribute('aria-pressed', 'false');
    button.textContent = `${targetResolution}p`;
    button.title = getI18nMessageSafe('qualityResolutionTitle', [String(targetResolution)]);
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      requestQualitySelection(targetResolution);
    });
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
      qualityCycleIndex = (qualityCycleIndex + 1) % QUALITY_CYCLE.length;
      const cycledResolution = QUALITY_CYCLE[qualityCycleIndex];
      button.textContent = `${cycledResolution}p`;
      button.dataset.requestedResolution = String(cycledResolution);
      button.title = getI18nMessageSafe('qualityResolutionTitle', [String(cycledResolution)]);
      requestQualitySelection(cycledResolution);
    });
    qualityGroup.append(button);
  }

  const musicButton = doc.createElement('button');
  musicButton.type = 'button';
  musicButton.className = 'yt-music-button';
  musicButton.dataset.role = 'music-button';
  musicButton.setAttribute('aria-pressed', 'false');
  musicButton.setAttribute('aria-label', getI18nMessageSafe('musicModeEnableAriaLabel'));
  musicButton.title = getI18nMessageSafe('musicModeEnableTitle');

  const musicIcon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  musicIcon.setAttribute('viewBox', '0 0 24 24');
  musicIcon.setAttribute('fill', 'none');
  musicIcon.setAttribute('stroke', 'currentColor');
  musicIcon.setAttribute('stroke-width', '2');
  musicIcon.setAttribute('stroke-linecap', 'round');
  musicIcon.setAttribute('stroke-linejoin', 'round');
  musicIcon.setAttribute('aria-hidden', 'true');
  const musicPath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  musicPath.setAttribute('d', 'M9 18V5l12-2v13');
  const musicCircleLeft = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
  musicCircleLeft.setAttribute('cx', '6');
  musicCircleLeft.setAttribute('cy', '18');
  musicCircleLeft.setAttribute('r', '3');
  const musicCircleRight = doc.createElementNS('http://www.w3.org/2000/svg', 'circle');
  musicCircleRight.setAttribute('cx', '18');
  musicCircleRight.setAttribute('cy', '16');
  musicCircleRight.setAttribute('r', '3');
  musicIcon.append(musicPath, musicCircleLeft, musicCircleRight);
  musicButton.append(musicIcon);

  musicButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMusicModeEnabled(!musicModeEnabled);
  });
  musicGroup.append(musicButton);

  const captionsButton = doc.createElement('button');
  captionsButton.type = 'button';
  captionsButton.className = 'yt-captions-button';
  captionsButton.dataset.role = 'captions-button';
  captionsButton.setAttribute('aria-pressed', 'false');
  captionsButton.textContent = getI18nMessageSafe('captionsButtonLabel');
  captionsButton.title = getI18nMessageSafe('captionsEnableTitle');
  captionsButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggleCaptions();
  });
  captionsGroup.append(captionsButton);

  const pinButton = doc.createElement('button');
  pinButton.type = 'button';
  pinButton.className = 'yt-pin-button';
  pinButton.dataset.role = 'pin-button';
  pinButton.setAttribute('aria-pressed', 'false');
  pinButton.setAttribute('aria-label', getI18nMessageSafe('pinEnableAriaLabel'));
  pinButton.title = getI18nMessageSafe('pinEnableTitle');

  const pinIcon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  pinIcon.setAttribute('viewBox', '0 0 24 24');
  pinIcon.setAttribute('fill', 'none');
  pinIcon.setAttribute('stroke', 'currentColor');
  pinIcon.setAttribute('stroke-width', '2');
  pinIcon.setAttribute('stroke-linecap', 'round');
  pinIcon.setAttribute('stroke-linejoin', 'round');
  pinIcon.setAttribute('aria-hidden', 'true');
  const pinPath = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
  pinPath.setAttribute('d', 'M12 17v5M5 17h14l-3.5-4V5.5L17 4V2H7v2l1.5 1.5V13L5 17Z');
  pinIcon.append(pinPath);
  pinButton.append(pinIcon);

  pinButton.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    setControlsPinned(!controlsPinned);
  });
  pinGroup.append(pinButton);

  seekGroup.append(rewindExtraLargeButton, rewindLargeButton, rewindButton, forwardButton, forwardLargeButton, forwardExtraLargeButton);
  speedGroup.append(decreaseButton, rateIndicator, increaseButton);
  renderVisibleControlBarSections();
  bindControlBarSectionPreferenceStorage();
  void readStoredControlBarSectionPreference().then((value) => {
    if (!disposed) {
      applyControlBarSectionPreference(value);
    }
  });
  shadow.append(style, root);

  function clearQualityRetryTimer(): void {
    if (qualityRetryTimer !== null) {
      win.clearTimeout(qualityRetryTimer);
      qualityRetryTimer = null;
    }
  }

  function clearPlaybackPositionSaveTimer(): void {
    if (playbackPositionSaveTimer !== null) {
      win.clearInterval(playbackPositionSaveTimer);
      playbackPositionSaveTimer = null;
    }
  }

  function clearPlaybackPositionRestore(): void {
    playbackPositionRestore?.cleanup();
    playbackPositionRestore = null;
  }

  function normalizeCaptionDisplayText(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  function getNativeCaptionLines(container: HTMLElement | null): string[] {
    if (!container) {
      return [];
    }

    const segmentLines = Array.from(container.querySelectorAll<HTMLElement>('.ytp-caption-segment'))
      .map((segment) => normalizeCaptionDisplayText(segment.textContent ?? ''))
      .filter(Boolean);
    if (segmentLines.length > 0) {
      return segmentLines;
    }

    const fallbackText = normalizeCaptionDisplayText(container.textContent ?? '');
    return fallbackText ? [fallbackText] : [];
  }

  function getCueText(cue: TextTrackCue): string {
    const cueWithText = cue as TextTrackCue & { text?: unknown; getCueAsHTML?: () => DocumentFragment };
    if (typeof cueWithText.text === 'string') {
      return cueWithText.text;
    }

    const cueFragment = cueWithText.getCueAsHTML?.();
    return cueFragment?.textContent ?? '';
  }

  function getActiveTextTrackCaptionLines(video: HTMLVideoElement): string[] {
    const tracks = video.textTracks;
    const lines: string[] = [];

    for (let trackIndex = 0; trackIndex < tracks.length; trackIndex += 1) {
      const track = tracks[trackIndex];
      if (!track || track.mode === 'disabled' || !['captions', 'subtitles'].includes(track.kind)) {
        continue;
      }

      const activeCues = track.activeCues;
      if (!activeCues) {
        continue;
      }

      for (let cueIndex = 0; cueIndex < activeCues.length; cueIndex += 1) {
        const cue = activeCues[cueIndex];
        if (!cue) {
          continue;
        }

        const cueLines = getCueText(cue)
          .split(/\r?\n/)
          .map(normalizeCaptionDisplayText)
          .filter(Boolean);
        lines.push(...cueLines);
      }
    }

    return lines;
  }

  function renderFastSeekCaptions(): void {
    const captions = activeFastSeekCaptions;
    if (!captions) {
      return;
    }

    captions.overlay.replaceChildren(
      ...captions.lines.map((line) => {
        const lineElement = doc.createElement('span');
        lineElement.className = 'yt-playback-speed-fast-seek-caption-line';
        lineElement.textContent = line;
        return lineElement;
      })
    );
    captions.overlay.dataset.visible = captions.lines.length > 0 ? 'true' : 'false';
  }

  function captureFastSeekCaptions(): void {
    const captions = activeFastSeekCaptions;
    if (!captions) {
      return;
    }

    const textTrackLines = getActiveTextTrackCaptionLines(captions.video);
    captions.nativeCaptionContainer = findYouTubeCaptionContainer(captions.playerContainer);
    const nextLines = textTrackLines.length > 0 ? textTrackLines : getNativeCaptionLines(captions.nativeCaptionContainer);
    const normalizedText = nextLines.map(normalizeText).join('\n');
    if (!normalizedText || normalizedText === captions.lastNormalizedText) {
      return;
    }

    captions.lastNormalizedText = normalizedText;
    for (const line of nextLines) {
      const key = normalizeText(line);
      if (!key || captions.lineKeys.has(key)) {
        continue;
      }

      captions.lines.push(line);
      captions.lineKeys.add(key);
      while (captions.lines.length > FAST_SEEK_CAPTION_MAX_LINES) {
        const removedLine = captions.lines.shift();
        if (removedLine) {
          captions.lineKeys.delete(normalizeText(removedLine));
        }
      }
    }

    renderFastSeekCaptions();
  }

  function clearFastSeekCaptions(): void {
    if (!activeFastSeekCaptions) {
      return;
    }

    const captions = activeFastSeekCaptions;
    activeFastSeekCaptions = null;
    captions.observer?.disconnect();
    captions.playerContainer.classList.remove('yt-playback-speed-fast-seek-captions');
    captions.overlay.remove();
  }

  function startFastSeekCaptions(video: HTMLVideoElement): void {
    clearFastSeekCaptions();

    const playerContainer = controlsState.playerContainer;
    const nativeSubtitlesButton = findYouTubeSubtitlesButton(playerContainer);
    if (!playerContainer || nativeSubtitlesButton?.getAttribute('aria-pressed') !== 'true') {
      return;
    }

    const overlay = doc.createElement('div');
    overlay.className = 'yt-playback-speed-fast-seek-caption-overlay';
    overlay.dataset.role = 'fast-seek-caption-overlay';
    overlay.dataset.visible = 'false';
    playerContainer.append(overlay);
    playerContainer.classList.add('yt-playback-speed-fast-seek-captions');

    activeFastSeekCaptions = {
      video,
      playerContainer,
      nativeCaptionContainer: findYouTubeCaptionContainer(playerContainer),
      overlay,
      lines: [],
      lineKeys: new Set(),
      lastNormalizedText: '',
      observer: null
    };

    const observerRoot = activeFastSeekCaptions.nativeCaptionContainer ?? playerContainer;
    activeFastSeekCaptions.observer = new MutationObserver(captureFastSeekCaptions);
    activeFastSeekCaptions.observer.observe(observerRoot, {
      childList: true,
      subtree: true,
      characterData: true
    });
    captureFastSeekCaptions();
  }

  function clearSeekCountdown(restorePlaybackRate = true): void {
    if (!activeSeekCountdown) {
      return;
    }

    const seekCountdown = activeSeekCountdown;
    activeSeekCountdown = null;

    if (seekCountdown.timer !== null) {
      win.clearInterval(seekCountdown.timer);
      seekCountdown.timer = null;
    }

    clearFastSeekCaptions();

    if (seekCountdown.button) {
      seekCountdown.button.textContent = seekCountdown.buttonLabel;
      seekCountdown.button.setAttribute('aria-pressed', 'false');
    }

    rateIndicator.setAttribute('aria-pressed', 'false');

    if (restorePlaybackRate) {
      seekCountdown.video.playbackRate = seekCountdown.previousPlaybackRate;
      updateRateIndicator(seekCountdown.video);
    }
  }

  function updateMusicButton(): void {
    musicButton.setAttribute('aria-pressed', musicModeEnabled ? 'true' : 'false');
    musicButton.setAttribute(
      'aria-label',
      getI18nMessageSafe(musicModeEnabled ? 'musicModeDisableAriaLabel' : 'musicModeEnableAriaLabel')
    );
    musicButton.title = getI18nMessageSafe(musicModeEnabled ? 'musicModeDisableTitle' : 'musicModeEnableTitle');
  }

  function clearMusicModeVisuals(): void {
    musicModeOverlay?.remove();
    musicModeOverlay = null;
    musicModePlayerContainer?.classList.remove(MUSIC_MODE_CLASS);
    musicModePlayerContainer = null;
    musicModeVideoKey = null;
  }

  function applyMusicModeState(): void {
    if (!musicModeEnabled) {
      clearMusicModeVisuals();
      return;
    }

    const video = controlsState.video ?? boundVideo ?? findActiveVideo(doc);
    const playerContainer = controlsState.playerContainer ?? findPlayerContainer(doc, video);
    if (!playerContainer) {
      return;
    }

    if (musicModePlayerContainer && musicModePlayerContainer !== playerContainer) {
      musicModePlayerContainer.classList.remove(MUSIC_MODE_CLASS);
      musicModeOverlay?.remove();
      musicModeOverlay = null;
    }

    musicModePlayerContainer = playerContainer;
    musicModePlayerContainer.classList.add(MUSIC_MODE_CLASS);

    if (!musicModeOverlay || musicModeOverlay.parentElement !== playerContainer) {
      musicModeOverlay?.remove();
      musicModeOverlay = doc.createElement('div');
      musicModeOverlay.className = 'yt-playback-speed-music-overlay';
      musicModeOverlay.dataset.role = 'music-overlay';
      musicModeOverlay.dataset.imageSource = 'none';
      playerContainer.append(musicModeOverlay);
    }

    const videoId = getCurrentVideoId();
    const videoKey = videoId ?? video?.currentSrc ?? win.location.href;
    if (musicModeVideoKey !== videoKey) {
      musicModeVideoKey = videoKey;
      musicModeOverlay.style.removeProperty('background-image');
      musicModeOverlay.dataset.imageSource = 'none';
      requestQualitySelection(MUSIC_MODE_TARGET_RESOLUTION);
    }
  }

  function setMusicModeEnabled(nextEnabled: boolean): void {
    if (musicModeEnabled === nextEnabled) {
      return;
    }

    musicModeEnabled = nextEnabled;
    updateMusicButton();

    if (musicModeEnabled) {
      musicModeVideoKey = null;
      applyMusicModeState();
      return;
    }

    clearMusicModeVisuals();
    requestAutoQualitySelection();
  }

  function updatePinButton(): void {
    pinButton.setAttribute('aria-pressed', controlsPinned ? 'true' : 'false');
    pinButton.setAttribute(
      'aria-label',
      getI18nMessageSafe(controlsPinned ? 'pinDisableAriaLabel' : 'pinEnableAriaLabel')
    );
    pinButton.title = getI18nMessageSafe(controlsPinned ? 'pinDisableTitle' : 'pinEnableTitle');
  }

  function applyPinnedControlsState(): void {
    const nextPlayerContainer = controlsPinned ? controlsState.playerContainer : null;

    if (pinnedPlayerContainer && pinnedPlayerContainer !== nextPlayerContainer) {
      pinnedPlayerContainer.classList.remove(PINNED_PLAYER_CLASS);
    }

    pinnedPlayerContainer = nextPlayerContainer;

    if (pinnedPlayerContainer) {
      pinnedPlayerContainer.classList.add(PINNED_PLAYER_CLASS);
    }
  }

  function setControlsPinned(nextPinned: boolean): void {
    controlsPinned = nextPinned;
    updatePinButton();
    applyPinnedControlsState();
  }

  function isSameQualityRequest(button: HTMLElement, request: QualitySelectionRequest | null): boolean {
    if (!request) {
      return false;
    }

    if (request.kind === 'auto') {
      return button.dataset.requestedQuality === 'auto';
    }

    return (
      button.dataset.requestedQuality === 'resolution' &&
      Number(button.dataset.requestedResolution) === request.requestedResolution
    );
  }

  function updateSelectedQualityButton(): void {
    const buttons = qualityGroup.querySelectorAll<HTMLElement>('[data-role="quality-button"]');
    for (const button of buttons) {
      button.setAttribute('aria-pressed', isSameQualityRequest(button, selectedQualityRequest) ? 'true' : 'false');
    }
  }

  function updateCaptionsButton(): void {
    const nativeSubtitlesButton = findYouTubeSubtitlesButton(controlsState.playerContainer);
    const captionsAvailable = nativeSubtitlesButton !== null;
    const captionsEnabled = nativeSubtitlesButton?.getAttribute('aria-pressed') === 'true';

    captionsButton.disabled = !captionsAvailable;
    captionsButton.setAttribute('aria-pressed', captionsEnabled ? 'true' : 'false');
    captionsButton.setAttribute(
      'aria-label',
      getI18nMessageSafe(captionsEnabled ? 'captionsDisableAriaLabel' : 'captionsEnableAriaLabel')
    );
    captionsButton.title = captionsAvailable
      ? getI18nMessageSafe(captionsEnabled ? 'captionsDisableTitle' : 'captionsEnableTitle')
      : getI18nMessageSafe('captionsUnavailableTitle');
  }

  function onNativeSubtitlesButtonClick(): void {
    win.setTimeout(updateCaptionsButton, 0);
  }

  function bindNativeSubtitlesButton(): void {
    const nativeSubtitlesButton = findYouTubeSubtitlesButton(controlsState.playerContainer);
    if (boundNativeSubtitlesButton === nativeSubtitlesButton) {
      updateCaptionsButton();
      return;
    }

    boundNativeSubtitlesButton?.removeEventListener('click', onNativeSubtitlesButtonClick);
    boundNativeSubtitlesButton = nativeSubtitlesButton;
    boundNativeSubtitlesButton?.addEventListener('click', onNativeSubtitlesButtonClick);
    updateCaptionsButton();
  }

  function toggleCaptions(): void {
    const nativeSubtitlesButton = findYouTubeSubtitlesButton(controlsState.playerContainer);
    if (!nativeSubtitlesButton) {
      updateCaptionsButton();
      logger.warn?.('Could not find the YouTube captions button.');
      return;
    }

    nativeSubtitlesButton.click();
    updateCaptionsButton();
    win.setTimeout(updateCaptionsButton, 0);
  }

  function setSelectedQualityRequest(request: QualitySelectionRequest): void {
    selectedQualityRequest =
      request.kind === 'auto' ? { kind: 'auto' } : { kind: 'resolution', requestedResolution: request.requestedResolution };
    updateSelectedQualityButton();
  }

  function scheduleQualityRetry(): void {
    if (disposed || pendingQualityRequest === null || qualityRetryTimer !== null) {
      return;
    }

    qualityRetryTimer = win.setTimeout(() => {
      qualityRetryTimer = null;
      void attemptPendingQualitySelection();
    }, QUALITY_RETRY_DELAY_MS);
  }

  function requestAutoQualitySelection(): void {
    pendingQualityRequest = { kind: 'auto' };
    qualityRequestToken += 1;
    clearQualityRetryTimer();
    void attemptPendingQualitySelection(qualityRequestToken);
  }

  function requestQualitySelection(requestedResolution: number): void {
    pendingQualityRequest = { kind: 'resolution', requestedResolution };
    qualityRequestToken += 1;
    clearQualityRetryTimer();
    void attemptPendingQualitySelection(qualityRequestToken);
  }

  async function attemptPendingQualitySelection(token = qualityRequestToken): Promise<void> {
    if (disposed || qualityAttemptInFlight || pendingQualityRequest === null) {
      return;
    }

    if (token !== qualityRequestToken) {
      return;
    }

    qualityAttemptInFlight = true;
    try {
      const request = pendingQualityRequest;

      const playerContainer =
        controlsState.playerContainer ?? findPlayerContainer(doc, controlsState.video ?? findActiveVideo(doc));

      if (playerContainer) {
        controlsState.playerContainer = playerContainer;
      } else {
        scheduleQualityRetry();
        return;
      }

      const qualityMenu = await ensureQualityMenuVisible(win, playerContainer);
      if (disposed || token !== qualityRequestToken || pendingQualityRequest !== request) {
        return;
      }

      if (!qualityMenu) {
        scheduleQualityRetry();
        return;
      }

      const options = getQualityOptionsFromMenu(qualityMenu);
      const choice =
        request.kind === 'auto'
          ? chooseAutoQualityOption(options)
          : chooseClosestQualityOption(request.requestedResolution, options);

      if (!choice || (request.kind === 'resolution' && choice.resolution === null)) {
        scheduleQualityRetry();
        return;
      }

      choice.element.click();

      if (token === qualityRequestToken && pendingQualityRequest === request) {
        setSelectedQualityRequest(request);
        pendingQualityRequest = null;
        clearQualityRetryTimer();
      }
    } catch (error) {
      logger.warn?.(error instanceof Error ? error.message : 'Could not change the resolution.');
      scheduleQualityRetry();
    } finally {
      qualityAttemptInFlight = false;

      if (!disposed && pendingQualityRequest !== null && token !== qualityRequestToken) {
        queueMicrotask(() => {
          void attemptPendingQualitySelection(qualityRequestToken);
        });
      }
    }
  }

  function updateRateIndicator(video: HTMLVideoElement | null = boundVideo ?? controlsState.video): void {
    rateIndicator.textContent = formatPlaybackRate(video?.playbackRate);
  }

  function onRateChange(): void {
    updateRateIndicator(boundVideo ?? controlsState.video);
  }

  function updateVolumeIndicator(video: HTMLVideoElement | null = boundVideo ?? controlsState.video): void {
    const volume = desiredVolume ?? video?.volume ?? 1;
    const muted = video?.muted ?? false;
    const boostLevel = !muted && volume > 1 ? Math.min(10, Math.max(1, Math.round((volume - 1) * 10))) : 0;
    volumeIndicator.textContent = formatMediaVolumePercent(volume, muted);
    volumeIndicator.dataset.volumeBoosted = boostLevel > 0 ? 'true' : 'false';
    volumeIndicator.dataset.volumeBoostLevel = String(boostLevel);
  }

  function onVolumeChange(): void {
    const activeVideo = boundVideo ?? controlsState.video;
    if (!activeVideo) return;
    const expectedNativeVolume = Math.min(MAX_NATIVE_MEDIA_VOLUME, desiredVolume ?? activeVideo.volume);
    if (Date.now() < suppressNativeVolumeSyncUntil && activeVideo.volume === expectedNativeVolume) {
      updateVolumeIndicator(activeVideo);
      return;
    }
    desiredVolume = clampMediaVolume(activeVideo.muted ? 0 : activeVideo.volume);
    resetVolumeBoost(volumeBoostState);
    updateVolumeIndicator(activeVideo);
  }

  function clearInitialPlaybackRateReset(): void {
    if (initialPlaybackRateResetTimer !== null) {
      win.clearInterval(initialPlaybackRateResetTimer);
      initialPlaybackRateResetTimer = null;
    }

    initialPlaybackRateResetVideo = null;
    initialPlaybackRateResetUntil = 0;
  }

  function enforceInitialPlaybackRate(): void {
    const video = initialPlaybackRateResetVideo;
    if (!video || Date.now() > initialPlaybackRateResetUntil) {
      clearInitialPlaybackRateReset();
      return;
    }

    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
    }
    updateRateIndicator(video);
  }

  function startInitialPlaybackRateReset(video: HTMLVideoElement): void {
    clearInitialPlaybackRateReset();
    initialPlaybackRateResetVideo = video;
    initialPlaybackRateResetUntil = Date.now() + INITIAL_PLAYBACK_RATE_RESET_WINDOW_MS;
    enforceInitialPlaybackRate();
    initialPlaybackRateResetTimer = win.setInterval(enforceInitialPlaybackRate, INITIAL_PLAYBACK_RATE_RESET_INTERVAL_MS);
  }

  function getCurrentVideoId(): string | null {
    return getYouTubeVideoIdFromUrl(win.location.href);
  }

  function replaceVisiblePlaybackUrl(videoId: string, nextUrl: string): void {
    if (getCurrentVideoId() !== videoId) {
      return;
    }

    const currentUrl = `${win.location.pathname}${win.location.search}${win.location.hash}`;
    if (nextUrl !== currentUrl) {
      originalReplaceState(win.history.state, '', nextUrl);
    }
  }

  function savePlaybackPosition(
    video: HTMLVideoElement | null = playbackPositionVideo,
    videoId: string | null = playbackPositionVideoId
  ): void {
    if (!video || !videoId) {
      return;
    }

    const time = video.currentTime;
    const restoreTime = playbackPositionRestore ? getPlaybackPositionRestoreTime(playbackPositionRestore.entry) : null;
    if (
      Date.now() < playbackPositionSaveSuppressedUntil &&
      playbackPositionRestore?.video === video &&
      playbackPositionRestore.videoId === videoId &&
      restoreTime !== null &&
      (!Number.isFinite(time) || time < restoreTime - PLAYBACK_POSITION_RESTORE_TOLERANCE_SECONDS)
    ) {
      return;
    }

    const shouldSave = shouldSavePlaybackPosition(video);
    const shouldClear = shouldClearPlaybackPosition(video);
    if (!shouldSave && !shouldClear) {
      return;
    }

    const url = shouldSave ? buildYouTubeWatchUrlWithTime(win.location.href, videoId, time) : null;
    if (!storage) {
      if (url) {
        replaceVisiblePlaybackUrl(videoId, url);
      }
      return;
    }

    void readPlaybackPositionStore(storage, logger).then((store) => {
      if (shouldClear) {
        delete store[videoId];
      } else if (url) {
        replaceVisiblePlaybackUrl(videoId, url);
        store[videoId] = {
          url,
          time,
          duration: getVideoDuration(video),
          updatedAt: Date.now()
        };
      }

      writePlaybackPositionStore(storage, store, logger);
    });
  }

  function startPlaybackPositionRestore(video: HTMLVideoElement, videoId: string, entry: StoredPlaybackPosition): void {
    clearPlaybackPositionRestore();

    const restoreEvents = ['loadedmetadata', 'durationchange', 'canplay', 'play', 'playing', 'timeupdate'] as const;
    const deadlineAt = Date.now() + PLAYBACK_POSITION_RESTORE_TIMEOUT_MS;
    const restoreTime = getPlaybackPositionRestoreTime(entry);
    playbackPositionSaveSuppressedUntil = deadlineAt + 1000;

    const restore: ActivePlaybackPositionRestore = {
      video,
      videoId,
      entry,
      deadlineAt,
      stableSince: null,
      reachedPosition: false,
      timer: null,
      cleanup() {
        if (restore.timer !== null) {
          win.clearInterval(restore.timer);
          restore.timer = null;
        }

        for (const eventName of restoreEvents) {
          video.removeEventListener(eventName, applyPosition);
        }

        if (playbackPositionRestore === restore) {
          playbackPositionRestore = null;
        }
      }
    };

    const isCurrentRestoreTarget = (): boolean =>
      !disposed &&
      playbackPositionVideo === video &&
      playbackPositionVideoId === videoId &&
      playbackPositionRestore === restore;

    function applyPosition(): void {
      if (!isCurrentRestoreTarget()) {
        restore.cleanup();
        return;
      }

      if (Date.now() > restore.deadlineAt || !shouldRestorePlaybackPosition(entry, video)) {
        restore.cleanup();
        return;
      }

      const distance = Math.abs(video.currentTime - restoreTime);
      if (distance <= PLAYBACK_POSITION_RESTORE_TOLERANCE_SECONDS) {
        restore.reachedPosition = true;
        restore.stableSince ??= Date.now();
        if (Date.now() - restore.stableSince >= PLAYBACK_POSITION_RESTORE_STABLE_MS) {
          restore.cleanup();
        }
        return;
      }

      if (restore.reachedPosition && video.currentTime > restoreTime + PLAYBACK_POSITION_RESTORE_TOLERANCE_SECONDS) {
        restore.cleanup();
        return;
      }

      restore.stableSince = null;
      try {
        video.currentTime = restoreTime;
        restore.reachedPosition = true;
      } catch {
        // YouTube may not have metadata ready yet. The interval/events will retry.
      }
    }

    playbackPositionRestore = restore;

    for (const eventName of restoreEvents) {
      video.addEventListener(eventName, applyPosition);
    }

    restore.timer = win.setInterval(applyPosition, PLAYBACK_POSITION_RESTORE_RETRY_MS);
    applyPosition();
  }

  function restorePlaybackPosition(video: HTMLVideoElement, videoId: string): void {
    const currentUrlTime = getPlaybackTimeFromUrl(win.location.href);
    if (currentUrlTime !== null) {
      const entryFromUrl: StoredPlaybackPosition = {
        url: buildYouTubeWatchUrlWithTime(win.location.href, videoId, currentUrlTime),
        time: currentUrlTime,
        duration: getVideoDuration(video),
        updatedAt: Date.now()
      };

      if (shouldRestorePlaybackPosition(entryFromUrl, video)) {
        startPlaybackPositionRestore(video, videoId, entryFromUrl);
      }
      return;
    }

    if (!storage) {
      return;
    }

    void readPlaybackPositionStore(storage, logger).then((store) => {
      const entry = store[videoId];
      if (
        disposed ||
        playbackPositionVideo !== video ||
        playbackPositionVideoId !== videoId ||
        !entry ||
        !shouldRestorePlaybackPosition(entry, video)
      ) {
        return;
      }

      const currentUrl = `${win.location.pathname}${win.location.search}${win.location.hash}`;
      if (entry.url !== currentUrl) {
        originalReplaceState(win.history.state, '', entry.url);
      }

      startPlaybackPositionRestore(video, videoId, entry);
    });
  }

  function onPlaybackPositionEvent(): void {
    savePlaybackPosition();
  }

  function bindPlaybackPositionVideo(video: HTMLVideoElement | null, videoId: string | null): void {
    if (playbackPositionVideo === video && playbackPositionVideoId === videoId) {
      return;
    }

    savePlaybackPosition();
    clearPlaybackPositionRestore();

    if (playbackPositionVideo) {
      playbackPositionVideo.removeEventListener('pause', onPlaybackPositionEvent);
      playbackPositionVideo.removeEventListener('ended', onPlaybackPositionEvent);
      playbackPositionVideo.removeEventListener('seeked', onPlaybackPositionEvent);
    }

    clearPlaybackPositionSaveTimer();
    playbackPositionVideo = video;
    playbackPositionVideoId = videoId;

    if (!playbackPositionVideo || !playbackPositionVideoId) {
      return;
    }

    startInitialPlaybackRateReset(playbackPositionVideo);

    playbackPositionVideo.addEventListener('pause', onPlaybackPositionEvent);
    playbackPositionVideo.addEventListener('ended', onPlaybackPositionEvent);
    playbackPositionVideo.addEventListener('seeked', onPlaybackPositionEvent);
    playbackPositionSaveTimer = win.setInterval(onPlaybackPositionEvent, PLAYBACK_POSITION_SAVE_INTERVAL_MS);
    restorePlaybackPosition(playbackPositionVideo, playbackPositionVideoId);
  }

  function bindVideo(video: HTMLVideoElement | null): void {
    if (boundVideo === video) {
      updateRateIndicator(video);
      if (video) applyDesiredVolume(video);
      return;
    }

    if (boundVideo) {
      clearSeekCountdown();
      resetVolumeBoost(volumeBoostState);
      boundVideo.removeEventListener('ratechange', onRateChange);
      boundVideo.removeEventListener('volumechange', onVolumeChange);
    }

    boundVideo = video;

    if (boundVideo) {
      desiredVolume ??= clampMediaVolume(boundVideo.volume);
      boundVideo.addEventListener('ratechange', onRateChange);
      boundVideo.addEventListener('volumechange', onVolumeChange);
      applyDesiredVolume(boundVideo);
    }

    updateRateIndicator(video);
    updateVolumeIndicator(video);
  }

  function applyRateDelta(delta: number): void {
    const activeVideo = controlsState.video ?? boundVideo ?? findActiveVideo(doc);
    if (!activeVideo) {
      logger.warn?.('Could not find the active YouTube video.');
      return;
    }

    clearSeekCountdown();
    clearInitialPlaybackRateReset();
    activeVideo.playbackRate = adjustPlaybackRate(activeVideo.playbackRate, delta);
    updateRateIndicator(activeVideo);
  }

  function resetPlaybackRate(): void {
    const activeVideo = controlsState.video ?? boundVideo ?? findActiveVideo(doc);
    if (!activeVideo) {
      logger.warn?.('Could not find the active YouTube video.');
      return;
    }

    clearSeekCountdown();
    clearInitialPlaybackRateReset();
    activeVideo.playbackRate = 1;
    updateRateIndicator(activeVideo);
  }

  function onKeyboardShortcut(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || isEditableKeyboardTarget(event.target)) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'x') {
      event.preventDefault();
      applyRateDelta(-STEP);
    } else if (key === 'c') {
      event.preventDefault();
      applyRateDelta(STEP);
    } else if (key === 'z') {
      event.preventDefault();
      event.stopPropagation();
      toggleCaptions();
    }
  }

  function seekBySeconds(deltaSeconds: number): void {
    const activeVideo = controlsState.video ?? boundVideo ?? findActiveVideo(doc);
    if (!activeVideo) {
      logger.warn?.('Could not find the active YouTube video.');
      return;
    }

    clearSeekCountdown();
    clearInitialPlaybackRateReset();
    clearPlaybackPositionRestore();
    const duration = getVideoDuration(activeVideo);
    const maxTime = duration ?? Number.POSITIVE_INFINITY;
    activeVideo.currentTime = Math.min(maxTime, Math.max(0, activeVideo.currentTime + deltaSeconds));
    savePlaybackPosition(activeVideo, getCurrentVideoId());
  }

  function formatSeekCountdownLabel(deltaSeconds: number, remainingSeconds: number): string {
    const roundedSeconds = Math.max(0, Math.ceil(remainingSeconds));
    return deltaSeconds < 0 ? `←${roundedSeconds}s` : `${roundedSeconds}s→`;
  }

  function updateSeekCountdown(video: HTMLVideoElement): void {
    const seekCountdown = activeSeekCountdown;
    if (!seekCountdown || seekCountdown.video !== video) {
      return;
    }

    const remainingSeconds = Math.abs(seekCountdown.targetTime - video.currentTime);
    if (seekCountdown.button) {
      seekCountdown.button.textContent = formatSeekCountdownLabel(seekCountdown.deltaSeconds, remainingSeconds);
    }

    captureFastSeekCaptions();
  }

  function finishSeekCountdown(video: HTMLVideoElement, targetTime: number): void {
    const seekCountdown = activeSeekCountdown;
    if (!seekCountdown || seekCountdown.video !== video) {
      return;
    }

    const wasPaused = seekCountdown.wasPaused;
    video.currentTime = targetTime;
    clearSeekCountdown();
    if (wasPaused) {
      video.pause();
    } else {
      void video.play?.();
    }
    savePlaybackPosition(video, getCurrentVideoId());
  }

  function startSeekCountdown(
    video: HTMLVideoElement,
    targetTime: number,
    deltaSeconds: number,
    button: HTMLButtonElement | null,
    previousPlaybackRate: number,
    wasPaused: boolean
  ): void {
    activeSeekCountdown = {
      video,
      targetTime,
      button,
      buttonLabel: button?.textContent ?? '',
      deltaSeconds,
      previousPlaybackRate,
      wasPaused,
      timer: null
    };
    button?.setAttribute('aria-pressed', 'true');
    rateIndicator.setAttribute('aria-pressed', 'true');
    updateSeekCountdown(video);
    startFastSeekCaptions(video);
  }

  function seekBySecondsWithCountdown(deltaSeconds: number, button: HTMLButtonElement | null = null): void {
    const activeVideo = controlsState.video ?? boundVideo ?? findActiveVideo(doc);
    if (!activeVideo) {
      logger.warn?.('Could not find the active YouTube video.');
      return;
    }

    clearSeekCountdown();
    clearInitialPlaybackRateReset();
    clearPlaybackPositionRestore();

    const duration = getVideoDuration(activeVideo);
    const maxTime = duration ?? Number.POSITIVE_INFINITY;
    const targetTime = Math.min(maxTime, Math.max(0, activeVideo.currentTime + deltaSeconds));
    if (Math.abs(targetTime - activeVideo.currentTime) <= PLAYBACK_POSITION_RESTORE_TOLERANCE_SECONDS) {
      activeVideo.currentTime = targetTime;
      savePlaybackPosition(activeVideo, getCurrentVideoId());
      return;
    }

    const previousPlaybackRate = activeVideo.playbackRate;
    const wasPaused = activeVideo.paused;
    startSeekCountdown(activeVideo, targetTime, deltaSeconds, button, previousPlaybackRate, wasPaused);

    if (deltaSeconds > 0) {
      activeVideo.playbackRate = FAST_SEEK_PLAYBACK_RATE;
      updateRateIndicator(activeVideo);
      void activeVideo.play?.();
      if (activeSeekCountdown) {
        activeSeekCountdown.timer = win.setInterval(() => {
          if (
            !activeSeekCountdown ||
            activeSeekCountdown.video !== activeVideo ||
            activeVideo.currentTime >= targetTime ||
            activeVideo.ended
          ) {
            finishSeekCountdown(activeVideo, targetTime);
            return;
          }

          updateSeekCountdown(activeVideo);
        }, SEEK_COUNTDOWN_INTERVAL_MS);
      }
      return;
    }

    activeVideo.pause();
    if (activeSeekCountdown) {
      activeSeekCountdown.timer = win.setInterval(() => {
        if (!activeSeekCountdown || activeSeekCountdown.video !== activeVideo) {
          return;
        }

        const stepSeconds = (FAST_SEEK_PLAYBACK_RATE * SEEK_COUNTDOWN_INTERVAL_MS) / 1000;
        activeVideo.currentTime = Math.max(targetTime, activeVideo.currentTime - stepSeconds);
        updateSeekCountdown(activeVideo);
        if (activeVideo.currentTime <= targetTime + PLAYBACK_POSITION_RESTORE_TOLERANCE_SECONDS) {
          finishSeekCountdown(activeVideo, targetTime);
        }
      }, SEEK_COUNTDOWN_INTERVAL_MS);
    }
  }

  function mountControls(): void {
    const { playerContainer } = controlsState;
    if (!playerContainer) {
      return;
    }

    ensurePlayerContainerCanAnchorHost(playerContainer);
    applyHostLayoutStyles();

    if (host.parentElement !== playerContainer) {
      host.remove();
      playerContainer.append(host);
    }
  }

  function scan(): void {
    if (disposed) {
      return;
    }

    const video = findActiveVideo(doc);
    const playerContainer = findPlayerContainer(doc, video);
    const controlsRoot = findControlsRoot(doc, video);
    const videoId = getCurrentVideoId();

    controlsState = { video, controlsRoot, playerContainer };
    applyPinnedControlsState();
    bindNativeSubtitlesButton();
    bindVideo(video);
    bindPlaybackPositionVideo(video, videoId);
    applyMusicModeState();

    if (!playerContainer) {
      host.remove();
      return;
    }

    mountControls();
  }

  function scheduleScan(): void {
    if (disposed || scanQueued) {
      return;
    }

    scanQueued = true;
    queueMicrotask(() => {
      scanQueued = false;
      scan();
    });
  }

  function initialScanWithRetry(): void {
    if (disposed) {
      return;
    }

    scan();

    // If we still don't have a player container, retry until we find it
    if (!controlsState.playerContainer && initialScanRetryCount < INITIAL_SCAN_MAX_RETRIES) {
      initialScanRetryCount += 1;
      initialScanRetryTimer = win.setTimeout(initialScanWithRetry, INITIAL_SCAN_RETRY_MS);
    }
  }

  function clearInitialScanRetry(): void {
    if (initialScanRetryTimer !== null) {
      win.clearTimeout(initialScanRetryTimer);
      initialScanRetryTimer = null;
    }
  }

  function clearRescueScan(): void {
    if (rescueScanTimer !== null) {
      win.clearInterval(rescueScanTimer);
      rescueScanTimer = null;
    }
  }

  const originalPushState = win.history.pushState.bind(win.history);
  const originalReplaceState = win.history.replaceState.bind(win.history);

  win.history.pushState = ((...args: Parameters<History['pushState']>) => {
    savePlaybackPosition();
    const result = originalPushState(...args);
    scheduleScan();
    return result;
  }) as History['pushState'];

  win.history.replaceState = ((...args: Parameters<History['replaceState']>) => {
    savePlaybackPosition();
    const result = originalReplaceState(...args);
    scheduleScan();
    return result;
  }) as History['replaceState'];

  const onNavigationChange = (): void => {
    savePlaybackPosition();
    scheduleScan();
  };

  function isExtensionOwnedMutationNode(node: Node): boolean {
    if (node === host || node === musicModeOverlay) {
      return true;
    }

    if (!(node instanceof Element)) {
      return node.parentElement ? isExtensionOwnedMutationNode(node.parentElement) : false;
    }

    return (
      node.matches(`[${HOST_ATTR}], .yt-playback-speed-music-overlay`) ||
      node.closest(`[${HOST_ATTR}], .yt-playback-speed-music-overlay`) !== null
    );
  }

  function isExtensionOnlyMutation(record: MutationRecord): boolean {
    if (record.type !== 'childList') {
      return false;
    }

    const changedNodes = [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)];
    return changedNodes.length > 0 && changedNodes.every(isExtensionOwnedMutationNode);
  }

  const onPlayerMutation = (records: MutationRecord[]): void => {
    if (records.length > 0 && records.every(isExtensionOnlyMutation)) {
      return;
    }

    scheduleScan();
  };

  const onPagePersist = (): void => {
    savePlaybackPosition();
  };

  const onVisibilityChange = (): void => {
    if (doc.visibilityState === 'hidden') {
      savePlaybackPosition();
    }
  };

  const onYouTubeNavigate = (): void => {
    savePlaybackPosition();
    // Delay scan to let YouTube's SPA finish reconstructing the player DOM
    win.setTimeout(() => {
      if (!disposed) {
        scan();
      }
    }, YT_NAVIGATE_SCAN_DELAY_MS);
  };

  win.addEventListener('popstate', onNavigationChange);
  win.addEventListener('hashchange', onNavigationChange);
  win.addEventListener('pagehide', onPagePersist);
  win.addEventListener('beforeunload', onPagePersist);
  doc.addEventListener('visibilitychange', onVisibilityChange);
  doc.addEventListener('keydown', onKeyboardShortcut, true);
  doc.addEventListener('yt-navigate-finish', onYouTubeNavigate);
  win.addEventListener('yt-navigate-finish', onYouTubeNavigate);
  // Extra YouTube SPA events that can fire in Brave / adblocked environments
  doc.addEventListener('yt-navigate', onYouTubeNavigate);
  win.addEventListener('yt-navigate', onYouTubeNavigate);
  doc.addEventListener('yt-player-updated', onYouTubeNavigate);
  win.addEventListener('yt-player-updated', onYouTubeNavigate);

  observer = new MutationObserver(onPlayerMutation);
  observer.observe(doc.documentElement, {
    childList: true,
    subtree: true
  });

  initialScanWithRetry();

  // Also scan when the page fully loads, since Brave and other Chromium browsers
  // may delay YouTube player creation due to ad blocking
  if (doc.readyState !== 'complete') {
    win.addEventListener('load', () => {
      if (!disposed && (!controlsState.playerContainer || !host.isConnected)) {
        scan();
      }
    }, { once: true });
  }

  // Rescue periodic scan during the first seconds to handle cases where
  // the MutationObserver misses the player creation or the host gets detached
  const rescueScanStartTime = Date.now();
  rescueScanTimer = win.setInterval(() => {
    if (disposed || Date.now() - rescueScanStartTime > RESCUE_SCAN_DURATION_MS) {
      clearRescueScan();
      return;
    }
    if (!controlsState.playerContainer || !host.isConnected) {
      scan();
    }
  }, RESCUE_SCAN_INTERVAL_MS);

  // Extra long-tail safety scans for extremely delayed player under Brave Shields + YT script blocking
  win.setTimeout(() => {
    if (!disposed && (!controlsState.playerContainer || !host.isConnected)) scan();
  }, 10000);
  win.setTimeout(() => {
    if (!disposed && (!controlsState.playerContainer || !host.isConnected)) scan();
  }, 45000);

  const handle: YouTubePlaybackSpeedControlsHandle = {
    destroy() {
      if (disposed) {
        return;
      }

      disposed = true;
      savePlaybackPosition();
      clearQualityRetryTimer();
      clearPlaybackPositionSaveTimer();
      clearPlaybackPositionRestore();
      clearSeekCountdown();
      clearInitialPlaybackRateReset();
      clearMusicModeVisuals();
      resetVolumeBoost(volumeBoostState);
      pendingQualityRequest = null;
      pinnedPlayerContainer?.classList.remove(PINNED_PLAYER_CLASS);
      pinnedPlayerContainer = null;
      boundNativeSubtitlesButton?.removeEventListener('click', onNativeSubtitlesButtonClick);
      boundNativeSubtitlesButton = null;
      if (boundVideo) {
        boundVideo.removeEventListener('ratechange', onRateChange);
        boundVideo.removeEventListener('volumechange', onVolumeChange);
      }
      if (playbackPositionVideo) {
        playbackPositionVideo.removeEventListener('pause', onPlaybackPositionEvent);
        playbackPositionVideo.removeEventListener('ended', onPlaybackPositionEvent);
        playbackPositionVideo.removeEventListener('seeked', onPlaybackPositionEvent);
      }
      unbindControlsThemePreferenceStorage();
      unbindControlBarSectionPreferenceStorage();
      observer?.disconnect();
      clearInitialScanRetry();
      clearRescueScan();
      win.removeEventListener('popstate', onNavigationChange);
      win.removeEventListener('hashchange', onNavigationChange);
      win.removeEventListener('pagehide', onPagePersist);
      win.removeEventListener('beforeunload', onPagePersist);
      doc.removeEventListener('visibilitychange', onVisibilityChange);
      doc.removeEventListener('keydown', onKeyboardShortcut, true);
      doc.removeEventListener('yt-navigate-finish', onYouTubeNavigate);
      win.removeEventListener('yt-navigate-finish', onYouTubeNavigate);
      doc.removeEventListener('yt-navigate', onYouTubeNavigate);
      win.removeEventListener('yt-navigate', onYouTubeNavigate);
      doc.removeEventListener('yt-player-updated', onYouTubeNavigate);
      win.removeEventListener('yt-player-updated', onYouTubeNavigate);
      win.history.pushState = originalPushState;
      win.history.replaceState = originalReplaceState;
      globalStyle.remove();
      host.remove();

      if (globalWindow[SENTINEL_KEY] === handle) {
        delete globalWindow[SENTINEL_KEY];
      }
    }
  };

  globalWindow[SENTINEL_KEY] = handle;

  return handle;
}
