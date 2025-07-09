# 面談管理システム

社内および取引先向けの面談管理システムです。

## 機能

- **ダッシュボード**: 面談統計と曜日・時間帯別の傾向分析
- **面談一覧**: 検索・フィルタリング機能付きの面談データ表示
- **分析**: 判定結果、年齢分布、性別分布などの詳細分析

## Google スプレッドシートとの連携設定

### 1. Google Cloud Console でAPIキーを取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成または選択
3. 「APIとサービス」→「ライブラリ」から「Google Sheets API」を有効化
4. 「認証情報」→「認証情報を作成」→「APIキー」を作成
5. APIキーに制限を設定（推奨）:
   - HTTPリファラー制限: `https://YOUR_USERNAME.github.io/*`
   - API制限: Google Sheets API のみ

### 2. script.js の設定を更新

```javascript
const CONFIG = {
    apiKey: 'YOUR_API_KEY_HERE', // ← 取得したAPIキーを入力
    useGoogleSheets: true
};
```

### 3. デプロイ

1. GitHubリポジトリにコードをプッシュ
2. Settings → Pages → Source を "Deploy from a branch" に設定
3. Branch を "main" に設定して保存

## スプレッドシートの形式

以下の列順でデータを入力してください：

1. No.
2. 識別子
3. 面談予約日
4. 面談日
5. 面談出席（○/×）
6. 判定結果（有効/無効/空欄）
7. 却下理由
8. 判定日
9. 年齢
10. 性別

## ファイル構成
- `index.html` - メインページ
- `styles.css` - スタイルシート
- `script.js` - 機能実装
- `data.csv` - サンプルデータ（オフライン時のフォールバック）
- `google-sheets-setup.md` - 詳細な設定手順