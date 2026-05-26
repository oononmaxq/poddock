import { useCallback } from 'preact/hooks';
import { resolvePlayableUrl } from '../utils/playable-url';
import { EpisodeInlineCard } from './EpisodeInlineCard';
import { usePaginatedList, type PaginatedFetchResult } from '../hooks/use-paginated-list';

interface FavoriteEpisodeItem {
  sourceId: string;
  episodeKey: string;
  title: string;
  podcastTitle: string;
  coverImageUrl: string | null;
  enclosureUrl: string | null;
}

interface ApiResponse {
  items: FavoriteEpisodeItem[];
}

const PAGE_SIZE = 10;

export function FavoriteEpisodesPage() {
  const fetchPage = useCallback(async (offset: number, limit: number): Promise<PaginatedFetchResult<FavoriteEpisodeItem>> => {
    try {
      const response = await fetch(`/api/episode-favorites?limit=${limit}&offset=${offset}`, {
        credentials: 'include',
      });

      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login';
        return { items: [], hasMore: false };
      }

      if (!response.ok) {
        return { items: [], hasMore: false };
      }

      const payload = (await response.json()) as ApiResponse;
      return { items: payload.items, hasMore: payload.items.length === limit };
    } catch {
      return { items: [], hasMore: false };
    }
  }, []);
  const { items, hasMore, loadingInitial, loadingMore, loadMore } = usePaginatedList<FavoriteEpisodeItem>({
    pageSize: PAGE_SIZE,
    fetchPage,
  });

  const handlePlay = (item: FavoriteEpisodeItem) => {
    if (!item.enclosureUrl) return;
    window.dispatchEvent(
      new CustomEvent('poddock:play-episode', {
        detail: {
          id: `${item.sourceId}:${item.episodeKey}`,
          title: item.title || '(untitled)',
          podcastId: item.sourceId,
          podcastTitle: item.podcastTitle,
          audioUrl: resolvePlayableUrl(item.enclosureUrl),
          coverImageUrl: item.coverImageUrl || undefined,
        },
      })
    );
  };

  if (loadingInitial) {
    return (
      <div class="py-16 text-center">
        <span class="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return <div class="alert">お気に入りエピソードはまだありません。</div>;
  }

  return (
    <section class="space-y-3">
      <div class="grid gap-2">
        {items.map((item) => (
          <EpisodeInlineCard
            key={`${item.sourceId}:${item.episodeKey}`}
            title={item.title || '(untitled)'}
            imageUrl={item.coverImageUrl}
            imageAlt={item.podcastTitle}
            onPlay={() => handlePlay(item)}
            playAriaLabel="再生"
            disabled={!item.enclosureUrl}
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
