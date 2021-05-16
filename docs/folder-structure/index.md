# フォルダ構造

- 📁[backups](#backups)  
  - 📁[uploads](#backupsuploads)  
- 📁[dist](#dist)  
- 📁[docs](#docs)  
- 📁[logs](#logs)  
  - [access.log](#logsaccesslog)  
  - [system.log](#logssystemlog)  
- 📁[private](#private)  
  - 📁[javascripts](#privatejavascripts)  
  - 📁[stylesheets](#privatestylesheets)  
- 📁[public](#public)  
  - 📁[stylesheets](#publicstylesheets)  
  - 📁[fontawesome-free-5.15.1-web](#publicfontawesome-free-5151-web)  
- 📁[src](#src)  
  - 📁[@types](#srctypes)
  - 📁[config](#srcconfig)  
    - [passport.js](#srcconfigpassportjs)  
  - 📁[models](#srcmodels)  
    - [database.ts](#srcmodelsdatabasets)  
  - 📁[modules](#srcmodules)  
    - [logger.ts](#srcmodulesloggerts)  
  - 📁[routes](#srcroutes)  
    - [auth.ts](#srcroutesauthts)  
    - [db.ts](#srcroutesdbts)  
    - [games.ts](#srcroutesgamests)  
    - [index.ts](#srcroutesindexts)  
    - [upload.ts](#srcroutesuploadts)  
  - 📁[services](#srcservices)  
    - [auth.ts](#srcservicesauthts)  
    - [upload.ts](#srcservicesuploadts)
  - 📁[utils](#srcutils)  
    - [constants.ts](#srcutilsconstantsts)  
    - [helpers.ts](#srcutilshelpersts)  
  - [app.ts](#srcappts)  
  - [index.ts](#srcindexts)  
- 📁[src_browser](#src_browser)  
- 📁[test](#test)  
- 📁[uploads](#uploads)  
- 📁[views](#views)  
- [node.env](#nodeenv)
- [docker-dev.env](#docker-devenv)
- [docker-production.env](#docker-productionenv)
- [docker-test.env](#docker-testenv)

---

## 📁backups

### 📁backups/uploads

Unityゲームが上書きされる際、[uploads](#📁uploads)フォルダーにある既存のゲームがここにバックアップされる。

## 📁dist

`yarn bulid:server`コマンドにより、[src](#📁src)フォルダー内のTypescriptファイルから生成されたJavascriptファイルおよび、[src](#📁src)フォルダー内のJavascriptファイルのコピーが格納される。

productionにおいては、[src](#📁src)フォルダー内の代わりに、このフォルダー内のプログラムが実行される。

## 📁docs

このレポジトリーに関するドキュメントを格納

## 📁logs

### logs/access.log

ユーザーがアクセスしたURL、ステータス、UserAgentなどのログ

### logs/system.log

ユーザーの行動、404以外のエラーなど、サーバーが出力したログ

## 📁private

`/private/*`でアクセスできるが、ログインが必須

### 📁private/javascripts

[📁src_browser/private/javascripts](📁src_browser/private/javascripts)内のTypescriptをビルドしたJavascriptファイル。

ログイン必須なページで使用される。

### 📁private/stylesheets

ログイン必須なページで使用されるcssファイルとそのソースであるscssファイルを格納。

scssファイルを編集すれば、同名のcssファイルにアクセスした際、cssファイルの内容が自動的に更新される。

## 📁public

### 📁public/stylesheets

ログイン不要なページで使用されるcssファイルやcssファイルのソースであるscssファイルを格納。

scssファイルを編集すれば、同名のcssファイルにアクセスした際、cssファイルの内容が自動的に更新される。

#### 📁public/fontawesome-free-5.15.1-web

[Font Awesome](https://fontawesome.com/)のアイコン

## 📁src

Expressアプリケーションのソースコード(Typescript&Javascript)

`yarn build:server`コマンドにより、生成されたJavascirptコードが[dist](#dist)フォルダーに格納される

### 📁src/@types

Typescriptの型定義ファイルを格納

### 📁src/config

#### src/config/passport.js

[async-passport-slack](https://www.npmjs.com/package/async-passport-slack)を読み込み、Sign In With Slack V2に対応するための修正を加える。

### 📁src/models

#### src/models/database.ts

MongoDBで保存するデータに関するオブジェクトの定義。

### 📁src/modules

#### src/modules/logger.ts

[log4js](https://www.npmjs.com/package/log4js)によるロギングの定義。

### 📁src/routes

express.routerの定義。

#### src/routes/auth.ts

`/auth/*`でアクセスできるroute。
ログイン・ログアウトなどができる。

#### src/routes/db.ts

`/db/*`でアクセスできるroute。
MongoDBに保存したデータを得られる。

#### src/routes/games.ts

`/games/*`でアクセスできるroute。
アップロードされたゲームにアクセスできる。

#### src/routes/index.ts

`/`でアクセスできるroute。ログイン必須。
機能一覧を表示

#### src/routes/upload.ts

`/upload/*`でアクセスできるroute。ログイン必須。
ゲームをアップロードできる。

### 📁src/services

#### src/services/auth.ts

認証関連の関数などを定義。

#### src/services/upload.ts

ゲームアップロード関連の関数などを定義。

### 📁src/utils

#### src/utils/constants.ts

定数の定義。

#### src/utils/helpers.ts

ヘルパー関数の定義。

### src/app.ts

expressアプリケーションの定義。

### src/index.ts

データベースに接続し、アプリケーションを開始する。

## 📁src_browser

ブラウザーで表示するコンテンツ用のソースコード(Typescript)

`yarn build:browser`コマンドにより、生成されたJavascriptコードがルートフォルダーに格納される。

## 📁test

単体テスト

## 📁uploads

ユーザーによってアップロードされたゲームが格納されるフォルダー

`/games/*`でアクセスできる。

## 📁views

このレポジトリーで使われているejsファイルを格納するフォルダー

ejsはhtmlに条件分岐、変数の内容表示など、機能を拡張したファイル

## node.env

環境変数を格納するファイル。バージョン管理対象外である。

- `SLACK_CLIENT_ID`：Slack AppのClient ID。
- `SLACK_CLIENT_SECRET`：Slack AppのClient Secret。
- `SLACK_WORKSPACE_ID`：ログインを認めるWorkspaceのID。Slackにブラウザでアクセスした際のURL`https://app.slack.com/client/(A)/(B)`の`(A)`。Sign In With Slackは、作成したWorkspaceしかログインできないと思われるが、フェイルセーフとして導入。
- `COOKIE_NAME`：Cookieを利用するための設定。
- `COOKIE_KEYS`：Cookieを利用するための設定。
- `JWT_SECRET`：JsonWebTokenによる暗号化に必要なsecretも文字列。

## docker-dev.env

dockerでdevelopment実行する際の環境変数を格納するファイル。バージョン管理対象外である。

- `SLACK_REDIRECT_URI`：Slack AppのRedirect URI。
- `DATABASE_URL`：MongoDBを使用するためのURL。

## docker-production.env

dockerでproduction実行する際の環境変数を格納するファイル。バージョン管理対象外である。

- `SLACK_REDIRECT_URI`：Slack AppのRedirect URI。
- `DATABASE_URL`：MongoDBを使用するためのURL。

## docker-test.env

dockerでtest実行する際の環境変数を格納するファイル。バージョン管理対象外である。

- `SLACK_REDIRECT_URI`：Slack AppのRedirect URI。
- `DATABASE_URL`：MongoDBを使用するためのURL。
