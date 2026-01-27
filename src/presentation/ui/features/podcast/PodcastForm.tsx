import { useState, useEffect } from 'preact/hooks';
import { useI18n } from '../../hooks/useI18n';
import { apiPost, apiPatch } from '../../hooks/useApi';
import { Loading } from '../../components/Loading';
import { showToast, showToastAfterRedirect } from '../../components/Toast';
import { CoverImageUpload } from './components/CoverImageUpload';
import { ThemeSettings } from './components/ThemeSettings';
import { PODCAST_CATEGORIES } from '../../../../domain/constants/podcast';

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

const DEFAULT_FORM_DATA: PodcastFormData = {
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
};

export function PodcastForm({ podcastId }: PodcastFormProps) {
  const { t, lang } = useI18n();
  const isEdit = !!podcastId;
  const basePath = lang === 'ja' ? '' : `/${lang}`;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [form, setForm] = useState<PodcastFormData>(DEFAULT_FORM_DATA);

  useEffect(() => {
    if (!isEdit) return;

    fetch(`/api/podcasts/${podcastId}`, { credentials: 'include' })
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
          setCoverPreview(data.cover_image_url);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to load podcast');
      });
  }, [podcastId, isEdit]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setSubmitting(true);

    const data = {
      ...form,
      author_name: form.author_name || null,
      contact_email: form.contact_email || null,
    };

    try {
      if (isEdit) {
        await apiPatch(`/api/podcasts/${podcastId}`, data);
        showToastAfterRedirect(t('common.saved'));
        window.location.href = `${basePath}/podcasts/${podcastId}`;
      } else {
        const result = await apiPost<{ id: string }>('/api/podcasts', data);
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
      <h1 className="text-2xl font-bold mb-6">
        {isEdit ? t('podcast.edit.title') : t('podcast.create.title')}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t('podcast.form.title')} <span className="text-error">*</span>
            </span>
          </label>
          <input
            type="text"
            className="input input-bordered w-full"
            value={form.title}
            onInput={(e) => updateField('title', (e.target as HTMLInputElement).value)}
            required
          />
        </div>

        {/* Description */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">
              {t('podcast.form.description')} <span className="text-error">*</span>
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full h-32"
            value={form.description}
            onInput={(e) => updateField('description', (e.target as HTMLTextAreaElement).value)}
            required
          />
        </div>

        {/* Cover Image */}
        <CoverImageUpload
          initialPreview={coverPreview}
          onUploadComplete={(assetId) => updateField('cover_image_asset_id', assetId)}
          onClear={() => {
            updateField('cover_image_asset_id', null);
            setCoverPreview(null);
          }}
        />

        {/* Language & Category */}
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
              <span className="label-text">
                {t('podcast.form.category')} <span className="text-error">*</span>
              </span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.category}
              onChange={(e) => updateField('category', (e.target as HTMLSelectElement).value)}
              required
            >
              <option value="">{t('podcast.form.selectCategory')}</option>
              {PODCAST_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Author Name */}
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

        {/* Contact Email */}
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

        {/* Explicit */}
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

        {/* Podcast Type & Visibility */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('podcast.form.podcastType')}</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={form.podcast_type}
              onChange={(e) =>
                updateField('podcast_type', (e.target as HTMLSelectElement).value as 'episodic' | 'serial')
              }
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
              onChange={(e) =>
                updateField('visibility', (e.target as HTMLSelectElement).value as 'public' | 'private')
              }
            >
              <option value="private">{t('podcast.form.visibility.private')}</option>
              <option value="public">{t('podcast.form.visibility.public')}</option>
            </select>
          </div>
        </div>

        {/* Theme Settings */}
        <ThemeSettings
          themeColor={form.theme_color}
          themeMode={form.theme_mode}
          onThemeColorChange={(color) => updateField('theme_color', color)}
          onThemeModeChange={(mode) => updateField('theme_mode', mode)}
        />

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? (
              <span className="loading loading-spinner loading-sm" />
            ) : isEdit ? (
              t('podcast.form.save')
            ) : (
              t('podcast.form.create')
            )}
          </button>
          <a
            href={isEdit ? `${basePath}/podcasts/${podcastId}` : `${basePath}/podcasts`}
            className="btn btn-ghost"
          >
            {t('podcast.form.cancel')}
          </a>
        </div>
      </form>
    </div>
  );
}
