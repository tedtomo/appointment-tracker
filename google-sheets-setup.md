# Google Sheets API 設定手順

## 1. Google Cloud Console でプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）

## 2. Google Sheets API を有効化

1. 左メニューから「APIとサービス」→「ライブラリ」を選択
2. 「Google Sheets API」を検索
3. 「有効にする」をクリック

## 3. API キーを作成

1. 左メニューから「APIとサービス」→「認証情報」を選択
2. 「認証情報を作成」→「APIキー」を選択
3. 作成されたAPIキーをコピー

## 4. APIキーの制限（推奨）

1. 作成したAPIキーの編集画面を開く
2. 「アプリケーションの制限」で「HTTPリファラー」を選択
3. 以下のURLを追加：
   - `https://YOUR_USERNAME.github.io/*`
   - `http://localhost:*` （ローカルテスト用）
4. 「APIの制限」で「Google Sheets API」のみを選択

## 5. script.js の設定を更新

```javascript
const CONFIG = {
    spreadsheetId: '1rsUWkrkWiDbrCPXwmbFQ6BcQEvXtLbdBs-UWf2EPYzw',
    apiKey: 'YOUR_ACTUAL_API_KEY', // ← ここに取得したAPIキーを入力
    range: 'シート1!A:J',
    useGoogleSheets: true
};
```

## 6. スプレッドシートの共有設定

現在のスプレッドシートは「リンクを知っている全員」がアクセス可能な設定になっているので、追加の設定は不要です。

## 注意事項

- APIキーは公開リポジトリにプッシュしないよう注意してください
- 本番環境では、APIキーに適切な制限を設定することを推奨します
- 1日あたりの無料枠は十分な量がありますが、大量のアクセスがある場合は[使用量](https://console.cloud.google.com/apis/api/sheets.googleapis.com/metrics)を確認してください