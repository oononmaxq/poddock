import { useState } from 'preact/hooks';

interface CommentItem {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface EpisodeCommentsProps {
  sourceId: string;
  episodeKey: string;
}

export function EpisodeComments({ sourceId, episodeKey }: EpisodeCommentsProps) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CommentItem[]>([]);

  const loadComments = async () => {
    if (loaded || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/public/feeds/${encodeURIComponent(sourceId)}/comments?episode_key=${encodeURIComponent(episodeKey)}`,
      );
      if (!response.ok) {
        throw new Error('コメントの取得に失敗しました');
      }
      const data = (await response.json()) as { items: CommentItem[] };
      setItems(data.items);
      setLoaded(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'コメントの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void loadComments();
  };

  const handleSubmit = async (event: Event) => {
    event.preventDefault();
    if (!authorName.trim() || !body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/feeds/${encodeURIComponent(sourceId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episode_key: episodeKey,
          author_name: authorName.trim(),
          body: body.trim(),
        }),
      });
      if (!response.ok) {
        throw new Error('コメントの投稿に失敗しました');
      }
      const created = (await response.json()) as CommentItem;
      setItems((prev) => [created, ...prev]);
      setBody('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'コメントの投稿に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="mt-3">
      <button type="button" class="btn btn-xs btn-ghost" onClick={handleToggle}>
        コメント {items.length > 0 ? `(${items.length})` : ''}
      </button>
      {open && (
        <div class="mt-2 rounded-lg border border-base-300 bg-base-100 p-3 space-y-3">
          <form class="space-y-2" onSubmit={handleSubmit}>
            <input
              type="text"
              class="input input-sm input-bordered w-full"
              placeholder="名前"
              value={authorName}
              onInput={(e) => setAuthorName((e.target as HTMLInputElement).value)}
              maxLength={50}
              required
            />
            <textarea
              class="textarea textarea-sm textarea-bordered w-full"
              placeholder="コメントを書く"
              value={body}
              onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
              maxLength={1000}
              rows={3}
              required
            />
            <div class="flex justify-end">
              <button type="submit" class="btn btn-primary btn-xs" disabled={submitting}>
                {submitting ? '投稿中...' : 'コメント投稿'}
              </button>
            </div>
          </form>

          {loading && <div class="text-xs text-base-content/60">読み込み中...</div>}
          {error && <div class="text-xs text-error">{error}</div>}
          {!loading && items.length === 0 && (
            <div class="text-xs text-base-content/60">まだコメントはありません。</div>
          )}

          {items.length > 0 && (
            <div class="space-y-2">
              {items.map((item) => (
                <article class="rounded-md border border-base-200 p-2">
                  <div class="text-xs text-base-content/60">
                    <span class="font-medium">{item.authorName}</span>
                    <span class="ml-2">{new Date(item.createdAt).toLocaleString('ja-JP')}</span>
                  </div>
                  <p class="text-sm whitespace-pre-wrap mt-1">{item.body}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
