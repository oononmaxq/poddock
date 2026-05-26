export function resolvePlayableUrl(url: string): string {
  const anchorRedirectPattern = /\/podcast\/play\/\d+\/(.+)$/;
  const match = url.match(anchorRedirectPattern);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return url;
    }
  }
  return url;
}
