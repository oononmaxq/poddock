import type { ComponentChildren } from 'preact';
import { useI18n } from '../hooks/useI18n';

interface BadgeProps {
  type: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  children: ComponentChildren;
}

const badgeClasses = {
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  neutral: 'badge-neutral',
};

export function Badge({ type, children }: BadgeProps) {
  return <span className={`badge ${badgeClasses[type]}`}>{children}</span>;
}

export function VisibilityBadge({ visibility }: { visibility: 'public' | 'private' }) {
  const { t } = useI18n();
  return (
    <Badge type={visibility === 'public' ? 'success' : 'warning'}>
      {visibility === 'public' ? t('badge.public') : t('badge.private')}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: 'draft' | 'published' }) {
  const { t } = useI18n();
  return (
    <Badge type={status === 'published' ? 'success' : 'warning'}>
      {status === 'published' ? t('badge.published') : t('badge.draft')}
    </Badge>
  );
}

export function DistributionBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const config: Record<string, { type: BadgeProps['type']; labelKey: 'badge.notSubmitted' | 'badge.submitted' | 'badge.live' | 'badge.needsAttention' }> = {
    not_submitted: { type: 'neutral', labelKey: 'badge.notSubmitted' },
    submitted: { type: 'info', labelKey: 'badge.submitted' },
    live: { type: 'success', labelKey: 'badge.live' },
    needs_attention: { type: 'error', labelKey: 'badge.needsAttention' },
  };

  const item = config[status];
  if (item) {
    return <Badge type={item.type}>{t(item.labelKey)}</Badge>;
  }
  return <Badge type="neutral">{status}</Badge>;
}
