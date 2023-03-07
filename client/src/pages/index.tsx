import { type User } from '@common/types';
import { useContext } from 'react';
import { FaUnity } from 'react-icons/fa';
import { Link, Navigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const DatabaseSection = ({ user }: { user: User }) => {
  if (user.type === 'Guest') {
    return null;
  }
  return (
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
  );
};

export const IndexPage = () => {
  const user = useContext(UserContext);
  if (user === null) {
    return <Navigate to="/auth" />;
  }
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
      <DatabaseSection user={user} />
    </div>
  );
};
