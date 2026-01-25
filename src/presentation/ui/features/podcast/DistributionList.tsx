import { useState } from 'preact/hooks';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { Loading } from '../../components/Loading';
import { showToast } from '../../components/Toast';

interface DistributionStatus {
  target_id: string;
  target_name: string;
  status: string;
  submit_url: string;
  note: string | null;
}

interface DistributionListResponse {
  items: DistributionStatus[];
}

interface DistributionListProps {
  podcastId: string;
}

const STATUS_OPTIONS = [
  { value: 'not_submitted', label: '未登録', color: 'badge-ghost' },
  { value: 'submitted', label: '申請中', color: 'badge-warning' },
  { value: 'live', label: '配信中', color: 'badge-success' },
  { value: 'needs_attention', label: '要確認', color: 'badge-error' },
] as const;

const PLATFORM_LOGOS: Record<string, string> = {
  apple: '/badges/apple-podcasts.svg',
  spotify: '/badges/spotify.svg',
  amazon: '/badges/amazon-music.svg',
  youtube: '/badges/youtube-music.svg',
};

export function DistributionList({ podcastId }: DistributionListProps) {
  const { token } = useAuth();
  const { t } = useI18n();
  const { data, loading, error, refetch } = useApi<DistributionListResponse>(
    `/api/podcasts/${podcastId}/distribution-statuses`,
    token
  );

  if (loading) return <Loading />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const statuses = data?.items || [];

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">{t('distribution.title')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statuses.map((item) => (
          <DistributionCard
            key={item.target_id}
            podcastId={podcastId}
            item={item}
            onStatusChange={refetch}
          />
        ))}
      </div>
    </div>
  );
}

interface DistributionCardProps {
  podcastId: string;
  item: DistributionStatus;
  onStatusChange: () => void;
}

function DistributionCard({ podcastId, item, onStatusChange }: DistributionCardProps) {
  const { t } = useI18n();
  const { token } = useAuth();
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (e: Event) => {
    const newStatus = (e.target as HTMLSelectElement).value;
    if (newStatus === item.status) return;

    setUpdating(true);
    try {
      const response = await fetch(
        `/api/podcasts/${podcastId}/distribution-statuses/${item.target_id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        onStatusChange();
        showToast(t('common.saved'), 'success');
      } else {
        showToast(t('common.error'), 'error');
      }
    } catch {
      showToast(t('common.error'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const currentOption = STATUS_OPTIONS.find((opt) => opt.value === item.status);

  const logoSrc = PLATFORM_LOGOS[item.target_id];

  return (
    <div className="card bg-base-200">
      <div className="card-body py-4 flex-row items-center justify-between gap-4">
        {logoSrc ? (
          <img src={logoSrc} alt={item.target_name} className="h-8" />
        ) : (
          <h3 className="font-medium">{item.target_name}</h3>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            className={`select select-sm select-bordered ${updating ? 'opacity-50' : ''}`}
            value={item.status}
            onChange={handleStatusChange}
            disabled={updating}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <a
            href={item.submit_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline btn-square sm:btn-wide"
            title={t('distribution.submitPage')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="hidden sm:inline ml-1">{t('distribution.submitPage')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
