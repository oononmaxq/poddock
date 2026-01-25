import { useState, useEffect } from 'preact/hooks';
import { translations, languages, defaultLang } from '../../../../i18n/translations';

type Lang = keyof typeof translations;

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState<Lang>(defaultLang);

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem('access_token');
    if (token) {
      window.location.href = '/podcasts';
      return;
    }

    const savedLang = localStorage.getItem('lang') as Lang | null;
    if (savedLang && savedLang in translations) {
      setLang(savedLang);
    }
  }, []);

  const t = (key: keyof typeof translations.ja) => {
    return translations[lang][key] || translations[defaultLang][key] || key;
  };

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access_token);
        window.location.href = '/podcasts';
      } else {
        const data = await response.json();
        setError(data.message || t('login.error.failed'));
      }
    } catch {
      setError(t('login.error.network'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {/* Language Switch */}
          <div className="flex justify-end mb-2">
            <div className="join">
              {(Object.keys(languages) as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={`join-item btn btn-xs ${lang === l ? 'btn-active' : ''}`}
                  onClick={() => handleLangChange(l)}
                >
                  {languages[l]}
                </button>
              ))}
            </div>
          </div>

          <h1 className="card-title text-2xl font-bold justify-center mb-4">poddock</h1>
          <p className="text-center text-base-content/70 mb-6">{t('login.subtitle')}</p>

          {error && (
            <div className="alert alert-error mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label" htmlFor="email">
                <span className="label-text">{t('login.email')}</span>
              </label>
              <input
                type="email"
                id="email"
                className="input input-bordered w-full"
                placeholder="admin@example.com"
                value={email}
                onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="password">
                <span className="label-text">{t('login.password')}</span>
              </label>
              <input
                type="password"
                id="password"
                className="input input-bordered w-full"
                placeholder="........"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : t('login.submit')}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-base-content/70">
            {t('login.noAccount')}{' '}
            <a href="/signup" className="link link-primary">{t('login.signup')}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
