import { signal, computed } from '@preact/signals';

export interface Episode {
  id: string;
  title: string;
  podcastId: string;
  podcastTitle: string;
  audioUrl: string;
  coverImageUrl?: string;
  durationSeconds?: number;
  initialTimeSeconds?: number;
}

export interface PlaybackHistoryItem {
  episodeId: string;
  podcastId: string;
  title: string;
  podcastTitle: string;
  audioUrl: string;
  coverImageUrl?: string;
  lastPositionSeconds: number;
  durationSeconds: number;
  lastPlayedAt: string;
}

// Global audio state
export const currentEpisode = signal<Episode | null>(null);
export const isPlaying = signal(false);
export const currentTime = signal(0);
export const duration = signal(0);
export const volume = signal(1);
export const playbackRate = signal(1);

// Feed episode list for prev/next navigation
export interface FeedEpisodeInfo {
  id: string;
  title: string;
  audioUrl: string;
  coverImageUrl?: string;
  durationSeconds?: number;
}
export const currentFeedEpisodes = signal<FeedEpisodeInfo[]>([]);
export const currentFeedPodcastId = signal<string | null>(null);
export const currentFeedPodcastTitle = signal<string>('');

export function setFeedEpisodes(podcastId: string, podcastTitle: string, episodes: FeedEpisodeInfo[]) {
  currentFeedPodcastId.value = podcastId;
  currentFeedPodcastTitle.value = podcastTitle;
  currentFeedEpisodes.value = episodes;
}

export function clearFeedEpisodes() {
  currentFeedPodcastId.value = null;
  currentFeedPodcastTitle.value = '';
  currentFeedEpisodes.value = [];
}

// Derived state
export const progress = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

export const formattedCurrentTime = computed(() => formatTime(currentTime.value));
export const formattedDuration = computed(() => formatTime(duration.value));

// Audio element reference (singleton)
let audioElement: HTMLAudioElement | null = null;
let hasRestoredState = false;
let pendingSeekTime: number | null = null;
let lastSnapshotSaveMs = 0;
let lastRemoteSyncMs = 0;
let remoteSyncMode: 'unknown' | 'enabled' | 'disabled' = 'unknown';
let authStatusPromise: Promise<'enabled' | 'disabled'> | null = null;

const SNAPSHOT_STORAGE_KEY = 'poddock:playback:snapshot:v1';
const HISTORY_STORAGE_KEY = 'poddock:playback:history:v1';
const HISTORY_LIMIT_GUEST = 10;
const SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SNAPSHOT_SAVE_INTERVAL_MS = 5000;
const REMOTE_SYNC_INTERVAL_MS = 10000;
export const PLAYBACK_HISTORY_UPDATED_EVENT = 'poddock:playback-history-updated';

interface PlaybackSnapshot {
  episode: Episode;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  savedAt: number;
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function supportsMediaSession(): boolean {
  return isBrowser() && 'mediaSession' in navigator;
}

function updateMediaSessionMetadata(episode: Episode | null) {
  if (!supportsMediaSession()) return;
  if (!episode) {
    navigator.mediaSession.metadata = null;
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: episode.title,
    artist: episode.podcastTitle,
    album: episode.podcastTitle,
    artwork: episode.coverImageUrl
      ? [
          { src: episode.coverImageUrl, sizes: '96x96', type: 'image/png' },
          { src: episode.coverImageUrl, sizes: '128x128', type: 'image/png' },
          { src: episode.coverImageUrl, sizes: '192x192', type: 'image/png' },
          { src: episode.coverImageUrl, sizes: '256x256', type: 'image/png' },
          { src: episode.coverImageUrl, sizes: '384x384', type: 'image/png' },
          { src: episode.coverImageUrl, sizes: '512x512', type: 'image/png' },
        ]
      : [],
  });
}

function updateMediaSessionPlaybackState() {
  if (!supportsMediaSession()) return;
  navigator.mediaSession.playbackState = isPlaying.value ? 'playing' : 'paused';
}

function updateMediaSessionPositionState() {
  if (!supportsMediaSession()) return;
  if (!audioElement || !Number.isFinite(duration.value) || duration.value <= 0) return;
  if (!('setPositionState' in navigator.mediaSession)) return;
  navigator.mediaSession.setPositionState({
    duration: duration.value,
    playbackRate: playbackRate.value,
    position: Math.max(0, Math.min(currentTime.value, duration.value)),
  });
}

function registerMediaSessionHandlers() {
  if (!supportsMediaSession()) return;
  navigator.mediaSession.setActionHandler('play', () => {
    resume();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    pause();
  });
  navigator.mediaSession.setActionHandler('seekbackward', (details) => {
    skipBackward(details.seekOffset ?? 15);
  });
  navigator.mediaSession.setActionHandler('seekforward', (details) => {
    skipForward(details.seekOffset ?? 15);
  });
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (typeof details.seekTime === 'number') {
      seek(details.seekTime);
    }
  });
}

function emitHistoryUpdated() {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(PLAYBACK_HISTORY_UPDATED_EVENT));
}

function readLocalHistory(): PlaybackHistoryItem[] {
  if (!isBrowser()) return [];
  return parseJson<PlaybackHistoryItem[]>(window.localStorage.getItem(HISTORY_STORAGE_KEY)) ?? [];
}

function writeLocalHistory(items: PlaybackHistoryItem[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(items));
}

export function getLocalPlaybackHistory(limit: number = HISTORY_LIMIT_GUEST): PlaybackHistoryItem[] {
  return readLocalHistory().slice(0, Math.max(1, limit));
}

function upsertLocalHistory(episode: Episode, positionSeconds: number, durationSeconds: number) {
  if (!isBrowser()) return;
  const now = new Date().toISOString();
  const nextItem: PlaybackHistoryItem = {
    episodeId: episode.id,
    podcastId: episode.podcastId,
    title: episode.title,
    podcastTitle: episode.podcastTitle,
    audioUrl: episode.audioUrl,
    coverImageUrl: episode.coverImageUrl,
    lastPositionSeconds: Math.max(0, Math.floor(positionSeconds)),
    durationSeconds: Math.max(0, Math.floor(durationSeconds)),
    lastPlayedAt: now,
  };
  const existing = readLocalHistory();
  const deduped = existing.filter((item) => item.episodeId !== nextItem.episodeId);
  const updated = [nextItem, ...deduped].slice(0, HISTORY_LIMIT_GUEST);
  writeLocalHistory(updated);
  emitHistoryUpdated();
}

async function syncHistoryToRemote(episode: Episode, positionSeconds: number, durationSeconds: number, force: boolean = false) {
  if (!isBrowser()) return;
  if (remoteSyncMode === 'unknown') {
    if (!authStatusPromise) {
      authStatusPromise = fetch('/api/auth/status', {
        credentials: 'include',
      })
        .then(async (response) => {
          if (!response.ok) return 'disabled' as const;
          const data = (await response.json()) as { authenticated?: boolean };
          return data.authenticated ? ('enabled' as const) : ('disabled' as const);
        })
        .catch(() => 'disabled' as const)
        .finally(() => {
          authStatusPromise = null;
        });
    }
    remoteSyncMode = await authStatusPromise;
  }
  if (remoteSyncMode === 'disabled') return;
  const nowMs = Date.now();
  if (!force && nowMs - lastRemoteSyncMs < REMOTE_SYNC_INTERVAL_MS) return;
  lastRemoteSyncMs = nowMs;

  const response = await fetch('/api/listening-history', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      episode_id: episode.id,
      podcast_id: episode.podcastId,
      title: episode.title,
      podcast_title: episode.podcastTitle,
      audio_url: episode.audioUrl,
      cover_image_url: episode.coverImageUrl ?? null,
      last_position_seconds: Math.max(0, Math.floor(positionSeconds)),
      duration_seconds: Math.max(0, Math.floor(durationSeconds)),
      last_played_at: new Date().toISOString(),
    }),
  });

  if (response.status === 401 || response.status === 403) {
    remoteSyncMode = 'disabled';
    return;
  }
  if (response.ok) {
    remoteSyncMode = 'enabled';
    emitHistoryUpdated();
  }
}

function persistPlaybackState(force: boolean = false) {
  if (!isBrowser() || !currentEpisode.value) return;
  const nowMs = Date.now();
  if (!force && nowMs - lastSnapshotSaveMs < SNAPSHOT_SAVE_INTERVAL_MS) return;
  lastSnapshotSaveMs = nowMs;

  const snapshot: PlaybackSnapshot = {
    episode: currentEpisode.value,
    currentTime: currentTime.value,
    duration: duration.value,
    isPlaying: isPlaying.value,
    volume: volume.value,
    playbackRate: playbackRate.value,
    savedAt: nowMs,
  };
  window.localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));

  const episode = currentEpisode.value;
  const currentDuration = duration.value || episode.durationSeconds || 0;
  upsertLocalHistory(episode, currentTime.value, currentDuration);
  void syncHistoryToRemote(episode, currentTime.value, currentDuration, force).catch(() => {});
}

function restorePlaybackStateIfNeeded() {
  if (!isBrowser() || hasRestoredState) return;
  hasRestoredState = true;
  const snapshot = parseJson<PlaybackSnapshot>(window.localStorage.getItem(SNAPSHOT_STORAGE_KEY));
  if (!snapshot) return;
  if (!snapshot.episode?.audioUrl) return;
  if (!snapshot.savedAt || Date.now() - snapshot.savedAt > SNAPSHOT_MAX_AGE_MS) return;

  currentEpisode.value = snapshot.episode;
  updateMediaSessionMetadata(snapshot.episode);
  volume.value = Math.max(0, Math.min(1, snapshot.volume ?? 1));
  playbackRate.value = snapshot.playbackRate ?? 1;
  currentTime.value = Math.max(0, snapshot.currentTime ?? 0);
  duration.value = Math.max(0, snapshot.duration ?? 0);

  const audio = getAudioElement();
  audio.src = snapshot.episode.audioUrl;
  audio.volume = volume.value;
  audio.playbackRate = playbackRate.value;
  pendingSeekTime = currentTime.value > 0 ? currentTime.value : null;
  updateMediaSessionPlaybackState();
  updateMediaSessionPositionState();
}

export function getAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'metadata';
    registerMediaSessionHandlers();

    audioElement.addEventListener('timeupdate', () => {
      currentTime.value = audioElement!.currentTime;
      persistPlaybackState();
      updateMediaSessionPositionState();
    });

    audioElement.addEventListener('loadedmetadata', () => {
      duration.value = audioElement!.duration;
      if (pendingSeekTime !== null) {
        audioElement!.currentTime = Math.max(0, Math.min(pendingSeekTime, audioElement!.duration || pendingSeekTime));
        pendingSeekTime = null;
      }
      updateMediaSessionPositionState();
    });

    audioElement.addEventListener('ended', () => {
      isPlaying.value = false;
      currentTime.value = 0;
      persistPlaybackState(true);
      updateMediaSessionPlaybackState();
      updateMediaSessionPositionState();
    });

    audioElement.addEventListener('play', () => {
      isPlaying.value = true;
      updateMediaSessionPlaybackState();
      updateMediaSessionPositionState();
    });

    audioElement.addEventListener('pause', () => {
      isPlaying.value = false;
      persistPlaybackState(true);
      updateMediaSessionPlaybackState();
      updateMediaSessionPositionState();
    });

    if (isBrowser()) {
      window.addEventListener('beforeunload', () => {
        persistPlaybackState(true);
      });
    }
  }
  restorePlaybackStateIfNeeded();
  return audioElement;
}

// Actions
export function playEpisode(episode: Episode) {
  const audio = getAudioElement();

  // Same episode, just toggle play/pause
  if (currentEpisode.value?.id === episode.id) {
    if (typeof episode.initialTimeSeconds === 'number') {
      seek(episode.initialTimeSeconds);
    }
    if (isPlaying.value) {
      audio.pause();
    } else {
      void audio.play().catch((error) => {
        console.error('Failed to resume audio playback', error);
      });
    }
    persistPlaybackState(true);
    return;
  }

  // New episode
  currentEpisode.value = episode;
  updateMediaSessionMetadata(episode);
  audio.src = episode.audioUrl;
  audio.volume = volume.value;
  audio.playbackRate = playbackRate.value;
  if (typeof episode.initialTimeSeconds === 'number' && episode.initialTimeSeconds > 0) {
    pendingSeekTime = episode.initialTimeSeconds;
  } else {
    pendingSeekTime = null;
  }
  void audio.play().catch((error) => {
    console.error('Failed to start audio playback', error);
  });
  persistPlaybackState(true);
  updateMediaSessionPositionState();
}

export function pause() {
  getAudioElement().pause();
}

export function resume() {
  void getAudioElement().play().catch((error) => {
    console.error('Failed to resume audio playback', error);
  });
}

export function togglePlay() {
  if (isPlaying.value) {
    pause();
  } else {
    resume();
  }
}

export function seek(time: number) {
  const audio = getAudioElement();
  audio.currentTime = Math.max(0, Math.min(time, duration.value));
  persistPlaybackState(true);
  updateMediaSessionPositionState();
}

export function seekByPercent(percent: number) {
  seek((percent / 100) * duration.value);
}

export function skipForward(seconds: number = 15) {
  seek(currentTime.value + seconds);
}

export function skipBackward(seconds: number = 15) {
  seek(currentTime.value - seconds);
}

export function setVolume(v: number) {
  volume.value = Math.max(0, Math.min(1, v));
  getAudioElement().volume = volume.value;
  persistPlaybackState(true);
}

export function setPlaybackRate(rate: number) {
  playbackRate.value = rate;
  getAudioElement().playbackRate = rate;
  persistPlaybackState(true);
  updateMediaSessionPositionState();
}

// Utility
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
