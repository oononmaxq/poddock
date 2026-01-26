import { useState, useEffect } from 'preact/hooks';
import { useI18n } from '../../hooks/useI18n';
import { Loading } from '../../components/Loading';
import { PlanGate } from './PlanGate';

interface MonthlyPlay {
  year_month: string;
  play_count: number;
}

interface OverviewData {
  podcast_id: string;
  period: { start: string; end: string };
  monthly_plays: MonthlyPlay[];
  total_plays: number;
  current_month_plays: number;
}

interface EpisodePlay {
  episode_id: string;
  title: string;
  play_count: number;
  percentage: number;
}

interface EpisodesData {
  podcast_id: string;
  period: string;
  episodes: EpisodePlay[];
  total_plays: number;
}

interface CountryPlay {
  country: string;
  play_count: number;
  percentage: number;
}

interface CountriesData {
  podcast_id: string;
  period: string;
  countries: CountryPlay[];
  total_plays: number;
}

interface DailyPlay {
  date: string;
  play_count: number;
}

interface DailyData {
  podcast_id: string;
  period: { start: string; end: string };
  daily_plays: DailyPlay[];
}

interface AnalyticsDashboardProps {
  podcastId: string;
}

type Period = '7d' | '30d' | '90d';

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  JP: '日本',
  US: 'United States',
  CA: 'Canada',
  GB: 'United Kingdom',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  KR: '韓国',
  CN: '中国',
  TW: '台湾',
  OTHER: 'その他',
  UNKNOWN: '不明',
};

export function AnalyticsDashboard({ podcastId }: AnalyticsDashboardProps) {
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>('30d');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [episodesData, setEpisodesData] = useState<EpisodesData | null>(null);
  const [countriesData, setCountriesData] = useState<CountriesData | null>(null);
  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsUpgrade, setNeedsUpgrade] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

        const [overviewRes, episodesRes, countriesRes, dailyRes] = await Promise.all([
          fetch(`/api/podcasts/${podcastId}/analytics/overview?months=6`, { credentials: 'include' }),
          fetch(`/api/podcasts/${podcastId}/analytics/episodes?period=${period}&limit=10`, { credentials: 'include' }),
          fetch(`/api/podcasts/${podcastId}/analytics/countries?period=${period}&limit=10`, { credentials: 'include' }),
          fetch(`/api/podcasts/${podcastId}/analytics/daily?days=${days}`, { credentials: 'include' }),
        ]);

        // Check if user needs to upgrade (403 means plan restriction)
        if (overviewRes.status === 403) {
          setNeedsUpgrade(true);
          setLoading(false);
          return;
        }

        if (!overviewRes.ok || !episodesRes.ok || !countriesRes.ok || !dailyRes.ok) {
          throw new Error('Failed to fetch analytics');
        }

        const [overviewData, episodesData, countriesData, dailyData] = await Promise.all([
          overviewRes.json(),
          episodesRes.json(),
          countriesRes.json(),
          dailyRes.json(),
        ]);

        setOverview(overviewData);
        setEpisodesData(episodesData);
        setCountriesData(countriesData);
        setDailyData(dailyData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [podcastId, period]);

  if (loading) return <Loading />;
  if (needsUpgrade) return <PlanGate />;
  if (error) return <div className="alert alert-error">{error}</div>;

  const maxDailyPlay = dailyData?.daily_plays.reduce((max, d) => Math.max(max, d.play_count), 0) || 0;
  const maxMonthlyPlay = overview?.monthly_plays.reduce((max, m) => Math.max(max, m.play_count), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex justify-end">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${period === '7d' ? 'tab-active' : ''}`}
            onClick={() => setPeriod('7d')}
          >
            {t('analytics.period.7d')}
          </button>
          <button
            className={`tab ${period === '30d' ? 'tab-active' : ''}`}
            onClick={() => setPeriod('30d')}
          >
            {t('analytics.period.30d')}
          </button>
          <button
            className={`tab ${period === '90d' ? 'tab-active' : ''}`}
            onClick={() => setPeriod('90d')}
          >
            {t('analytics.period.90d')}
          </button>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-sm text-base-content/70">{t('analytics.overview.totalPlays')}</div>
            <div className="text-3xl font-bold">{overview?.total_plays.toLocaleString() || 0}</div>
          </div>
        </div>
        <div className="card bg-base-200">
          <div className="card-body">
            <div className="text-sm text-base-content/70">{t('analytics.overview.currentMonth')}</div>
            <div className="text-3xl font-bold">{overview?.current_month_plays.toLocaleString() || 0}</div>
          </div>
        </div>
      </div>

      {/* Monthly Trend Bar Chart */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">{t('analytics.overview.monthlyTrend')}</h3>
          {overview && overview.monthly_plays.length > 0 ? (
            <div className="flex items-end gap-2 h-40 mt-4">
              {overview.monthly_plays.map((m) => {
                const height = maxMonthlyPlay > 0 ? (m.play_count / maxMonthlyPlay) * 100 : 0;
                const month = m.year_month.split('-')[1];
                return (
                  <div key={m.year_month} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary rounded-t transition-all"
                      style={{ height: `${Math.max(height, 2)}%` }}
                      title={`${m.play_count.toLocaleString()} ${t('analytics.plays')}`}
                    />
                    <div className="text-xs text-base-content/70 mt-2">{month}月</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-base-content/50 py-8">{t('analytics.noData')}</div>
          )}
        </div>
      </div>

      {/* Daily Trend Line Chart (simplified as bar) */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">{t('analytics.daily.title')}</h3>
          {dailyData && dailyData.daily_plays.length > 0 ? (
            <div className="flex items-end gap-px h-32 mt-4 overflow-hidden">
              {dailyData.daily_plays.map((d) => {
                const height = maxDailyPlay > 0 ? (d.play_count / maxDailyPlay) * 100 : 0;
                return (
                  <div
                    key={d.date}
                    className="flex-1 bg-primary/80 min-w-[2px] transition-all hover:bg-primary"
                    style={{ height: `${Math.max(height, 1)}%` }}
                    title={`${d.date}: ${d.play_count.toLocaleString()} ${t('analytics.plays')}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center text-base-content/50 py-8">{t('analytics.noData')}</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Episode Rankings */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">{t('analytics.episodes.title')}</h3>
            {episodesData && episodesData.episodes.length > 0 ? (
              <div className="space-y-3 mt-2">
                {episodesData.episodes.map((ep, index) => (
                  <div key={ep.episode_id} className="flex items-center gap-3">
                    <div className="text-sm text-base-content/50 w-6 text-right">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{ep.title}</div>
                      <div className="w-full bg-base-300 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${ep.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-medium w-16 text-right">
                      {ep.play_count.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-base-content/50 py-8">{t('analytics.noData')}</div>
            )}
          </div>
        </div>

        {/* Country Distribution */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">{t('analytics.countries.title')}</h3>
            {countriesData && countriesData.countries.length > 0 ? (
              <div className="space-y-3 mt-2">
                {countriesData.countries.map((country) => (
                  <div key={country.country} className="flex items-center gap-3">
                    <div className="w-8 text-lg">
                      {country.country === 'JP' ? '🇯🇵' :
                       country.country === 'US' ? '🇺🇸' :
                       country.country === 'CA' ? '🇨🇦' :
                       country.country === 'GB' ? '🇬🇧' :
                       country.country === 'AU' ? '🇦🇺' :
                       country.country === 'DE' ? '🇩🇪' :
                       country.country === 'FR' ? '🇫🇷' :
                       country.country === 'KR' ? '🇰🇷' :
                       country.country === 'CN' ? '🇨🇳' :
                       country.country === 'TW' ? '🇹🇼' :
                       '🌐'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        {COUNTRY_NAMES[country.country] || country.country}
                      </div>
                      <div className="w-full bg-base-300 rounded-full h-2 mt-1">
                        <div
                          className="bg-secondary h-2 rounded-full transition-all"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-sm text-base-content/70 w-12 text-right">
                      {country.percentage}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-base-content/50 py-8">{t('analytics.noData')}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
