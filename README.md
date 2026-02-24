# TimeTree → Google Calendar Sync

GitHub Actions の cron で TimeTree のカレンダーイベントを Google Calendar に自動同期します。

## 仕組み

1. [TimeTree-Exporter](https://github.com/eoleedi/TimeTree-Exporter) CLI で TimeTree からイベントを ICS ファイルとしてエクスポート
2. TypeScript スクリプトが ICS をパースし、Google Calendar API で差分同期

差分管理には Google Calendar の Extended Properties を使用。外部 DB やファイル不要でステートレスに動作します。

## セットアップ

### 1. Google Cloud の準備

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Google Calendar API を有効化
3. サービスアカウントを作成し、JSON キーをダウンロード
4. 同期先の Google Calendar の設定画面で、サービスアカウントのメールアドレス (`xxx@xxx.iam.gserviceaccount.com`) を「変更および共有の管理権限」で追加

### 2. TimeTree Calendar Code の確認

```bash
pip install timetree-exporter
timetree-exporter
```

メールアドレスとパスワードを入力すると、カレンダー一覧と各カレンダーの code が表示されます。

### 3. GitHub Secrets の設定

リポジトリの Settings → Secrets and variables → Actions で以下を設定:

| Secret 名 | 内容 |
|---|---|
| `TIMETREE_EMAIL` | TimeTree ログインメールアドレス |
| `TIMETREE_PASSWORD` | TimeTree ログインパスワード |
| `TIMETREE_CALENDAR_CODE` | 同期元の TimeTree Calendar Code |
| `GOOGLE_CALENDAR_ID` | 同期先の Google Calendar ID (例: `xxx@group.calendar.google.com`) |
| `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64` | サービスアカウント JSON キーの base64 エンコード値 |

JSON キーの base64 エンコード:

```bash
base64 -i path/to/service-account-key.json | pbcopy
```

### 4. 動作確認

Actions タブから `Sync TimeTree to Google Calendar` ワークフローを手動実行 (Run workflow) して確認できます。

## ローカル実行

```bash
npm install

export TIMETREE_EMAIL=your@email.com
export TIMETREE_PASSWORD=yourpassword
export TIMETREE_CALENDAR_CODE=your_calendar_code
export GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
export GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

npm run sync
```

## 同期間隔

デフォルトは 15 分間隔。`.github/workflows/sync.yml` の cron 式を変更して調整できます。
