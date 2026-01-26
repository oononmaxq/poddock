import { useI18n } from '../../hooks/useI18n';

export function PlanGate() {
  const { t } = useI18n();

  return (
    <div className="card bg-base-200">
      <div className="card-body items-center text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-16 h-16 text-base-content/30 mb-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
        <h2 className="card-title">{t('analytics.upgradeRequired')}</h2>
        <p className="text-base-content/70">{t('analytics.upgradeDescription')}</p>
        <div className="card-actions mt-4">
          <a href="/settings" className="btn btn-primary">
            {t('analytics.upgradePlan')}
          </a>
        </div>
      </div>
    </div>
  );
}
