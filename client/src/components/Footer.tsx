export const Footer = () => {
  return (
    <footer className="page-footer">
      <div className="container">
        <div className="row">
          <div className="col l6 s12">
            <h5 className="white-text">
              大阪公立大学 アプリNavi 部員専用サイト
            </h5>
            <p className="grey-text text-lighten-4">
              アプリNavi部員でない人はアクセスすることができません。
            </p>
          </div>
          <div className="col l4 offset-l2 s12">
            <h5 className="white-text">Links</h5>
            <ul>
              <li>
                <a
                  className="grey-text text-lighten-3"
                  href="https://opuappnavi.com/#/"
                >
                  アプリNavi ホームページ
                </a>
              </li>
              <li>
                <a
                  className="grey-text text-lighten-3"
                  href="https://blog.opuappnavi.com/"
                >
                  アプリNavi ブログ
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-copyright">
        <div className="container">Juris710</div>
      </div>
    </footer>
  );
};
