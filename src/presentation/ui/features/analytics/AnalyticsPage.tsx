import { useState, useEffect } from 'preact/hooks';
import { useI18n } from '../../hooks/useI18n';
import { Loading } from '../../components/Loading';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface Podcast {
  id: string;
  title: string;
  cover_image_url: string | null;
}

interface Episode {
  id: string;
  title: string;
  podcast_id: string;
}

type ViewMode = 'podcast' | 'episode';

export function AnalyticsPage() {
  const { t } = useI18n();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedPodcastId, setSelectedPodcastId] = useState<string | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('podcast');
  const [loading, setLoading] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch podcasts on mount
  useEffect(() => {
    async function fetchPodcasts() {
      try {
        const res = await fetch('/api/podcasts', { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch podcasts');
        const data = await res.json();
        const items = data.items || [];
        setPodcasts(items);

        // Auto-select first podcast if available
        if (items.length > 0) {
          setSelectedPodcastId(items[0].id);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchPodcasts();
  }, []);

  // Fetch episodes when podcast changes
  useEffect(() => {
    if (!selectedPodcastId || viewMode !== 'episode') {
      setEpisodes([]);
      setSelectedEpisodeId(null);
      return;
    }

    async function fetchEpisodes() {
      setLoadingEpisodes(true);
      try {
        const res = await fetch(`/api/podcasts/${selectedPodcastId}/episodes`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch episodes');
        const data = await res.json();
        const items = data.items || [];
        setEpisodes(items);

        // Auto-select first episode
        if (items.length > 0) {
          setSelectedEpisodeId(items[0].id);
        } else {
          setSelectedEpisodeId(null);
        }
      } catch (err) {
        console.error(err);
        setEpisodes([]);
      } finally {
        setLoadingEpisodes(false);
      }
    }
    fetchEpisodes();
  }, [selectedPodcastId, viewMode]);

  if (loading) return <Loading />;
  if (error) return <div className="p-6"><div className="alert alert-error">{error}</div></div>;

  if (podcasts.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">{t('analytics.selectPodcast')}</h2>
          <p className="text-base-content/50">{t('analytics.selectPodcast.description')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* View Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${viewMode === 'podcast' ? 'tab-active' : ''}`}
            onClick={() => {
              setViewMode('podcast');
              setSelectedEpisodeId(null);
            }}
          >
            {t('analytics.viewMode.podcast')}
          </button>
          <button
            className={`tab ${viewMode === 'episode' ? 'tab-active' : ''}`}
            onClick={() => setViewMode('episode')}
          >
            {t('analytics.viewMode.episode')}
          </button>
        </div>

        {/* Podcast Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-base-content/70">
            {t('analytics.selectPodcast')}:
          </label>
          <select
            className="select select-bordered select-sm"
            value={selectedPodcastId || ''}
            onChange={(e) => {
              setSelectedPodcastId((e.target as HTMLSelectElement).value);
              setSelectedEpisodeId(null);
            }}
          >
            {podcasts.map((podcast) => (
              <option key={podcast.id} value={podcast.id}>
                {podcast.title}
              </option>
            ))}
          </select>
        </div>

        {/* Episode Selector (only shown in episode mode) */}
        {viewMode === 'episode' && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-base-content/70">
              {t('analytics.selectEpisode')}:
            </label>
            {loadingEpisodes ? (
              <span className="loading loading-spinner loading-sm" />
            ) : episodes.length > 0 ? (
              <select
                className="select select-bordered select-sm max-w-xs"
                value={selectedEpisodeId || ''}
                onChange={(e) => setSelectedEpisodeId((e.target as HTMLSelectElement).value)}
              >
                {episodes.map((episode) => (
                  <option key={episode.id} value={episode.id}>
                    {episode.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm text-base-content/50">{t('analytics.noEpisodes')}</span>
            )}
          </div>
        )}
      </div>

      {/* Dashboard */}
      {selectedPodcastId && (
        <AnalyticsDashboard
          key={`${selectedPodcastId}-${selectedEpisodeId || 'all'}`}
          podcastId={selectedPodcastId}
          episodeId={viewMode === 'episode' ? selectedEpisodeId : null}
        />
      )}
    </div>
  );
}
