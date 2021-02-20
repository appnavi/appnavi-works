# game-upload

アプリNavi部員作品のupload/serveを行うExpress製サーバーアプリケーション

詳しい説明は[ドキュメント](docs/index.md)参照

## 起動方法

### production

実際にさくらのVPSで稼働させるとき

```sh
docker-compose up -d
```

### development

ローカル環境で開発するとき(ファイルに変更が加えて保存すると自動的に変更が反映される)

```sh
bash dev.sh
```

### test

game-uploadの単体テスト

```sh
bash test.sh
```

## 停止方法

```sh
docker-compose down
```
