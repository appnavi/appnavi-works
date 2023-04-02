# フォルダ構造

- 📁[backups](#backups)
  - 📁[uploads](#backupsuploads)
- 📁[client](#client)
- 📁[docker](#docker)
  - 📁[development.Dockerfile](#dockerdevelopmentdockerfile)
  - 📁[production.Dockerfile](#dockerproductiondockerfile)
- 📁[docs](#docs)
- 📁[logs](#logs)
  - [access.log](#logsaccesslog)
  - [system.log](#logssystemlog)
- 📁[secrets](#secrets)
- 📁[server](#server)
- 📁[uploads](#uploads)
- [.env](#env)

---

## 📁backups

### 📁backups/uploads

Unity ゲームが上書きされる際、[uploads](#uploads)フォルダーにある既存のゲームがここにバックアップされる。

## 📁client

React と Vite で作成したクライアントのソースコードを格納。

## 📁docker

### docker/development.Dockerfile

[development](../how-to-execute.md#development) と [test](../how-to-execute.md#test) を実行するための Dockerfile

### docker/production.Dockerfile

[staging](../how-to-execute.md#staging) と [production](../how-to-execute.md#production) を実行するための Dockerfile

## 📁docs

このレポジトリーに関するドキュメントを格納

## 📁logs

### logs/access.log

ユーザーがアクセスした URL、ステータス、UserAgent などのログ

### logs/system.log

ユーザーの行動、404 以外のエラーなど、サーバーが出力したログ

## 📁secrets

Docker Compose の Secrets 機能によって管理する機密情報を保存するためのディレクトリ。

バージョン管理対象外であるため、自分で作成する必要がある。作成方法については[ここ](../how-to-execute.md)を参照

# 📁server

Express アプリケーションのソースコードを格納

## 📁uploads

ユーザーによってアップロードされたゲームが格納されるフォルダー

`/works/*`でアクセスできる。

## .env

環境変数を格納するファイル。バージョン管理対象外である。

- `SITE_URL_DEVELOPMENT`：development で実行する時にアクセスする URL。詳しくは[ここ](../how-to-execute.md#development)を参照
