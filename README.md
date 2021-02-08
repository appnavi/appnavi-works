# game-upload-dev

アプリNavi部員作品のupload/serveを行うExpress製サーバーアプリケーション

詳しい説明は[ドキュメント](docs/index.md)参照

## 実行方法

1. データベース起動
    MongoDBを起動する必要があります。
2. アプリケーション起動
    - development  
      1. `yarn dev`
    - production  
      [forever](https://www.npmjs.com/package/forever)によるバックグラウンド実行
      1. `yarn build`
      2. `yarn start`

### 停止方法

1. アプリケーション停止
    - development  
      Ctrl+Cを押す
    - production  
      1. `forever list`でpidを確認
      2. `forever stop (pid)`：(pid)には1.で確認したpidを入力
2. データベース停止
