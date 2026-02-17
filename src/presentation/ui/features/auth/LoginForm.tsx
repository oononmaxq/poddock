import { useState, useEffect } from "preact/hooks";
import {
  translations,
  languages,
  defaultLang,
} from "../../../../i18n/translations";

type Lang = keyof typeof translations;

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [lang, setLang] = useState<Lang>(defaultLang);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Lang | null;
    if (savedLang && savedLang in translations) {
      setLang(savedLang);
    }
  }, []);

  const t = (key: keyof typeof translations.ja) => {
    return translations[lang][key] || translations[defaultLang][key] || key;
  };

  const handleLangChange = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem("lang", newLang);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        const data = await response.json();
        setError(data.message || t("login.error.failed"));
      }
    } catch {
      setError(t("login.error.network"));
    } finally {
      setLoading(false);
    }
  };

  // Email sent - show confirmation
  if (sent) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="flex justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-16 h-16 text-primary"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            </div>
            <h1 className="card-title text-2xl font-bold justify-center mb-2">
              {t("login.checkEmail.title")}
            </h1>
            <p className="text-base-content/70 mb-4">
              {t("login.checkEmail.description")}
            </p>
            <p className="text-sm text-base-content/50 mb-6">
              <strong>{email}</strong>
            </p>
            <p className="text-sm text-base-content/50">
              {t("login.checkEmail.spam")}
            </p>
            <button
              className="btn btn-ghost mt-4"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
            >
              {t("login.checkEmail.tryAgain")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Language Switch */}
            <div className="flex justify-end mb-2">
              <div className="join">
                {(Object.keys(languages) as Lang[]).map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`join-item btn btn-xs ${lang === l ? "btn-active" : ""}`}
                    onClick={() => handleLangChange(l)}
                  >
                    {languages[l]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center mb-4">
              <img src="/header_logo.png" alt="PODDOCK" className="h-12" />
            </div>
            <p className="text-center text-base-content/70 mb-6">
              {t("login.subtitle")}
            </p>

            {error && (
              <div className="alert alert-error mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text">{t("login.email")}</span>
                </label>
                <input
                  type="email"
                  id="email"
                  className="input input-bordered w-full"
                  placeholder="you@example.com"
                  value={email}
                  onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  t("login.sendLink")
                )}
              </button>
            </form>

            <p className="text-center text-sm text-base-content/50 mt-4">
              {t("login.magicLinkHint")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 flex justify-center gap-4 text-sm text-base-content/50">
        <a href="/terms" className="link link-hover">
          {t("login.terms")}
        </a>
        <span>·</span>
        <a href="/legal" className="link link-hover">
          {t("login.legal")}
        </a>
        <span>·</span>
        <a href="/contact" className="link link-hover">
          {t("login.contact")}
        </a>
      </div>
    </div>
  );
}
