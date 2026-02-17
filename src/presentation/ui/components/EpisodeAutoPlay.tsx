import { useEffect } from 'preact/hooks';
import { currentEpisode, isPlaying, playEpisode, type Episode } from '../stores/audio-store';

interface EpisodeAutoPlayProps {
  episode: Episode;
  autoPlay?: boolean;
}

export function EpisodeAutoPlay({ episode, autoPlay = false }: EpisodeAutoPlayProps) {
  const isCurrentEpisode = currentEpisode.value?.id === episode.id;
  const isThisPlaying = isCurrentEpisode && isPlaying.value;

  useEffect(() => {
    if (autoPlay && episode.audioUrl) {
      playEpisode(episode);
    }
  }, [autoPlay, episode.id]);

  const handlePlay = () => {
    if (!episode.audioUrl) return;
    playEpisode(episode);
  };

  return (
    <button
      type="button"
      class={`btn mt-4 gap-2 ${isThisPlaying ? 'btn-primary' : 'btn-outline'}`}
      onClick={handlePlay}
    >
      {isThisPlaying ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            class="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 5.25v13.5m-7.5-13.5v13.5"
            />
          </svg>
          再生中
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            class="w-5 h-5"
          >
            <path d="M8 5.14v14l11-7-11-7z" />
          </svg>
          再生
        </>
      )}
    </button>
  );
}
