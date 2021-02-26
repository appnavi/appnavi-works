# 導入パッケージ

## dependencies

### `async-passport-slack`

passportでSlack認証を使えるようにするパッケージ。最新のSign In With Slack V2に対応するため、`src/config/passport.js`で手を加えている。

### `compression`

ファイルを圧縮し、動作を高速化するパッケージ。

### `cookie-parser`

expressを使用するために必要なパッケージの一つ。

### `cookie-session`

認証情報などをCookieに保存できるようにするパッケージ。

### `dotenv`

.envファイルを読み込み、その内容を環境変数として使用できるようにするパッケージ

### `ejs`

htmlに似た記法のテンプレートエンジン

### `express`

Nodejsでサーバーアプリケーションを作成できるようになるパッケージ。

### `fs-extra`

Nodejs標準の`fs`パッケージの機能を拡充したパッケージ。

### `helmet`

セキュリティ対策のための複数のパッケージをまとめたパッケージ。

### `jsonwebtoken`

オブジェクトの暗号化を提供するパッケージ。

### `log4js`

ログ出力機能を提供するパッケージ。

### `mongoose`

MongoDBを操作するためのパッケージ。

### `multer`

Expressアプリケーションにファイルアップロード機能を提供するパッケージ。

### `node-sass-middleware`

指定フォルダ内のcssファイルにアクセスした際、scssファイルからcssファイルを自動で生成して提供するパッケージ

### `passport`

Expressアプリケーションに認証機能を提供するパッケージ

### `serve-index`

フォルダ内ファイル一覧機能を提供するパッケージ。

### `yup`

値のバリデーションをやりやすくするパッケージ。

### `debug`, `http-errors`, `morgan`, `request`

[express-generator](https://www.npmjs.com/package/express-generator)によって生成されたボイラープレートに含まれるパッケージ

## devDependencies

### `@types/`で始まるパッケージ

Typescriptでコーディングするために必要な型情報を提供するパッケージ。

パッケージAを使用するとき、`@types/A`が存在すれば、それを導入するだけで良い。
もしなかった場合は、自分で型情報を作成しなければならない。

### `cross-env`

環境変数を設定するためのパッケージ。

本来はproductionやdevelopmentごとに環境変数を切り替えるためのパッケージだが、productionやdevelopmentを設定するために使用。

### `eslint`

Javascriptの静的検証ツール。

### `eslint-config-prettier`

EslintとPrettierを連携するためのeslintプラグイン。

### `eslint-plugin-import`

importをアルファベット順にするeslintプラグイン。

### `forever`

Nodejs製アプリケーションのバックグラウンド実行を管理するためのパッケージ。

### `npm-run-all`

複数のnpm scriptを一度に実行できるようにするパッケージ。

### `prettier`

コードフォーマッター

### `typescript`

Typescriptで開発するためのパッケージ
