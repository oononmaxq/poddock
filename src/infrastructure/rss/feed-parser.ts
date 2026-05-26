export interface ParsedRssItem {
  guid: string | null;
  title: string;
  description: string;
  pubDate: string | null;
  link: string | null;
  enclosureUrl: string | null;
}

export interface ParsedRssFeed {
  title: string;
  link: string | null;
  description: string;
  language: string;
  author: string;
  copyright: string;
  ownerName: string;
  ownerEmail: string;
  imageUrl: string | null;
  categories: string[];
  items: ParsedRssItem[];
}

const RSS_FETCH_TIMEOUT_MS = 12000;

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(input: string): string {
  return input
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_, code: string) => {
      if (code.startsWith('#x') || code.startsWith('#X')) {
        const value = Number.parseInt(code.slice(2), 16);
        return Number.isFinite(value) ? String.fromCodePoint(value) : '';
      }
      if (code.startsWith('#')) {
        const value = Number.parseInt(code.slice(1), 10);
        return Number.isFinite(value) ? String.fromCodePoint(value) : '';
      }
      return ENTITY_MAP[code] ?? `&${code};`;
    })
    .trim();
}

function cleanText(input: string | null): string {
  if (!input) return '';
  return decodeEntities(
    input
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function cleanDescriptionText(input: string | null): string {
  if (!input) return '';
  const decoded = decodeEntities(
    input
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '• ')
      .replace(/<[^>]+>/g, '')
  );

  return decoded
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function firstTagValue(xml: string, tagNames: string[]): string | null {
  for (const tag of tagNames) {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}

function collectCategories(channelXml: string): string[] {
  const values = new Set<string>();

  const simpleCategoryMatches = channelXml.matchAll(/<category[^>]*>([\s\S]*?)<\/category>/gi);
  for (const match of simpleCategoryMatches) {
    const value = cleanText(match[1]);
    if (value) values.add(value);
  }

  const itunesCategoryMatches = channelXml.matchAll(/<itunes:category[^>]*text="([^"]+)"[^>]*\/?>/gi);
  for (const match of itunesCategoryMatches) {
    const value = cleanText(match[1]);
    if (value) values.add(value);
  }

  return Array.from(values);
}

function parseItems(channelXml: string): ParsedRssItem[] {
  const items: ParsedRssItem[] = [];
  const itemMatches = channelXml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi);

  for (const match of itemMatches) {
    const itemXml = match[1];
    const enclosureUrlMatch = itemXml.match(/<enclosure[^>]*url="([^"]+)"/i);

    items.push({
      guid: cleanText(firstTagValue(itemXml, ['guid'])) || null,
      title: cleanText(firstTagValue(itemXml, ['title'])),
      description: cleanDescriptionText(firstTagValue(itemXml, ['description', 'content:encoded'])),
      pubDate: cleanText(firstTagValue(itemXml, ['pubDate'])) || null,
      link: cleanText(firstTagValue(itemXml, ['link'])) || null,
      enclosureUrl: enclosureUrlMatch?.[1] ? decodeEntities(enclosureUrlMatch[1]) : null,
    });
  }

  return items;
}

function parseItunesOwner(channelXml: string): { ownerName: string; ownerEmail: string } {
  const ownerMatch = channelXml.match(/<itunes:owner[^>]*>([\s\S]*?)<\/itunes:owner>/i);
  const ownerXml = ownerMatch?.[1] ?? '';
  return {
    ownerName: cleanText(firstTagValue(ownerXml, ['itunes:name'])),
    ownerEmail: cleanText(firstTagValue(ownerXml, ['itunes:email'])),
  };
}

export function parseRssXml(xml: string): ParsedRssFeed {
  const channelMatch = xml.match(/<channel[^>]*>([\s\S]*?)<\/channel>/i);
  const channelXml = channelMatch?.[1] ?? xml;
  const imageUrlMatch = channelXml.match(/<itunes:image[^>]*href="([^"]+)"/i)
    ?? channelXml.match(/<image>[\s\S]*?<url>([\s\S]*?)<\/url>[\s\S]*?<\/image>/i);
  const owner = parseItunesOwner(channelXml);

  return {
    title: cleanText(firstTagValue(channelXml, ['title'])),
    link: cleanText(firstTagValue(channelXml, ['link'])) || null,
    description: cleanDescriptionText(firstTagValue(channelXml, ['description', 'itunes:summary'])),
    language: cleanText(firstTagValue(channelXml, ['language'])),
    author: cleanText(firstTagValue(channelXml, ['itunes:author', 'managingEditor'])),
    copyright: cleanText(firstTagValue(channelXml, ['copyright'])),
    ownerName: owner.ownerName,
    ownerEmail: owner.ownerEmail,
    imageUrl: imageUrlMatch?.[1] ? cleanText(imageUrlMatch[1]) : null,
    categories: collectCategories(channelXml),
    items: parseItems(channelXml),
  };
}

export async function fetchAndParseRss(feedUrl: string): Promise<ParsedRssFeed> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RSS_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'PODDOCK/1.0 RSS Fetcher',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }
    const xml = await response.text();
    return parseRssXml(xml);
  } catch (error) {
    const causeCode = (error as { cause?: { code?: string } })?.cause?.code;
    if ((error as Error).name === 'AbortError' || causeCode === 'UND_ERR_CONNECT_TIMEOUT') {
      throw new Error(`Failed to fetch RSS (timeout): ${feedUrl}`);
    }
    throw new Error(`Failed to fetch RSS: ${feedUrl}`);
  } finally {
    clearTimeout(timeoutId);
  }
}
