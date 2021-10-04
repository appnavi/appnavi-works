# 導入パッケージ

## dependencies

### `bcrypt`

パスワードを生成・比較するためのパッケージ。

### `compression`

ファイルを圧縮し、動作を高速化するパッケージ。

### `connect-mongo`

MongoDB にセッション情報を保存するためのパッケージ。

### `cookie-parser`

express を使用するために必要なパッケージの一つ。

### `csurf`

CSRF（クロスサイト・リクエスト・フォージェリ）という脆弱性を対策するためのパッケージ。

### `ejs`

html に似た記法のテンプレートエンジン

### `express`

Nodejs でサーバーアプリケーションを作成できるようになるパッケージ。

### `express-rate-limit`

各ユーザーが一定時間内にアクセスできる回数を制限するためのパッケージ。

現状はこのパッケージを用いることで、ゲストログインを 1 時間に 3 回までしか失敗できないようにし、総当たり攻撃を対策している。

### `express-session`

認証情報を保存するための仕組みであるセッションを利用するためのパッケージ。

### `fs-extra`

Nodejs 標準の`fs`パッケージの機能を拡充したパッケージ。

### `helmet`

セキュリティ対策のための複数のパッケージをまとめたパッケージ。

### `http-errors`

[express-generator](https://www.npmjs.com/package/express-generator)によって生成されたボイラープレートに含まれるパッケージ

### `jsonwebtoken`

オブジェクトの暗号化を提供するパッケージ。

### `log4js`

ログ出力機能を提供するパッケージ。

### `mongoose`

MongoDB を操作するためのパッケージ。

### `multer`

Express アプリケーションにファイルアップロード機能を提供するパッケージ。

### `openid-client`

[OpenID Connect](https://openid.net/connect/)というプロトコルによる認証機能を提供するためのパッケージ。

このパッケージを用いることで Slack 認証を実現している。

### `passport`

Express アプリケーションに認証機能を提供するパッケージ

### `passport-local`

passport でユーザー名とパスワードによる認証を使えるようにするパッケージ。

### `sass`

sass から css へのコンパイラー。

### `serve-index`

フォルダ内ファイル一覧機能を提供するパッケージ。

### `yup`

値のバリデーションをやりやすくするパッケージ。

## devDependencies

### `@types/`で始まるパッケージ

Typescript でコーディングするために必要な型情報を提供するパッケージ。

### `@typescript-eslint/eslint-plugin`

Typescript 開発で eslint を使うためのパッケージ

### `@typescript-eslint/parser`

Typescript 開発で eslint を使うためのパッケージ

### `eslint`

Javascript の静的検証ツール。

### `eslint-config-prettier`

Eslint と Prettier を連携するための eslint プラグイン。

### `eslint-plugin-import`

import をアルファベット順にする eslint プラグイン。

### `jest`

単体テストができるようになるパッケージ。

### `lint-staged`

git でステージされたファイルのみに linter を実行できるパッケージ。

### `migrate-mongo`

MongoDB でデータベースマイグレーションを実現するパッケージ。

### `nodemon`

ファイルに変更が加えられた際に Node.js アプリケーションを自動で再スタートするパッケージ。

`ts-node`の導入により、Typescript ファイルをコンパイルなしで実行できる。

### `npm-run-all`

複数の npm script を一度に実行できるようにするパッケージ。

### `passport-stub`

単体テストにおいて、ログイン状態をモックできるパッケージ・

### `prettier`

コードフォーマッター

### `supertest`

express アプリケーションに仮想的に HTTP リクエストを送ることで単体テストができるパッケージ。

### `ts-jest`

Typescript ファイルをコンパイルなしで jest による単体テストができるようになるパッケージ。

### `ts-node`

Typescript ファイルをコンパイルなしで実行できるようになるパッケージ。

### `typescript`

Typescript で開発するためのパッケージ
