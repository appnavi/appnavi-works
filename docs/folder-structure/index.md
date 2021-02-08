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
    - 📁[upload](#privatestylesheetsupload)  
- 📁[public](#public)  
  - 📁[stylesheets](#publicstylesheets)  
    - 📁[fontawesome-free-5.15.1-web](#publicstylesheetsfontawesome-free-5151-web)  
- 📁[src](#src)  
- 📁[src_browser](#src_browser)  
  - 📁[private](#src_browserprivate)  
    - 📁[javascripts](#src_browserprivatejavascripts)  
      - 📁[uploads](#uploads)  
- 📁[views](#views)  
  - 📁[auth](#viewsauth)  
  - 📁[common](#viewscommon)  
  - 📁[upload](#viewsupload)  

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
