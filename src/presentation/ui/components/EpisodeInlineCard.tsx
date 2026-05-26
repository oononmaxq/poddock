interface EpisodeInlineCardProps {
  title: string;
  imageUrl?: string | null;
  imageAlt: string;
  onPlay: () => void;
  playAriaLabel: string;
  disabled?: boolean;
}

export function EpisodeInlineCard({
  title,
  imageUrl,
  imageAlt,
  onPlay,
  playAriaLabel,
  disabled = false,
}: EpisodeInlineCardProps) {
  return (
    <article class="card border shadow-sm border-base-300 bg-base-100">
      <div class="card-body p-3 sm:p-4">
        <div class="grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-2">
          <span class="inline-flex items-center justify-center h-6 w-6 text-warning">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
              <path
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12 3.6 2.61 5.3 5.85.85-4.23 4.12 1 5.83L12 17l-5.23 2.7 1-5.83L3.54 9.75l5.85-.85L12 3.6Z"
              />
            </svg>
          </span>
          <div class="flex-shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt={imageAlt} class="w-10 h-10 rounded-md object-cover" />
            ) : (
              <div class="w-10 h-10 rounded-md bg-base-300 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  class="w-5 h-5 text-base-content/50"
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
          <p class="min-w-0 flex-1 font-semibold truncate">{title || '(untitled)'}</p>
          <button
            type="button"
            class="btn btn-circle btn-xs sm:btn-sm btn-primary"
            onClick={onPlay}
            disabled={disabled}
            aria-label={playAriaLabel}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-4 h-4">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  );
}
