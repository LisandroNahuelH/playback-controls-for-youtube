import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONTROLS_THEME_STORAGE_KEY,
  DEFAULT_CONTROLS_THEME_ID,
  getControlsTheme
} from '../../src/shared/theme-preferences';
import {
  CONTROL_BAR_SECTION_STORAGE_KEY,
  DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS
} from '../../src/shared/control-bar-sections';
import {
  adjustPlaybackRate,
  buildYouTubeWatchUrlWithTime,
  chooseAutoQualityOption,
  chooseClosestQualityOption,
  findActiveVideo,
  findControlsRoot,
  findPlayerContainer,
  getPlaybackTimeFromUrl,
  getYouTubeVideoIdFromUrl,
  isMainWatchPlaybackPage,
  normalizeYouTubeQualityText,
  parseYouTubeTimeParam,
  type YouTubePlaybackSpeedControlsStorage,
  startYouTubePlaybackSpeedControls
} from '../../src/content/youtube-speed';

describe('youtube speed helpers', () => {
  it('adjusts playback rate in 0.05x steps and clamps to the safe range', () => {
    expect(adjustPlaybackRate(1, 0.05)).toBe(1.05);
    expect(adjustPlaybackRate(1, -0.05)).toBe(0.95);
    expect(adjustPlaybackRate(0.25, -0.05)).toBe(0.25);
    expect(adjustPlaybackRate(4, 0.05)).toBe(4);
    expect(adjustPlaybackRate(3.95, 0.05)).toBe(4);
  });

  it('finds the active video and the player controls root', () => {
    window.history.replaceState({}, '', '/watch?v=abc123_DEF-');
    document.body.innerHTML = `
      <div class="html5-video-player" id="movie_player">
        <video></video>
        <div class="ytp-chrome-bottom">
          <div class="ytp-left-controls"></div>
          <div class="ytp-right-controls"></div>
        </div>
      </div>
    `;

    const video = findActiveVideo(document);
    const controlsRoot = findControlsRoot(document, video);

    expect(video).not.toBeNull();
    expect(controlsRoot?.className).toContain('ytp-chrome-bottom');
  });

  it('prefers the visible main player when another video appears earlier in the DOM', () => {
    window.history.replaceState({}, '', '/watch?v=abc123_DEF-');
    document.body.innerHTML = `
      <div class="html5-video-player">
        <video></video>
      </div>
      <div class="html5-video-player" id="movie_player">
        <video></video>
        <div class="ytp-chrome-bottom"></div>
      </div>
    `;

    const [hiddenPlayer, mainPlayer] = Array.from(document.querySelectorAll<HTMLElement>('.html5-video-player'));
    const [hiddenVideo, mainVideo] = Array.from(document.querySelectorAll<HTMLVideoElement>('video'));
    hiddenPlayer.style.display = 'none';
    setElementRect(hiddenPlayer, 0, 0);
    setElementRect(hiddenVideo, 0, 0);
    setElementRect(mainPlayer, 1280, 720);
    setElementRect(mainVideo, 1280, 720);

    expect(findActiveVideo(document)).toBe(mainVideo);
    expect(findPlayerContainer(document, null)).toBe(mainPlayer);
    expect(findControlsRoot(document, mainVideo)?.className).toContain('ytp-chrome-bottom');
  });

  it('detects main watch playback pages from the URL', () => {
    expect(isMainWatchPlaybackPage('https://www.youtube.com/watch?v=abc123_DEF-')).toBe(true);
    expect(isMainWatchPlaybackPage('/watch?v=abc123_DEF-')).toBe(true);
    expect(isMainWatchPlaybackPage('https://www.youtube.com/shorts/shorts12345')).toBe(false);
    expect(isMainWatchPlaybackPage('https://www.youtube.com/feed/subscriptions')).toBe(false);
    expect(isMainWatchPlaybackPage('https://www.youtube.com/watch')).toBe(false);
  });

  it('ignores thumbnail preview players outside the main watch page', () => {
    window.history.replaceState({}, '', '/feed/subscriptions');
    document.body.innerHTML = `
      <ytd-thumbnail>
        <div id="thumbnail">
          <div class="html5-video-player">
            <video></video>
          </div>
        </div>
      </ytd-thumbnail>
    `;

    const previewPlayer = document.querySelector<HTMLElement>('.html5-video-player')!;
    const previewVideo = document.querySelector<HTMLVideoElement>('video')!;
    setElementRect(previewPlayer, 320, 180);
    setElementRect(previewVideo, 320, 180);

    expect(findActiveVideo(document)).toBeNull();
    expect(findPlayerContainer(document, null)).toBeNull();
  });

  it('ignores thumbnail preview players on the watch page', () => {
    window.history.replaceState({}, '', '/watch?v=abc123_DEF-');
    document.body.innerHTML = `
      <ytd-thumbnail>
        <div id="thumbnail">
          <div class="html5-video-player">
            <video></video>
          </div>
        </div>
      </ytd-thumbnail>
    `;

    const previewPlayer = document.querySelector<HTMLElement>('.html5-video-player')!;
    const previewVideo = document.querySelector<HTMLVideoElement>('video')!;
    setElementRect(previewPlayer, 320, 180);
    setElementRect(previewVideo, 320, 180);

    expect(findActiveVideo(document)).toBeNull();
    expect(findPlayerContainer(document, null)).toBeNull();
  });

  it('prefers the main watch player over sidebar thumbnail previews', () => {
    window.history.replaceState({}, '', '/watch?v=abc123_DEF-');
    document.body.innerHTML = `
      <ytd-thumbnail>
        <div id="thumbnail">
          <div class="html5-video-player">
            <video></video>
          </div>
        </div>
      </ytd-thumbnail>
      <div class="html5-video-player" id="movie_player">
        <video></video>
        <div class="ytp-chrome-bottom"></div>
      </div>
    `;

    const previewPlayer = document.querySelector<HTMLElement>('ytd-thumbnail .html5-video-player')!;
    const previewVideo = previewPlayer.querySelector<HTMLVideoElement>('video')!;
    const mainPlayer = document.querySelector<HTMLElement>('#movie_player')!;
    const mainVideo = mainPlayer.querySelector<HTMLVideoElement>('video')!;
    setElementRect(previewPlayer, 320, 180);
    setElementRect(previewVideo, 320, 180);
    setElementRect(mainPlayer, 1280, 720);
    setElementRect(mainVideo, 1280, 720);

    expect(findActiveVideo(document)).toBe(mainVideo);
    expect(findPlayerContainer(document, null)).toBe(mainPlayer);
  });

  it('extracts YouTube video ids from common URL shapes', () => {
    expect(getYouTubeVideoIdFromUrl('https://www.youtube.com/watch?v=abc123_DEF-')).toBe('abc123_DEF-');
    expect(getYouTubeVideoIdFromUrl('https://www.youtube.com/shorts/shorts12345')).toBe('shorts12345');
    expect(getYouTubeVideoIdFromUrl('/embed/embed12345')).toBe('embed12345');
    expect(getYouTubeVideoIdFromUrl('https://www.youtube.com/feed/subscriptions')).toBeNull();
  });
});

describe('youtube quality helpers', () => {
  const option = (label: string) => ({
    label,
    resolution: normalizeYouTubeQualityText(label),
    element: document.createElement('button')
  });

  it('normalizes quality labels from YouTube', () => {
    expect(normalizeYouTubeQualityText('144p')).toBe(144);
    expect(normalizeYouTubeQualityText('1080p Premium')).toBe(1080);
    expect(normalizeYouTubeQualityText('hd720')).toBe(720);
    expect(normalizeYouTubeQualityText('Auto')).toBeNull();
  });

  it('chooses the closest available quality and prefers the lower one on ties', () => {
    expect(chooseClosestQualityOption(1080, [option('720p'), option('480p')])?.label).toBe('720p');
    expect(chooseClosestQualityOption(900, [option('720p'), option('1080p')])?.label).toBe('720p');
    expect(chooseClosestQualityOption(1080, [option('Auto')])?.resolution).toBeNull();
  });

  it('finds the Auto quality option when it is available', () => {
    expect(chooseAutoQualityOption([option('Auto')])?.label).toBe('Auto');
    expect(chooseAutoQualityOption([option('720p')])).toBeNull();
  });
});

describe('youtube playback URL helpers', () => {
  it('builds watch URLs with a timestamp while preserving useful query params', () => {
    expect(buildYouTubeWatchUrlWithTime('/watch?v=abc123_DEF-&list=PL1&t=12s', 'abc123_DEF-', 42)).toBe(
      '/watch?v=abc123_DEF-&list=PL1&t=42s'
    );
    expect(buildYouTubeWatchUrlWithTime('/shorts/shorts12345?feature=share', 'shorts12345', 80.9)).toBe(
      '/watch?feature=share&v=shorts12345&t=80s'
    );
  });

  it('parses YouTube timestamp values from URLs', () => {
    expect(parseYouTubeTimeParam('42')).toBe(42);
    expect(parseYouTubeTimeParam('42s')).toBe(42);
    expect(parseYouTubeTimeParam('1m20s')).toBe(80);
    expect(parseYouTubeTimeParam('1h2m3s')).toBe(3723);
    expect(parseYouTubeTimeParam('')).toBeNull();
    expect(parseYouTubeTimeParam('nope')).toBeNull();
    expect(getPlaybackTimeFromUrl('/watch?v=abc123_DEF-&t=1m20s')).toBe(80);
  });
});

describe('youtube speed and resolution runtime', () => {
  let handle: { destroy(): void } | null = null;

  beforeEach(() => {
    document.body.innerHTML = '';
    window.localStorage.clear();
    window.history.replaceState({}, '', '/watch?v=mockvid12345');
  });

  afterEach(() => {
    handle?.destroy();
    handle = null;
    vi.restoreAllMocks();
    vi.useRealTimers();
    Reflect.deleteProperty(globalThis, 'chrome');
    Reflect.deleteProperty(window, 'AudioContext');
    document.body.innerHTML = '';
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('renders the divider and the resolution buttons beside the speed controls', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['1080p', '720p', '480p', '360p', '240p', '144p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    expect(host).not.toBeNull();
    expect(host?.parentElement?.className).toContain('html5-video-player');
    expect(host?.style.getPropertyValue('z-index')).toBe('2147483647');
    expect(host?.style.getPropertyPriority('z-index')).toBe('important');

    const shadowRoot = host?.shadowRoot as ShadowRoot | null;
    const seekGroup = shadowRoot?.querySelector('[data-role="seek-group"]');
    const speedGroup = shadowRoot?.querySelector('[data-role="speed-group"]');
    const divider = shadowRoot?.querySelector('[data-role="divider"]');
    const root = shadowRoot?.querySelector('.yt-speed-root');
    const volumeGroup = shadowRoot?.querySelector('[data-role="volume-group"]');
    const qualityGroup = shadowRoot?.querySelector('[data-role="quality-group"]');
    const musicGroup = shadowRoot?.querySelector('[data-role="music-group"]');
    const captionsGroup = shadowRoot?.querySelector('[data-role="captions-group"]');
    const pinGroup = shadowRoot?.querySelector('[data-role="pin-group"]');
    const qualityButtons = qualityGroup?.querySelectorAll('[data-role="quality-button"]');
    const volumeButtons = volumeGroup?.querySelectorAll('[data-role="volume-button"]');
    const volumeIndicator = volumeGroup?.querySelector('[data-role="volume-indicator"]');
    const musicButton = musicGroup?.querySelector('[data-role="music-button"]');
    const captionsButton = captionsGroup?.querySelector('[data-role="captions-button"]');
    const pinButton = pinGroup?.querySelector('[data-role="pin-button"]');

    expect(seekGroup).not.toBeNull();
    expect(shadowRoot?.querySelector('[data-role="fast-seek-group"]')).toBeNull();
    expect(speedGroup).not.toBeNull();
    expect(divider?.textContent).toBe('|');
    expect(volumeGroup).not.toBeNull();
    expect(qualityGroup).not.toBeNull();
    expect(musicGroup).not.toBeNull();
    expect(captionsGroup).not.toBeNull();
    expect(pinGroup).not.toBeNull();
    expect(Array.from(root?.children ?? [], (element) => (element as HTMLElement).dataset.role ?? null)).toEqual([
      'seek-group',
      'divider',
      'speed-group',
      'divider',
      'volume-group',
      'divider',
      'quality-group',
      'divider',
      'music-group',
      'divider',
      'captions-group',
      'divider',
      'pin-group'
    ]);
    const seekButtons = Array.from(seekGroup?.querySelectorAll('.yt-speed-button') ?? []);
    expect(seekButtons.length).toBe(6);
    expect(seekButtons.map((button) => button.textContent)).toEqual([
      '←60s',
      '←30s',
      '←15s',
      '15s→',
      '30s→',
      '60s→'
    ]);
    expect(Array.from(seekButtons, (button) => button.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false',
      'false',
      'false',
      'false',
      'false'
    ]);
    expect(
      seekButtons.map((button) => Array.from(button.classList).find((className) => className.startsWith('yt-seek-button-')))
    ).toEqual([
      'yt-seek-button-rewind-60',
      'yt-seek-button-rewind-30',
      'yt-seek-button-15',
      'yt-seek-button-15',
      'yt-seek-button-forward-30',
      'yt-seek-button-forward-60'
    ]);
    expect(shadowRoot?.querySelector('style')?.textContent).toMatch(
      /\.yt-seek-button-rewind-30 \{\s*background: #ffb3b3;\s*border-color: #ff8585;\s*color: #111111;/
    );
    expect(shadowRoot?.querySelector('style')?.textContent).toMatch(
      /\.yt-seek-button-forward-60 \{\s*background: #72d987;\s*border-color: #43bd5c;\s*color: #111111;/
    );
    expect(shadowRoot?.querySelector('style')?.textContent).toMatch(
      /\[data-role="volume-indicator"\] \{\s*align-items: center;\s*justify-content: center;\s*min-width: 64px;\s*width: 64px;\s*height: 28px;\s*padding: 0 8px;\s*font-size: 12px;\s*line-height: 1;\s*text-align: center;\s*letter-spacing: 0\.02em;/
    );
    expect(shadowRoot?.querySelector('style')?.textContent).toMatch(
      /\[data-role="volume-indicator"\]\[data-volume-boost-level="1"\] \{\s*background: #ffe8ef;\s*border-color: #fac8d6;\s*color: #5f1630;/
    );
    expect(shadowRoot?.querySelector('style')?.textContent).toMatch(
      /\[data-role="volume-indicator"\]\[data-volume-boost-level="10"\] \{\s*background: #ff90a1;\s*border-color: #d65070;\s*color: #5f1630;/
    );
    expect(shadowRoot?.querySelector('style')?.textContent).toMatch(
      /\.yt-volume-group \.yt-speed-button \{\s*min-width: 64px;\s*width: 64px;\s*padding: 0 8px;/
    );
    expect(speedGroup?.querySelectorAll('.yt-speed-button').length).toBe(2);
    expect(Array.from(speedGroup?.querySelectorAll('.yt-speed-button') ?? [], (button) => button.textContent)).toEqual([
      '-5% | -10%',
      '+5% | +10%'
    ]);
    expect(shadowRoot?.querySelector('[data-role="rate-indicator"]')?.tagName).toBe('BUTTON');
    expect(shadowRoot?.querySelector('[data-role="rate-indicator"]')?.getAttribute('aria-pressed')).toBe('false');
    expect(Array.from(volumeButtons ?? [], (button) => button.textContent)).toEqual(['🔉 -10%', '🔊 +10%']);
    expect(volumeIndicator?.tagName).toBe('BUTTON');
    expect(volumeIndicator?.textContent).toBe('100%');
    fixture.video.volume = 0.5;
    (volumeButtons?.[1] as HTMLButtonElement | undefined)?.click();
    expect(fixture.video.volume).toBe(0.6);
    expect(volumeIndicator?.textContent).toBe('60%');
    volumeButtons?.[1]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(fixture.video.volume).toBe(0.8);
    expect(volumeIndicator?.textContent).toBe('80%');
    fixture.video.muted = true;
    (volumeButtons?.[0] as HTMLButtonElement | undefined)?.click();
    expect(fixture.video.volume).toBe(0.7);
    expect(fixture.video.muted).toBe(true);
    expect(volumeIndicator?.textContent).toBe('0%');
    expect((volumeIndicator as HTMLElement | null)?.dataset.volumeBoosted).toBe('false');
    expect((volumeIndicator as HTMLElement | null)?.dataset.volumeBoostLevel).toBe('0');
    volumeButtons?.[0]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(fixture.video.volume).toBe(0.5);
    expect(fixture.video.muted).toBe(true);
    volumeButtons?.[1]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(fixture.video.volume).toBe(0.7);
    expect(fixture.video.muted).toBe(false);
    expect(volumeIndicator?.textContent).toBe('70%');
    fixture.video.volume = 0.33;
    fixture.video.dispatchEvent(new Event('volumechange'));
    expect(volumeIndicator?.textContent).toBe('33%');
    (volumeIndicator as HTMLButtonElement | null)?.click();
    expect(fixture.video.volume).toBe(1);
    expect(fixture.video.muted).toBe(false);
    expect(volumeIndicator?.textContent).toBe('100%');
    expect(qualityButtons?.length).toBe(2);
    expect(Array.from(qualityButtons ?? [], (button) => button.textContent)).toEqual([
      'Auto',
      '1080p'
    ]);
    expect(document.getElementById('playback-controls-for-youtube-tm-global-style')?.textContent).toContain(
      '.html5-video-player.ytp-fullscreen .ytp-fullscreen-grid-expand-button'
    );
    expect(Array.from(qualityButtons ?? [], (button) => button.getAttribute('aria-pressed'))).toEqual([
      'false',
      'false'
    ]);
    expect(shadowRoot?.querySelector('[data-role="rate-indicator"]')?.textContent).toBe('1.00x');
    expect(musicButton?.querySelector('svg')).not.toBeNull();
    expect(musicButton?.getAttribute('aria-pressed')).toBe('false');
    expect(musicButton?.getAttribute('aria-label')).toBe('Enable music mode');
    expect(captionsButton?.textContent).toBe('CC');
    expect(captionsButton?.getAttribute('aria-pressed')).toBe('false');
    expect((captionsButton as HTMLButtonElement | null)?.disabled).toBe(false);
    expect(pinButton?.getAttribute('aria-pressed')).toBe('false');
    expect(pinButton?.querySelector('svg')).not.toBeNull();
  });

  it('boosts volume above 100 percent through Web Audio', async () => {
    const audio = installMockAudioContext();
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const volumeGroup = host?.shadowRoot?.querySelector('[data-role="volume-group"]');
    const volumeButtons = volumeGroup?.querySelectorAll('[data-role="volume-button"]');
    const volumeIndicator = volumeGroup?.querySelector('[data-role="volume-indicator"]');

    (volumeButtons?.[1] as HTMLButtonElement | undefined)?.click();
    expect(audio.gainNodes[0]?.gain.value).toBe(1.1);
    expect((volumeIndicator as HTMLElement | null)?.dataset.volumeBoosted).toBe('true');
    expect((volumeIndicator as HTMLElement | null)?.dataset.volumeBoostLevel).toBe('1');
    expect(volumeIndicator?.textContent).toBe('110%');

    volumeButtons?.[1]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(audio.gainNodes[0]?.gain.value).toBe(1.3);
    expect((volumeIndicator as HTMLElement | null)?.dataset.volumeBoostLevel).toBe('3');
    expect(volumeIndicator?.textContent).toBe('130%');

    for (let index = 0; index < 8; index += 1) {
      (volumeButtons?.[1] as HTMLButtonElement | undefined)?.click();
    }
    expect(audio.gainNodes[0]?.gain.value).toBe(2);
    expect((volumeIndicator as HTMLElement | null)?.dataset.volumeBoostLevel).toBe('10');
    expect(volumeIndicator?.textContent).toBe('200%');

    volumeButtons?.[0]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(audio.gainNodes[0]?.gain.value).toBe(1.8);
    expect(volumeIndicator?.textContent).toBe('180%');

    (volumeIndicator as HTMLButtonElement | null)?.click();
    expect(audio.gainNodes[0]?.gain.value).toBe(1);
    expect((volumeIndicator as HTMLElement | null)?.dataset.volumeBoosted).toBe('false');
    expect((volumeIndicator as HTMLElement | null)?.dataset.volumeBoostLevel).toBe('0');
    expect(volumeIndicator?.textContent).toBe('100%');
  });

  it('carries the last desired volume to the next YouTube video in the same tab', async () => {
    const audio = installMockAudioContext();
    const firstFixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const volumeGroup = host?.shadowRoot?.querySelector('[data-role="volume-group"]');
    const volumeButtons = volumeGroup?.querySelectorAll('[data-role="volume-button"]');
    const volumeIndicator = volumeGroup?.querySelector('[data-role="volume-indicator"]');

    for (let index = 0; index < 8; index += 1) {
      (volumeButtons?.[1] as HTMLButtonElement | undefined)?.click();
    }
    expect(volumeIndicator?.textContent).toBe('180%');

    firstFixture.player.remove();
    const secondFixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    await flushAsyncTurn();

    expect(secondFixture.video.volume).toBe(1);
    expect(audio.gainNodes[0]?.gain.value).toBe(1);
    expect(audio.gainNodes[1]?.gain.value).toBe(1.8);
    expect(volumeIndicator?.textContent).toBe('180%');
  });

  it('syncs native YouTube volume changes and disables boost', async () => {
    const audio = installMockAudioContext();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const volumeGroup = host?.shadowRoot?.querySelector('[data-role="volume-group"]');
    const volumeButtons = volumeGroup?.querySelectorAll('[data-role="volume-button"]');
    const volumeIndicator = volumeGroup?.querySelector('[data-role="volume-indicator"]');

    for (let index = 0; index < 5; index += 1) {
      (volumeButtons?.[1] as HTMLButtonElement | undefined)?.click();
    }
    expect(volumeIndicator?.textContent).toBe('150%');

    await new Promise((resolve) => setTimeout(resolve, 550));
    fixture.video.volume = 0.4;
    fixture.video.dispatchEvent(new Event('volumechange'));

    expect(audio.gainNodes[0]?.gain.value).toBe(1);
    expect(volumeIndicator?.textContent).toBe('40%');
  });

  it('falls back to native 100 percent volume when Web Audio is unavailable', async () => {
    const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() };
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls({ logger });
    await Promise.resolve();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const volumeGroup = host?.shadowRoot?.querySelector('[data-role="volume-group"]');
    const volumeButtons = volumeGroup?.querySelectorAll('[data-role="volume-button"]');
    const volumeIndicator = volumeGroup?.querySelector('[data-role="volume-indicator"]');

    (volumeButtons?.[1] as HTMLButtonElement | undefined)?.click();

    expect(fixture.video.volume).toBe(1);
    expect(volumeIndicator?.textContent).toBe('100%');
    expect(logger.warn).toHaveBeenCalled();
  });

  it('resets active volume boost when destroyed', async () => {
    const audio = installMockAudioContext();
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const volumeButton = host?.shadowRoot?.querySelectorAll('[data-role="volume-button"]')?.[1] as HTMLButtonElement | undefined;

    volumeButton?.click();
    expect(audio.gainNodes[0]?.gain.value).toBe(1.1);

    handle.destroy();
    handle = null;

    expect(audio.gainNodes[0]?.gain.value).toBe(1);
  });

  it('mounts the controls when the player exists before YouTube renders the native controls root', async () => {
    const player = document.createElement('div');
    player.className = 'html5-video-player';
    player.id = 'movie_player';
    player.append(document.createElement('video'));
    document.body.append(player);

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;

    expect(host).not.toBeNull();
    expect(host?.parentElement).toBe(player);
    expect(host?.shadowRoot?.querySelector('[data-role="speed-group"]')).not.toBeNull();
  });

  it('anchors the absolute controls to a static player container', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    fixture.player.style.position = 'static';

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;

    expect(fixture.player.style.getPropertyValue('position')).toBe('relative');
    expect(fixture.player.style.getPropertyPriority('position')).toBe('important');
    expect(host?.style.getPropertyValue('box-sizing')).toBe('border-box');
    expect(host?.style.getPropertyPriority('box-sizing')).toBe('important');
    expect(host?.style.getPropertyValue('overflow')).toBe('visible');
    expect(host?.style.getPropertyPriority('overflow')).toBe('important');
  });

  it('repairs host layout styles after a YouTube DOM mutation', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    expect(host).not.toBeNull();

    host?.style.setProperty('display', 'none');
    host?.style.setProperty('visibility', 'hidden');
    host?.style.setProperty('z-index', '1');
    fixture.player.append(document.createElement('span'));
    await Promise.resolve();
    await Promise.resolve();

    expect(host?.style.getPropertyValue('display')).toBe('flex');
    expect(host?.style.getPropertyPriority('display')).toBe('important');
    expect(host?.style.getPropertyValue('z-index')).toBe('2147483647');
    expect(host?.style.getPropertyPriority('z-index')).toBe('important');
  });

  it('hides the controls when YouTube marks the player as autohidden', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    fixture.player.classList.add('ytp-autohide');

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const globalStyle = document.getElementById('playback-controls-for-youtube-tm-global-style');

    expect(host).not.toBeNull();
    expect(host?.style.getPropertyValue('opacity')).toBe('');
    expect(host?.style.getPropertyValue('visibility')).toBe('');
    expect(globalStyle?.textContent).toContain(
      '.html5-video-player.ytp-autohide:not(.yt-playback-speed-controls-pinned) [data-playback-controls-for-youtube-host]'
    );
    expect(globalStyle?.textContent).toMatch(
      /ytp-autohide:not\(\.yt-playback-speed-controls-pinned\) \[data-playback-controls-for-youtube-host\] \{\s*opacity: 0 !important;\s*visibility: hidden !important;\s*pointer-events: none !important;/
    );
  });

  it('keeps the controls visible while pinned even when YouTube autohides the player', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    fixture.player.classList.add('ytp-autohide');

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const globalStyle = document.getElementById('playback-controls-for-youtube-tm-global-style');
    const pinButton = host?.shadowRoot?.querySelector('[data-role="pin-button"]') as HTMLButtonElement | null;
    pinButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fixture.player.classList.contains('yt-playback-speed-controls-pinned')).toBe(true);
    expect(globalStyle?.textContent).toMatch(
      /yt-playback-speed-controls-pinned \[data-playback-controls-for-youtube-host\] \{\s*opacity: 1 !important;\s*visibility: visible !important;\s*pointer-events: auto !important;/
    );
  });

  it('applies the default controls theme when extension storage is unavailable', async () => {
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const root = document
      .querySelector<HTMLElement>('[data-playback-controls-for-youtube-host]')
      ?.shadowRoot?.querySelector<HTMLElement>('.yt-speed-root');
    const classicTheme = getControlsTheme(DEFAULT_CONTROLS_THEME_ID);

    expect(root?.dataset.theme).toBe('classic');
    expect(root?.style.getPropertyValue('--yt-controls-bar-background')).toBe(classicTheme.tokens.barBackground);
    expect(root?.style.getPropertyValue('--yt-controls-border-radius')).toBe(classicTheme.tokens.borderRadius);
  });

  it('loads a stored controls theme from chrome storage', async () => {
    installMockChromeThemeStorage('dark');
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const root = document
      .querySelector<HTMLElement>('[data-playback-controls-for-youtube-host]')
      ?.shadowRoot?.querySelector<HTMLElement>('.yt-speed-root');
    const darkTheme = getControlsTheme('dark');

    expect(root?.dataset.theme).toBe('dark');
    expect(root?.style.getPropertyValue('--yt-controls-active-background')).toBe(darkTheme.tokens.activeBackground);
  });

  it('falls back to the default controls theme when the stored theme is invalid', async () => {
    installMockChromeThemeStorage('unknown-theme');
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const root = document
      .querySelector<HTMLElement>('[data-playback-controls-for-youtube-host]')
      ?.shadowRoot?.querySelector<HTMLElement>('.yt-speed-root');

    expect(root?.dataset.theme).toBe(DEFAULT_CONTROLS_THEME_ID);
  });

  it('updates the controls theme when chrome storage changes', async () => {
    const chromeStorage = installMockChromeThemeStorage('classic');
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const root = document
      .querySelector<HTMLElement>('[data-playback-controls-for-youtube-host]')
      ?.shadowRoot?.querySelector<HTMLElement>('.yt-speed-root');

    chromeStorage.emitThemeChange('ocean');

    expect(root?.dataset.theme).toBe('ocean');
    expect(root?.style.getPropertyValue('--yt-controls-bar-background')).toBe(getControlsTheme('ocean').tokens.barBackground);

    handle.destroy();
    handle = null;
    expect(chromeStorage.listenerCount()).toBe(0);
  });

  it('applies stored visible section preferences and live section changes', async () => {
    const chromeStorage = installMockChromeThemeStorage(DEFAULT_CONTROLS_THEME_ID, {
      ...DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS,
      quality: false
    });
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await Promise.resolve();

    const root = document
      .querySelector<HTMLElement>('[data-playback-controls-for-youtube-host]')
      ?.shadowRoot?.querySelector<HTMLElement>('.yt-speed-root');

    expect(Array.from(root?.children ?? [], (element) => (element as HTMLElement).dataset.role ?? null)).toEqual([
      'seek-group',
      'divider',
      'speed-group',
      'divider',
      'volume-group',
      'divider',
      'music-group',
      'divider',
      'captions-group',
      'divider',
      'pin-group'
    ]);
    expect(root?.querySelector('[data-role="quality-group"]')).toBeNull();

    chromeStorage.emitSectionChange({ ...DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS, music: false });
    expect(root?.querySelector('[data-role="quality-group"]')).not.toBeNull();
    expect(root?.querySelector('[data-role="music-group"]')).toBeNull();

    chromeStorage.emitSectionChange({
      time: false,
      speed: false,
      volume: false,
      quality: false,
      music: false,
      captions: false,
      pin: false
    });
    expect(Array.from(root?.children ?? [], (element) => (element as HTMLElement).dataset.role ?? null)).toEqual([
      'seek-group',
      'divider',
      'speed-group',
      'divider',
      'volume-group',
      'divider',
      'quality-group',
      'divider',
      'music-group',
      'divider',
      'captions-group',
      'divider',
      'pin-group'
    ]);
  });

  it('removes the global YouTube fullscreen cleanup styles on destroy', async () => {
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    expect(document.getElementById('playback-controls-for-youtube-tm-global-style')).not.toBeNull();

    handle.destroy();
    handle = null;

    expect(document.getElementById('playback-controls-for-youtube-tm-global-style')).toBeNull();
  });

  it('pins and unpins the YouTube player controls from the pin button', async () => {
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const player = document.querySelector('.html5-video-player') as HTMLElement | null;
    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const pinButton = host?.shadowRoot?.querySelector('[data-role="pin-button"]') as HTMLButtonElement | null;

    expect(player?.classList.contains('yt-playback-speed-controls-pinned')).toBe(false);
    expect(pinButton?.getAttribute('aria-pressed')).toBe('false');

    pinButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(player?.classList.contains('yt-playback-speed-controls-pinned')).toBe(true);
    expect(pinButton?.getAttribute('aria-pressed')).toBe('true');
    expect(pinButton?.title).toBe('Unpin player controls');

    pinButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(player?.classList.contains('yt-playback-speed-controls-pinned')).toBe(false);
    expect(pinButton?.getAttribute('aria-pressed')).toBe('false');
  });

  it('toggles YouTube captions from the CC button and the z keyboard shortcut', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const captionsButton = host?.shadowRoot?.querySelector('[data-role="captions-button"]') as HTMLButtonElement | null;

    expect(fixture.getCaptionsEnabled()).toBe(false);
    expect(captionsButton?.getAttribute('aria-pressed')).toBe('false');

    captionsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(fixture.getCaptionsEnabled()).toBe(true);
    expect(captionsButton?.getAttribute('aria-pressed')).toBe('true');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
    expect(fixture.getCaptionsEnabled()).toBe(false);
    expect(captionsButton?.getAttribute('aria-pressed')).toBe('false');
  });

  it('does not toggle captions with z inside editable fields', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const input = document.createElement('input');
    document.body.append(input);

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));

    expect(fixture.getCaptionsEnabled()).toBe(false);
  });

  it('disables the CC button when YouTube captions are unavailable', async () => {
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'], attachSubtitlesButton: false });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const captionsButton = host?.shadowRoot?.querySelector('[data-role="captions-button"]') as HTMLButtonElement | null;

    expect(captionsButton?.disabled).toBe(true);
    expect(captionsButton?.getAttribute('aria-pressed')).toBe('false');
    expect(captionsButton?.title).toBe('Captions are not available for this video');
  });

  it('removes the pinned player class on destroy', async () => {
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const player = document.querySelector('.html5-video-player') as HTMLElement | null;
    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const pinButton = host?.shadowRoot?.querySelector('[data-role="pin-button"]') as HTMLButtonElement | null;

    pinButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(player?.classList.contains('yt-playback-speed-controls-pinned')).toBe(true);

    handle.destroy();
    handle = null;

    expect(player?.classList.contains('yt-playback-speed-controls-pinned')).toBe(false);
  });

  it('mounts the controls and updates the speed indicator when the buttons are used', async () => {
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p', '240p', '144p'] });

    const video = document.querySelector('video') as HTMLVideoElement;
    video.playbackRate = 1;

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    expect(host).not.toBeNull();

    const shadowRoot = host?.shadowRoot as ShadowRoot | null;
    const speedGroup = shadowRoot?.querySelector('[data-role="speed-group"]');
    const speedButtons = speedGroup?.querySelectorAll('.yt-speed-button');
    const rateIndicator = shadowRoot?.querySelector('[data-role="rate-indicator"]') as HTMLButtonElement | null;
    expect(speedButtons?.length).toBe(2);
    expect(rateIndicator?.textContent).toBe('1.00x');

    speedButtons?.[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.playbackRate).toBe(1.05);
    expect(rateIndicator?.textContent).toBe('1.05x');

    speedButtons?.[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.playbackRate).toBe(1);
    expect(rateIndicator?.textContent).toBe('1.00x');

    video.playbackRate = 1.35;
    video.dispatchEvent(new Event('ratechange'));
    expect(rateIndicator?.textContent).toBe('1.35x');

    rateIndicator?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.playbackRate).toBe(1);
    expect(rateIndicator?.textContent).toBe('1.00x');

    const increaseContextEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    expect(speedButtons?.[1]?.dispatchEvent(increaseContextEvent)).toBe(false);
    expect(video.playbackRate).toBe(1.1);
    expect(rateIndicator?.textContent).toBe('1.10x');

    const decreaseContextEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    expect(speedButtons?.[0]?.dispatchEvent(decreaseContextEvent)).toBe(false);
    expect(video.playbackRate).toBe(1);
    expect(rateIndicator?.textContent).toBe('1.00x');
  });

  it('resets the video playback speed to 1x when a video is loaded', async () => {
    window.history.replaceState({}, '', '/watch?v=loadspeed12345');
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = document.querySelector('video') as HTMLVideoElement;
    video.playbackRate = 2;

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const rateIndicator = host?.shadowRoot?.querySelector('[data-role="rate-indicator"]');

    expect(video.playbackRate).toBe(1);
    expect(rateIndicator?.textContent).toBe('1.00x');
  });

  it('keeps resetting playback speed when YouTube reapplies a saved rate during load', async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/watch?v=delayedrate12345');
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = document.querySelector('video') as HTMLVideoElement;
    video.playbackRate = 2;

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    video.playbackRate = 2;
    video.dispatchEvent(new Event('ratechange'));
    await vi.advanceTimersByTimeAsync(300);

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const rateIndicator = host?.shadowRoot?.querySelector('[data-role="rate-indicator"]');

    expect(video.playbackRate).toBe(1);
    expect(rateIndicator?.textContent).toBe('1.00x');
  });

  it('resets playback speed when YouTube navigates to another video with the same player', async () => {
    window.history.replaceState({}, '', '/watch?v=firstspeed12345');
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = document.querySelector('video') as HTMLVideoElement;

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    video.playbackRate = 1.75;
    window.history.pushState({}, '', '/watch?v=secondspeed12345');
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const rateIndicator = host?.shadowRoot?.querySelector('[data-role="rate-indicator"]');

    expect(video.playbackRate).toBe(1);
    expect(rateIndicator?.textContent).toBe('1.00x');
  });

  it('adjusts playback speed with x and c keyboard shortcuts outside editable fields', async () => {
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = document.querySelector('video') as HTMLVideoElement;
    video.playbackRate = 1;

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    expect(video.playbackRate).toBe(1.05);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
    expect(video.playbackRate).toBe(1);

    const input = document.createElement('input');
    document.body.append(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', bubbles: true }));
    expect(video.playbackRate).toBe(1);
  });

  it('seeks backward and forward by 15 seconds in the active video', async () => {
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = document.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    video.currentTime = 20;

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const seekButtons = host?.shadowRoot?.querySelector('[data-role="seek-group"]')?.querySelectorAll('.yt-speed-button');

    seekButtons?.[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.currentTime).toBe(5);

    seekButtons?.[2]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.currentTime).toBe(0);

    video.currentTime = 45;
    seekButtons?.[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.currentTime).toBe(15);

    video.currentTime = 80;
    seekButtons?.[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.currentTime).toBe(20);

    video.currentTime = 90;
    seekButtons?.[3]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.currentTime).toBe(100);

    video.currentTime = 60;
    seekButtons?.[4]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.currentTime).toBe(90);

    video.currentTime = 20;
    seekButtons?.[5]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.currentTime).toBe(80);

    video.currentTime = 80;
    seekButtons?.[5]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(video.currentTime).toBe(100);
  });

  it('right-click seek plays at 4x until the target time and then restores the playback rate', async () => {
    vi.useFakeTimers();
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = document.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    video.currentTime = 20;
    vi.spyOn(video, 'play').mockResolvedValue(undefined);
    vi.spyOn(video, 'pause').mockImplementation(() => {});

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(5001);
    video.playbackRate = 1.25;

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const seekButtons = host?.shadowRoot?.querySelector('[data-role="seek-group"]')?.querySelectorAll('.yt-speed-button');
    const rateIndicator = host?.shadowRoot?.querySelector('[data-role="rate-indicator"]');

    seekButtons?.[4]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

    expect(video.currentTime).toBe(20);
    expect(video.playbackRate).toBe(4);
    expect(rateIndicator?.textContent).toBe('4.00x');
    expect(rateIndicator?.getAttribute('aria-pressed')).toBe('true');
    expect(seekButtons?.[4]?.textContent).toBe('30s→');
    expect(seekButtons?.[4]?.getAttribute('aria-pressed')).toBe('true');

    video.currentTime = 35;
    await vi.advanceTimersByTimeAsync(100);
    expect(seekButtons?.[4]?.textContent).toBe('15s→');

    video.currentTime = 50;
    await vi.advanceTimersByTimeAsync(100);
    expect(video.currentTime).toBe(50);
    expect(video.playbackRate).toBe(1.25);
    expect(rateIndicator?.textContent).toBe('1.25x');
    expect(rateIndicator?.getAttribute('aria-pressed')).toBe('false');
    expect(seekButtons?.[4]?.getAttribute('aria-pressed')).toBe('false');
  });

  it('stops the seek countdown when the same seek button is right-clicked again', async () => {
    vi.useFakeTimers();
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = document.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    video.currentTime = 20;
    vi.spyOn(video, 'play').mockResolvedValue(undefined);
    vi.spyOn(video, 'pause').mockImplementation(() => {});

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(5001);
    video.playbackRate = 1.5;

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const seekButtons = host?.shadowRoot?.querySelector('[data-role="seek-group"]')?.querySelectorAll('.yt-speed-button');
    const rateIndicator = host?.shadowRoot?.querySelector('[data-role="rate-indicator"]');

    seekButtons?.[4]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

    expect(video.currentTime).toBe(20);
    expect(video.playbackRate).toBe(4);
    expect(seekButtons?.[4]?.getAttribute('aria-pressed')).toBe('true');

    seekButtons?.[4]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(500);

    expect(video.playbackRate).toBe(1.5);
    expect(rateIndicator?.textContent).toBe('1.50x');
    expect(rateIndicator?.getAttribute('aria-pressed')).toBe('false');
    expect(seekButtons?.[4]?.getAttribute('aria-pressed')).toBe('false');
    expect(seekButtons?.[4]?.textContent).toBe('30s→');
    expect(video.currentTime).toBe(20);
  });

  it('does not start fast seek when rewind buttons are right-clicked', async () => {
    vi.useFakeTimers();
    createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = document.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    Object.defineProperty(video, 'paused', { configurable: true, value: true });
    video.playbackRate = 1;
    video.currentTime = 20;
    vi.spyOn(video, 'play').mockResolvedValue(undefined);
    vi.spyOn(video, 'pause').mockImplementation(() => {});

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const seekButtons = host?.shadowRoot?.querySelector('[data-role="seek-group"]')?.querySelectorAll('.yt-speed-button');

    seekButtons?.[2]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
    expect(seekButtons?.[2]?.getAttribute('aria-pressed')).toBe('false');
    expect(seekButtons?.[2]?.textContent).toBe('←15s');
    expect(video.currentTime).toBe(20);
    expect(video.playbackRate).toBe(1);

    await vi.advanceTimersByTimeAsync(3000);

    expect(video.currentTime).toBe(20);
    expect(video.playbackRate).toBe(1);
    expect(seekButtons?.[2]?.getAttribute('aria-pressed')).toBe('false');
    expect(seekButtons?.[2]?.textContent).toBe('←15s');
  });

  it('shows active captions naturally and stacks overflow lines during right-click fast seek', async () => {
    vi.useFakeTimers();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = fixture.video;
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    video.playbackRate = 1;
    video.currentTime = 20;
    vi.spyOn(video, 'play').mockResolvedValue(undefined);
    vi.spyOn(video, 'pause').mockImplementation(() => {});

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const captionsButton = host?.shadowRoot?.querySelector('[data-role="captions-button"]') as HTMLButtonElement | null;
    const seekButtons = host?.shadowRoot?.querySelector('[data-role="seek-group"]')?.querySelectorAll('.yt-speed-button');

    captionsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.setCaptionSegments(['Primera frase']);
    seekButtons?.[4]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

    const getOverlayLines = () =>
      Array.from(
        fixture.player.querySelectorAll<HTMLElement>(
          '[data-role="fast-seek-caption-overlay"] .yt-playback-speed-fast-seek-caption-line'
        ),
        (line) => line.textContent
      );

    expect(fixture.player.classList.contains('yt-playback-speed-fast-seek-captions')).toBe(true);
    expect(getOverlayLines()).toEqual(['Primera frase']);

    fixture.setCaptionSegments(['Segunda frase']);
    await vi.advanceTimersByTimeAsync(100);
    expect(getOverlayLines()).toEqual(['Primera frase', 'Segunda frase']);

    fixture.setCaptionSegments(['Tercera frase']);
    await vi.advanceTimersByTimeAsync(100);
    expect(getOverlayLines()).toEqual(['Primera frase', 'Segunda frase', 'Tercera frase']);

    fixture.setCaptionSegments(['Tercera frase']);
    await vi.advanceTimersByTimeAsync(100);
    expect(getOverlayLines()).toEqual(['Primera frase', 'Segunda frase', 'Tercera frase']);

    video.currentTime = 50;
    await vi.advanceTimersByTimeAsync(100);

    expect(fixture.player.querySelector('[data-role="fast-seek-caption-overlay"]')).toBeNull();
    expect(fixture.player.classList.contains('yt-playback-speed-fast-seek-captions')).toBe(false);
  });

  it('uses active text track cues immediately when YouTube caption DOM is late', async () => {
    vi.useFakeTimers();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = fixture.video;
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    video.currentTime = 20;
    vi.spyOn(video, 'play').mockResolvedValue(undefined);

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const captionsButton = host?.shadowRoot?.querySelector('[data-role="captions-button"]') as HTMLButtonElement | null;
    const seekButtons = host?.shadowRoot?.querySelector('[data-role="seek-group"]')?.querySelectorAll('.yt-speed-button');

    captionsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.setCaptionSegments([]);
    fixture.setActiveTextTrackCues(['Cue sincronizado']);
    seekButtons?.[4]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

    const getOverlayLines = () =>
      Array.from(
        fixture.player.querySelectorAll<HTMLElement>(
          '[data-role="fast-seek-caption-overlay"] .yt-playback-speed-fast-seek-caption-line'
        ),
        (line) => line.textContent
      );

    expect(getOverlayLines()).toEqual(['Cue sincronizado']);

    fixture.setActiveTextTrackCues(['Cue siguiente']);
    await vi.advanceTimersByTimeAsync(100);

    expect(getOverlayLines()).toEqual(['Cue sincronizado', 'Cue siguiente']);
  });

  it('does not show the fast seek caption overlay when captions are off', async () => {
    vi.useFakeTimers();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = fixture.video;
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    video.currentTime = 20;
    vi.spyOn(video, 'play').mockResolvedValue(undefined);

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const seekButtons = host?.shadowRoot?.querySelector('[data-role="seek-group"]')?.querySelectorAll('.yt-speed-button');

    fixture.setCaptionSegments(['This should not appear']);
    seekButtons?.[4]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));
    await vi.advanceTimersByTimeAsync(100);

    expect(fixture.player.querySelector('[data-role="fast-seek-caption-overlay"]')).toBeNull();
    expect(fixture.player.classList.contains('yt-playback-speed-fast-seek-captions')).toBe(false);
  });

  it('cleans up the fast seek caption overlay when fast seek is cancelled', async () => {
    vi.useFakeTimers();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });

    const video = fixture.video;
    Object.defineProperty(video, 'duration', { configurable: true, value: 100 });
    Object.defineProperty(video, 'paused', { configurable: true, value: false });
    video.currentTime = 20;
    vi.spyOn(video, 'play').mockResolvedValue(undefined);

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const captionsButton = host?.shadowRoot?.querySelector('[data-role="captions-button"]') as HTMLButtonElement | null;
    const seekButtons = host?.shadowRoot?.querySelector('[data-role="seek-group"]')?.querySelectorAll('.yt-speed-button');

    captionsButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.setCaptionSegments(['Se limpia al cancelar']);
    seekButtons?.[4]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

    expect(fixture.player.querySelector('[data-role="fast-seek-caption-overlay"]')).not.toBeNull();

    seekButtons?.[4]?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }));

    expect(fixture.player.querySelector('[data-role="fast-seek-caption-overlay"]')).toBeNull();
    expect(fixture.player.classList.contains('yt-playback-speed-fast-seek-captions')).toBe(false);
  });

  it('selects the closest available quality when the exact resolution is missing', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    const video = fixture.video;
    video.playbackRate = 1;

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const shadowRoot = host?.shadowRoot as ShadowRoot | null;
    const qualityButtons = shadowRoot?.querySelector('[data-role="quality-group"]')?.querySelectorAll('button');
    expect(qualityButtons?.length).toBe(2);

    qualityButtons?.[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncTurn();

    expect(fixture.getSelectedQuality()).toBe('720p');

    expect(qualityButtons?.[1]?.textContent).toBe('1080p');
    expect(qualityButtons?.[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(qualityButtons?.[0]?.getAttribute('aria-pressed')).toBe('false');
  });

  it('cycles the resolution button to 240p with right click', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['1080p', '720p', '480p', '360p', '240p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const qualityButtons = host?.shadowRoot?.querySelector('[data-role="quality-group"]')?.querySelectorAll('button');
    const resolutionButton = qualityButtons?.[1] as HTMLButtonElement | undefined;

    expect(resolutionButton?.textContent).toBe('1080p');

    resolutionButton?.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    await flushAsyncTurn();

    expect(fixture.getSelectedQuality()).toBe('240p');
    expect(resolutionButton?.textContent).toBe('240p');
    expect(resolutionButton?.dataset.requestedResolution).toBe('240');
    expect(resolutionButton?.title).toBe('Select 240p or the closest available resolution');
    expect(resolutionButton?.getAttribute('aria-pressed')).toBe('true');
  });

  it('enables music mode, hides the video, shows a static overlay, and selects the minimum quality', async () => {
    window.history.replaceState({}, '', '/watch?v=musicmode12345');
    const fixture = createMockYouTubePlayer({ availableQualities: ['Auto', '720p', '240p', '144p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const musicButton = host?.shadowRoot?.querySelector('[data-role="music-button"]') as HTMLButtonElement | null;

    musicButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    const overlay = fixture.player.querySelector<HTMLElement>('[data-role="music-overlay"]');
    expect(fixture.player.classList.contains('yt-playback-speed-controls-music-mode')).toBe(true);
    expect(overlay).not.toBeNull();
    expect(overlay?.dataset.imageSource).toBe('none');
    expect(overlay?.style.backgroundImage).toBe('');
    expect(musicButton?.getAttribute('aria-pressed')).toBe('true');
    expect(musicButton?.getAttribute('aria-label')).toBe('Disable music mode');
    await flushAsyncTurn();
    expect(fixture.getSelectedQuality()).toBe('144p');
  });

  it('ignores its own music-mode DOM mutations when multiple players exist', async () => {
    window.history.replaceState({}, '', '/watch?v=musicstable12345');
    const auxiliaryFixture = createMockYouTubePlayer({
      availableQualities: ['Auto', '360p'],
      attachSettingsButton: false
    });
    const mainFixture = createMockYouTubePlayer({
      availableQualities: ['Auto', '144p'],
      attachSettingsButton: false
    });
    mainFixture.player.id = 'movie_player';
    setElementRect(auxiliaryFixture.player, 320, 180);
    setElementRect(auxiliaryFixture.video, 320, 180);
    setElementRect(mainFixture.player, 1280, 720);
    setElementRect(mainFixture.video, 1280, 720);

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const musicButton = host?.shadowRoot?.querySelector('[data-role="music-button"]') as HTMLButtonElement | null;
    expect(host?.parentElement).toBe(mainFixture.player);

    musicButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncTurn();

    expect(host?.parentElement).toBe(mainFixture.player);
    expect(mainFixture.player.classList.contains('yt-playback-speed-controls-music-mode')).toBe(true);
    expect(mainFixture.player.querySelectorAll('[data-role="music-overlay"]')).toHaveLength(1);
    expect(auxiliaryFixture.player.classList.contains('yt-playback-speed-controls-music-mode')).toBe(false);
    expect(auxiliaryFixture.player.querySelector('[data-role="music-overlay"]')).toBeNull();
  });

  it('keeps music mode black even when a video frame is available', async () => {
    window.history.replaceState({}, '', '/watch?v=musicblack12345');
    const fixture = createMockYouTubePlayer({
      availableQualities: ['Auto', '1080p', '144p'],
      initialVideoSize: { width: 1920, height: 1080 }
    });
    const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    const toDataUrlSpy = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL');

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const musicButton = host?.shadowRoot?.querySelector('[data-role="music-button"]') as HTMLButtonElement | null;

    musicButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    const overlay = fixture.player.querySelector<HTMLElement>('[data-role="music-overlay"]');
    expect(overlay?.dataset.imageSource).toBe('none');
    expect(overlay?.style.backgroundImage).toBe('');
    await flushAsyncTurn();
    expect(fixture.getSelectedQuality()).toBe('144p');
    expect(getContextSpy).not.toHaveBeenCalled();
    expect(toDataUrlSpy).not.toHaveBeenCalled();
  });

  it('disables music mode and returns quality to Auto', async () => {
    window.history.replaceState({}, '', '/watch?v=musicmode54321');
    const fixture = createMockYouTubePlayer({ availableQualities: ['Auto', '720p', '240p', '144p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const musicButton = host?.shadowRoot?.querySelector('[data-role="music-button"]') as HTMLButtonElement | null;

    musicButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    await flushAsyncTurn();
    expect(fixture.getSelectedQuality()).toBe('144p');

    musicButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.getSelectedQuality()).toBe('Auto');
    expect(fixture.player.classList.contains('yt-playback-speed-controls-music-mode')).toBe(false);
    expect(fixture.player.querySelector('[data-role="music-overlay"]')).toBeNull();
    expect(musicButton?.getAttribute('aria-pressed')).toBe('false');
    expect(musicButton?.getAttribute('aria-label')).toBe('Enable music mode');
  });

  it('cleans up music mode visuals on destroy', async () => {
    window.history.replaceState({}, '', '/watch?v=musicdestroy12345');
    const fixture = createMockYouTubePlayer({ availableQualities: ['Auto', '240p', '144p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const musicButton = host?.shadowRoot?.querySelector('[data-role="music-button"]') as HTMLButtonElement | null;

    musicButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(fixture.player.querySelector('[data-role="music-overlay"]')).not.toBeNull();

    handle.destroy();
    handle = null;

    expect(fixture.player.classList.contains('yt-playback-speed-controls-music-mode')).toBe(false);
    expect(fixture.player.querySelector('[data-role="music-overlay"]')).toBeNull();
  });

  it('selects Auto from the YouTube quality menu when it is available', async () => {
    const fixture = createMockYouTubePlayer({ availableQualities: ['Auto', '720p', '480p', '360p'] });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const qualityButtons = host?.shadowRoot?.querySelector('[data-role="quality-group"]')?.querySelectorAll('button');

    qualityButtons?.[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await flushAsyncTurn();

    expect(fixture.getSelectedQuality()).toBe('Auto');
    expect(qualityButtons?.[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(qualityButtons?.[1]?.getAttribute('aria-pressed')).toBe('false');
  });

  it('retries when the quality controls are not ready yet', async () => {
    vi.useFakeTimers();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'], attachSettingsButton: false });

    handle = startYouTubePlaybackSpeedControls();
    await Promise.resolve();

    const host = document.querySelector('[data-playback-controls-for-youtube-host]') as HTMLElement | null;
    const qualityButtons = host?.shadowRoot?.querySelector('[data-role="quality-group"]')?.querySelectorAll('button');
    qualityButtons?.[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(fixture.getSelectedQuality()).toBeNull();

    fixture.setAvailableQualities(['Auto', '720p', '480p', '360p']);
    fixture.attachSettingsButton();
    await vi.advanceTimersByTimeAsync(1000);
    await Promise.resolve();

    expect(fixture.getSelectedQuality()).toBe('Auto');
    expect(qualityButtons?.[0]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('saves the current playback position and timestamp URL for the active YouTube video', async () => {
    window.history.replaceState({}, '', '/watch?v=save12345');
    const storage = createMockStorage();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });

    handle = startYouTubePlaybackSpeedControls({ storage });
    await Promise.resolve();

    fixture.video.currentTime = 42;
    fixture.video.dispatchEvent(new Event('pause'));
    await flushAsyncTurn();

    const positions = storage.getSnapshot().youtubePlaybackPositions as Record<string, { url: string; time: number; duration: number }>;
    expect(positions.save12345).toMatchObject({ url: '/watch?v=save12345&t=42s', time: 42, duration: 120 });
    expect(window.location.pathname + window.location.search).toBe('/watch?v=save12345&t=42s');
  });

  it('updates and saves the timestamp URL every 10 seconds without pushing browser history', async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/watch?v=interval12345');
    const storage = createMockStorage();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });
    const pushStateSpy = vi.spyOn(window.history, 'pushState');

    handle = startYouTubePlaybackSpeedControls({ storage });
    await Promise.resolve();

    fixture.video.currentTime = 55;
    await vi.advanceTimersByTimeAsync(9999);
    await Promise.resolve();
    expect(storage.getSnapshot().youtubePlaybackPositions).toBeUndefined();

    await vi.advanceTimersByTimeAsync(1);
    await Promise.resolve();
    await Promise.resolve();

    const positions = storage.getSnapshot().youtubePlaybackPositions as Record<string, { url: string; time: number }>;
    expect(positions.interval12345).toMatchObject({ url: '/watch?v=interval12345&t=55s', time: 55 });
    expect(window.location.pathname + window.location.search).toBe('/watch?v=interval12345&t=55s');
    expect(pushStateSpy).not.toHaveBeenCalled();
  });

  it('does not save or update the timestamp URL near the end of the video', async () => {
    window.history.replaceState({}, '', '/watch?v=end12345');
    const storage = createMockStorage();
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });

    handle = startYouTubePlaybackSpeedControls({ storage });
    await Promise.resolve();

    fixture.video.currentTime = 118;
    fixture.video.dispatchEvent(new Event('pause'));
    await flushAsyncTurn();

    const positions = storage.getSnapshot().youtubePlaybackPositions as Record<string, unknown> | undefined;
    expect(positions?.end12345).toBeUndefined();
    expect(window.location.pathname + window.location.search).toBe('/watch?v=end12345');
  });

  it('restores the saved playback position when the same video opens again', async () => {
    window.history.replaceState({}, '', '/watch?v=restore12345');
    const storage = createMockStorage({
      youtubePlaybackPositions: {
        restore12345: {
          time: 37,
          duration: 120,
          updatedAt: 1
        }
      }
    });
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });

    handle = startYouTubePlaybackSpeedControls({ storage });
    await flushAsyncTurn();

    expect(fixture.video.currentTime).toBe(34);
    expect(window.location.pathname + window.location.search).toBe('/watch?v=restore12345&t=37s');
  });

  it('restores from a saved timestamp URL and keeps compatible old position records', async () => {
    window.history.replaceState({}, '', '/watch?v=urlrestore12345');
    const storage = createMockStorage({
      youtubePlaybackPositions: {
        urlrestore12345: {
          url: '/watch?v=urlrestore12345&list=PL1&t=50s',
          time: 50,
          duration: 120,
          updatedAt: 1
        }
      }
    });
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });

    handle = startYouTubePlaybackSpeedControls({ storage });
    await flushAsyncTurn();

    expect(fixture.video.currentTime).toBe(47);
    expect(window.location.pathname + window.location.search).toBe('/watch?v=urlrestore12345&list=PL1&t=50s');
  });

  it('respects a timestamp already present in the current URL over older saved positions', async () => {
    window.history.replaceState({}, '', '/watch?v=priority12345&t=80s');
    const storage = createMockStorage({
      youtubePlaybackPositions: {
        priority12345: {
          url: '/watch?v=priority12345&t=37s',
          time: 37,
          duration: 120,
          updatedAt: 1
        }
      }
    });
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });

    handle = startYouTubePlaybackSpeedControls({ storage });
    await flushAsyncTurn();

    expect(fixture.video.currentTime).toBe(77);
    expect(window.location.pathname + window.location.search).toBe('/watch?v=priority12345&t=80s');
  });

  it('retries restoring when YouTube resets the video time during startup', async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/watch?v=resilient12345');
    const storage = createMockStorage({
      youtubePlaybackPositions: {
        resilient12345: {
          time: 37,
          duration: 120,
          updatedAt: 1
        }
      }
    });
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });

    handle = startYouTubePlaybackSpeedControls({ storage });
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.video.currentTime).toBe(34);

    fixture.video.currentTime = 0;
    fixture.video.dispatchEvent(new Event('pause'));
    await Promise.resolve();
    await Promise.resolve();

    const positionsBeforeRetry = storage.getSnapshot().youtubePlaybackPositions as Record<string, { time: number }>;
    expect(positionsBeforeRetry.resilient12345.time).toBe(37);

    await vi.advanceTimersByTimeAsync(400);

    expect(fixture.video.currentTime).toBe(34);
  });

  it('does not restore before the start of the video', async () => {
    window.history.replaceState({}, '', '/watch?v=start12345');
    const storage = createMockStorage({
      youtubePlaybackPositions: {
        start12345: {
          time: 2,
          duration: 120,
          updatedAt: 1
        }
      }
    });
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });

    handle = startYouTubePlaybackSpeedControls({ storage });
    await flushAsyncTurn();

    expect(fixture.video.currentTime).toBe(0);
  });

  it('stops restoring once playback advances past the saved position', async () => {
    vi.useFakeTimers();
    window.history.replaceState({}, '', '/watch?v=continue12345');
    const storage = createMockStorage({
      youtubePlaybackPositions: {
        continue12345: {
          time: 37,
          duration: 120,
          updatedAt: 1
        }
      }
    });
    const fixture = createMockYouTubePlayer({ availableQualities: ['720p', '480p', '360p'] });
    Object.defineProperty(fixture.video, 'duration', { configurable: true, value: 120 });

    handle = startYouTubePlaybackSpeedControls({ storage });
    await Promise.resolve();
    await Promise.resolve();

    expect(fixture.video.currentTime).toBe(34);

    fixture.video.currentTime = 35;
    fixture.video.dispatchEvent(new Event('timeupdate'));
    await vi.advanceTimersByTimeAsync(400);

    expect(fixture.video.currentTime).toBe(35);
  });
});

async function flushAsyncTurn(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 25));
  await Promise.resolve();
}

interface MockGainNode {
  connect: ReturnType<typeof vi.fn>;
  gain: { value: number };
}

function installMockAudioContext(): { gainNodes: MockGainNode[]; sources: HTMLMediaElement[] } {
  const gainNodes: MockGainNode[] = [];
  const sources: HTMLMediaElement[] = [];

  class MockAudioContext {
    destination = {};
    state = 'running';

    createGain(): GainNode {
      const gainNode = { connect: vi.fn(), gain: { value: 1 } };
      gainNodes.push(gainNode);
      return gainNode as unknown as GainNode;
    }

    createMediaElementSource(video: HTMLMediaElement): MediaElementAudioSourceNode {
      sources.push(video);
      return { connect: vi.fn() } as unknown as MediaElementAudioSourceNode;
    }

    resume(): Promise<void> {
      return Promise.resolve();
    }
  }

  Object.defineProperty(window, 'AudioContext', { configurable: true, value: MockAudioContext });
  return { gainNodes, sources };
}

function setElementRect(element: Element, width: number, height: number): void {
  element.getBoundingClientRect = vi.fn(() => ({
    x: 0,
    y: 0,
    top: 0,
    right: width,
    bottom: height,
    left: 0,
    width,
    height,
    toJSON: () => ({})
  }));
}

interface MockYouTubePlayerFixture {
  video: HTMLVideoElement;
  player: HTMLElement;
  attachSettingsButton(): void;
  setAvailableQualities(qualities: string[]): void;
  setVideoFrameSize(width: number, height: number): void;
  setCaptionSegments(lines: string[]): void;
  setActiveTextTrackCues(lines: string[]): void;
  getSelectedQuality(): string | null;
  getCaptionsEnabled(): boolean;
}

function createMockYouTubePlayer(options: {
  availableQualities: string[];
  attachSettingsButton?: boolean;
  attachSubtitlesButton?: boolean;
  initialVideoSize?: { width: number; height: number };
  qualityFrameSizes?: Record<string, { width: number; height: number }>;
}): MockYouTubePlayerFixture {
  const player = document.createElement('div');
  player.className = 'html5-video-player';
  player.id = 'movie_player';

  const video = document.createElement('video');
  const chromeBottom = document.createElement('div');
  chromeBottom.className = 'ytp-chrome-bottom';
  const leftControls = document.createElement('div');
  leftControls.className = 'ytp-left-controls';
  const rightControls = document.createElement('div');
  rightControls.className = 'ytp-right-controls';
  const captionContainer = document.createElement('div');
  captionContainer.className = 'ytp-caption-window-container';

  chromeBottom.append(leftControls, rightControls);
  player.append(video, chromeBottom, captionContainer);

  const settingsButton = document.createElement('button');
  settingsButton.type = 'button';
  settingsButton.className = 'ytp-settings-button';
  settingsButton.textContent = 'Settings';

  const subtitlesButton = document.createElement('button');
  subtitlesButton.type = 'button';
  subtitlesButton.className = 'ytp-subtitles-button';
  subtitlesButton.setAttribute('aria-pressed', 'false');
  subtitlesButton.textContent = 'CC';

  const settingsMenu = document.createElement('div');
  settingsMenu.className = 'ytp-settings-menu';

  const qualityMenuItem = document.createElement('button');
  qualityMenuItem.type = 'button';
  qualityMenuItem.className = 'ytp-menuitem';
  qualityMenuItem.textContent = 'Quality';

  const qualityMenu = document.createElement('div');
  qualityMenu.className = 'ytp-quality-menu';

  let selectedQuality: string | null = null;
  let captionsEnabled = false;
  let availableQualities = [...options.availableQualities];
  let activeTextTrackCueTexts: string[] = [];
  let videoFrameWidth = options.initialVideoSize?.width ?? 0;
  let videoFrameHeight = options.initialVideoSize?.height ?? 0;

  const textTrack = {
    kind: 'subtitles',
    mode: 'showing',
    get activeCues() {
      return Object.assign(
        {
          length: activeTextTrackCueTexts.length
        },
        Object.fromEntries(activeTextTrackCueTexts.map((text, index) => [index, { text }]))
      );
    }
  };

  Object.defineProperty(video, 'textTracks', {
    configurable: true,
    value: {
      0: textTrack,
      length: 1
    }
  });

  Object.defineProperty(video, 'videoWidth', {
    configurable: true,
    get() {
      return videoFrameWidth;
    }
  });

  Object.defineProperty(video, 'videoHeight', {
    configurable: true,
    get() {
      return videoFrameHeight;
    }
  });

  const renderSettingsMenu = () => {
    settingsMenu.replaceChildren(qualityMenuItem);
    if (!settingsMenu.isConnected) {
      player.append(settingsMenu);
    }
  };

  const renderQualityMenu = () => {
    qualityMenu.replaceChildren(
      ...availableQualities.map((label) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'ytp-menuitem';
        item.textContent = label;
        item.addEventListener('click', () => {
          selectedQuality = label;
          const frameSize = options.qualityFrameSizes?.[label];
          if (frameSize) {
            videoFrameWidth = frameSize.width;
            videoFrameHeight = frameSize.height;
          }
        });
        return item;
      })
    );

    if (!qualityMenu.isConnected) {
      player.append(qualityMenu);
    }
  };

  settingsButton.addEventListener('click', renderSettingsMenu);
  qualityMenuItem.addEventListener('click', renderQualityMenu);
  subtitlesButton.addEventListener('click', () => {
    captionsEnabled = !captionsEnabled;
    subtitlesButton.setAttribute('aria-pressed', captionsEnabled ? 'true' : 'false');
  });

  document.body.append(player);

  if (options.attachSubtitlesButton ?? true) {
    rightControls.append(subtitlesButton);
  }

  if (options.attachSettingsButton ?? true) {
    rightControls.append(settingsButton);
  }

  return {
    video,
    player,
    attachSettingsButton() {
      if (!settingsButton.isConnected) {
        rightControls.append(settingsButton);
      }
    },
    setAvailableQualities(qualities: string[]) {
      availableQualities = [...qualities];
    },
    setVideoFrameSize(width: number, height: number) {
      videoFrameWidth = width;
      videoFrameHeight = height;
    },
    setCaptionSegments(lines: string[]) {
      captionContainer.replaceChildren(
        ...lines.map((line) => {
          const segment = document.createElement('span');
          segment.className = 'ytp-caption-segment';
          segment.textContent = line;
          return segment;
        })
      );
    },
    setActiveTextTrackCues(lines: string[]) {
      activeTextTrackCueTexts = [...lines];
    },
    getSelectedQuality() {
      return selectedQuality;
    },
    getCaptionsEnabled() {
      return captionsEnabled;
    }
  };
}

function createMockStorage(initialItems: Record<string, unknown> = {}): YouTubePlaybackSpeedControlsStorage & {
  getSnapshot(): Record<string, unknown>;
} {
  let items = { ...initialItems };

  return {
    get(keys, callback) {
      if (typeof keys === 'string') {
        callback({ [keys]: items[keys] });
        return;
      }

      if (Array.isArray(keys)) {
        callback(Object.fromEntries(keys.map((key) => [key, items[key]])));
        return;
      }

      if (keys && typeof keys === 'object') {
        callback(
          Object.fromEntries(Object.entries(keys).map(([key, fallbackValue]) => [key, items[key] ?? fallbackValue]))
        );
        return;
      }

      callback({ ...items });
    },
    set(nextItems, callback) {
      items = { ...items, ...nextItems };
      callback?.();
    },
    getSnapshot() {
      return { ...items };
    }
  };
}

type ChromeStorageChangeListener = (
  changes: Record<string, chrome.storage.StorageChange>,
  areaName: chrome.storage.AreaName
) => void;

function installMockChromeThemeStorage(
  initialTheme: unknown = DEFAULT_CONTROLS_THEME_ID,
  initialSections: unknown = DEFAULT_VISIBLE_CONTROL_BAR_SECTIONS
): {
  emitThemeChange(nextTheme: unknown): void;
  emitSectionChange(nextSections: unknown): void;
  listenerCount(): number;
} {
  let storedTheme = initialTheme;
  let storedSections = initialSections;
  const listeners = new Set<ChromeStorageChangeListener>();

  const emitThemeChange = (nextTheme: unknown) => {
    const oldValue = storedTheme;
    storedTheme = nextTheme;
    const changes = {
      [CONTROLS_THEME_STORAGE_KEY]: {
        oldValue,
        newValue: nextTheme
      }
    };
    for (const listener of listeners) {
      listener(changes, 'local');
    }
  };

  const emitSectionChange = (nextSections: unknown) => {
    const oldValue = storedSections;
    storedSections = nextSections;
    const changes = {
      [CONTROL_BAR_SECTION_STORAGE_KEY]: {
        oldValue,
        newValue: nextSections
      }
    };
    for (const listener of listeners) {
      listener(changes, 'local');
    }
  };

  const chromeApi = {
    storage: {
      local: {
        get(keys: string | string[] | Record<string, unknown> | null, callback: (items: Record<string, unknown>) => void) {
          if (typeof keys === 'string') {
            callback({
              [keys]:
                keys === CONTROLS_THEME_STORAGE_KEY
                  ? storedTheme
                  : keys === CONTROL_BAR_SECTION_STORAGE_KEY
                    ? storedSections
                    : undefined
            });
            return;
          }

          if (Array.isArray(keys)) {
            callback(
              Object.fromEntries(
                keys.map((key) => [
                  key,
                  key === CONTROLS_THEME_STORAGE_KEY
                    ? storedTheme
                    : key === CONTROL_BAR_SECTION_STORAGE_KEY
                      ? storedSections
                      : undefined
                ])
              )
            );
            return;
          }

          if (keys && typeof keys === 'object') {
            callback(
              Object.fromEntries(
                Object.entries(keys).map(([key, fallbackValue]) => [
                  key,
                  key === CONTROLS_THEME_STORAGE_KEY
                    ? storedTheme
                    : key === CONTROL_BAR_SECTION_STORAGE_KEY
                      ? storedSections
                      : fallbackValue
                ])
              )
            );
            return;
          }

          callback({ [CONTROLS_THEME_STORAGE_KEY]: storedTheme, [CONTROL_BAR_SECTION_STORAGE_KEY]: storedSections });
        },
        set(items: Record<string, unknown>, callback?: () => void) {
          if (CONTROLS_THEME_STORAGE_KEY in items) {
            emitThemeChange(items[CONTROLS_THEME_STORAGE_KEY]);
          }
          if (CONTROL_BAR_SECTION_STORAGE_KEY in items) {
            emitSectionChange(items[CONTROL_BAR_SECTION_STORAGE_KEY]);
          }
          callback?.();
        }
      },
      onChanged: {
        addListener(listener: ChromeStorageChangeListener) {
          listeners.add(listener);
        },
        removeListener(listener: ChromeStorageChangeListener) {
          listeners.delete(listener);
        }
      }
    }
  };

  Object.defineProperty(globalThis, 'chrome', {
    configurable: true,
    value: chromeApi
  });

  return {
    emitThemeChange,
    emitSectionChange,
    listenerCount() {
      return listeners.size;
    }
  };
}
