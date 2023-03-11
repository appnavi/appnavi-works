import { URL_PREFIX_WORK } from '@common/constants';
import { MdOpenInNew } from 'react-icons/md';
import { AuthorizedOnly } from '../../../components/AuthorizedOnly';
import { FormatDate } from '../../../components/FormatDate';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { trpc } from '../../../trpc';

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
      {works.map(({ creatorId, workId, owner, fileSize, uploadedAt }) => {
        return (
          <div className="card" key={`${creatorId}/${workId}`}>
            <div className="card-content">
              <span className="card-title">
                {creatorId}/{workId}
              </span>
              <div>所有者のユーザーID：{owner} </div>
              <div>ファイルサイズ：{fileSize}バイト</div>
              {uploadedAt !== undefined ? (
                <div>
                  <FormatDate date={uploadedAt} />
                  アップロード
                </div>
              ) : null}
            </div>
            <div className="card-action">
              <a
                href={`${location.origin}${URL_PREFIX_WORK}/${creatorId}/${workId}`}
                className="teal-text"
                rel="noreferrer"
                target="_blank"
              >
                <i className="left">
                  <MdOpenInNew size={24} />
                </i>
                作品へ移動
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export const DbWorksPage = () => {
  return <AuthorizedOnly>{() => <Page />}</AuthorizedOnly>;
};
