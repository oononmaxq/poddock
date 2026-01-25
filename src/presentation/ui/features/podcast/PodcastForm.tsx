import { useState, useEffect, useRef } from 'preact/hooks';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../hooks/useI18n';
import { apiPost, apiPatch } from '../../hooks/useApi';
import { Loading } from '../../components/Loading';
import { showToast, showToastAfterRedirect } from '../../components/Toast';

interface PodcastFormData {
  title: string;
  description: string;
  language: string;
  category: string;
  author_name: string;
  contact_email: string;
  explicit: boolean;
  podcast_type: 'episodic' | 'serial';
  visibility: 'public' | 'private';
  cover_image_asset_id: string | null;
  theme_color: string;
  theme_mode: 'light' | 'dark';
}

interface PodcastFormProps {
  podcastId?: string;
}

const CATEGORIES = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Business', label: 'Business' },
  { value: 'Comedy', label: 'Comedy' },
  { value: 'Education', label: 'Education' },
  { value: 'News', label: 'News' },
  { value: 'Society & Culture', label: 'Society & Culture' },
  { value: 'Arts', label: 'Arts' },
  { value: 'Health & Fitness', label: 'Health & Fitness' },
  { value: 'Music', label: 'Music' },
  { value: 'Sports', label: 'Sports' },
];

const THEME_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#ef4444', label: 'Red' },
  { value: '#f97316', label: 'Orange' },
  { value: '#eab308', label: 'Yellow' },
  { value: '#22c55e', label: 'Green' },
  { value: '#14b8a6', label: 'Teal' },
  { value: '#0ea5e9', label: 'Sky' },
  { value: '#3b82f6', label: 'Blue' },
];

export function PodcastForm({ podcastId }: PodcastFormProps) {
  const { token } = useAuth();
  const { t, lang } = useI18n();
  const isEdit = !!podcastId;
  const basePath = lang === 'ja' ? '' : `/${lang}`;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'complete'>('idle');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [form, setForm] = useState<PodcastFormData>({
    title: '',
    description: '',
    language: 'ja',
    category: '',
    author_name: '',
    contact_email: '',
    explicit: false,
    podcast_type: 'episodic',
    visibility: 'private',
    cover_image_asset_id: null,
    theme_color: '#6366f1',
    theme_mode: 'light',
  });

  useEffect(() => {
    if (!isEdit) return;

    fetch(`/api/podcasts/${podcastId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) window.location.href = '/login';
          throw new Error('Failed to load');
        }
        return res.json();
      })
      .then((data) => {
        setForm({
          title: data.title,
          description: data.description,
          language: data.language,
          category: data.category,
          author_name: data.author_name || '',
          contact_email: data.contact_email || '',
          explicit: data.explicit,
          podcast_type: data.podcast_type || 'episodic',
          visibility: data.visibility,
          cover_image_asset_id: data.cover_image_asset_id || null,
          theme_color: data.theme_color || '#6366f1',
          theme_mode: data.theme_mode || 'light',
        });
        if (data.cover_image_url) {
          setUploadState('complete');
          setCoverPreview(data.cover_image_url);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load podcast');
      });
  }, [podcastId, token, isEdit]);

  const handleCoverUpload = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      alert('JPG or PNG only');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Max 10MB');
      return;
    }

    setUploadState('uploading');

    try {
      const urlRes = await fetch('/api/assets/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: 'image', file_name: file.name, content_type: file.type, byte_size: file.size }),
      });
      if (!urlRes.ok) throw new Error('Failed to get upload URL');

      const { asset_id, upload } = await urlRes.json();

      await fetch(upload.url, {
        method: upload.method,
        headers: { 'Content-Type': file.type, Authorization: `Bearer ${token}` },
        body: file,
      });

      await fetch(`/api/assets/${asset_id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      });

      setForm((prev) => ({ ...prev, cover_image_asset_id: asset_id }));
      setCoverPreview(URL.createObjectURL(file));
      setUploadState('complete');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
      setUploadState('idle');
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);

    const data = {
      title: form.title,
      description: form.description,
      language: form.language,
      category: form.category,
      author_name: form.author_name || null,
      contact_email: form.contact_email || null,
      explicit: form.explicit,
      podcast_type: form.podcast_type,
      visibility: form.visibility,
      cover_image_asset_id: form.cover_image_asset_id,
      theme_color: form.theme_color || '#6366f1',
      theme_mode: form.theme_mode || 'light',
    };

    try {
      if (isEdit) {
        await apiPatch(`/api/podcasts/${podcastId}`, token, data);
        showToastAfterRedirect(t('common.saved'));
        window.location.href = `${basePath}/podcasts/${podcastId}`;
      } else {
        const result = await apiPost<{ id: string }>('/api/podcasts', token, data);
        showToastAfterRedirect(t('common.saved'));
        window.location.href = `${basePath}/podcasts/${result.id}`;
      }
    } catch (err) {
      showToast((err as Error).message || t('common.error'), 'error');
      setSubmitting(false);
    }
  };

  const updateField = <K extends keyof PodcastFormData>(key: K, value: PodcastFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) return <Loading />;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEdit ? t('podcast.edit.title') : t('podcast.create.title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('podcast.form.title')} <span className="text-error">*</span></span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={form.title}
            onInput={(e) => updateField('title', (e.target as HTMLInputElement).value)}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('podcast.form.description')} <span className="text-error">*</span></span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-32"
            value={form.description}
            onInput={(e) => updateField('description', (e.target as HTMLTextAreaElement).value)}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('podcast.form.coverImage')} <span className="text-error">*</span></span>
          </label>
          <div
            className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const files = e.dataTransfer?.files;
              if (files?.length) handleCoverUpload(files[0]);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              className="hidden"
              onChange={(e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files?.length) handleCoverUpload(files[0]);
              }}
            />

            {uploadState === 'idle' && (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-base-content/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-base-content/70">{t('podcast.form.coverImage.upload')}</p>
                <p className="text-sm text-base-content/50 mt-1">{t('podcast.form.coverImage.format')}</p>
              </div>
            )}

            {uploadState === 'uploading' && (
              <div className="flex items-center justify-center gap-2">
                <span className="loading loading-spinner loading-sm" />
                <span>Uploading...</span>
              </div>
            )}

            {uploadState === 'complete' && coverPreview && (
              <div className="flex items-center gap-4">
                <img src={coverPreview} alt="Cover" className="w-24 h-24 object-cover rounded" />
                <div className="text-left">
                  <p className="font-medium text-success">{t('podcast.form.coverImage.uploaded')}</p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm mt-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadState('idle');
                      setCoverPreview(null);
                      setForm((prev) => ({ ...prev, cover_image_asset_id: null }));
                    }}
                  >
                    {t('podcast.form.coverImage.change')}
                  </button>
                </div>
              </div>
            )}
          </div>
          <label className="label">
            <span className="label-text-alt">{t('podcast.form.coverImage.description')}</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('podcast.form.language')}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.language}
              onChange={(e) => updateField('language', (e.target as HTMLSelectElement).value)}
            >
              <option value="ja">Japanese</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('podcast.form.category')} <span className="text-error">*</span></span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.category}
              onChange={(e) => updateField('category', (e.target as HTMLSelectElement).value)}
              required
            >
              <option value="">{t('podcast.form.selectCategory')}</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('podcast.form.authorName')}</span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={form.author_name}
            onInput={(e) => updateField('author_name', (e.target as HTMLInputElement).value)}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('podcast.form.contactEmail')}</span>
          </label>
          <input
            type="email"
            className="input input-bordered w-full"
            value={form.contact_email}
            onInput={(e) => updateField('contact_email', (e.target as HTMLInputElement).value)}
          />
          <label className="label">
            <span className="label-text-alt">{t('podcast.form.contactEmail.description')}</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              className="checkbox"
              checked={form.explicit}
              onChange={(e) => updateField('explicit', (e.target as HTMLInputElement).checked)}
            />
            <span className="label-text">{t('podcast.form.explicit')}</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('podcast.form.podcastType')}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.podcast_type}
              onChange={(e) => updateField('podcast_type', (e.target as HTMLSelectElement).value as 'episodic' | 'serial')}
            >
              <option value="episodic">{t('podcast.form.podcastType.episodic')}</option>
              <option value="serial">{t('podcast.form.podcastType.serial')}</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('podcast.form.visibility')}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.visibility}
              onChange={(e) => updateField('visibility', (e.target as HTMLSelectElement).value as 'public' | 'private')}
            >
              <option value="private">{t('podcast.form.visibility.private')}</option>
              <option value="public">{t('podcast.form.visibility.public')}</option>
            </select>
          </div>
        </div>

        {/* Website Theme Settings */}
        <div className="divider">{t('podcast.form.websiteTheme')}</div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('podcast.form.themeColor')}</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {THEME_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                className={`w-10 h-10 rounded-full border-2 transition-all ${
                  form.theme_color === color.value ? 'border-base-content scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: color.value }}
                onClick={() => updateField('theme_color', color.value)}
                title={color.label}
              />
            ))}
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">{t('podcast.form.themeMode')}</span>
          </label>
          <div className="flex gap-4">
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                name="theme_mode"
                className="radio"
                checked={form.theme_mode === 'light'}
                onChange={() => updateField('theme_mode', 'light')}
              />
              <span className="label-text">{t('settings.theme.light')}</span>
            </label>
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                name="theme_mode"
                className="radio"
                checked={form.theme_mode === 'dark'}
                onChange={() => updateField('theme_mode', 'dark')}
              />
              <span className="label-text">{t('settings.theme.dark')}</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="loading loading-spinner loading-sm" /> : isEdit ? t('podcast.form.save') : t('podcast.form.create')}
          </button>
          <a href={isEdit ? `${basePath}/podcasts/${podcastId}` : `${basePath}/`} className="btn btn-ghost">
            {t('podcast.form.cancel')}
          </a>
        </div>
      </form>
    </div>
  );
}
