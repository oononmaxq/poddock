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
    if (isSubscribed) return;
    setLoading(true);
    try {
      const response = await fetch('/api/channel-subscriptions', {
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
        setIsSubscribed(true);
        showToast('チャンネル登録しました', 'success');
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
      class={`btn btn-sm ${isSubscribed ? 'border-yellow-500 text-yellow-500 bg-transparent hover:bg-base-100' : 'btn-primary'}`}
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <span class="loading loading-spinner loading-xs" />
      ) : isSubscribed ? (
        'チャンネル登録済'
      ) : (
        'チャンネル登録'
      )}
    </button>
  );
}
