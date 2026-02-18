import {
  currentEpisode,
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  progress,
  formattedCurrentTime,
  formattedDuration,
  togglePlay,
  skipForward,
  skipBackward,
  seekByPercent,
  setVolume,
  setPlaybackRate,
} from '../stores/audio-store';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function FixedAudioPlayer() {
  const episode = currentEpisode.value;

  if (!episode) return null;

  const handleSeek = (e: MouseEvent) => {
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekByPercent(percent);
  };

  const handleVolumeChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    setVolume(parseFloat(input.value));
  };

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate.value);
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length;
    setPlaybackRate(PLAYBACK_RATES[nextIndex]);
  };

  return (
    <div class="fixed bottom-0 left-0 right-0 bg-base-200 border-t border-base-300 shadow-lg z-50">
      {/* Progress bar (clickable) */}
      <div
        class="h-1 bg-base-300 cursor-pointer group"
        onClick={handleSeek}
      >
        <div
          class="h-full bg-primary transition-all"
          style={{ width: `${progress.value}%` }}
        />
      </div>

      <div class="container mx-auto px-4 py-3">
        <div class="flex items-center gap-4">
          {/* Cover image */}
          <div class="flex-shrink-0">
            {episode.coverImageUrl ? (
              <img
                src={episode.coverImageUrl}
                alt=""
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

          {/* Episode info */}
          <div class="flex-1 min-w-0 hidden sm:block">
            <p class="text-sm font-semibold truncate">{episode.title}</p>
            <p class="text-xs text-base-content/70 truncate">{episode.podcastTitle}</p>
          </div>

          {/* Controls */}
          <div class="flex items-center gap-2">
            {/* Skip backward */}
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              onClick={() => skipBackward(15)}
              aria-label="15秒戻る"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061A1.125 1.125 0 0 1 21 8.689v8.122ZM11.25 16.811c0 .864-.933 1.406-1.683.977l-7.108-4.061a1.125 1.125 0 0 1 0-1.954l7.108-4.061a1.125 1.125 0 0 1 1.683.977v8.122Z"
                />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              type="button"
              class="btn btn-primary btn-circle"
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

            {/* Skip forward */}
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              onClick={() => skipForward(15)}
              aria-label="15秒進む"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                class="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061A1.125 1.125 0 0 1 3 16.811V8.69ZM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 0 1 0 1.954l-7.108 4.061a1.125 1.125 0 0 1-1.683-.977V8.69Z"
                />
              </svg>
            </button>
          </div>

          {/* Time */}
          <div class="text-xs text-base-content/70 tabular-nums hidden md:block">
            {formattedCurrentTime.value} / {formattedDuration.value}
          </div>

          {/* Volume */}
          <div class="hidden lg:flex items-center gap-2">
            <button
              type="button"
              class="btn btn-ghost btn-sm btn-circle"
              onClick={() => setVolume(volume.value > 0 ? 0 : 1)}
              aria-label={volume.value > 0 ? 'ミュート' : 'ミュート解除'}
            >
              {volume.value > 0 ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
                  />
                </svg>
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume.value}
              onInput={handleVolumeChange}
              class="range range-xs range-primary w-20"
            />
          </div>

          {/* Playback rate */}
          <button
            type="button"
            class="btn btn-ghost btn-sm text-xs font-mono"
            onClick={cyclePlaybackRate}
            aria-label="再生速度"
          >
            {playbackRate.value}x
          </button>
        </div>
      </div>
    </div>
  );
}
