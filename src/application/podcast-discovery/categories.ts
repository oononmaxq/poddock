const CATEGORY_CANONICAL = [
  'ビジネス',
  'キャリア',
  'テクノロジー',
  '言語',
  '暮らし',
  '教育',
  'ニュース',
  '健康',
  '科学',
  '社会・文化',
  'エンタメ',
  '音楽',
  'スポーツ',
  'コメディ',
] as const;

export type CanonicalCategory = (typeof CATEGORY_CANONICAL)[number];

export const CATEGORY_ALIAS_MAP: Record<string, CanonicalCategory> = {
  business: 'ビジネス',
  entrepreneurship: 'ビジネス',
  marketing: 'ビジネス',
  economy: 'ビジネス',
  investing: 'ビジネス',
  management: 'ビジネス',
  ビジネス: 'ビジネス',
  キャリア: 'キャリア',
  career: 'キャリア',
  careers: 'キャリア',
  jobs: 'キャリア',
  technology: 'テクノロジー',
  'tech news': 'テクノロジー',
  'software how-to': 'テクノロジー',
  gadgets: 'テクノロジー',
  tech: 'テクノロジー',
  テクノロジー: 'テクノロジー',
  language: '言語',
  languages: '言語',
  'language learning': '言語',
  言語: '言語',
  語学: '言語',
  leisure: '暮らし',
  'home & garden': '暮らし',
  hobbies: '暮らし',
  crafts: '暮らし',
  games: '暮らし',
  parenting: '暮らし',
  'kids & family': '暮らし',
  'kids and family': '暮らし',
  'places & travel': '暮らし',
  travel: '暮らし',
  lifestyle: '暮らし',
  暮らし: '暮らし',
  生活: '暮らし',
  education: '教育',
  'how to': '教育',
  courses: '教育',
  'self-improvement': '教育',
  教育: '教育',
  学習: '教育',
  news: 'ニュース',
  'daily news': 'ニュース',
  politics: 'ニュース',
  'news commentary': 'ニュース',
  ニュース: 'ニュース',
  health: '健康',
  'health & fitness': '健康',
  'mental health': '健康',
  fitness: '健康',
  medicine: '健康',
  wellness: '健康',
  健康: '健康',
  science: '科学',
  astronomy: '科学',
  nature: '科学',
  科学: '科学',
  'society & culture': '社会・文化',
  'society and culture': '社会・文化',
  documentary: '社会・文化',
  philosophy: '社会・文化',
  relationships: '社会・文化',
  社会: '社会・文化',
  文化: '社会・文化',
  '社会・文化': '社会・文化',
  entertainment: 'エンタメ',
  'tv & film': 'エンタメ',
  'tv and film': 'エンタメ',
  fiction: 'エンタメ',
  'true crime': 'エンタメ',
  anime: 'エンタメ',
  manga: 'エンタメ',
  エンタメ: 'エンタメ',
  娯楽: 'エンタメ',
  music: '音楽',
  音楽: '音楽',
  sports: 'スポーツ',
  'sports news': 'スポーツ',
  football: 'スポーツ',
  baseball: 'スポーツ',
  basketball: 'スポーツ',
  golf: 'スポーツ',
  スポーツ: 'スポーツ',
  comedy: 'コメディ',
  'comedy interviews': 'コメディ',
  improv: 'コメディ',
  'stand-up': 'コメディ',
  コメディ: 'コメディ',
};

export function getCanonicalCategories() {
  return CATEGORY_CANONICAL;
}

export function normalizeCategory(raw: string): CanonicalCategory | null {
  const trimmed = raw.trim();
  if (!trimmed || /^\d+$/.test(trimmed)) return null;
  const key = trimmed.toLowerCase();
  return CATEGORY_ALIAS_MAP[key] ?? null;
}

export function parseCategoriesJson(input: string | null | undefined): string[] {
  if (!input) return [];
  try {
    const parsed = JSON.parse(input) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}
