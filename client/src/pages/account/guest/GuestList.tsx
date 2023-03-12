import { User } from '@common/types';
import { MdDelete } from 'react-icons/md';
import { FormatDate } from '../../../components/FormatDate';
import { LoadingSpinner } from '../../../components/LoadingSpinner';
import { useConfirmDialogContext } from '../../../context/DialogsContext/ConfirmDialog';
import { useMessageDialogContext } from '../../../context/DialogsContext/MessageDialog';
import { trpc } from '../../../trpc';
const DeleteUserButton = ({ guestId: guestId }: { guestId: string }) => {
  const trpcContext = trpc.useContext();
  const { showConfirmDialog } = useConfirmDialogContext();
  const { showMessageDialog } = useMessageDialogContext();
  const { mutate } = trpc.account.guest.delete.useMutation({
    onSuccess() {
      showMessageDialog({
        title: `ゲストユーザー${guestId}を削除しました。`,
        onClose() {
          trpcContext.db.fetchAllUsers.invalidate();
        },
      });
    },
    onError(error) {
      showMessageDialog({
        title: `ゲストユーザー${guestId}の削除に失敗しました。`,
        text: error.message,
      });
    },
  });
  const onClick = () => {
    showConfirmDialog({
      title: `ゲストユーザー"${guestId}"を削除しますか？`,
      content: (
        <div>
          <p>この操作は取り消せません。</p>
          <p>作品が存在するゲストユーザーは削除できません。</p>
        </div>
      ),
      positiveButton: {
        label: '削除する',
        classes: ['waves-effect', 'waves-light', 'btn', 'red'],
        onPresed() {
          mutate({ guestId });
        },
      },
      negativeButton: {
        label: 'キャンセル',
        classes: ['waves-effect', 'waves-light', 'btn-flat'],
      },
    });
  };
  return (
    <button className="red-text" onClick={onClick}>
      <i className="h-full flex">
        <MdDelete className="my-auto" size={24} />
      </i>
    </button>
  );
};

export const GuestList = ({ user }: { user: User }) => {
  const { data: users } = trpc.db.fetchAllUsers.useQuery();
  if (users === undefined) {
    return (
      <div className="w-full grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  const guests = users.filter((u) => u.guest?.createdBy === user.id);
  if (guests.length === 0) {
    return null;
  }
  return (
    <div className="section">
      <h3 className="header">作成したゲストユーザー一覧</h3>
      <ul className="collection">
        {guests
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .map(({ userId, createdAt }) => (
            <li className="collection-item" key={userId}>
              <div className="flex">
                <div className="flex-1">
                  <p>{userId}</p>
                  <span>
                    <FormatDate date={createdAt} />
                    作成
                  </span>
                </div>
                <div className="valign-wrapper">
                  <DeleteUserButton guestId={userId} />
                </div>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
};
