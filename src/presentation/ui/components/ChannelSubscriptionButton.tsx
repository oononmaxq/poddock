import { useEffect, useState } from 'preact/hooks';
import { showToast } from './Toast';

interface ChannelSubscriptionButtonProps {
  sourceId: string;
  initialLoggedIn: boolean;
}

export function ChannelSubscriptionButton({ sourceId, initialLoggedIn }: ChannelSubscriptionButtonProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadState = async () => {
    if (!isLoggedIn) return;
    try {
      const response = await fetch('/api/channel-subscriptions', { credentials: 'include' });
      if (response.status === 401 || response.status === 403) {
        setIsLoggedIn(false);
        return;
      }
      if (!response.ok) return;
      const data = (await response.json()) as { items: Array<{ sourceId: string }> };
      setIsSubscribed(data.items.some((item) => item.sourceId === sourceId));
    } catch {
      // noop
    }
  };

  useEffect(() => {
    void loadState();
  }, [sourceId, isLoggedIn]);

  const handleToggle = async () => {
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    setLoading(true);
    try {
      const response = isSubscribed
        ? await fetch(`/api/channel-subscriptions/${encodeURIComponent(sourceId)}`, {
            method: 'DELETE',
            credentials: 'include',
          })
        : await fetch('/api/channel-subscriptions', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source_id: sourceId }),
          });
      if (response.status === 401 || response.status === 403) {
        window.location.href = '/login';
        return;
      }
      if (response.ok) {
        const nextState = !isSubscribed;
        setIsSubscribed(nextState);
        showToast(nextState ? 'チャンネル登録しました' : 'チャンネル登録を解除しました', nextState ? 'success' : 'info');
      } else {
        showToast('チャンネル登録の更新に失敗しました', 'error');
      }
    } catch {
      showToast('チャンネル登録の更新に失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      class={`btn btn-sm ${isSubscribed ? 'btn-outline' : 'btn-primary'}`}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <span class="loading loading-spinner loading-xs" />
      ) : isSubscribed ? (
        '登録解除'
      ) : (
        'チャンネル登録'
      )}
    </button>
  );
}
