import { User } from '@common/types';
import { MdOpenInNew } from 'react-icons/md';
import { FormatDate } from '../../../components/FormatDate';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { trpc } from '../../../trpc';
import { DeleteWorkButton } from './DeleteWorkButton';
import { RenameWorkButton } from './RenameWorkButton';

export const MyWorks = ({ user }: { user: User }) => {
  const { data: works } = trpc.db.fetchAllWorks.useQuery();
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
        const { creatorId, workId, uploadedAt, fileSize } = work;
        return (
          <div className="section" key={`${creatorId}/${workId}`}>
            <h4 className="header">
              {creatorId}/{workId}
            </h4>
            <ul>
              <li>ファイルサイズ：{fileSize}</li>
              {uploadedAt ? (
                <li>
                  <FormatDate date={uploadedAt} />
                  アップロード
                </li>
              ) : null}
            </ul>
            <div className="flex gap-2">
              <a
                href={`${location.origin}/works/${creatorId}/${workId}`}
                className="btn"
                target="_blank"
                rel="noreferrer"
              >
                <i className="left h-full flex">
                  <MdOpenInNew className="my-auto" />
                </i>
                作品へ移動
              </a>
              <RenameWorkButton work={work} />
              <DeleteWorkButton work={work} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
