import { WorkDB } from '@common/types';
import { MdDeleteForever, MdRestore } from 'react-icons/md';
import { FormatDate } from '../../../components/FormatDate';
import { PreventPageLeave } from '../../../components/PreventPageLeave';
import { useConfirmDialogContext } from '../../../context/DialogsContext/ConfirmDialog';
import { useMessageDialogContext } from '../../../context/DialogsContext/MessageDialog';
import { trpc } from '../../../trpc';

const RestoreBackupButton = ({
  work,
  backupName,
}: {
  work: WorkDB;
  backupName: string;
}) => {
  const trpcContext = trpc.useContext();
  const { showMessageDialog } = useMessageDialogContext();
  const { showConfirmDialog } = useConfirmDialogContext();
  const { mutate, isLoading } = trpc.account.backup.restore.useMutation({
    onSuccess() {
      showMessageDialog({
        title: '復元に成功しました。',
        onClose() {
          trpcContext.account.work.list.invalidate();
        },
      });
    },
    onError(error) {
      showMessageDialog({
        title: '復元に失敗しました',
        text: error.message,
      });
    },
  });
  return (
    <button
      className="waves-effect waves-light btn"
      onClick={() => {
        showConfirmDialog({
          title: '確認',
          content: <p>バックアップ{backupName}を復元しますか？</p>,
          positiveButton: {
            label: '復元',
            classes: ['waves-effect', 'waves-light', 'btn'],
            onPresed() {
              mutate({
                creatorId: work.creatorId,
                workId: work.workId,
                backupName,
              });
            },
          },
          negativeButton: {
            label: 'キャンセル',
            classes: ['waves-effect', 'waves-light', 'btn-flat'],
          },
        });
      }}
      disabled={isLoading}
    >
      <i className="left flex h-full">
        <MdRestore className="my-auto" />
      </i>
      復元
      <PreventPageLeave shouldPreventLeave={isLoading} />
    </button>
  );
};

const DeleteBackupButton = ({
  work,
  backupName,
}: {
  work: WorkDB;
  backupName: string;
}) => {
  const trpcContext = trpc.useContext();
  const { showMessageDialog } = useMessageDialogContext();
  const { showConfirmDialog } = useConfirmDialogContext();
  const { mutate, isLoading } = trpc.account.backup.delete.useMutation({
    onSuccess() {
      showMessageDialog({
        title: '削除に成功しました。',
        onClose() {
          trpcContext.account.work.list.invalidate();
        },
      });
    },
    onError(error) {
      showMessageDialog({
        title: '削除に失敗しました',
        text: error.message,
      });
    },
  });
  return (
    <button
      className="waves-effect waves-light btn red"
      onClick={() => {
        showConfirmDialog({
          title: '確認',
          content: <p>バックアップ{backupName}を削除しますか？</p>,
          positiveButton: {
            label: '削除',
            classes: ['waves-effect', 'waves-light', 'btn', 'red'],
            onPresed() {
              mutate({
                creatorId: work.creatorId,
                workId: work.workId,
                backupName,
              });
            },
          },
          negativeButton: {
            label: 'キャンセル',
            classes: ['waves-effect', 'waves-light', 'btn-flat'],
          },
        });
      }}
      disabled={isLoading}
    >
      <i className="left flex h-full">
        <MdDeleteForever className="my-auto" />
      </i>
      削除
      <PreventPageLeave shouldPreventLeave={isLoading} />
    </button>
  );
};

export const Backups = ({ work }: { work: WorkDB }) => {
  const { backups } = work;
  if (backups.length === 0) {
    return null;
  }

  return (
    <ul className="collection with-header">
      <li className="collection-header">
        <h6>バックアップ</h6>
      </li>
      {backups.map(({ name, fileSize, uploadedAt }) => {
        return (
          <li className="collection-item valign-wrapper" key={name}>
            <div className="row valign-wrapper mb-0 w-full">
              <div className="col s1">{name}</div>
              <div className="col s3">{fileSize}バイト</div>
              <div className="col s4">
                {uploadedAt !== undefined ? (
                  <>
                    <FormatDate date={uploadedAt} />
                    アップロード
                  </>
                ) : null}
              </div>
              <div className="col s4 flex justify-end gap-2">
                <RestoreBackupButton work={work} backupName={name} />
                <DeleteBackupButton work={work} backupName={name} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
