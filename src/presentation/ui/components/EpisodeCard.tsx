import { currentEpisode, isPlaying, playEpisode, type Episode } from '../stores/audio-store';

interface EpisodeCardProps {
  episode: {
    id: string;
    title: string;
    description?: string;
    publishedAt: string;
    durationSeconds?: number;
    audioUrl?: string;
  };
  podcast: {
    id: string;
    title: string;
    coverImageUrl?: string;
    language?: string;
  };
  showThumbnail?: boolean;
}

export function EpisodeCard({ episode, podcast, showThumbnail = true }: EpisodeCardProps) {
  const isCurrentEpisode = currentEpisode.value?.id === episode.id;
  const isThisPlaying = isCurrentEpisode && isPlaying.value;
  const locale = podcast.language === 'ja' ? 'ja-JP' : 'en-US';

  const handlePlay = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!episode.audioUrl) return;

    const ep: Episode = {
      id: episode.id,
      title: episode.title,
      podcastId: podcast.id,
      podcastTitle: podcast.title,
      audioUrl: episode.audioUrl,
      coverImageUrl: podcast.coverImageUrl,
      durationSeconds: episode.durationSeconds,
    };

    playEpisode(ep);
  };

  return (
    <a
      href={`/p/${podcast.id}/episodes/${episode.id}`}
      class={`card bg-base-200 hover:bg-base-300 transition-all block group ${
        isCurrentEpisode ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-100' : ''
      }`}
    >
      <div class="card-body p-4">
        <div class="flex items-start gap-4">
          {/* Thumbnail */}
          {showThumbnail && (
            <div class="flex-shrink-0 relative">
              {podcast.coverImageUrl ? (
                <img
                  src={podcast.coverImageUrl}
                  alt=""
                  class="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                <div class="w-16 h-16 rounded-lg bg-base-300 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    class="w-8 h-8 text-base-content/30"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                    />
                  </svg>
                </div>
              )}
              {/* Playing indicator */}
              {isThisPlaying && (
                <div class="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div class="flex items-end gap-0.5 h-4">
                    <span class="w-1 bg-primary animate-bounce" style="animation-delay: 0ms; height: 60%" />
                    <span class="w-1 bg-primary animate-bounce" style="animation-delay: 150ms; height: 100%" />
                    <span class="w-1 bg-primary animate-bounce" style="animation-delay: 300ms; height: 40%" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div class="flex-1 min-w-0">
            <h3 class={`font-semibold text-base line-clamp-1 ${isCurrentEpisode ? 'text-primary' : ''}`}>
              {episode.title}
            </h3>
            <p class="text-sm text-base-content/70 mt-1">
              {new Date(episode.publishedAt).toLocaleDateString(locale)}
              {episode.durationSeconds && (
                <span class="ml-2">
                  {Math.floor(episode.durationSeconds / 60)}分
                </span>
              )}
            </p>
            {episode.description && (
              <p class="text-sm text-base-content/60 mt-2 line-clamp-2">
                {episode.description}
              </p>
            )}
          </div>

          {/* Play button */}
          {episode.audioUrl && (
            <button
              type="button"
              class={`btn btn-circle flex-shrink-0 transition-all ${
                isThisPlaying
                  ? 'btn-primary'
                  : 'btn-ghost opacity-0 group-hover:opacity-100'
              }`}
              onClick={handlePlay}
              aria-label={isThisPlaying ? '一時停止' : '再生'}
            >
              {isThisPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  class="w-6 h-6"
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </a>
  );
}
