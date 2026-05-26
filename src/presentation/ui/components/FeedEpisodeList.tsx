import { EpisodeComments } from './EpisodeComments';
import { ExpandableText } from './ExpandableText';
import { useEffect, useState } from 'preact/hooks';
import { showToast } from './Toast';
import { resolvePlayableUrl } from '../utils/playable-url';
import { currentEpisode, isPlaying } from '../stores/audio-store';

interface FeedEpisodeItem {
  id: string;
  episodeKey: string;
  title: string;
  description: string;
  pubDate: string | null;
  link: string | null;
  enclosureUrl: string | null;
}

interface FeedEpisodeListProps {
  sourceId: string;
  podcastTitle: string;
  podcastImageUrl?: string | null;
  items: FeedEpisodeItem[];
}

export function FeedEpisodeList({ sourceId, podcastTitle, podcastImageUrl, items }: FeedEpisodeListProps) {
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (items.length === 0) return;
    const keys = items.map((item) => item.episodeKey).join(',');
    const loadStatus = async () => {
      try {
        const response = await fetch(
          `/api/episode-favorites/status?source_id=${encodeURIComponent(sourceId)}&episode_keys=${encodeURIComponent(keys)}`,
          { credentials: 'include' }
        );
        if (!response.ok) return;
        const data = (await response.json()) as { keys: string[] };
        setFavoriteKeys(new Set(data.keys));
      } catch {
        // ignore for non-login users
      }
    };
    void loadStatus();
  }, [items, sourceId]);

  const handlePlay = (item: FeedEpisodeItem) => {
    if (!item.enclosureUrl) return;
    const episode = {
      id: `${sourceId}:${item.id}`,
      title: item.title || '(untitled)',
      podcastId: sourceId,
      podcastTitle,
      audioUrl: resolvePlayableUrl(item.enclosureUrl),
      coverImageUrl: podcastImageUrl || undefined,
    };
    window.dispatchEvent(new CustomEvent('poddock:play-episode', { detail: episode }));
  };

  const toggleFavorite = async (item: FeedEpisodeItem) => {
    const key = item.episodeKey;
    if (favoriteLoading[key]) return;
    setFavoriteLoading((prev) => ({ ...prev, [key]: true }));
    const isFavorite = favoriteKeys.has(key);

    try {
      if (isFavorite) {
        const response = await fetch('/api/episode-favorites', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            source_id: sourceId,
            episode_key: key,
          }),
        });
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        if (!response.ok) throw new Error('お気に入り解除に失敗しました');
        setFavoriteKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        showToast('ブックマークを解除しました', 'info');
      } else {
        const response = await fetch('/api/episode-favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            source_id: sourceId,
            episode_key: key,
            title: item.title || '(untitled)',
            podcast_title: podcastTitle,
            cover_image_url: podcastImageUrl ?? null,
            link: item.link ?? null,
            enclosure_url: item.enclosureUrl ?? null,
            pub_date: item.pubDate ?? null,
          }),
        });
        if (response.status === 401 || response.status === 403) {
          window.location.href = '/login';
          return;
        }
        if (!response.ok) throw new Error('ブックマーク登録に失敗しました');
        setFavoriteKeys((prev) => new Set(prev).add(key));
        showToast('ブックマークに追加しました', 'success');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'ブックマーク操作に失敗しました', 'error');
    } finally {
      setFavoriteLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div class="space-y-2">
      {items.map((item) => {
        const episodeId = `${sourceId}:${item.id}`;
        const isCurrentEpisode = currentEpisode.value?.id === episodeId;
        const isCurrentPlaying = isCurrentEpisode && isPlaying.value;

        return (
          <article
            class={`card border shadow-sm bg-base-100 transition-colors ${isCurrentEpisode ? 'border-warning ring-2 ring-warning/60' : 'border-base-300'}`}
          >
            <div class="card-body p-3 sm:p-4">
              <div class="flex items-start gap-1 sm:gap-2">
                <button
                  type="button"
                  class={`btn btn-xs btn-ghost px-0 min-h-0 h-5 w-5 mt-0 sm:mt-0.5 ${favoriteKeys.has(item.episodeKey) ? 'text-warning' : ''}`}
                  onClick={() => toggleFavorite(item)}
                  disabled={favoriteLoading[item.episodeKey]}
                  aria-label={favoriteKeys.has(item.episodeKey) ? 'お気に入り解除' : 'お気に入り追加'}
                  title={favoriteKeys.has(item.episodeKey) ? 'お気に入り解除' : 'お気に入り追加'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={favoriteKeys.has(item.episodeKey) ? 'currentColor' : 'none'} class="w-5 h-5">
                    <path
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m12 3.6 2.61 5.3 5.85.85-4.23 4.12 1 5.83L12 17l-5.23 2.7 1-5.83L3.54 9.75l5.85-.85L12 3.6Z"
                    />
                  </svg>
                </button>

                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="card-title text-base sm:text-lg leading-tight overflow-hidden text-ellipsis whitespace-nowrap sm:whitespace-normal">
                      {item.title || '(untitled)'}
                    </h3>
                    <button
                      type="button"
                      class={`btn btn-circle btn-xs sm:btn-sm ${isCurrentEpisode ? 'btn-warning' : 'btn-outline'}`}
                      onClick={() => handlePlay(item)}
                      disabled={!item.enclosureUrl}
                      aria-label={isCurrentPlaying ? '再生中' : '再生'}
                    >
                      {isCurrentPlaying ? (
                        <span class="flex items-end gap-0.5 h-3.5">
                          <span class="w-0.5 h-2 bg-current animate-pulse" />
                          <span class="w-0.5 h-3.5 bg-current animate-pulse [animation-delay:120ms]" />
                          <span class="w-0.5 h-2.5 bg-current animate-pulse [animation-delay:240ms]" />
                        </span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
                          <path d="M8 5.14v14l11-7-11-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <div class="text-[11px] sm:text-xs text-base-content/60 font-medium">{item.pubDate || '公開日なし'}</div>
                  {item.description && (
                    <div class="mt-2 hidden sm:block">
                      <ExpandableText
                        text={item.description}
                        collapsedLines={2}
                        textClassName="text-sm text-base-content/80 leading-relaxed"
                      />
                    </div>
                  )}
                  <div class="hidden sm:flex flex-wrap gap-2 text-sm mt-3">
                    {item.link && (
                      <a href={item.link} class="btn btn-xs btn-outline" target="_blank" rel="noopener noreferrer">
                        詳細ページ
                      </a>
                    )}
                    {item.enclosureUrl && (
                      <a href={item.enclosureUrl} class="btn btn-xs btn-primary btn-outline" target="_blank" rel="noopener noreferrer">
                        音声ファイル
                      </a>
                    )}
                  </div>
                  <div class="hidden sm:block">
                    <EpisodeComments sourceId={sourceId} episodeKey={item.episodeKey} />
                  </div>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
