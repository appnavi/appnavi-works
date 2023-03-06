import { FaUnity } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export const IndexPage = () => {
  return (
    <div className="container">
      <h3 className="header">HOME</h3>
      <div className="section">
        <h4 className="header">アップロード</h4>
        <a className="btn-large flex" href="/upload/unity">
          <i className="left h-full flex">
            <FaUnity size={30} className="my-auto" />
          </i>
          Unityゲームのアップロード
        </a>
      </div>
      <div className="section">
        <h4 className="header">データベース</h4>
        <div className="section">
          <h5>一覧</h5>
          <div className="flex gap-2">
            <Link className="btn-large" to="/db/works">
              作品一覧
            </Link>
            <Link className="btn-large" to="/db/users">
              ユーザー一覧
            </Link>
          </div>
        </div>
        <div className="section">
          <h5 className="header">データベース内容の出力</h5>
          <div className="flex gap-2">
            <Link className="btn-large" to="/db/works/raw">
              works
            </Link>
            <Link className="btn-large" to="/db/users/raw">
              users
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
