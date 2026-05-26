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
        {items.map((item) => (
          <EpisodeInlineCard
            key={`${item.episodeId}:${item.lastPlayedAt}`}
            title={item.title}
            imageUrl={item.coverImageUrl}
            imageAlt={item.podcastTitle}
            onPlay={() =>
              window.dispatchEvent(new CustomEvent('poddock:play-episode', { detail: toEpisode(item) }))
            }
            playAriaLabel="履歴から再生"
          />
        ))}
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
