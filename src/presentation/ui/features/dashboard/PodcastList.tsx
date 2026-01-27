import { useApi } from '../../hooks/useApi';
import { useI18n } from '../../hooks/useI18n';
import { VisibilityBadge } from '../../components/Badge';
import { Loading } from '../../components/Loading';

interface Podcast {
  id: string;
  title: string;
  visibility: 'public' | 'private';
  cover_image_url: string | null;
  episode_counts: {
    draft: number;
    published: number;
  };
  updated_at: string;
}

interface PodcastListResponse {
  items: Podcast[];
}

export function PodcastList() {
  const { t, lang } = useI18n();
  const basePath = lang === 'ja' ? '' : `/${lang}`;
  const { data, loading, error } = useApi<PodcastListResponse>('/api/podcasts');

  if (loading) return <Loading />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const podcasts = data?.items || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <a href={`${basePath}/podcasts/new`} className="btn btn-primary">
          {t('dashboard.createNew')}
        </a>
      </div>

      {podcasts.length === 0 ? (
        <EmptyState basePath={basePath} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {podcasts.map((podcast) => (
            <PodcastCard key={podcast.id} podcast={podcast} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
}

function PodcastCard({ podcast, basePath }: { podcast: Podcast; basePath: string }) {
  const { t, lang } = useI18n();
  const locale = lang === 'ja' ? 'ja-JP' : 'en-US';
  const updatedDate = new Date(podcast.updated_at).toLocaleDateString(locale);

  return (
    <a
      href={`${basePath}/podcasts/${podcast.id}`}
      className="card bg-base-200 hover:bg-base-300 transition-colors"
    >
      <div className="card-body flex-row gap-4">
        <div className="flex-1">
          <h2 className="card-title">{podcast.title}</h2>
          <div className="flex items-center gap-2">
            <VisibilityBadge visibility={podcast.visibility} />
          </div>
          <div className="text-sm text-base-content/70 mt-2">
            <p>
              {t('dashboard.card.published')}: {podcast.episode_counts.published}{t('dashboard.card.episodes')} / {t('dashboard.card.draft')}: {podcast.episode_counts.draft}{t('dashboard.card.episodes')}
            </p>
            <p className="mt-1">{t('dashboard.card.updated')}: {updatedDate}</p>
          </div>
        </div>
        {podcast.cover_image_url && (
          <div className="flex-shrink-0">
            <img
              src={podcast.cover_image_url}
              alt=""
              className="w-20 h-20 rounded-lg object-cover"
            />
          </div>
        )}
      </div>
    </a>
  );
}

function EmptyState({ basePath }: { basePath: string }) {
  const { t } = useI18n();

  return (
    <div className="card bg-base-200">
      <div className="card-body items-center text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        <h2 className="card-title">{t('dashboard.empty.title')}</h2>
        <p className="text-base-content/70">{t('dashboard.empty.description')}</p>
        <div className="card-actions mt-4">
          <a href={`${basePath}/podcasts/new`} className="btn btn-primary">{t('dashboard.empty.button')}</a>
        </div>
      </div>
    </div>
  );
}
