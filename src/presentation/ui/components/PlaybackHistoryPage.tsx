import { useState, useEffect, useCallback } from 'preact/hooks';
import {
  getLocalPlaybackHistory,
  type Episode,
  type PlaybackHistoryItem,
} from '../stores/audio-store';
import { EpisodeInlineCard } from './EpisodeInlineCard';
import { usePaginatedList, type PaginatedFetchResult } from '../hooks/use-paginated-list';

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

const PAGE_SIZE = 10;

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

async function fetchBatch(offset: number, limit: number): Promise<PaginatedFetchResult<PlaybackHistoryItem>> {
  try {
    const response = await fetch(`/api/listening-history?limit=${limit}&offset=${offset}`, {
      credentials: 'include',
    });
    if (response.status === 401 || response.status === 403) {
      window.location.href = '/login';
      return { items: [], hasMore: false };
    }
    if (response.ok) {
      const payload = (await response.json()) as ApiResponse;
      const items = normalizeApiItems(payload.items);
      return {
        items,
        hasMore: items.length === limit,
      };
    }
  } catch {
    // fall through to local history
  }

  const localItems = getLocalPlaybackHistory(offset + limit).slice(offset);
  return { items: localItems, hasMore: false };
}

export function PlaybackHistoryPage() {
  const { items, hasMore, loadingInitial, loadingMore, loadMore } = usePaginatedList<PlaybackHistoryItem>({
    pageSize: PAGE_SIZE,
    fetchPage: fetchBatch,
  });

  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set());

  // Fetch favorite status for displayed items
  useEffect(() => {
    if (items.length === 0) return;

    // Group by podcastId
    const byPodcast = new Map<string, PlaybackHistoryItem[]>();
    for (const item of items) {
      const list = byPodcast.get(item.podcastId) || [];
      list.push(item);
      byPodcast.set(item.podcastId, list);
    }

    // Fetch status for each podcast
    byPodcast.forEach((podcastItems, podcastId) => {
      const episodeKeys = podcastItems.map((i) => i.episodeId).join(',');
      fetch(`/api/episode-favorites/status?source_id=${encodeURIComponent(podcastId)}&episode_keys=${encodeURIComponent(episodeKeys)}`, {
        credentials: 'include',
      })
        .then((res) => res.ok ? res.json() : { keys: [] })
        .then((data: { keys: string[] }) => {
          setFavoriteKeys((prev) => {
            const next = new Set(prev);
            for (const key of data.keys) {
              next.add(`${podcastId}:${key}`);
            }
            return next;
          });
        })
        .catch(() => {});
    });
  }, [items]);

  const handleToggleFavorite = useCallback(async (item: PlaybackHistoryItem) => {
    const key = `${item.podcastId}:${item.episodeId}`;
    const isFavorite = favoriteKeys.has(key);

    setLoadingKeys((prev) => new Set(prev).add(key));

    try {
      if (isFavorite) {
        // Remove favorite
        const response = await fetch('/api/episode-favorites', {
          method: 'DELETE',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_id: item.podcastId,
            episode_key: item.episodeId,
          }),
        });
        if (response.ok || response.status === 204) {
          setFavoriteKeys((prev) => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        }
      } else {
        // Add favorite
        const response = await fetch('/api/episode-favorites', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_id: item.podcastId,
            episode_key: item.episodeId,
            title: item.title,
            podcast_title: item.podcastTitle,
            cover_image_url: item.coverImageUrl || null,
            enclosure_url: item.audioUrl,
          }),
        });
        if (response.ok) {
          setFavoriteKeys((prev) => new Set(prev).add(key));
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [favoriteKeys]);

  if (loadingInitial) {
    return (
      <div class="py-16 text-center">
        <span class="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return <div class="alert">再生履歴はまだありません。</div>;
  }

  return (
    <section class="space-y-3">
      <div class="grid gap-2">
        {items.map((item) => {
          const key = `${item.podcastId}:${item.episodeId}`;
          return (
            <EpisodeInlineCard
              key={`${item.episodeId}:${item.lastPlayedAt}`}
              title={item.title}
              imageUrl={item.coverImageUrl}
              imageAlt={item.podcastTitle}
              onPlay={() =>
                window.dispatchEvent(new CustomEvent('poddock:play-episode', { detail: toEpisode(item) }))
              }
              playAriaLabel="履歴から再生"
              isFavorite={favoriteKeys.has(key)}
              onToggleFavorite={() => void handleToggleFavorite(item)}
              favoriteLoading={loadingKeys.has(key)}
            />
          );
        })}
      </div>
      {hasMore && (
        <div class="pt-1 flex justify-center">
          <button type="button" class="btn btn-outline btn-sm" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? '読み込み中...' : 'もっと見る'}
          </button>
        </div>
      )}
    </section>
  );
}
