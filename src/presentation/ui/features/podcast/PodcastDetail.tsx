import { Tabs } from '../../components/Tabs';
import { VisibilityBadge } from '../../components/Badge';
import { Loading } from '../../components/Loading';
import { useApi } from '../../hooks/useApi';
import { useI18n } from '../../hooks/useI18n';
import { PodcastOverview } from './PodcastOverview';
import { EpisodeList } from './EpisodeList';
import { DistributionList } from './DistributionList';
import { PodcastSettings } from './PodcastSettings';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';

interface Podcast {
  id: string;
  title: string;
  description: string;
  language: string;
  category: string;
  author_name: string | null;
  visibility: 'public' | 'private';
  public_rss_url: string;
  private_rss_url: string | null;
  public_website_url: string | null;
}

interface PodcastDetailProps {
  podcastId: string;
}

export function PodcastDetail({ podcastId }: PodcastDetailProps) {
  const { t, lang } = useI18n();
  const basePath = lang === 'ja' ? '' : `/${lang}`;
  const { data: podcast, loading, error } = useApi<Podcast>(
    `/api/podcasts/${podcastId}`
  );

  // Get initial tab from URL hash
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1);
      if (['overview', 'episodes', 'analytics', 'distribution', 'settings'].includes(hash)) {
        return hash;
      }
    }
    return 'overview';
  };

  if (loading) return <Loading />;
  if (error || !podcast) return <div className="alert alert-error">{error || 'Not found'}</div>;

  const tabs = [
    {
      id: 'overview',
      label: t('podcast.tabs.overview'),
      content: <PodcastOverview podcast={podcast} />,
    },
    {
      id: 'episodes',
      label: t('podcast.tabs.episodes'),
      content: <EpisodeList podcastId={podcastId} />,
    },
    {
      id: 'analytics',
      label: t('podcast.tabs.analytics'),
      content: <AnalyticsDashboard podcastId={podcastId} />,
    },
    {
      id: 'distribution',
      label: t('podcast.tabs.distribution'),
      content: <DistributionList podcastId={podcastId} />,
    },
    {
      id: 'settings',
      label: t('podcast.tabs.settings'),
      content: <PodcastSettings podcastId={podcastId} />,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{podcast.title}</h1>
          <div className="mt-2">
            <VisibilityBadge visibility={podcast.visibility} />
          </div>
        </div>
        <a href={`${basePath}/podcasts/${podcastId}/edit`} className="btn btn-outline">
          {t('podcast.detail.edit')}
        </a>
      </div>

      <Tabs tabs={tabs} defaultTab={getInitialTab()} />
    </div>
  );
}
