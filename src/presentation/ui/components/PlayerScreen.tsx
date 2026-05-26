import { useEffect } from 'preact/hooks';
import {
  currentEpisode,
  isPlaying,
  progress,
  formattedCurrentTime,
  formattedDuration,
  getAudioElement,
  togglePlay,
  seekByPercent,
  skipBackward,
  skipForward,
} from '../stores/audio-store';

export function PlayerScreen() {
  useEffect(() => {
    getAudioElement();
  }, []);

  const episode = currentEpisode.value;

  const handleSeekChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    seekByPercent(parseFloat(input.value));
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = '/';
  };

  if (!episode) {
    return (
      <div class="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div class="text-center space-y-4">
          <p class="text-lg font-semibold">再生中のエピソードがありません</p>
          <a href="/" class="btn btn-primary btn-sm">番組一覧へ戻る</a>
        </div>
      </div>
    );
  }

  const progressPercent = Math.max(0, Math.min(progress.value, 100));

  return (
    <div class="min-h-screen bg-black text-white">
      <div class="mx-auto flex min-h-screen w-full max-w-md flex-col bg-gradient-to-b from-neutral-700/60 via-black to-black px-5 pt-4 pb-10">
        <div class="flex items-center justify-between">
          <button type="button" class="btn btn-ghost btn-circle btn-sm text-white" onClick={goBack} aria-label="戻る">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" class="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25 12 15.75 4.5 8.25" />
            </svg>
          </button>
          <div class="tabs tabs-boxed bg-white/10 p-1">
            <a class="tab tab-sm tab-active text-white">曲</a>
            <a class="tab tab-sm text-white/70">動画</a>
          </div>
          <button type="button" class="btn btn-ghost btn-circle btn-sm text-white" aria-label="メニュー">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="h-5 w-5">
              <path d="M12 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 7.5A1.5 1.5 0 1 0 12 11a1.5 1.5 0 0 0 0 3.5ZM13.5 20a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
            </svg>
          </button>
        </div>

        <div class="flex flex-1 flex-col justify-center pt-8">
          <div class="mx-auto w-56 overflow-hidden rounded-md shadow-2xl sm:w-64">
            {episode.coverImageUrl ? (
              <img src={episode.coverImageUrl} alt="" class="aspect-square w-full object-cover" />
            ) : (
              <div class="aspect-square w-full bg-white/15 flex items-center justify-center text-white/60">
                No Image
              </div>
            )}
          </div>

          <div class="mt-10">
            <h1 class="text-4xl font-bold leading-tight">{episode.title}</h1>
            <p class="mt-2 text-2xl text-white/75">{episode.podcastTitle}</p>
          </div>

          <div class="mt-8">
            <div class="relative h-5">
              <div class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white/30" />
              <div
                class="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded bg-white"
                style={{ width: `${progressPercent}%` }}
              />
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={progress.value}
                onInput={handleSeekChange}
                class="absolute inset-0 h-5 w-full cursor-pointer opacity-0"
                aria-label="再生位置"
              />
            </div>
            <div class="mt-1 flex items-center justify-between text-sm text-white/80 tabular-nums">
              <span>{formattedCurrentTime.value}</span>
              <span>{formattedDuration.value}</span>
            </div>
          </div>

          <div class="mt-8 flex items-center justify-between">
            <button type="button" class="btn btn-ghost btn-circle text-white" aria-label="シャッフル">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" class="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 3h5v5m0-5-6 6m-2 2-6 6m0 0H2m5 0v5m0-5 6-6m2-2 6-6" />
              </svg>
            </button>
            <button type="button" class="btn btn-ghost btn-circle text-white" onClick={() => skipBackward(15)} aria-label="15秒戻る">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="h-8 w-8">
                <path d="M11 12 21 18V6l-10 6Zm-8.5 0L10 18V6l-7.5 6Z" />
              </svg>
            </button>
            <button
              type="button"
              class="btn btn-circle h-24 min-h-24 w-24 border-0 bg-white text-black hover:bg-white/90"
              onClick={togglePlay}
              aria-label={isPlaying.value ? '一時停止' : '再生'}
            >
              {isPlaying.value ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="h-10 w-10">
                  <path d="M8 5h3v14H8zm5 0h3v14h-3z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="h-10 w-10">
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              )}
            </button>
            <button type="button" class="btn btn-ghost btn-circle text-white" onClick={() => skipForward(30)} aria-label="30秒進む">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="h-8 w-8">
                <path d="M13 6v12l10-6-10-6Zm-9.5 0L11 12 3.5 18V6Z" />
              </svg>
            </button>
            <button type="button" class="btn btn-ghost btn-circle text-white" aria-label="リピート">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" class="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 2v4h-4m-6 4H3v12h12v-4m2-12h4v12h-4M7 6h10" />
              </svg>
            </button>
          </div>
        </div>

        <div class="mt-8 grid grid-cols-3 gap-2 text-center text-base text-white/80">
          <button type="button" class="btn btn-ghost btn-sm text-white/90">次のコンテンツ</button>
          <button type="button" class="btn btn-ghost btn-sm text-white/60">歌詞</button>
          <button type="button" class="btn btn-ghost btn-sm text-white/60">関連コンテンツ</button>
        </div>
      </div>
    </div>
  );
}
