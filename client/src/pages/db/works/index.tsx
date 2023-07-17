import { AuthenticatedOnly } from '../../../components/AuthenticatedOnly';
import { FormatDate } from '../../../components/FormatDate';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { trpc } from '../../../trpc';

const WorkPaths = ({ paths }: { paths: string[] }) => {
  return (
    <ul className="collection">
      {paths.map((p) => (
        <a
          href={`${location.origin}${p}`}
          className="collection-item"
          key={p}
          target="_blank"
          rel="noreferrer"
        >
          {p}
        </a>
      ))}
    </ul>
  );
};

const Page = () => {
  const { data: works } = trpc.db.fetchAllWorks.useQuery();
  if (works === undefined) {
    return (
      <div className="grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  return (
    <div className="container">
      <h3 className="header">作品一覧</h3>
      {works.map(
        ({ creatorId, workId, owner, fileSize, uploadedAt, paths }) => {
          return (
            <div className="card" key={`${creatorId}/${workId}`}>
              <div className="card-content">
                <span className="card-title">
                  {creatorId}/{workId}
                </span>
                <div>所有者のユーザーID：{owner} </div>
                <div>ファイルサイズ：{fileSize}バイト</div>
                <div>
                  <FormatDate date={uploadedAt} />
                  アップロード
                </div>
                <WorkPaths paths={paths} />
              </div>
            </div>
          );
        },
      )}
    </div>
  );
};
export const DbWorksPage = () => {
  return <AuthenticatedOnly>{() => <Page />}</AuthenticatedOnly>;
};
