import { useEffect, useState } from 'preact/hooks';
import { PlaybackHistoryPanel } from './PlaybackHistoryPanel';
import { EpisodeInlineCard } from './EpisodeInlineCard';
import { resolvePlayableUrl } from '../utils/playable-url';

interface SubscriptionItem {
  sourceId: string;
  feedTitle: string;
  feedImageUrl: string | null;
  category: string | null;
}

interface FavoriteEpisodeItem {
  sourceId: string;
  episodeKey: string;
  title: string;
  podcastTitle: string;
  coverImageUrl: string | null;
  enclosureUrl: string | null;
}

export function MyPageDashboard() {
  const DASHBOARD_LIMIT = 5;
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [favoriteEpisodes, setFavoriteEpisodes] = useState<FavoriteEpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [subsRes, favoritesRes] = await Promise.all([
        fetch('/api/channel-subscriptions', { credentials: 'include' }),
        fetch(`/api/episode-favorites?limit=${DASHBOARD_LIMIT}`, { credentials: 'include' }),
      ]);

      if (
        subsRes.status === 401 ||
        subsRes.status === 403 ||
        favoritesRes.status === 401 ||
        favoritesRes.status === 403
      ) {
        window.location.href = '/login';
        return;
      }

      if (subsRes.ok) {
        const subsData = (await subsRes.json()) as { items: SubscriptionItem[] };
        setSubscriptions(subsData.items);
      }
      if (favoritesRes.ok) {
        const favoritesData = (await favoritesRes.json()) as { items: FavoriteEpisodeItem[] };
        setFavoriteEpisodes(favoritesData.items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handlePlayFavorite = (item: FavoriteEpisodeItem) => {
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

  if (loading) {
    return (
      <div class="py-16 text-center">
        <span class="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div class="space-y-10">
      <PlaybackHistoryPanel limit={DASHBOARD_LIMIT} moreHref="/mypage/playback-history" />

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold">お気に入りエピソード</h2>
          <span class="badge badge-outline">{favoriteEpisodes.length}件</span>
        </div>
        {favoriteEpisodes.length === 0 ? (
          <div class="alert">まだお気に入りがありません。エピソードの☆ボタンから追加できます。</div>
        ) : (
          <div class="space-y-2">
            {favoriteEpisodes.map((item) => (
              <EpisodeInlineCard
                key={`${item.sourceId}:${item.episodeKey}`}
                title={item.title || '(untitled)'}
                imageUrl={item.coverImageUrl}
                imageAlt={item.podcastTitle}
                onPlay={() => handlePlayFavorite(item)}
                playAriaLabel="再生"
                disabled={!item.enclosureUrl}
              />
            ))}
          </div>
        )}
        <div class="mt-3 flex justify-end">
          <a href="/mypage/favorites" class="btn btn-sm btn-outline">もっとみる</a>
        </div>
      </section>

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold">登録チャンネル</h2>
          <span class="badge badge-outline">{subscriptions.length}件</span>
        </div>
        {subscriptions.length === 0 ? (
          <div class="alert">まだ登録チャンネルがありません。番組ページから登録してください。</div>
        ) : (
          <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {subscriptions.map((item) => (
              <a href={`/feeds/${item.sourceId}`} class="group block" key={item.sourceId}>
                <div class="overflow-hidden rounded-xl border border-base-300 bg-base-200">
                  {item.feedImageUrl ? (
                    <img
                      src={item.feedImageUrl}
                      alt={item.feedTitle}
                      class="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div class="aspect-square w-full bg-base-300 flex items-center justify-center">
                      <span class="text-sm text-base-content/50">No Image</span>
                    </div>
                  )}
                </div>
                <div class="mt-2 px-1">
                  <p class="text-sm sm:text-base font-semibold leading-tight line-clamp-2">{item.feedTitle}</p>
                  <div class="mt-1 flex items-center gap-2 text-xs text-base-content/70">
                    {item.category && <span class="badge badge-outline badge-sm">{item.category}</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
