import { useState } from 'preact/hooks';
import {
  IMAGE_VALID_TYPES,
  IMAGE_MAX_SIZE_BYTES,
  AUDIO_VALID_TYPES,
  AUDIO_MAX_SIZE_BYTES,
} from '../../../domain/constants/podcast';

export type UploadState = 'idle' | 'uploading' | 'complete';
export type FileType = 'image' | 'audio';

interface UseFileUploadOptions {
  type: FileType;
  onSuccess?: (assetId: string, previewUrl: string) => void;
  onError?: (error: string) => void;
}

interface UseFileUploadReturn {
  uploadState: UploadState;
  fileName: string;
  progress: number;
  previewUrl: string | null;
  assetId: string | null;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

function validateFile(file: File, type: FileType): string | null {
  const validTypes = type === 'image' ? IMAGE_VALID_TYPES : AUDIO_VALID_TYPES;
  const maxSize = type === 'image' ? IMAGE_MAX_SIZE_BYTES : AUDIO_MAX_SIZE_BYTES;

  if (!validTypes.includes(file.type)) {
    const extensions = type === 'image' ? 'JPG, PNG' : 'MP3, M4A, WAV';
    return `${extensions} only`;
  }

  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024);
    return `Max ${maxMB}MB`;
  }

  return null;
}

async function uploadToR2(file: File, type: FileType): Promise<string> {
  // Get presigned upload URL
  const urlRes = await fetch('/api/assets/upload-url', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type,
      file_name: file.name,
      content_type: file.type,
      byte_size: file.size,
    }),
  });

  if (!urlRes.ok) {
    throw new Error('Failed to get upload URL');
  }

  const { asset_id, upload } = await urlRes.json();

  // Upload file to R2
  await fetch(upload.url, {
    method: upload.method,
    headers: { 'Content-Type': file.type },
    body: file,
  });

  // Mark upload as complete
  await fetch(`/api/assets/${asset_id}/complete`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  return asset_id;
}

export function useFileUpload({
  type,
  onSuccess,
  onError,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [assetId, setAssetId] = useState<string | null>(null);

  const upload = async (file: File) => {
    const validationError = validateFile(file, type);
    if (validationError) {
      onError?.(validationError);
      return;
    }

    setUploadState('uploading');
    setFileName(file.name);
    setProgress(0);

    try {
      // Simulate progress (R2 doesn't provide progress)
      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + 10, 90));
      }, 100);

      const uploadedAssetId = await uploadToR2(file, type);

      clearInterval(progressInterval);
      setProgress(100);

      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
      setAssetId(uploadedAssetId);
      setUploadState('complete');

      onSuccess?.(uploadedAssetId, preview);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadState('idle');
      onError?.('Upload failed');
    }
  };

  const reset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadState('idle');
    setFileName('');
    setProgress(0);
    setPreviewUrl(null);
    setAssetId(null);
  };

  return {
    uploadState,
    fileName,
    progress,
    previewUrl,
    assetId,
    upload,
    reset,
  };
}
