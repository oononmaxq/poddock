import { signal, computed } from '@preact/signals';

export interface Episode {
  id: string;
  title: string;
  podcastId: string;
  podcastTitle: string;
  audioUrl: string;
  coverImageUrl?: string;
  durationSeconds?: number;
}

// Global audio state
export const currentEpisode = signal<Episode | null>(null);
export const isPlaying = signal(false);
export const currentTime = signal(0);
export const duration = signal(0);
export const volume = signal(1);
export const playbackRate = signal(1);

// Derived state
export const progress = computed(() => {
  if (duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

export const formattedCurrentTime = computed(() => formatTime(currentTime.value));
export const formattedDuration = computed(() => formatTime(duration.value));

// Audio element reference (singleton)
let audioElement: HTMLAudioElement | null = null;

export function getAudioElement(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'metadata';

    audioElement.addEventListener('timeupdate', () => {
      currentTime.value = audioElement!.currentTime;
    });

    audioElement.addEventListener('loadedmetadata', () => {
      duration.value = audioElement!.duration;
    });

    audioElement.addEventListener('ended', () => {
      isPlaying.value = false;
      currentTime.value = 0;
    });

    audioElement.addEventListener('play', () => {
      isPlaying.value = true;
    });

    audioElement.addEventListener('pause', () => {
      isPlaying.value = false;
    });
  }
  return audioElement;
}

// Actions
export function playEpisode(episode: Episode) {
  const audio = getAudioElement();

  // Same episode, just toggle play/pause
  if (currentEpisode.value?.id === episode.id) {
    if (isPlaying.value) {
      audio.pause();
    } else {
      audio.play();
    }
    return;
  }

  // New episode
  currentEpisode.value = episode;
  audio.src = episode.audioUrl;
  audio.volume = volume.value;
  audio.playbackRate = playbackRate.value;
  audio.play();
}

export function pause() {
  getAudioElement().pause();
}

export function resume() {
  getAudioElement().play();
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
}

export function setPlaybackRate(rate: number) {
  playbackRate.value = rate;
  getAudioElement().playbackRate = rate;
}

// Utility
function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
