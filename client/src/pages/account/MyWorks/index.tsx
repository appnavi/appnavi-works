import { User } from '@common/types';
import { FormatDate } from '../../../components/FormatDate';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { trpc } from '../../../trpc';
import { Backups } from './Backups';
import { DeleteWorkButton } from './DeleteWorkButton';
import { RenameWorkButton } from './RenameWorkButton';

const WorkPaths = ({ paths }: { paths: string[] }) => {
  return (
    <ul className="collection with-header">
      <li className="collection-header">
        <h6>URL</h6>
      </li>
      {paths.map((p) => (
        <a
          className="collection-item"
          key={p}
          target="_blank"
          rel="noreferrer"
          href={`${location.origin}${p}`}
        >
          {p}
        </a>
      ))}
    </ul>
  );
};

export const MyWorks = ({ user }: { user: User }) => {
  const { data: works } = trpc.account.work.list.useQuery();
  if (works === undefined) {
    return (
      <div className="grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  const myWorks = works.filter((work) => work.owner === user.id);
  return (
    <div className="section">
      <h3 className="header">作品一覧</h3>
      {myWorks.map((work) => {
        const { creatorId, workId, uploadedAt, fileSize, paths } = work;
        return (
          <div className="section" key={`${creatorId}/${workId}`}>
            <h4 className="header">
              {creatorId}/{workId}
            </h4>
            <ul>
              <li>ファイルサイズ：{fileSize}</li>
              <li>
                <FormatDate date={uploadedAt} />
                アップロード
              </li>
            </ul>
            <div className="flex gap-2">
              <RenameWorkButton work={work} />
              <DeleteWorkButton work={work} />
            </div>
            <WorkPaths paths={paths} />
            <Backups work={work} />
          </div>
        );
      })}
    </div>
  );
};
