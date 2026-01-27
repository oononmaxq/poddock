import { useState, useRef, useEffect } from "preact/hooks";
import { useApi } from "../../hooks/useApi";
import { useI18n } from "../../hooks/useI18n";
import { Loading } from "../../components/Loading";

interface Episode {
  id: string;
  title: string;
  status: "draft" | "published";
  published_at: string | null;
  audio: {
    public_url: string;
  } | null;
  duration_seconds: number | null;
}

interface EpisodeListResponse {
  items: Episode[];
}

interface EpisodeListProps {
  podcastId: string;
}

export function EpisodeList({ podcastId }: EpisodeListProps) {
  const { t, lang } = useI18n();
  const basePath = lang === "ja" ? "" : `/${lang}`;
  const { data, loading, error, refetch } = useApi<EpisodeListResponse>(
    `/api/podcasts/${podcastId}/episodes`
  );

  if (loading) return <Loading />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const episodes = data?.items || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{t("episode.list.title")}</h2>
        <a
          href={`${basePath}/podcasts/${podcastId}/episodes/new`}
          className="btn btn-primary btn-sm"
        >
          {t("episode.list.add")}
        </a>
      </div>

      {episodes.length === 0 ? (
        <EmptyState podcastId={podcastId} basePath={basePath} />
      ) : (
        <div className="space-y-2">
          {episodes.map((episode) => (
            <EpisodeCard
              key={episode.id}
              podcastId={podcastId}
              episode={episode}
              basePath={basePath}
              onStatusChange={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface EpisodeCardProps {
  podcastId: string;
  episode: Episode;
  basePath: string;
  onStatusChange: () => void;
}

function EpisodeCard({
  podcastId,
  episode,
  basePath,
  onStatusChange,
}: EpisodeCardProps) {
  const { t, lang } = useI18n();
  const [updating, setUpdating] = useState(false);
  const locale = lang === "ja" ? "ja-JP" : "en-US";
  const publishedDate = episode.published_at
    ? new Date(episode.published_at).toLocaleDateString(locale)
    : t("episode.unpublished");

  const handleToggleStatus = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (updating) return;

    setUpdating(true);
    const newStatus = episode.status === "published" ? "draft" : "published";
    const body: Record<string, unknown> = { status: newStatus };

    // If publishing and no published_at, set current time
    if (newStatus === "published" && !episode.published_at) {
      body.published_at = new Date().toISOString();
    }

    try {
      const response = await fetch(
        `/api/podcasts/${podcastId}/episodes/${episode.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        onStatusChange();
      }
    } catch {
      // Ignore errors silently
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="card bg-base-200 hover:bg-base-300 transition-colors">
      <div className="card-body py-4 flex-row items-center justify-between gap-4">
        <a
          href={`${basePath}/podcasts/${podcastId}/episodes/${episode.id}`}
          className="flex-1 min-w-0"
        >
          <h3 className="font-medium truncate">{episode.title}</h3>
          <p className="text-sm text-base-content/70">{publishedDate}</p>
        </a>
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Status Toggle */}
          <label
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={`text-xs ${episode.status === "draft" ? "text-base-content/70" : "text-base-content/40"}`}
            >
              {t("episode.toggleDraft")}
            </span>
            <input
              type="checkbox"
              className={`toggle toggle-sm toggle-primary ${updating ? "opacity-50" : ""}`}
              checked={episode.status === "published"}
              onChange={handleToggleStatus}
              disabled={updating}
            />
            <span
              className={`text-xs ${episode.status === "published" ? "text-primary" : "text-base-content/40"}`}
            >
              {t("episode.togglePublish")}
            </span>
          </label>
          {episode.audio && (
            <>
              <div className="w-px h-6 bg-base-300" />
              <AudioPlayer
                url={episode.audio.public_url}
                durationSeconds={episode.duration_seconds}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AudioPlayer({
  url,
  durationSeconds,
}: {
  url: string;
  durationSeconds: number | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  // Listen for stop events from other players
  useEffect(() => {
    const handleStopOthers = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (audioRef.current && customEvent.detail !== url) {
        audioRef.current.pause();
        setPlaying(false);
      }
    };

    window.addEventListener("PODDOCK:stopOtherPlayers", handleStopOthers);
    return () => {
      window.removeEventListener("PODDOCK:stopOtherPlayers", handleStopOthers);
    };
  }, [url]);

  const togglePlay = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef.current) return;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      // Stop all other players first
      window.dispatchEvent(
        new CustomEvent("PODDOCK:stopOtherPlayers", { detail: url }),
      );
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      <audio ref={audioRef} src={url} onEnded={handleEnded} />
      <button
        type="button"
        className="btn btn-circle btn-sm btn-primary"
        onClick={togglePlay}
      >
        {playing ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      {durationSeconds !== null && (
        <>
          <div className="w-px h-6 bg-base-300" />
          <span className="flex items-center gap-1 text-sm text-base-content/70">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="tabular-nums">
              {formatDuration(durationSeconds)}
            </span>
          </span>
        </>
      )}
    </div>
  );
}

function EmptyState({
  podcastId,
  basePath,
}: {
  podcastId: string;
  basePath: string;
}) {
  const { t } = useI18n();

  return (
    <div className="card bg-base-200">
      <div className="card-body items-center text-center py-8">
        <p className="text-base-content/70">{t("episode.list.empty")}</p>
        <a
          href={`${basePath}/podcasts/${podcastId}/episodes/new`}
          className="btn btn-primary btn-sm mt-4"
        >
          {t("episode.list.createFirst")}
        </a>
      </div>
    </div>
  );
}
