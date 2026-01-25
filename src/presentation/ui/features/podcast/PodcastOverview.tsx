import { useI18n } from '../../hooks/useI18n';
import { showToast } from '../../components/Toast';

interface Podcast {
  id: string;
  title: string;
  description: string;
  language: string;
  category: string;
  author_name: string | null;
  public_rss_url: string;
  private_rss_url: string | null;
  public_website_url: string | null;
}

interface PodcastOverviewProps {
  podcast: Podcast;
}

export function PodcastOverview({ podcast }: PodcastOverviewProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Public Website URL */}
      {podcast.public_website_url && (
        <WebsiteUrlCard url={podcast.public_website_url} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <RssUrlCard
          publicUrl={podcast.public_rss_url}
          privateUrl={podcast.private_rss_url}
          publicLabel={t('podcast.overview.publicRss')}
          privateLabel={t('podcast.overview.privateRss')}
        />
        <PodcastInfoCard podcast={podcast} />
      </div>
    </div>
  );
}

function WebsiteUrlCard({ url }: { url: string }) {
  const { t } = useI18n();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    showToast(t('common.copied'));
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">{t('podcast.overview.publicWebsite')}</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="input input-bordered flex-1 font-mono text-sm"
            value={url}
            readOnly
          />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-ghost"
            title={t('podcast.overview.openWebsite')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button className="btn btn-sm btn-ghost" onClick={handleCopy}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function RssUrlCard({ publicUrl, privateUrl, publicLabel, privateLabel }: { publicUrl: string; privateUrl: string | null; publicLabel: string; privateLabel: string }) {
  const { t } = useI18n();

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">RSS URL</h2>
        <div className="space-y-4">
          <UrlField
            label={publicLabel}
            description={t('podcast.overview.publicRssDescription')}
            url={publicUrl}
          />
          {privateUrl && (
            <UrlField
              label={privateLabel}
              description={t('podcast.overview.privateRssDescription')}
              url={privateUrl}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function UrlField({ label, description, url }: { label: string; description?: string; url: string }) {
  const { t } = useI18n();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    showToast(t('common.copied'));
  };

  return (
    <div>
      <label className="label pb-0">
        <span className="label-text font-medium">{label}</span>
      </label>
      {description && (
        <p className="text-xs text-base-content/60 mb-2 ml-1">{description}</p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1 font-mono text-sm"
          value={url}
          readOnly
        />
        <button className="btn btn-sm btn-ghost" onClick={handleCopy}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function PodcastInfoCard({ podcast }: { podcast: Podcast }) {
  const { t } = useI18n();

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h2 className="card-title">{t('podcast.overview.podcastInfo')}</h2>
        <dl className="space-y-2">
          <div>
            <dt className="text-sm text-base-content/70">{t('podcast.overview.description')}</dt>
            <dd className="mt-1">{podcast.description}</dd>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-base-content/70">{t('podcast.overview.language')}</dt>
              <dd className="mt-1">{podcast.language}</dd>
            </div>
            <div>
              <dt className="text-sm text-base-content/70">{t('podcast.overview.category')}</dt>
              <dd className="mt-1">{podcast.category}</dd>
            </div>
          </div>
          <div>
            <dt className="text-sm text-base-content/70">{t('podcast.overview.author')}</dt>
            <dd className="mt-1">{podcast.author_name || '-'}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
