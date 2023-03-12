import { WorkDB } from '@common/types';
import { MdDelete } from 'react-icons/md';
import { useConfirmDialogContext } from '../../../context/DialogsContext/ConfirmDialog';
import { useMessageDialogContext } from '../../../context/DialogsContext/MessageDialog';
import { trpc } from '../../../trpc';

export const DeleteWorkButton = ({ work }: { work: WorkDB }) => {
  const trpcContext = trpc.useContext();
  const { showMessageDialog } = useMessageDialogContext();
  const { showConfirmDialog } = useConfirmDialogContext();
  const { mutate } = trpc.account.work.delete.useMutation({
    onSuccess() {
      showMessageDialog({
        title: '削除に成功しました',
        content: <></>,
        onClose() {
          trpcContext.account.work.list.invalidate();
        },
      });
    },
    onError(error) {
      showMessageDialog({
        title: '削除に失敗しました',
        content: (
          <div>
            {error.message.split('\n').map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ),
      });
    },
  });
  const { creatorId, workId } = work;
  const onClick = () => {
    showConfirmDialog({
      title: '確認',
      content: (
        <div>
          <h5>
            作品&quot;{creatorId}/{workId}&quot;を削除してもよろしいですか？
          </h5>
          <p>この作品の全てのバックアップも削除されます。</p>
          <p>削除した後は元の戻すことはできません。</p>
        </div>
      ),
      positiveButton: {
        label: '削除',
        classes: ['waves-effect', 'waves-light', 'btn', 'red'],
        onPresed() {
          mutate({
            creatorId,
            workId,
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
    <button className="waves-effect waves-light btn red" onClick={onClick}>
      <i className="left flex h-full">
        <MdDelete className="my-auto" />
      </i>
      作品の削除
    </button>
  );
};
