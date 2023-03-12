import M from '@materializecss/materialize';
import { useRef, useEffect } from 'react';
import { useMessageDialogContext } from '../../../context/DialogsContext/MessageDialog';
import { trpc } from '../../../trpc';

const ClickToSelectDisplay = ({
  name,
  value,
  label,
}: {
  name: string;
  value: string;
  label: string;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const element = ref?.current;
    if (element === null) {
      return;
    }
    const controller = new AbortController();
    element.addEventListener(
      'click',
      () => {
        element.select();
      },
      { signal: controller.signal },
    );
    return () => {
      controller.abort();
    };
  }, []);
  return (
    <div className="input-field col s12">
      <input
        readOnly
        value={value}
        id={name}
        type="text"
        className="valid"
        ref={ref}
      />
      <label htmlFor={name}>{label}</label>
    </div>
  );
};

const CreatedGuestInfo = ({
  guestId,
  password,
}: {
  guestId: string;
  password: string;
}) => {
  useEffect(() => {
    M.updateTextFields();
  }, []);
  return (
    <div className="section">
      <p>
        <b className="red-text">
          作成されたゲストユーザーのユーザーIDおよびパスワードはこのページを離れると確認できなくなります。
        </b>
      </p>
      <div className="row card-panel">
        <ClickToSelectDisplay
          name="guestId"
          value={guestId}
          label="ユーザーID"
        />
        <ClickToSelectDisplay
          name="password"
          value={password}
          label="パスワード"
        />
      </div>
    </div>
  );
};

export const CreateGuest = () => {
  const trpcContext = trpc.useContext();
  const { showMessageDialog } = useMessageDialogContext();
  const { mutate } = trpc.account.guest.create.useMutation({
    onSuccess(data) {
      showMessageDialog({
        title: 'ゲストユーザーを作成しました',
        content: <CreatedGuestInfo {...data} />,
        onClose() {
          trpcContext.db.fetchAllUsers.invalidate();
        },
      });
    },
    onError(error) {
      showMessageDialog({
        title: 'ゲストユーザー作成に失敗しました',
        text: error.message,
      });
    },
  });
  return (
    <div className="section">
      <h3 className="header">ゲストユーザーの作成</h3>
      <p>
        部員以外の人でも作品をアップロードできるように、ユーザーIDとパスワードでログインできるゲストユーザーを作成できます。
      </p>
      <p>ユーザーIDとパスワードは自動で生成されます。</p>
      <button className="btn" onClick={() => mutate()}>
        ゲストユーザーを作成
      </button>
    </div>
  );
};
