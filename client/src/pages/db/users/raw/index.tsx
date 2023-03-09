import { Helmet } from 'react-helmet-async';
import { AuthorizedOnly } from '../../../../components/AuthorizedOnly';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { trpc } from '../../../../trpc';

const Page = () => {
  const { data: users } = trpc.db.fetchAllUsersRaw.useQuery();
  if (users === undefined) {
    return (
      <div className="grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="container">
      <h3 className="header">データベースの内容（ユーザー一覧）</h3>
      <div className="card">
        <div className="card-content overflow-auto">
          <pre>{JSON.stringify(users, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export const DbUsersRawPage = () => {
  return (
    <AuthorizedOnly>
      {() => (
        <>
          <Helmet>
            <title>データベースの内容（ユーザー一覧）</title>
          </Helmet>
          <Page />
        </>
      )}
    </AuthorizedOnly>
  );
};
