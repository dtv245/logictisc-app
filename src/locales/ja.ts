/**
 * Japanese dictionary — single source for the `ja` locale.
 *
 * Key paths mirror the English catalogue; missing keys fall back to `en`.
 */

const shared = {
  asyncState: {
    loading: "コンテンツを読み込み中",
    emptyTitle: "データがありません",
    emptyDescription: "表示する内容はまだありません。",
  },
  queryError: {
    title: "コンテンツを読み込めません",
    description: "このコンテンツの読み込み中に問題が発生しました。",
  },
  configError: {
    title: "設定が必要です",
    description:
      "実行時設定が不完全または無効なため、アプリケーションを起動できません。",
  },
  forbidden: {
    title: "アクセスが拒否されました",
    description: "このコンテンツを表示する権限がありません。",
  },
  notFound: {
    title: "ページが見つかりません",
    description: "ページが移動したか、存在しなくなった可能性があります。",
  },
  actions: {
    retry: "再試行",
    goHome: "ホームへ戻る",
    confirm: "確認",
    cancel: "キャンセル",
  },
  confirm: {
    pendingAnnouncement: "処理を実行中です。",
  },
} as const;

export const jaMessages = {
  ...shared,
  bootstrap: {
    loadingConfig: "アプリケーション設定を読み込み中",
    probingHealth: "API の可用性を確認中",
    unreachable: {
      title: "API に接続できません",
      description:
        "アプリケーションは API に接続できませんでした。サービスを確認して再試行してください。",
    },
    corsBlocked: {
      title: "ブラウザからのアクセスがブロックされています",
      description:
        "API には到達できますが、CORS ポリシーがこのアプリのオリジンを許可していません。",
    },
    unhealthy: {
      title: "API は準備ができていません",
      description:
        "API は応答しましたが、正常なステータスを報告していません。",
    },
    databaseDisabled: {
      title: "業務機能は利用できません",
      description:
        "API はデータベースなしで実行されているため、業務ナビゲーションはロックされたままです。",
    },
    requestId: {
      label: "リクエスト ID",
      copy: "リクエスト ID をコピー",
      copied: "リクエスト ID をコピーしました",
    },
    httpStatus: "HTTP ステータス: {{status}}",
  },
  diagnostics: {
    title: "システム診断",
    description:
      "公開可能な、機密情報を含まないランタイムおよび API 可用性のメタデータ。",
    fields: {
      environment: "環境",
      application: "API アプリケーション",
      profiles: "有効なプロファイル",
      status: "API ステータス",
      database: "データベース",
      requestId: "リクエスト ID",
    },
  },
  common: {
    logout: "サインアウト",
    changeTenant: "会社を変更",
    goDashboard: "ダッシュボードへ戻る",
    select: "選択",
    undo: "元に戻す",
  },
  auth: {
    introEyebrow: "オペレーションをもっとスムーズに",
    introTitle: "すべての出荷を、ひとつの場所で。",
    introDescription:
      "チーム、車両、顧客をひとつの明確で高速なオペレーションワークスペースでつなぎます。",
    systemHealthy: "すべてのシステムは正常に稼働しています",
    welcome: "おかえりなさい",
    title: "アカウントにサインイン",
    description: "続行するにはサインインしてください。",
    username: "勤務用メールアドレスまたはユーザー名",
    usernamePlaceholder: "you@company.com",
    usernameRequired: "メールアドレスまたはユーザー名を入力してください。",
    password: "パスワード",
    passwordPlaceholder: "8 文字以上",
    passwordRequired: "パスワードを入力してください。",
    forgotPassword: "パスワードをお忘れですか？",
    remember: "この端末でサインイン状態を保持する",
    signIn: "サインイン",
    continueWith: "または次で続行",
    oidcSignIn: "Identity Server/Lark でサインイン",
    protectedBy: "Authorization Code + PKCE で保護",
    demoReady: "開発用アカウントを事前入力しました",
    avatarAlt: "アニメーション シロクマ",
    copyright: "© 2026 Logicstic",
    support: "システムサポート",
    callbackLoading: "サインイン セッションを確認中...",
    callbackError: "サインインを完了できませんでした",
  },
} as const;
