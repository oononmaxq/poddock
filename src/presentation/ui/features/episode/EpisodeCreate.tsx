import { useState } from 'preact/hooks';
import { useI18n } from '../../hooks/useI18n';
import { apiPost } from '../../hooks/useApi';
import { showToast, showToastAfterRedirect } from '../../components/Toast';
import { AudioUpload, useAudioUploadState } from './components/AudioUpload';

interface EpisodeCreateProps {
  podcastId: string;
}

export function EpisodeCreate({ podcastId }: EpisodeCreateProps) {
  const { t, lang } = useI18n();
  const basePath = lang === 'ja' ? '' : `/${lang}`;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    uploadedAssetId,
    durationSeconds,
    handleUploadComplete,
    handleClear,
    isComplete,
  } = useAudioUploadState();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const episode = await apiPost<{ id: string }>(`/api/podcasts/${podcastId}/episodes`, {
        title,
        description: description || null,
        status: 'draft',
      });

      if (uploadedAssetId) {
        const audioData: Record<string, unknown> = {
          audio_asset_id: uploadedAssetId,
        };
        if (durationSeconds !== null) {
          audioData.duration_seconds = durationSeconds;
        }
        await apiPost(`/api/podcasts/${podcastId}/episodes/${episode.id}/audio`, audioData);
      }

      showToastAfterRedirect(t('common.saved'));
      window.location.href = `${basePath}/podcasts/${podcastId}#episodes`;
    } catch (err) {
      showToast((err as Error).message || t('common.error'), 'error');
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('episode.create.title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t('episode.form.title')} <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={title}
            onInput={(e) => setTitle((e.target as HTMLInputElement).value)}
            required
          />
        </div>

        {/* Description */}
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

        {/* Audio Upload */}
        <AudioUpload onUploadComplete={handleUploadComplete} onClear={handleClear} />

        {/* Submit Buttons */}
        <div className="flex gap-4 items-center">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || !isComplete}
          >
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              t('episode.form.saveAsDraft')
            )}
          </button>
          <a href={`${basePath}/podcasts/${podcastId}`} className="btn btn-ghost">
            {t('episode.form.cancel')}
          </a>
          {!isComplete && (
            <span className="text-sm text-base-content/50">{t('episode.form.audioRequired')}</span>
          )}
        </div>
      </form>
    </div>
  );
}
