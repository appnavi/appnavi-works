import { WorkDB } from '@common/types';
import { MdDeleteForever, MdRestore } from 'react-icons/md';
import { FormatDate } from '../../../components/FormatDate';
import { useConfirmDialogContext } from '../../../context/DialogsContext/ConfirmDialog';
import { useErrorDialogContext } from '../../../context/DialogsContext/ErrorDialog';
import { useMessageDialogContext } from '../../../context/DialogsContext/MessageDialog';
import { trpc } from '../../../trpc';

export const Backups = ({ work }: { work: WorkDB }) => {
  const trpcContext = trpc.useContext();
  const { showMessageDialog } = useMessageDialogContext();
  const { showErrorDialog } = useErrorDialogContext();
  const { showConfirmDialog } = useConfirmDialogContext();
  const { mutate: restoreBackup } = trpc.account.backup.restore.useMutation({
    onSuccess() {
      showMessageDialog({
        title: '復元に成功しました。',
        content: <></>,
        onClose() {
          trpcContext.account.work.list.invalidate();
        },
      });
    },
    onError(error) {
      showErrorDialog({
        title: '復元に失敗しました',
        errorMessage: error.message,
      });
    },
  });
  const { mutate: deleteBackup } = trpc.account.backup.delete.useMutation({
    onSuccess() {
      showMessageDialog({
        title: '削除に成功しました。',
        content: <></>,
        onClose() {
          trpcContext.account.work.list.invalidate();
        },
      });
    },
    onError(error) {
      showErrorDialog({
        title: '削除に失敗しました',
        errorMessage: error.message,
      });
    },
  });
  const { backups } = work;
  if (backups.length === 0) {
    return null;
  }
  const onRestoreBackupButtonClick = (backupName: string) => {
    showConfirmDialog({
      title: '確認',
      content: <p>バックアップ{backupName}を復元しますか？</p>,
      positiveButton: {
        label: '復元',
        classes: ['waves-effect', 'waves-light', 'btn'],
        onPresed() {
          restoreBackup({
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
  };
  const onDeleteBackupButtonClick = (backupName: string) => {
    showConfirmDialog({
      title: '確認',
      content: <p>バックアップ{backupName}を削除しますか？</p>,
      positiveButton: {
        label: '削除',
        classes: ['waves-effect', 'waves-light', 'btn', 'red'],
        onPresed() {
          deleteBackup({
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
  };
  return (
    <ul className="collection with-header">
      <li className="collection-header">
        <h5>バックアップ</h5>
      </li>
      {backups.map(({ name, fileSize, uploadedAt }) => {
        return (
          <li className="collection-item valign-wrapper" key={name}>
            <div className="row valign-wrapper w-full mb-0">
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
              <div className="col s4 flex gap-2 justify-end">
                <button
                  className="waves-effect waves-light btn"
                  onClick={() => onRestoreBackupButtonClick(name)}
                >
                  <i className="left flex h-full">
                    <MdRestore className="my-auto" />
                  </i>
                  復元
                </button>
                <button
                  className="waves-effect waves-light btn red"
                  onClick={() => onDeleteBackupButtonClick(name)}
                >
                  <i className="left flex h-full">
                    <MdDeleteForever className="my-auto" />
                  </i>
                  削除
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
