/**
 * Extract duration from an audio file
 * @param file Audio file to extract duration from
 * @returns Duration in seconds, or null if extraction fails
 */
export function extractAudioDuration(file: File): Promise<number | null> {
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
}

/**
 * Format duration in seconds to MM:SS string
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "3:45")
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}
