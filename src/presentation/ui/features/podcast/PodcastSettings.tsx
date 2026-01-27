import { useState } from 'preact/hooks';
import { useI18n } from '../../hooks/useI18n';
import { apiPost, apiDelete } from '../../hooks/useApi';
import { showToast } from '../../components/Toast';

interface PodcastSettingsProps {
  podcastId: string;
}

export function PodcastSettings({ podcastId }: PodcastSettingsProps) {
  const { lang } = useI18n();
  const basePath = lang === 'ja' ? '' : `/${lang}`;

  return (
    <div className="max-w-xl space-y-6">
      <TokenRotateCard podcastId={podcastId} />
      <DangerZoneCard podcastId={podcastId} basePath={basePath} />
    </div>
  );
}

function TokenRotateCard({ podcastId }: { podcastId: string }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleRotate = async () => {
    if (!confirm(t('podcast.settings.tokenRotateConfirm'))) return;

    setLoading(true);
    try {
      await apiPost(`/api/podcasts/${podcastId}/feed-token/rotate`, {});
      showToast(t('podcast.settings.tokenRotateSuccess'));
      window.location.reload();
    } catch {
      showToast(t('podcast.settings.tokenRotateError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body">
        <h3 className="card-title text-lg">{t('podcast.settings.tokenTitle')}</h3>
        <p className="text-sm text-base-content/70">
          {t('podcast.settings.tokenDescription')}
        </p>
        <div className="card-actions">
          <button
            className="btn btn-warning btn-sm"
            onClick={handleRotate}
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : t('podcast.settings.tokenRotate')}
          </button>
        </div>
      </div>
    </div>
  );
}

function DangerZoneCard({ podcastId, basePath }: { podcastId: string; basePath: string }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t('podcast.settings.deleteConfirm'))) return;

    setLoading(true);
    try {
      await apiDelete(`/api/podcasts/${podcastId}`);
      window.location.href = `${basePath}/podcasts`;
    } catch {
      showToast(t('podcast.settings.deleteError'), 'error');
      setLoading(false);
    }
  };

  return (
    <div className="card bg-error/10 border border-error">
      <div className="card-body">
        <h3 className="card-title text-lg text-error">{t('podcast.settings.dangerZone')}</h3>
        <p className="text-sm text-base-content/70">
          {t('podcast.settings.deleteDescription')}
        </p>
        <div className="card-actions">
          <button
            className="btn btn-error btn-sm"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : t('podcast.settings.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
