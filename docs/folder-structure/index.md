# フォルダ構造

- 📁[.husky](#husky)  
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
  - 📁[javascripts](#publicjavascripts)  
  - 📁[stylesheets](#publicstylesheets)  
  - 📁[fontawesome-free-5.15.1-web](#publicfontawesome-free-5151-web)  
- 📁[secrets](#secrets)  
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
- 📁[test](#test)  
- 📁[uploads](#uploads)  
- 📁[views](#views)  
- [.env](#env)

---

## 📁.husky

gitのコマンド実行時に自動実行する処理を指定するファイルがあるフォルダー。

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

ログイン必須なページで使用されるJavascriptファイル。

`yarn build:browser`により、このフォルダー内のTypescriptファイルから同名のJavascriptファイルが生成される。

### 📁private/stylesheets

ログイン必須なページで使用されるcssファイルとそのソースであるscssファイルを格納。

scssファイルを編集すれば、同名のcssファイルにアクセスした際、cssファイルの内容が自動的に更新される。

## 📁public

### 📁public/javascripts

ログインの有無に関わらず使えるJavascriptファイルを格納するフォルダー。

`yarn build:browser`により、このフォルダー内のTypescriptファイルから同名のJavascriptファイルが生成される。

### 📁public/stylesheets

ログイン不要なページで使用されるcssファイルやcssファイルのソースであるscssファイルを格納。

scssファイルを編集すれば、同名のcssファイルにアクセスした際、cssファイルの内容が自動的に更新される。

#### 📁public/fontawesome-free-5.15.1-web

[Font Awesome](https://fontawesome.com/)のアイコン

## 📁secrets

Docker ComposeのSecrets機能によって管理する機密情報を保存するためのディレクトリ。

バージョン管理対象外であるため、自分で作成する必要がある。作成方法については[ここ](../how-to-execute.md)を参照

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

- `SITE_URL_DEVELOPMENT`：developmentで実行する時にアクセスするURL。詳しくは[ここ](../how-to-execute.md#development)を参照
