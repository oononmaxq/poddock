import { useI18n } from '../../../hooks/useI18n';
import { THEME_COLORS } from '../../../../../domain/constants/podcast';

interface ThemeSettingsProps {
  themeColor: string;
  themeMode: 'light' | 'dark';
  onThemeColorChange: (color: string) => void;
  onThemeModeChange: (mode: 'light' | 'dark') => void;
}

export function ThemeSettings({
  themeColor,
  themeMode,
  onThemeColorChange,
  onThemeModeChange,
}: ThemeSettingsProps) {
  const { t } = useI18n();

  return (
    <>
      <div className="divider">{t('podcast.form.websiteTheme')}</div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('podcast.form.themeColor')}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {THEME_COLORS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`w-10 h-10 rounded-full border-2 transition-all ${
                themeColor === color.value
                  ? 'border-base-content scale-110'
                  : 'border-transparent'
              }`}
              style={{ backgroundColor: color.value }}
              onClick={() => onThemeColorChange(color.value)}
              title={color.label}
            />
          ))}
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">{t('podcast.form.themeMode')}</span>
        </label>
        <div className="flex gap-4">
          <label className="label cursor-pointer gap-2">
            <input
              type="radio"
              name="theme_mode"
              className="radio"
              checked={themeMode === 'light'}
              onChange={() => onThemeModeChange('light')}
            />
            <span className="label-text">{t('settings.theme.light')}</span>
          </label>
          <label className="label cursor-pointer gap-2">
            <input
              type="radio"
              name="theme_mode"
              className="radio"
              checked={themeMode === 'dark'}
              onChange={() => onThemeModeChange('dark')}
            />
            <span className="label-text">{t('settings.theme.dark')}</span>
          </label>
        </div>
      </div>
    </>
  );
}
