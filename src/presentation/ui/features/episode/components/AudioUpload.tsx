import { useRef, useState } from 'preact/hooks';
import { useI18n } from '../../../hooks/useI18n';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { extractAudioDuration, formatDuration } from '../../../utils/audio';

interface AudioUploadProps {
  onUploadComplete: (assetId: string, durationSeconds: number | null) => void;
  onClear: () => void;
}

export function AudioUpload({ onUploadComplete, onClear }: AudioUploadProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const { uploadState, fileName, progress, upload, reset } = useFileUpload({
    type: 'audio',
    onSuccess: async (assetId) => {
      // Extract duration after upload completes
      if (currentFile) {
        const duration = await extractAudioDuration(currentFile);
        setDurationSeconds(duration);
        onUploadComplete(assetId, duration);
      } else {
        onUploadComplete(assetId, null);
      }
    },
    onError: (error) => alert(error),
  });

  const handleFile = async (file: File) => {
    setCurrentFile(file);
    setDurationSeconds(null);
    await upload(file);
  };

  const handleClear = () => {
    reset();
    setDurationSeconds(null);
    setCurrentFile(null);
    onClear();
  };

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text">
          {t('episode.form.audioFile')} <span className="text-error">*</span>
        </span>
      </label>
      <div
        className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const files = e.dataTransfer?.files;
          if (files?.length) handleFile(files[0]);
        }}
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-base-content/30 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-success mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="font-medium">{fileName}</p>
            {durationSeconds !== null && (
              <p className="text-sm text-base-content/70 mt-1">{formatDuration(durationSeconds)}</p>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-2"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            >
              {t('episode.form.changeFile')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function useAudioUploadState() {
  const [uploadedAssetId, setUploadedAssetId] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  const handleUploadComplete = (assetId: string, duration: number | null) => {
    setUploadedAssetId(assetId);
    setDurationSeconds(duration);
  };

  const handleClear = () => {
    setUploadedAssetId(null);
    setDurationSeconds(null);
  };

  return {
    uploadedAssetId,
    durationSeconds,
    handleUploadComplete,
    handleClear,
    isComplete: uploadedAssetId !== null,
  };
}
