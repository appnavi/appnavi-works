import { type User } from '@common/types';
import { Helmet } from 'react-helmet-async';
import { FaUnity } from 'react-icons/fa';
import { AuthorizedOnly } from '../components/AuthorizedOnly';
import { Link } from '../components/Link';

const DatabaseSection = ({ user }: { user: User }) => {
  if (user.type === 'Guest') {
    return null;
  }
  return (
    <div className="section">
      <h4 className="header">データベース</h4>
      <div className="flex gap-2">
        <Link className="btn-large" to="/db/works">
          作品一覧
        </Link>
        <Link className="btn-large" to="/db/users">
          ユーザー一覧
        </Link>
      </div>
    </div>
  );
};
const Page = ({ user }: { user: User }) => {
  return (
    <div className="container">
      <h3 className="header">HOME</h3>
      <div className="section">
        <h4 className="header">アップロード</h4>
        <Link className="btn-large flex" to="/upload/unity">
          <i className="left flex h-full">
            <FaUnity className="my-auto" />
          </i>
          Unityゲームのアップロード
        </Link>
      </div>
      <DatabaseSection user={user} />
    </div>
  );
};

export const IndexPage = () => {
  return (
    <AuthorizedOnly>
      {(user) => (
        <>
          <Helmet>
            <title>HOME</title>
          </Helmet>
          <Page user={user} />
        </>
      )}
    </AuthorizedOnly>
  );
};
