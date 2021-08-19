# 導入パッケージ

## dependencies

### `bcrypt`

パスワードを生成・比較するためのパッケージ。

### `compression`

ファイルを圧縮し、動作を高速化するパッケージ。

### `cookie-parser`

expressを使用するために必要なパッケージの一つ。

### `cookie-session`

認証情報などをCookieに保存できるようにするパッケージ。

### `csurf`

CSRF（クロスサイト・リクエスト・フォージェリ）という脆弱性を対策するためのパッケージ。

### `ejs`

htmlに似た記法のテンプレートエンジン

### `express`

Nodejsでサーバーアプリケーションを作成できるようになるパッケージ。

### `fs-extra`

Nodejs標準の`fs`パッケージの機能を拡充したパッケージ。

### `helmet`

セキュリティ対策のための複数のパッケージをまとめたパッケージ。

### `http-errors`

[express-generator](https://www.npmjs.com/package/express-generator)によって生成されたボイラープレートに含まれるパッケージ

### `jsonwebtoken`

オブジェクトの暗号化を提供するパッケージ。

### `log4js`

ログ出力機能を提供するパッケージ。

### `mongoose`

MongoDBを操作するためのパッケージ。

### `multer`

Expressアプリケーションにファイルアップロード機能を提供するパッケージ。

### `openid-client`

[OpenID Connect](https://openid.net/connect/)というプロトコルによる認証機能を提供するためのパッケージ。

このパッケージを用いることでSlack認証を実現している。

### `passport`

Expressアプリケーションに認証機能を提供するパッケージ

### `passport-local`

passportでユーザー名とパスワードによる認証を使えるようにするパッケージ。

### `sass`

sassからcssへのコンパイラー

### `serve-index`

フォルダ内ファイル一覧機能を提供するパッケージ。

### `yup`

値のバリデーションをやりやすくするパッケージ。

## devDependencies

### `@types/`で始まるパッケージ

Typescriptでコーディングするために必要な型情報を提供するパッケージ。

パッケージAを使用するとき、`@types/A`が存在すれば、それを導入するだけで良い。
もしなかった場合は、自分で型情報を作成しなければならない。

### `@typescript-eslint/eslint-plugin`

Typescript開発でeslintを使うためのパッケージ

### `@typescript-eslint/parser`

Typescript開発でeslintを使うためのパッケージ

### `eslint`

Javascriptの静的検証ツール。

### `eslint-config-prettier`

EslintとPrettierを連携するためのeslintプラグイン。

### `eslint-plugin-import`

importをアルファベット順にするeslintプラグイン。

### `husky`

gitのコマンド実行時に指定した処理を自動実行できるパッケージ。

### `jest`

単体テストができるようになるパッケージ。

### `lint-staged`

gitでステージされたファイルのみにlinterを実行できるパッケージ。

### `migrate-mongo`

MongoDBでデータベースマイグレーションを実現するパッケージ。

### `nodemon`

ファイルに変更が加えられた際にNode.jsアプリケーションを自動で再スタートするパッケージ。

`ts-node`の導入により、Typescriptファイルをコンパイルなしで実行できる。

### `npm-run-all`

複数のnpm scriptを一度に実行できるようにするパッケージ。

### `passport-stub`

単体テストにおいて、ログイン状態をモックできるパッケージ・

### `prettier`

コードフォーマッター

### `supertest`

expressアプリケーションに仮想的にHTTPリクエストを送ることで単体テストができるパッケージ。

### `ts-jest`

Typescriptファイルをコンパイルなしでjestによる単体テストができるようになるパッケージ。

### `ts-node`

Typescriptファイルをコンパイルなしで実行できるようになるパッケージ。

### `typescript`

Typescriptで開発するためのパッケージ
