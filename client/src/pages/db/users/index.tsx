import { WorkDB } from '@common/types';
import { Helmet } from 'react-helmet-async';
import { AuthorizedOnly } from '../../../components/AuthorizedOnly';
import { FormatDate } from '../../../components/FormatDate';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { trpc } from '../../../trpc';
const WorksOfUser = ({ worksOfUser }: { worksOfUser: WorkDB[] }) => {
  return (
    <ul className="collection with-header">
      <li className="collection-header">
        <h6>作品</h6>
      </li>
      {worksOfUser.map((work) => {
        return (
          <li
            className="collection-item"
            key={`${work.creatorId}/${work.workId}`}
          >
            {work.creatorId}/{work.workId}
          </li>
        );
      })}
    </ul>
  );
};
const Page = () => {
  const { data: users } = trpc.db.fetchAllUsers.useQuery();
  const { data: works } = trpc.db.fetchAllWorks.useQuery();
  if (users === undefined || works === undefined) {
    return (
      <div className="grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="container">
      <h3 className="header">ユーザー一覧</h3>
      {users.map((user) => {
        const { lastLogIn } = user;
        const worksOfUser = works.filter((work) => work.owner === user.userId);
        return (
          <div className="card" key={user.userId}>
            <div className="card-content">
              <div>ユーザーID：{user.userId}</div>
              <div>デフォルトの作者ID：{user.defaultCreatorId ?? '未設定'}</div>
              {lastLogIn !== undefined ? (
                <div>
                  最終ログイン：
                  <FormatDate date={lastLogIn} />
                </div>
              ) : null}
              {worksOfUser.length > 0 ? (
                <WorksOfUser worksOfUser={worksOfUser} />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const DbUsersPage = () => {
  return (
    <AuthorizedOnly>
      {() => (
        <>
          <Helmet>
            <title>ユーザー一覧</title>
          </Helmet>
          <Page />
        </>
      )}
    </AuthorizedOnly>
  );
};
