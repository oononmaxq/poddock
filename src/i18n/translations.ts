export const languages = {
  ja: "日本語",
  en: "English",
};

export const defaultLang = "ja";

export const translations = {
  ja: {
    // Common
    "common.copied": "コピーしました",
    "common.saved": "保存しました",
    "common.deleted": "削除しました",
    "common.error": "エラーが発生しました",

    // Layout
    "nav.dashboard": "番組一覧",
    "nav.analytics": "アナリティクス",
    "nav.distributionHelp": "配信ヘルプ",
    "nav.settings": "設定",
    "nav.logout": "ログアウト",

    // Dashboard / Podcast List
    "dashboard.title": "番組一覧",
    "dashboard.createNew": "新規作成",
    "dashboard.empty.title": "番組がありません",
    "dashboard.empty.description":
      "最初の番組を作成して、ポッドキャストを始めましょう",
    "dashboard.empty.button": "番組を作成",
    "dashboard.card.published": "公開",
    "dashboard.card.draft": "下書き",
    "dashboard.card.episodes": "話",
    "dashboard.card.updated": "更新",

    // Settings
    "settings.title": "設定",
    "settings.language": "言語",
    "settings.language.description": "表示言語を選択してください",
    "settings.theme": "テーマ",
    "settings.theme.description": "表示テーマを選択してください",
    "settings.theme.light": "ライト",
    "settings.theme.dark": "ダーク",
    "settings.theme.changed": "テーマを変更しました",
    "settings.saved": "設定を保存しました",

    // Podcast Detail
    "podcast.detail.title": "番組詳細",
    "podcast.detail.edit": "編集",
    "podcast.tabs.overview": "概要",
    "podcast.tabs.episodes": "エピソード",
    "podcast.tabs.distribution": "配信",
    "podcast.tabs.settings": "設定",

    // Podcast Overview
    "podcast.overview.rssUrl": "RSS URL",
    "podcast.overview.publicRss": "公開RSS",
    "podcast.overview.publicRssDescription":
      "Spotifyなどのプラットフォームに登録するURL",
    "podcast.overview.privateRss": "非公開RSS",
    "podcast.overview.privateRssDescription":
      "限定配信用。このURLを知っている人のみアクセス可能",
    "podcast.overview.podcastInfo": "番組情報",
    "podcast.overview.description": "説明",
    "podcast.overview.language": "言語",
    "podcast.overview.category": "カテゴリ",
    "podcast.overview.author": "著者",
    "podcast.overview.publicWebsite": "公開ウェブサイト",
    "podcast.overview.openWebsite": "ウェブサイトを開く",

    // Badges
    "badge.public": "公開",
    "badge.private": "非公開",
    "badge.published": "公開中",
    "badge.scheduled": "予約中",
    "badge.draft": "下書き",
    "badge.notSubmitted": "未提出",
    "badge.submitted": "審査中",
    "badge.live": "配信中",
    "badge.needsAttention": "要確認",

    // Episode List
    "episode.list.title": "エピソード一覧",
    "episode.list.add": "エピソード追加",
    "episode.list.empty": "エピソードがありません",
    "episode.list.createFirst": "最初のエピソードを作成",
    "episode.unpublished": "未公開",
    "episode.togglePublish": "公開",
    "episode.toggleDraft": "下書き",
    "episode.scheduledSuffix": "に公開予定",

    // Public Podcast Website
    "public.episodes": "エピソード",
    "public.subscribe": "購読する",
    "public.listenOn": "で聴く",
    "public.copyRss": "RSSをコピー",
    "public.showNotes": "ショーノート",
    "public.backToEpisodes": "エピソード一覧に戻る",
    "public.noEpisodes": "エピソードはまだありません",
    "public.subscribeTitle": "購読する",
    "public.subscribeDescription": "お好みのアプリで購読してください",
    "public.otherApps": "その他のアプリ",

    // Episode Create
    "episode.create.title": "新規エピソード作成",
    "episode.form.title": "タイトル",
    "episode.form.description": "説明（ショーノート）",
    "episode.form.audioFile": "音声ファイル",
    "episode.form.audioUpload": "クリックまたはドラッグ&ドロップ",
    "episode.form.audioFormat": "MP3, M4A, WAV（最大500MB）",
    "episode.form.uploading": "アップロード中...",
    "episode.form.changeFile": "ファイルを変更",
    "episode.form.saveAsDraft": "下書き保存",
    "episode.form.cancel": "キャンセル",
    "episode.form.audioRequired": "音声ファイルが必要です",

    // Episode Edit
    "episode.edit.title": "エピソード編集",
    "episode.form.noAudio": "音声ファイルなし",
    "episode.form.publishSettings": "公開設定",
    "episode.form.status": "ステータス",
    "episode.form.draft": "下書き",
    "episode.form.scheduled": "予約公開",
    "episode.form.published": "公開",
    "episode.form.publishDate": "公開日時",
    "episode.form.publishDateRequired": "公開・予約時に必須",
    "episode.scheduledDateMustBeFuture": "予約公開日時は未来の日時を指定してください",
    "episode.form.save": "保存",
    "episode.form.back": "戻る",
    "episode.dangerZone": "危険な操作",
    "episode.deleteWarning": "エピソードを削除すると元に戻せません。",
    "episode.delete": "エピソードを削除",
    "episode.deleteConfirm":
      "このエピソードを削除しますか？この操作は取り消せません。",
    "episode.publishDateRequiredError": "公開日時を入力してください",
    "episode.deleteFailed": "削除に失敗しました",
    "episode.updateFailed": "更新に失敗しました",

    // Distribution
    "distribution.title": "配信先ステータス",
    "distribution.submitPage": "提出ページ",

    // Podcast Settings
    "podcast.settings.tokenTitle": "非公開RSSトークン",
    "podcast.settings.tokenDescription":
      "トークンを再発行すると、以前のURLは無効になります。",
    "podcast.settings.tokenRotate": "トークンを再発行",
    "podcast.settings.tokenRotateConfirm":
      "本当にトークンを再発行しますか？以前のURLは無効になります。",
    "podcast.settings.tokenRotateSuccess": "トークンを再発行しました",
    "podcast.settings.tokenRotateError": "トークンの再発行に失敗しました",
    "podcast.settings.dangerZone": "危険な操作",
    "podcast.settings.deleteDescription":
      "番組を削除すると、すべてのエピソードも削除されます。この操作は取り消せません。",
    "podcast.settings.delete": "番組を削除",
    "podcast.settings.deleteConfirm":
      "本当に削除しますか？この操作は取り消せません。",
    "podcast.settings.deleteError": "削除に失敗しました",

    // Podcast Form
    "podcast.create.title": "新規番組作成",
    "podcast.edit.title": "番組編集",
    "podcast.form.title": "タイトル",
    "podcast.form.description": "説明",
    "podcast.form.coverImage": "カバーアート",
    "podcast.form.coverImage.description":
      "Apple Podcasts, Spotify, Amazon Music, YouTube Music に必要",
    "podcast.form.coverImage.upload": "クリックまたはドラッグ&ドロップ",
    "podcast.form.coverImage.format": "JPG, PNG (1400x1400〜3000x3000px 推奨)",
    "podcast.form.coverImage.uploaded": "アップロード完了",
    "podcast.form.coverImage.change": "画像を変更",
    "podcast.form.language": "言語",
    "podcast.form.category": "カテゴリ",
    "podcast.form.authorName": "著者名",
    "podcast.form.contactEmail": "連絡先メール",
    "podcast.form.contactEmail.description": "Amazon Music配信に必要",
    "podcast.form.explicit": "露骨なコンテンツを含む",
    "podcast.form.podcastType": "番組タイプ",
    "podcast.form.podcastType.episodic": "エピソード型（新しい順）",
    "podcast.form.podcastType.serial": "シリアル型（古い順）",
    "podcast.form.visibility": "公開設定",
    "podcast.form.visibility.private": "非公開",
    "podcast.form.visibility.public": "公開",
    "podcast.form.save": "保存",
    "podcast.form.create": "作成",
    "podcast.form.cancel": "キャンセル",
    "podcast.form.required": "必須",
    "podcast.form.selectCategory": "選択してください",
    "podcast.form.websiteTheme": "公開ページのテーマ",
    "podcast.form.themeColor": "テーマカラー",
    "podcast.form.themeMode": "テーマモード",

    // Login
    "login.title": "ログイン",
    "login.subtitle": "メールアドレスを入力してください",
    "login.email": "メールアドレス",
    "login.password": "パスワード",
    "login.submit": "ログイン",
    "login.sendLink": "ログインリンクを送信",
    "login.magicLinkHint":
      "パスワード不要。メールでログインリンクをお送りします。",
    "login.error.network": "ネットワークエラーが発生しました",
    "login.error.failed": "ログインに失敗しました",
    "login.checkEmail.title": "メールを確認してください",
    "login.checkEmail.description":
      "ログインリンクを送信しました。メールを確認してリンクをクリックしてください。",
    "login.checkEmail.spam":
      "届かない場合は迷惑メールフォルダをご確認ください。",
    "login.checkEmail.tryAgain": "別のメールアドレスで試す",
    "login.terms": "利用規約",
    "login.legal": "特定商取引法",
    "login.contact": "お問い合わせ",

    // Analytics
    "podcast.tabs.analytics": "アナリティクス",
    "analytics.upgradeRequired": "アップグレードが必要です",
    "analytics.upgradeDescription":
      "アナリティクス機能はStarterプラン以上でご利用いただけます。",
    "analytics.upgradePlan": "プランをアップグレード",
    "analytics.overview.title": "再生数概要",
    "analytics.overview.totalPlays": "合計再生数",
    "analytics.overview.currentMonth": "今月の再生数",
    "analytics.overview.monthlyTrend": "月別推移",
    "analytics.episodes.title": "エピソード別再生数",
    "analytics.countries.title": "国別分布",
    "analytics.daily.title": "日別推移",
    "analytics.period.7d": "過去7日",
    "analytics.period.30d": "過去30日",
    "analytics.period.90d": "過去90日",
    "analytics.period.all": "全期間",
    "analytics.noData": "データがありません",
    "analytics.plays": "再生",
    "analytics.platforms.title": "プラットフォーム別",
    "analytics.selectPodcast": "番組を選択",
    "analytics.selectPodcast.description": "アナリティクスを表示する番組を選択してください",
    "analytics.selectEpisode": "エピソードを選択",
    "analytics.viewMode.podcast": "番組別",
    "analytics.viewMode.episode": "エピソード別",
    "analytics.noEpisodes": "エピソードがありません",
  },
  en: {
    // Common
    "common.copied": "Copied to clipboard",
    "common.saved": "Saved",
    "common.deleted": "Deleted",
    "common.error": "An error occurred",

    // Layout
    "nav.dashboard": "Podcasts",
    "nav.analytics": "Analytics",
    "nav.distributionHelp": "Distribution Help",
    "nav.settings": "Settings",
    "nav.logout": "Logout",

    // Dashboard / Podcast List
    "dashboard.title": "Podcasts",
    "dashboard.createNew": "Create New",
    "dashboard.empty.title": "No podcasts yet",
    "dashboard.empty.description": "Create your first podcast to get started",
    "dashboard.empty.button": "Create Podcast",
    "dashboard.card.published": "Published",
    "dashboard.card.draft": "Draft",
    "dashboard.card.episodes": " ep",
    "dashboard.card.updated": "Updated",

    // Settings
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.language.description": "Select your preferred language",
    "settings.theme": "Theme",
    "settings.theme.description": "Select your preferred theme",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.theme.changed": "Theme changed",
    "settings.saved": "Settings saved",

    // Podcast Detail
    "podcast.detail.title": "Podcast Detail",
    "podcast.detail.edit": "Edit",
    "podcast.tabs.overview": "Overview",
    "podcast.tabs.episodes": "Episodes",
    "podcast.tabs.distribution": "Distribution",
    "podcast.tabs.settings": "Settings",

    // Podcast Overview
    "podcast.overview.rssUrl": "RSS URL",
    "podcast.overview.publicRss": "Public RSS",
    "podcast.overview.publicRssDescription":
      "Register this URL with platforms like Spotify",
    "podcast.overview.privateRss": "Private RSS",
    "podcast.overview.privateRssDescription":
      "For private distribution. Only accessible with this URL",
    "podcast.overview.podcastInfo": "Podcast Info",
    "podcast.overview.description": "Description",
    "podcast.overview.language": "Language",
    "podcast.overview.category": "Category",
    "podcast.overview.author": "Author",
    "podcast.overview.publicWebsite": "Public Website",
    "podcast.overview.openWebsite": "Open website",

    // Badges
    "badge.public": "Public",
    "badge.private": "Private",
    "badge.published": "Published",
    "badge.scheduled": "Scheduled",
    "badge.draft": "Draft",
    "badge.notSubmitted": "Not Submitted",
    "badge.submitted": "In Review",
    "badge.live": "Live",
    "badge.needsAttention": "Needs Attention",

    // Episode List
    "episode.list.title": "Episodes",
    "episode.list.add": "Add Episode",
    "episode.list.empty": "No episodes yet",
    "episode.list.createFirst": "Create your first episode",
    "episode.unpublished": "Unpublished",
    "episode.togglePublish": "Published",
    "episode.toggleDraft": "Draft",
    "episode.scheduledSuffix": "scheduled",

    // Public Podcast Website
    "public.episodes": "Episodes",
    "public.subscribe": "Subscribe",
    "public.listenOn": "Listen on",
    "public.copyRss": "Copy RSS",
    "public.showNotes": "Show Notes",
    "public.backToEpisodes": "Back to Episodes",
    "public.noEpisodes": "No episodes yet",
    "public.subscribeTitle": "Subscribe",
    "public.subscribeDescription": "Subscribe with your favorite app",
    "public.otherApps": "Other Apps",

    // Episode Create
    "episode.create.title": "Create New Episode",
    "episode.form.title": "Title",
    "episode.form.description": "Description (Show Notes)",
    "episode.form.audioFile": "Audio File",
    "episode.form.audioUpload": "Click or drag & drop audio file",
    "episode.form.audioFormat": "MP3, M4A, WAV (max 500MB)",
    "episode.form.uploading": "Uploading...",
    "episode.form.changeFile": "Change file",
    "episode.form.saveAsDraft": "Save as Draft",
    "episode.form.cancel": "Cancel",
    "episode.form.audioRequired": "Audio file required",

    // Episode Edit
    "episode.edit.title": "Edit Episode",
    "episode.form.noAudio": "No audio file",
    "episode.form.publishSettings": "Publish Settings",
    "episode.form.status": "Status",
    "episode.form.draft": "Draft",
    "episode.form.scheduled": "Scheduled",
    "episode.form.published": "Published",
    "episode.form.publishDate": "Publish Date",
    "episode.form.publishDateRequired": "Required for publish/schedule",
    "episode.scheduledDateMustBeFuture": "Scheduled date must be in the future",
    "episode.form.save": "Save",
    "episode.form.back": "Back",
    "episode.dangerZone": "Danger Zone",
    "episode.deleteWarning": "Deleting an episode cannot be undone.",
    "episode.delete": "Delete Episode",
    "episode.deleteConfirm": "Delete this episode? This cannot be undone.",
    "episode.publishDateRequiredError": "Published date is required",
    "episode.deleteFailed": "Delete failed",
    "episode.updateFailed": "Update failed",

    // Distribution
    "distribution.title": "Distribution Status",
    "distribution.submitPage": "Submit Page",

    // Podcast Settings
    "podcast.settings.tokenTitle": "Private RSS Token",
    "podcast.settings.tokenDescription":
      "Regenerating the token will invalidate the previous URL.",
    "podcast.settings.tokenRotate": "Regenerate Token",
    "podcast.settings.tokenRotateConfirm":
      "Are you sure you want to regenerate the token? The previous URL will become invalid.",
    "podcast.settings.tokenRotateSuccess": "Token regenerated successfully",
    "podcast.settings.tokenRotateError": "Failed to regenerate token",
    "podcast.settings.dangerZone": "Danger Zone",
    "podcast.settings.deleteDescription":
      "Deleting the podcast will also delete all episodes. This action cannot be undone.",
    "podcast.settings.delete": "Delete Podcast",
    "podcast.settings.deleteConfirm":
      "Are you sure you want to delete? This action cannot be undone.",
    "podcast.settings.deleteError": "Failed to delete",

    // Podcast Form
    "podcast.create.title": "Create New Podcast",
    "podcast.edit.title": "Edit Podcast",
    "podcast.form.title": "Title",
    "podcast.form.description": "Description",
    "podcast.form.coverImage": "Cover Image",
    "podcast.form.coverImage.description":
      "Required for Apple Podcasts, Spotify, Amazon Music, YouTube Music",
    "podcast.form.coverImage.upload": "Click or drag & drop",
    "podcast.form.coverImage.format":
      "JPG, PNG (1400x1400-3000x3000px recommended)",
    "podcast.form.coverImage.uploaded": "Uploaded",
    "podcast.form.coverImage.change": "Change image",
    "podcast.form.language": "Language",
    "podcast.form.category": "Category",
    "podcast.form.authorName": "Author Name",
    "podcast.form.contactEmail": "Contact Email",
    "podcast.form.contactEmail.description": "Required for Amazon Music",
    "podcast.form.explicit": "Contains explicit content",
    "podcast.form.podcastType": "Podcast Type",
    "podcast.form.podcastType.episodic": "Episodic (newest first)",
    "podcast.form.podcastType.serial": "Serial (oldest first)",
    "podcast.form.visibility": "Visibility",
    "podcast.form.visibility.private": "Private",
    "podcast.form.visibility.public": "Public",
    "podcast.form.save": "Save",
    "podcast.form.create": "Create",
    "podcast.form.cancel": "Cancel",
    "podcast.form.required": "Required",
    "podcast.form.selectCategory": "Select...",
    "podcast.form.websiteTheme": "Public Website Theme",
    "podcast.form.themeColor": "Theme Color",
    "podcast.form.themeMode": "Theme Mode",

    // Login
    "login.title": "Login",
    "login.subtitle": "Enter your email address",
    "login.email": "Email",
    "login.password": "Password",
    "login.submit": "Login",
    "login.sendLink": "Send login link",
    "login.magicLinkHint": "No password needed. We'll send you a login link.",
    "login.error.network": "Network error occurred",
    "login.error.failed": "Login failed",
    "login.checkEmail.title": "Check your email",
    "login.checkEmail.description":
      "We sent you a login link. Check your email and click the link to log in.",
    "login.checkEmail.spam": "If you don't see it, check your spam folder.",
    "login.checkEmail.tryAgain": "Try a different email",
    "login.terms": "Terms of Service",
    "login.legal": "Legal",
    "login.contact": "Contact",

    // Analytics
    "podcast.tabs.analytics": "Analytics",
    "analytics.upgradeRequired": "Upgrade Required",
    "analytics.upgradeDescription":
      "Analytics is available on Starter plan and above.",
    "analytics.upgradePlan": "Upgrade Plan",
    "analytics.overview.title": "Play Overview",
    "analytics.overview.totalPlays": "Total Plays",
    "analytics.overview.currentMonth": "This Month",
    "analytics.overview.monthlyTrend": "Monthly Trend",
    "analytics.episodes.title": "Plays by Episode",
    "analytics.countries.title": "Country Distribution",
    "analytics.daily.title": "Daily Trend",
    "analytics.period.7d": "Last 7 days",
    "analytics.period.30d": "Last 30 days",
    "analytics.period.90d": "Last 90 days",
    "analytics.period.all": "All time",
    "analytics.noData": "No data available",
    "analytics.plays": "plays",
    "analytics.platforms.title": "Platform Distribution",
    "analytics.selectPodcast": "Select Podcast",
    "analytics.selectPodcast.description": "Select a podcast to view analytics",
    "analytics.selectEpisode": "Select Episode",
    "analytics.viewMode.podcast": "By Podcast",
    "analytics.viewMode.episode": "By Episode",
    "analytics.noEpisodes": "No episodes",
  },
} as const;

export type TranslationKey = keyof typeof translations.ja;

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split("/");
  if (lang in translations) return lang as keyof typeof translations;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof translations) {
  return function t(key: TranslationKey) {
    return translations[lang][key] || translations[defaultLang][key] || key;
  };
}
