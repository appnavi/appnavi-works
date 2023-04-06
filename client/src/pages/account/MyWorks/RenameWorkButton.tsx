import { idRegexPattern } from '@common/constants';
import { WorkDB } from '@common/types';
import M from '@materializecss/materialize';
import { useRef, useEffect, useState } from 'react';
import { MdEdit } from 'react-icons/md';
import { PreventPageLeave } from '../../../components/PreventPageLeave';
import { useMessageDialogContext } from '../../../context/DialogsContext/MessageDialog';
import { trpc } from '../../../trpc';

function shouldDisableRenameButton(
  creatorId: string,
  workId: string,
  renamedCreatorId: string,
  renamedWorkId: string,
) {
  if (renamedCreatorId === '') {
    return true;
  }
  if (renamedWorkId === '') {
    return true;
  }
  if (renamedCreatorId === creatorId && renamedWorkId === workId) {
    return true;
  }
  return false;
}

export const RenameWorkButton = ({ work }: { work: WorkDB }) => {
  const trpcContext = trpc.useContext();
  const { showMessageDialog } = useMessageDialogContext();
  const { mutate, isLoading } = trpc.account.work.rename.useMutation({
    onSuccess() {
      showMessageDialog({
        title: '編集に成功しました',
        onClose() {
          trpcContext.account.work.list.invalidate();
          trpcContext.account.getUserData.invalidate();
        },
      });
    },
    onError(error) {
      showMessageDialog({
        title: '編集に失敗しました',
        text: error.message,
      });
    },
  });
  const { creatorId, workId } = work;
  const modalRef = useRef<HTMLDivElement>(null);
  const [renamedCreatorId, setRenamedCreatorId] = useState(creatorId);
  const [renamedWorkId, setRenamedWorkId] = useState(workId);
  const onClick = () => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    M.Modal.getInstance(modalElement).open();
  };
  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    M.Modal.init(modalElement);
    M.updateTextFields();
  }, []);
  const renameButtonDisabled = shouldDisableRenameButton(
    work.creatorId,
    work.workId,
    renamedCreatorId,
    renamedWorkId,
  );
  return (
    <>
      <button
        className="waves-effect waves-light btn"
        onClick={onClick}
        disabled={isLoading}
      >
        <i className="left flex h-full">
          <MdEdit className="my-auto" />
        </i>
        作者名・作品名の編集
      </button>
      <div className="modal" ref={modalRef}>
        <div className="modal-content">
          <h4 className="title">作品ID・作者IDの編集</h4>
          <div className="content">
            <div className="row">
              <form className="col s12">
                <div className="row">
                  <div className="input-field col s6">
                    <input
                      id="renamedCreatorId"
                      name="renamedCreatorId"
                      type="text"
                      className="validate"
                      pattern={idRegexPattern}
                      required
                      value={renamedCreatorId}
                      onChange={(e) =>
                        setRenamedCreatorId(e.currentTarget.value)
                      }
                    />
                    <label htmlFor="renamedCreatorId">作者ID</label>
                    <span
                      className="helper-text"
                      data-error="数字・アルファベット小文字・ハイフンのみで入力してください"
                      data-success="問題なし"
                    ></span>
                  </div>
                  <div className="input-field col s6">
                    <input
                      id="renamedWorkId"
                      name="renamedWorkId"
                      type="text"
                      className="validate"
                      pattern={idRegexPattern}
                      required
                      value={renamedWorkId}
                      onChange={(e) => setRenamedWorkId(e.currentTarget.value)}
                    />
                    <label htmlFor="renamedWorkId">作品ID</label>
                    <span
                      className="helper-text"
                      data-error="数字・アルファベット小文字・ハイフンのみで入力してください"
                      data-success="問題なし"
                    ></span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <a
            href="#!"
            className="modal-close waves-effect waves-light btn-flat cancel"
          >
            キャンセル
          </a>
          <button
            className="modal-close waves-effect waves-light btn edit"
            disabled={renameButtonDisabled}
            onClick={() =>
              mutate({
                creatorId,
                workId,
                renamedCreatorId,
                renamedWorkId,
              })
            }
          >
            編集する
          </button>
        </div>
      </div>
      <PreventPageLeave shouldPreventLeave={isLoading} />
    </>
  );
};
