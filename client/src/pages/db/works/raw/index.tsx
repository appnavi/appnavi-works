import { Helmet } from 'react-helmet-async';
import { AuthorizedOnly } from '../../../../components/AuthorizedOnly';
import { LoadingSpinner } from '../../../../components/LoadingSpinner';
import { trpc } from '../../../../trpc';

const Page = () => {
  const { data: works } = trpc.db.fetchAllWorksRaw.useQuery();
  if (works === undefined) {
    return (
      <div className="grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="container">
      <h3 className="header">データベースの内容（作品一覧）</h3>
      <div className="card">
        <div className="card-content overflow-auto">
          <pre>{JSON.stringify(works, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export const DbWorksRawPage = () => {
  return (
    <AuthorizedOnly>
      {() => (
        <>
          <Helmet>
            <title>データベースの内容（作品一覧）</title>
          </Helmet>
          <Page />
        </>
      )}
    </AuthorizedOnly>
  );
};
