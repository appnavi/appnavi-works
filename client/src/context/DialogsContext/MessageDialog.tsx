import M from '@materializecss/materialize';
import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useRef,
  useEffect,
} from 'react';

export type MessageDialogContextProps = {
  showMessageDialog: (params: {
    title: string;
    content: ReactNode;
    onClose?: () => void;
  }) => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const doNothing = () => {};

const DialogsContext = createContext<MessageDialogContextProps | null>(null);

export const useMessageDialogContext = () => {
  const dialogs = useContext(DialogsContext);
  if (dialogs === null) {
    throw new Error('MessageDialogContextProvider が見つかりません。');
  }
  return dialogs;
};

export const MessageDialogContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    M.Modal.init(modalElement);
  }, []);
  const showMessageDialog = ({
    title,
    content,
    onClose,
  }: {
    title: string;
    content: ReactNode;
    onClose?: () => void;
  }) => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    setModalTitle(title);
    setModalContent(content);
    const modalInstance = M.Modal.getInstance(modalElement);
    modalInstance.options.onCloseEnd = onClose ?? doNothing;
    modalInstance.open();
  };
  return (
    <DialogsContext.Provider value={{ showMessageDialog }}>
      {children}
      <div className="modal" ref={modalRef}>
        <div className="modal-content">
          <h4 className="title">{modalTitle}</h4>
          <div className="content">{modalContent}</div>
        </div>
        <div className="modal-footer">
          <a
            href="#!"
            className="modal-close waves-effect waves-green btn-flat"
          >
            閉じる
          </a>
        </div>
      </div>
    </DialogsContext.Provider>
  );
};
