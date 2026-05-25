import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  PLAYBACK_HISTORY_UPDATED_EVENT,
  getLocalPlaybackHistory,
  type PlaybackHistoryItem,
  type Episode,
} from '../stores/audio-store';

interface ApiHistoryItem {
  episodeId: string;
  podcastId: string;
  title: string;
  podcastTitle: string;
  audioUrl: string;
  coverImageUrl: string | null;
  lastPositionSeconds: number;
  durationSeconds: number;
  lastPlayedAt: string;
}

interface ApiResponse {
  items: ApiHistoryItem[];
}

type SourceType = 'db' | 'local';

interface PlaybackHistoryPanelProps {
  limit?: number;
}

function toEpisode(item: PlaybackHistoryItem): Episode {
  return {
    id: item.episodeId,
    title: item.title,
    podcastId: item.podcastId,
    podcastTitle: item.podcastTitle,
    audioUrl: item.audioUrl,
    coverImageUrl: item.coverImageUrl,
    durationSeconds: item.durationSeconds,
    initialTimeSeconds: item.lastPositionSeconds,
  };
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function normalizeApiItems(items: ApiHistoryItem[]): PlaybackHistoryItem[] {
  return items.map((item) => ({
    episodeId: item.episodeId,
    podcastId: item.podcastId,
    title: item.title,
    podcastTitle: item.podcastTitle,
    audioUrl: item.audioUrl,
    coverImageUrl: item.coverImageUrl ?? undefined,
    lastPositionSeconds: item.lastPositionSeconds,
    durationSeconds: item.durationSeconds,
    lastPlayedAt: item.lastPlayedAt,
  }));
}

export function PlaybackHistoryPanel({ limit = 10 }: PlaybackHistoryPanelProps) {
  const [items, setItems] = useState<PlaybackHistoryItem[]>([]);
  const [source, setSource] = useState<SourceType>('local');

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/listening-history?limit=${limit}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const payload = (await response.json()) as ApiResponse;
        setItems(normalizeApiItems(payload.items));
        setSource('db');
        return;
      }
      if (response.status !== 401 && response.status !== 403) {
        return;
      }
    } catch {
      // fall through to local history
    }

    setItems(getLocalPlaybackHistory(limit));
    setSource('local');
  };

  useEffect(() => {
    void loadHistory();
  }, [limit]);

  useEffect(() => {
    const onUpdated = () => {
      if (source === 'db') {
        void loadHistory();
        return;
      }
      setItems(getLocalPlaybackHistory(limit));
    };
    window.addEventListener(PLAYBACK_HISTORY_UPDATED_EVENT, onUpdated);
    return () => {
      window.removeEventListener(PLAYBACK_HISTORY_UPDATED_EVENT, onUpdated);
    };
  }, [source, limit]);

  const label = useMemo(() => (source === 'db' ? 'ログイン履歴' : 'ローカル履歴'), [source]);

  if (items.length === 0) {
    return null;
  }

  return (
    <section class="mb-8">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-xl font-bold">再生履歴</h2>
        <span class="badge badge-outline">{label}</span>
      </div>
      <div class="grid gap-2">
        {items.map((item) => (
          <article class="card border border-base-300 bg-base-100">
            <div class="card-body p-3 sm:p-4">
              <div class="flex items-start gap-3">
                <button
                  type="button"
                  class="btn btn-primary btn-sm btn-circle mt-1"
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent('poddock:play-episode', { detail: toEpisode(item) }))
                  }
                  aria-label="履歴から再生"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
                    <path d="M8 5.14v14l11-7-11-7z" />
                  </svg>
                </button>
                <div class="flex-shrink-0 mt-1">
                  {item.coverImageUrl ? (
                    <img
                      src={item.coverImageUrl}
                      alt={item.podcastTitle}
                      class="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div class="w-12 h-12 rounded-lg bg-base-300 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        class="w-6 h-6 text-base-content/50"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold line-clamp-1">{item.title}</p>
                  <p class="text-xs text-base-content/70 line-clamp-1">{item.podcastTitle}</p>
                  <div class="mt-2 text-xs text-base-content/60 flex flex-wrap gap-2">
                    <span>続き: {formatTime(item.lastPositionSeconds)}</span>
                    <span>/</span>
                    <span>{formatTime(item.durationSeconds)}</span>
                    <span>・</span>
                    <span>{new Date(item.lastPlayedAt).toLocaleString('ja-JP')}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
