import { useRef } from 'preact/hooks';
import { useI18n } from '../../../hooks/useI18n';
import { useFileUpload } from '../../../hooks/useFileUpload';
import type { UploadState } from '../../../hooks/useFileUpload';

interface CoverImageUploadProps {
  initialPreview?: string | null;
  onUploadComplete: (assetId: string) => void;
  onClear: () => void;
}

export function CoverImageUpload({
  initialPreview,
  onUploadComplete,
  onClear,
}: CoverImageUploadProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadState,
    previewUrl,
    upload,
    reset,
  } = useFileUpload({
    type: 'image',
    onSuccess: (assetId) => onUploadComplete(assetId),
    onError: (error) => alert(error),
  });

  const displayPreview = previewUrl || initialPreview;
  const displayState: UploadState = initialPreview && !previewUrl ? 'complete' : uploadState;

  const handleClear = () => {
    reset();
    onClear();
  };

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">
          {t('podcast.form.coverImage')} <span className="text-error">*</span>
        </span>
      </label>
      <div
        className="border-2 border-dashed border-base-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer?.files;
          if (files?.length) upload(files[0]);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files?.length) upload(files[0]);
          }}
        />

        {displayState === 'idle' && (
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mx-auto text-base-content/30 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-base-content/70">{t('podcast.form.coverImage.upload')}</p>
            <p className="text-sm text-base-content/50 mt-1">
              {t('podcast.form.coverImage.format')}
            </p>
          </div>
        )}

        {displayState === 'uploading' && (
          <div className="flex items-center justify-center gap-2">
            <span className="loading loading-spinner loading-sm" />
            <span>Uploading...</span>
          </div>
        )}

        {displayState === 'complete' && displayPreview && (
          <div className="flex items-center gap-4">
            <img
              src={displayPreview}
              alt="Cover"
              className="w-24 h-24 object-cover rounded"
            />
            <div className="text-left">
              <p className="font-medium text-success">
                {t('podcast.form.coverImage.uploaded')}
              </p>
              <button
                type="button"
                className="btn btn-ghost btn-sm mt-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
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
  );
}
