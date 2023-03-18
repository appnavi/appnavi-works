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
    text?: string;
    content?: ReactNode;
    onClose?: () => void;
  }) => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const doNothing = () => {};

const MessageDialogContext = createContext<MessageDialogContextProps | null>(
  null,
);

export const useMessageDialogContext = () => {
  const dialog = useContext(MessageDialogContext);
  if (dialog === null) {
    throw new Error('MessageDialogContextProvider が見つかりません。');
  }
  return dialog;
};

export const MessageDialogContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
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
    text,
    content,
    onClose,
  }: {
    title: string;
    text?: string;
    content?: ReactNode;
    onClose?: () => void;
  }) => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    setModalTitle(title);
    if (text) {
      setModalContent(
        <>
          {text.split('\n').map((line) => (
            <p key={line}>{line}</p>
          ))}
        </>,
      );
    } else if (content) {
      setModalContent(content);
    } else {
      setModalContent(null);
    }
    const modalInstance = M.Modal.getInstance(modalElement);
    modalInstance.options.onCloseEnd = onClose ?? doNothing;
    modalInstance.open();
  };
  return (
    <MessageDialogContext.Provider value={{ showMessageDialog }}>
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
    </MessageDialogContext.Provider>
  );
};
