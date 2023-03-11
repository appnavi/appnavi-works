import M from '@materializecss/materialize';
import { useEffect, FormEvent, useRef } from 'react';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { useErrorDialogContext } from '../../context/DialogsContext/ErrorDialog';
import { useMessageDialogContext } from '../../context/DialogsContext/MessageDialog';
import { trpc } from '../../trpc';

export const DefaultCreatorIdForm = () => {
  const { showMessageDialog } = useMessageDialogContext();
  const { showErrorDialog } = useErrorDialogContext();
  const trpcContext = trpc.useContext();
  const { data: defaultCreatorId } =
    trpc.account.getDefaultCreatorId.useQuery();
  const { mutate: mutateDefaultCreatorId, isLoading } =
    trpc.account.setDefaultCreatorId.useMutation({
      onSuccess() {
        trpcContext.account.getDefaultCreatorId.invalidate();
        showMessageDialog({
          title: '成功',
          content: <p>デフォルト作者IDを変更しました</p>,
        });
      },
      onError(error) {
        showErrorDialog({
          title: 'エラー',
          errorMessage: error.message,
        });
      },
    });
  const defaultCreatorIdInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    M.updateTextFields();
  }, [defaultCreatorId]);
  if (defaultCreatorId === undefined) {
    return (
      <div className="grid place-items-center">
        <LoadingSpinner />
      </div>
    );
  }
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = defaultCreatorIdInputRef.current?.value;
    if (value !== undefined) {
      mutateDefaultCreatorId(value);
    }
  };
  return (
    <form action="" className="col s12" onSubmit={handleSubmit}>
      <div className="row">
        <div className="input-field col s12">
          <input
            ref={defaultCreatorIdInputRef}
            type="text"
            name="default_creator_id"
            id="default_creator_id"
            pattern="^[0-9a-z\-]+$"
            required
            defaultValue={defaultCreatorId ?? ''}
          />
          <label htmlFor="default_creator_id">デフォルトの作者ID</label>
          <span
            className="helper-text"
            data-error="数字・アルファベット小文字・ハイフンのみで入力してください"
            data-success="問題なし"
          ></span>
        </div>
      </div>
      <div className="row center">
        <button type="submit" className="btn" disabled={isLoading}>
          設定する
        </button>
      </div>
    </form>
  );
};
