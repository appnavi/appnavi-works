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
    - 📁[fontawesome-free-5.15.1-web](#publicstylesheetsfontawesome-free-5151-web)  
- 📁[src](#src)  
- 📁[src_browser](#src_browser)  
- 📁[uploads](#uploads)  
- 📁[views](#views)  
- [.env](#env)

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

#### 📁public/stylesheets/fontawesome-free-5.15.1-web

[Font Awesome](https://fontawesome.com/)のアイコン

## 📁src

Expressアプリケーションのソースコード(Typescript&Javascript)

`yarn build:server`コマンドにより、生成されたJavascirptコードが[dist](#dist)フォルダーに格納される

## 📁src_browser

ブラウザーで表示するコンテンツ用のソースコード(Typescript)

`yarn build:browser`コマンドにより、生成されたJavascriptコードがルートフォルダーに格納される。

## 📁uploads

ユーザーによってアップロードされたゲームが格納されるフォルダー

`/games/*`でアクセスできる。

## 📁views

このレポジトリーで使われているejsファイルを格納するフォルダー

ejsはhtmlに条件分岐、変数の内容表示など、機能を拡張したファイル

## .env

環境変数を格納するファイル。バージョン管理対象外である。

- `SLACK_CLIENT_ID`：Slack AppのClient ID。
- `SLACK_CLIENT_SECRET`：Slack AppのClient Secret。
- `SLACK_REDIRECT_URI`：Slack AppのRedirect URI。Slack Appのページで設定するだけで動作するので、現状使っていない。
- `SLACK_WORKSPACE_ID`：ログインを認めるWorkspaceのID。Sign In With Slackは、作成したWorkspaceしかログインできないと思われるが、フェイルセーフとして導入
- `COOKIE_NAME`：Cookieを利用するための設定。
- `COOKIE_KEYS`：Cookieを利用するための設定。
- `JWT_SECRET`：JsonWebTokenによる暗号化に必要なsecretも文字列。
- `DATABASE_URL`：MongoDBを使用するためのURL。
