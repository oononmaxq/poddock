import { useState, useRef } from 'preact/hooks';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { apiPost } from '../../hooks/useApi';
import { showToast, showToastAfterRedirect } from '../../components/Toast';

interface EpisodeCreateProps {
  podcastId: string;
}

export function EpisodeCreate({ podcastId }: EpisodeCreateProps) {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const basePath = lang === 'ja' ? '' : `/${lang}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'complete'>('idle');
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  const handleFile = async (file: File) => {
    const validTypes = ['audio/mpeg', 'audio/mp4', 'audio/wav'];
    if (!validTypes.includes(file.type)) {
      alert('MP3, M4A, WAV only');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      alert('Max 500MB');
      return;
    }

    setUploadState('uploading');
    setFileName(file.name);
    setProgress(0);
    setDurationSeconds(null);

    // Extract duration from audio file
    const extractDuration = (): Promise<number | null> => {
      return new Promise((resolve) => {
        const audio = new Audio();
        const objectUrl = URL.createObjectURL(file);
        audio.src = objectUrl;
        audio.onloadedmetadata = () => {
          const duration = Math.floor(audio.duration);
          URL.revokeObjectURL(objectUrl);
          resolve(isFinite(duration) ? duration : null);
        };
        audio.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        };
      });
    };

    // Start duration extraction in parallel with upload
    const durationPromise = extractDuration();

    try {
      const urlRes = await fetch('/api/assets/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'audio', file_name: file.name, content_type: file.type, byte_size: file.size }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');

      const { asset_id, upload } = await urlRes.json();

      await fetch(upload.url, {
        method: upload.method,
        headers: { 'Content-Type': file.type, Authorization: `Bearer ${token}` },
        body: file,
      });

      for (let i = 0; i <= 100; i += 10) {
        setProgress(i);
        await new Promise((r) => setTimeout(r, 50));
      }

      await fetch(`/api/assets/${asset_id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });

      // Wait for duration extraction to complete
      const duration = await durationPromise;
      setDurationSeconds(duration);

      setUploadedAssetId(asset_id);
      setUploadState('complete');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
      setUploadState('idle');
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files?.length) handleFile(files[0]);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const episode = await apiPost<{ id: string }>(`/api/podcasts/${podcastId}/episodes`, token, {
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
        await apiPost(`/api/podcasts/${podcastId}/episodes/${episode.id}/audio`, token, audioData);
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
            <span className="label-text">{t('episode.form.audioFile')} <span className="text-error">*</span></span>
          </label>
          <div
            className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav"
              className="hidden"
              onChange={(e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files?.length) handleFile(files[0]);
              }}
            />

            {uploadState === 'idle' && (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-base-content/30 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-base-content/70">{t('episode.form.audioUpload')}</p>
                <p className="text-sm text-base-content/50 mt-2">{t('episode.form.audioFormat')}</p>
              </div>
            )}

            {uploadState === 'uploading' && (
              <div>
                <p className="font-medium mb-2">{fileName}</p>
                <progress className="progress progress-primary w-full" value={progress} max="100" />
                <p className="text-sm text-base-content/70 mt-2">{t('episode.form.uploading')}</p>
              </div>
            )}

            {uploadState === 'complete' && (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-success mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">{fileName}</p>
                {durationSeconds !== null && (
                  <p className="text-sm text-base-content/70 mt-1">
                    {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, '0')}
                  </p>
                )}
                <button
                  type="button"
                  className="btn btn-ghost btn-sm mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadState('idle');
                    setUploadedAssetId(null);
                    setDurationSeconds(null);
                  }}
                >
                  {t('episode.form.changeFile')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || uploadState !== 'complete'}
          >
            {submitting ? <span className="loading loading-spinner loading-sm" /> : t('episode.form.saveAsDraft')}
          </button>
          <a href={`${basePath}/podcasts/${podcastId}`} className="btn btn-ghost">{t('episode.form.cancel')}</a>
          {uploadState !== 'complete' && (
            <span className="text-sm text-base-content/50">{t('episode.form.audioRequired')}</span>
          )}
        </div>
      </form>
    </div>
  );
}
