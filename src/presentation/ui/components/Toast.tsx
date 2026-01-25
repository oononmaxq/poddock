import { useState, useEffect } from 'preact/hooks';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

const PENDING_TOAST_KEY = 'pending-toast';

let toastId = 0;

// グローバルにトーストを表示する関数
export function showToast(message: string, type: ToastType = 'success') {
  const event = new CustomEvent('show-toast', {
    detail: { id: ++toastId, message, type },
  });
  window.dispatchEvent(event);
}

// ページ遷移後に表示するトーストを予約
export function showToastAfterRedirect(message: string, type: ToastType = 'success') {
  sessionStorage.setItem(PENDING_TOAST_KEY, JSON.stringify({ message, type }));
}

// 予約トーストをチェックして表示
function checkPendingToast() {
  const pending = sessionStorage.getItem(PENDING_TOAST_KEY);
  if (pending) {
    sessionStorage.removeItem(PENDING_TOAST_KEY);
    const { message, type } = JSON.parse(pending);
    setTimeout(() => showToast(message, type), 100);
  }
}

// トーストコンテナコンポーネント（Layoutに1つだけ配置）
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // 初回マウント時とView Transitions後にチェック
  useEffect(() => {
    checkPendingToast();

    // Astro View Transitions対応
    document.addEventListener('astro:page-load', checkPendingToast);
    return () => {
      document.removeEventListener('astro:page-load', checkPendingToast);
    };
  }, []);

  useEffect(() => {
    const handleToast = (e: CustomEvent<ToastData>) => {
      const toast = e.detail;
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 5000);
    };

    window.addEventListener('show-toast', handleToast as EventListener);
    return () => {
      window.removeEventListener('show-toast', handleToast as EventListener);
    };
  }, []);

  const alertClass = (type: ToastType) => {
    switch (type) {
      case 'success': return 'bg-success text-white border border-white/20';
      case 'error': return 'bg-error text-white border border-white/20';
      case 'warning': return 'bg-warning text-white border border-white/20';
      case 'info': return 'bg-info text-white border border-white/20';
    }
  };

  const Icon = ({ type }: { type: ToastType }) => {
    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast toast-end toast-bottom z-50">
      {toasts.map((toast) => (
        <div key={toast.id} className={`alert ${alertClass(toast.type)} shadow-lg`}>
          <Icon type={toast.type} />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
