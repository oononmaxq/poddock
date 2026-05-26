import { useEffect } from 'preact/hooks';
import {
  type Episode,
  currentEpisode,
  isPlaying,
  playbackRate,
  progress,
  formattedCurrentTime,
  formattedDuration,
  playEpisode,
  getAudioElement,
  togglePlay,
  seekByPercent,
  setPlaybackRate,
} from '../stores/audio-store';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function FixedAudioPlayer() {
  useEffect(() => {
    // Ensure persisted snapshot is restored when this component mounts
    getAudioElement();

    const onPlayEpisode = (event: Event) => {
      const customEvent = event as CustomEvent<Episode>;
      if (!customEvent.detail?.audioUrl) return;
      playEpisode(customEvent.detail);
    };

    window.addEventListener('poddock:play-episode', onPlayEpisode as EventListener);
    return () => {
      window.removeEventListener('poddock:play-episode', onPlayEpisode as EventListener);
    };
  }, []);

  const episode = currentEpisode.value;

  if (!episode) return null;

  const handleSeekSliderChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    seekByPercent(parseFloat(input.value));
  };

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate.value);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    setPlaybackRate(PLAYBACK_RATES[nextIndex]);
  };
  const progressPercent = Math.max(0, Math.min(progress.value, 100));

  return (
    <div class="fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 shadow-lg z-50">
      <div class="absolute top-0 left-0 right-0 h-2">
        <div class="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-base-300" />
        <div
          class="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary"
          style={{ width: `${progressPercent}%` }}
        />
        <input
          type="range"
          min="0"
          max="100"
          step="0.1"
          value={progress.value}
          onInput={handleSeekSliderChange}
          class="absolute inset-0 w-full h-2 m-0 opacity-0 cursor-pointer"
          aria-label="再生位置"
        />
      </div>
      <div class="container mx-auto px-4 pt-5">
        <div class="flex items-center gap-3">
          {/* Cover image */}
          <div class="flex-shrink-0">
            {episode.coverImageUrl ? (
              <img
                src={episode.coverImageUrl}
                alt=""
                class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover"
              />
            ) : (
              <div class="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-base-300 flex items-center justify-center">
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

          <div class="min-w-0 flex-1 grid grid-cols-[minmax(0,1fr)_auto] grid-rows-2 items-center gap-x-3 gap-y-0">
            <p class="col-start-1 row-start-1 text-xs sm:text-sm font-semibold leading-tight line-clamp-2">{episode.title}</p>
            <div class="col-start-1 row-start-2 flex items-center gap-2 min-w-0 -mt-0.5">
              <div class="text-xs text-base-content/70 tabular-nums whitespace-nowrap">
                {formattedCurrentTime.value} / {formattedDuration.value}
              </div>
              <button
                type="button"
                class="btn btn-ghost btn-sm text-xs font-mono"
                onClick={cyclePlaybackRate}
                aria-label="再生速度"
              >
                {playbackRate.value}x
              </button>
            </div>
            <button
              type="button"
              class="col-start-2 row-span-2 btn btn-primary btn-circle h-10 min-h-10 w-10 self-center"
              onClick={togglePlay}
              aria-label={isPlaying.value ? '一時停止' : '再生'}
            >
              {isPlaying.value ? (
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
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  class="w-5 h-5"
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
