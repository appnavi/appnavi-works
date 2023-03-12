import { MdDeleteSweep } from 'react-icons/md';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useConfirmDialogContext } from '../../context/DialogsContext/ConfirmDialog';
import { useMessageDialogContext } from '../../context/DialogsContext/MessageDialog';
import { trpc } from '../../trpc';

const CreatorIdsList = ({ creatorIds }: { creatorIds: string[] }) => {
  const trpcContext = trpc.useContext();
  const { showMessageDialog } = useMessageDialogContext();
  const { showConfirmDialog } = useConfirmDialogContext();
  const { mutate } = trpc.account.cleanupCreatorIds.useMutation({
    onSuccess() {
      showMessageDialog({
        title: '使用していない作者IDの削除に成功しました。',
        onClose() {
          trpcContext.account.getUserData.invalidate();
        },
      });
    },
    onError(error) {
      showMessageDialog({
        title: '使用していない作者IDの削除に失敗しました。',
        text: error.message,
      });
    },
  });
  const onClick = () => {
    showConfirmDialog({
      title: '確認',
      content: (
        <div>
          <h5>使用していない作者IDを一覧から削除してもよろしいですか？</h5>
          <p>
            これにより、他のユーザーがその作者IDを利用できるようになります。
          </p>
          <p>少なくとも一つの作品で用いられている作者IDは削除できません。</p>
        </div>
      ),
      positiveButton: {
        label: '削除',
        classes: ['waves-effect', 'waves-light', 'btn', 'red'],
        onPresed() {
          mutate();
        },
      },
      negativeButton: {
        label: 'キャンセル',
        classes: ['waves-effect', 'waves-light', 'btn-flat'],
      },
    });
  };
  return (
    <>
      <p>
        ここで表示されている作者IDはあなたが保有しており、他のユーザーが利用することはできません。
      </p>
      <ul className="collection">
        {creatorIds.map((creatorId) => (
          <li className="collection-item" key={creatorId}>
            {creatorId}
          </li>
        ))}
      </ul>
      <button className="waves-effect waves-light btn red" onClick={onClick}>
        <i className="left flex h-full">
          <MdDeleteSweep className="my-auto" />
        </i>
        使用していない作者IDを削除
      </button>
    </>
  );
};

export const MyCreatorIds = () => {
  const { data: userDB } = trpc.account.getUserData.useQuery();
  if (userDB === undefined) {
    return (
      <div className="w-full grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  const creatorIds = userDB.creatorIds ?? [];
  return (
    <div className="section">
      <h3 className="header">保有している作者ID一覧</h3>
      {creatorIds.length > 0 ? (
        <CreatorIdsList creatorIds={creatorIds} />
      ) : (
        <p>
          保有している作者IDはありません。作品を投稿すると、その作品の作者IDが保有している作者IDとして登録されます。
        </p>
      )}
    </div>
  );
};
