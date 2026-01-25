import { useState, useEffect } from 'preact/hooks';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { useApi, apiPatch, apiDelete } from '../../hooks/useApi';
import { Loading } from '../../components/Loading';
import { StatusBadge } from '../../components/Badge';
import { showToast, showToastAfterRedirect } from '../../components/Toast';

interface Episode {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  audio: { content_type: string; byte_size: number } | null;
}

interface EpisodeEditProps {
  podcastId: string;
  episodeId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function EpisodeEdit({ podcastId, episodeId }: EpisodeEditProps) {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const basePath = lang === 'ja' ? '' : `/${lang}`;
  const { data: episode, loading, error } = useApi<Episode>(
    `/api/podcasts/${podcastId}/episodes/${episodeId}`,
    token
  );

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [publishedAt, setPublishedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (episode) {
      setTitle(episode.title);
      setDescription(episode.description || '');
      setStatus(episode.status);
      if (episode.published_at) {
        // Convert to local time format
        const date = new Date(episode.published_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setPublishedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
      } else {
        // Default to current datetime (local time)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        setPublishedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
      }
    }
  }, [episode]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    if (status === 'published' && !publishedAt) {
      alert(t('episode.publishDateRequiredError'));
      return;
    }

    setSubmitting(true);

    const data: Record<string, unknown> = {
      title,
      description: description || null,
      status,
    };

    if (status === 'published') {
      data.published_at = new Date(publishedAt).toISOString();
    }

    try {
      await apiPatch(`/api/podcasts/${podcastId}/episodes/${episodeId}`, token, data);
      showToastAfterRedirect(t('common.saved'));
      window.location.href = `${basePath}/podcasts/${podcastId}#episodes`;
    } catch (err) {
      showToast((err as Error).message || t('episode.updateFailed'), 'error');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('episode.deleteConfirm'))) return;

    setDeleting(true);
    try {
      await apiDelete(`/api/podcasts/${podcastId}/episodes/${episodeId}`, token);
      showToastAfterRedirect(t('common.deleted'));
      window.location.href = `${basePath}/podcasts/${podcastId}#episodes`;
    } catch {
      showToast(t('episode.deleteFailed'), 'error');
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !episode) return <div className="alert alert-error">{error || 'Not found'}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('episode.edit.title')}</h1>
        <StatusBadge status={episode.status} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('episode.form.title')} <span className="text-error">*</span></span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={title}
            onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('episode.form.description')}</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-32"
            value={description}
            onInput={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('episode.form.audioFile')}</span>
          </label>
          <div className="card bg-base-200">
            <div className="card-body py-4">
              {episode.audio ? (
                <div className="flex items-center gap-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium">{episode.audio.content_type}</p>
                    <p className="text-sm text-base-content/70">{formatBytes(episode.audio.byte_size)}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-base-content/70">{t('episode.form.noAudio')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">{t('episode.form.publishSettings')}</h3>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('episode.form.status')}</span>
              </label>
              <div className="flex gap-4">
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="status"
                    className="radio radio-warning"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                  />
                  <span className="label-text">{t('episode.form.draft')}</span>
                </label>
                <label className="label cursor-pointer gap-2">
                  <input
                    type="radio"
                    name="status"
                    className="radio radio-success"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                  />
                  <span className="label-text">{t('episode.form.published')}</span>
                </label>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{t('episode.form.publishDate')}</span>
              </label>
              <input
                type="datetime-local"
                className="input input-bordered w-full"
                value={publishedAt}
                onInput={(e) => setPublishedAt((e.target as HTMLInputElement).value)}
              />
              <label className="label">
                <span className="label-text-alt">{t('episode.form.publishDateRequired')}</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="loading loading-spinner loading-sm" /> : t('episode.form.save')}
          </button>
          <a href={`${basePath}/podcasts/${podcastId}`} className="btn btn-ghost">{t('episode.form.back')}</a>
        </div>
      </form>

      <div className="mt-8 card bg-error/10 border border-error">
        <div className="card-body">
          <h3 className="card-title text-lg text-error">{t('episode.dangerZone')}</h3>
          <p className="text-sm text-base-content/70">
            {t('episode.deleteWarning')}
          </p>
          <div className="card-actions">
            <button className="btn btn-error btn-sm" onClick={handleDelete} disabled={deleting}>
              {deleting ? <span className="loading loading-spinner loading-sm" /> : t('episode.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
