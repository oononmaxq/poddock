// Podcast categories (Apple Podcasts standard)
export const PODCAST_CATEGORIES = [
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
] as const;

// Theme colors for public podcast website
export const THEME_COLORS = [
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
] as const;

// Supported languages
export const PODCAST_LANGUAGES = [
  { value: 'ja', label: 'Japanese' },
  { value: 'en', label: 'English' },
] as const;

// File validation constants
export const IMAGE_VALID_TYPES = ['image/jpeg', 'image/png'];
export const IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const AUDIO_VALID_TYPES = ['audio/mpeg', 'audio/mp4', 'audio/wav'];
export const AUDIO_MAX_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
