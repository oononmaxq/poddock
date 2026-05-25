import { useEffect, useState } from 'preact/hooks';
import { PlaybackHistoryPanel } from './PlaybackHistoryPanel';

interface SubscriptionItem {
  sourceId: string;
  sourceName: string | null;
  feedTitle: string;
  feedImageUrl: string | null;
  category: string | null;
  feedUrl: string;
  subscribedAt: string;
}

interface LatestEpisodeItem {
  id: string;
  sourceId: string;
  sourceName: string;
  feedTitle: string;
  feedImageUrl: string | null;
  title: string;
  description: string;
  pubDate: string | null;
  link: string | null;
  enclosureUrl: string | null;
}

interface FavoriteEpisodeItem {
  sourceId: string;
  episodeKey: string;
  title: string;
  podcastTitle: string;
  coverImageUrl: string | null;
  link: string | null;
  enclosureUrl: string | null;
  pubDate: string | null;
  createdAt: string;
}

function resolvePlayableUrl(url: string) {
  const anchorRedirectPattern = /\/podcast\/play\/\d+\/(.+)$/;
  const match = url.match(anchorRedirectPattern);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return url;
    }
  }
  return url;
}

export function MyPageDashboard() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([]);
  const [latestEpisodes, setLatestEpisodes] = useState<LatestEpisodeItem[]>([]);
  const [favoriteEpisodes, setFavoriteEpisodes] = useState<FavoriteEpisodeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [subsRes, latestRes, favoritesRes] = await Promise.all([
        fetch('/api/channel-subscriptions', { credentials: 'include' }),
        fetch('/api/channel-subscriptions/latest?limit=24', { credentials: 'include' }),
        fetch('/api/episode-favorites?limit=24', { credentials: 'include' }),
      ]);

      if (
        subsRes.status === 401 ||
        subsRes.status === 403 ||
        latestRes.status === 401 ||
        latestRes.status === 403 ||
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
      if (latestRes.ok) {
        const latestData = (await latestRes.json()) as { items: LatestEpisodeItem[] };
        setLatestEpisodes(latestData.items);
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

  const handlePlay = (item: LatestEpisodeItem) => {
    if (!item.enclosureUrl) return;
    window.dispatchEvent(
      new CustomEvent('poddock:play-episode', {
        detail: {
          id: `${item.sourceId}:${item.id}`,
          title: item.title || '(untitled)',
          podcastId: item.sourceId,
          podcastTitle: item.feedTitle,
          audioUrl: resolvePlayableUrl(item.enclosureUrl),
          coverImageUrl: item.feedImageUrl || undefined,
        },
      })
    );
  };

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
      <PlaybackHistoryPanel limit={30} />

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold">お気に入りエピソード</h2>
          <span class="badge badge-outline">{favoriteEpisodes.length}件</span>
        </div>
        {favoriteEpisodes.length === 0 ? (
          <div class="alert">まだお気に入りがありません。エピソードの☆ボタンから追加できます。</div>
        ) : (
          <div class="space-y-3">
            {favoriteEpisodes.map((item) => (
              <article class="card border border-base-300 bg-base-100">
                <div class="card-body">
                  <div class="flex items-start gap-3">
                    <button
                      type="button"
                      class="btn btn-circle btn-sm btn-primary mt-1"
                      onClick={() => handlePlayFavorite(item)}
                      disabled={!item.enclosureUrl}
                      aria-label="再生"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    </button>
                    <div class="min-w-0 flex-1">
                      <p class="text-xs text-base-content/60">{item.podcastTitle}</p>
                      <h3 class="font-semibold">{item.title || '(untitled)'}</h3>
                      <div class="mt-2 flex flex-wrap gap-2 text-xs text-base-content/60">
                        <span>{item.pubDate || '公開日なし'}</span>
                        <a href={`/feeds/${item.sourceId}`} class="link link-primary">
                          番組へ
                        </a>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" class="link link-primary">
                            詳細
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
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
              <a href={`/feeds/${item.sourceId}`} class="group block">
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

      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold">登録チャンネルの最新エピソード</h2>
          <span class="badge badge-outline">{latestEpisodes.length}件</span>
        </div>
        {latestEpisodes.length === 0 ? (
          <div class="alert">登録チャンネルの最新エピソードはまだありません。</div>
        ) : (
          <div class="space-y-3">
            {latestEpisodes.map((item) => (
              <article class="card border border-base-300 bg-base-100">
                <div class="card-body">
                  <div class="flex items-start gap-3">
                    <button
                      type="button"
                      class="btn btn-circle btn-sm btn-primary mt-1"
                      onClick={() => handlePlay(item)}
                      disabled={!item.enclosureUrl}
                      aria-label="再生"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
                        <path d="M8 5.14v14l11-7-11-7z" />
                      </svg>
                    </button>
                    <div class="min-w-0 flex-1">
                      <p class="text-xs text-base-content/60">{item.feedTitle}</p>
                      <h3 class="font-semibold">{item.title || '(untitled)'}</h3>
                      {item.description && (
                        <p class="text-sm text-base-content/70 line-clamp-2 mt-1">{item.description}</p>
                      )}
                      <div class="mt-2 flex flex-wrap gap-2 text-xs text-base-content/60">
                        <span>{item.pubDate || '公開日なし'}</span>
                        <a href={`/feeds/${item.sourceId}`} class="link link-primary">
                          番組へ
                        </a>
                        {item.link && (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" class="link link-primary">
                            詳細
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
