import M from '@materializecss/materialize';
import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useRef,
  useEffect,
} from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const doNothing = () => {};

export type ConfirmDialogContextProps = {
  showConfirmDialog: (params: {
    title: string;
    content: ReactNode;
    positiveButton: {
      label: string;
      classes?: string[];
      onPresed?: () => void;
    };
    negativeButton: {
      label: string;
      classes?: string[];
      onPresed?: () => void;
    };
  }) => void;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextProps | null>(
  null,
);

export const useConfirmDialogContext = () => {
  const dialogs = useContext(ConfirmDialogContext);
  if (dialogs === null) {
    throw new Error('ConfirmDialogContextProvider が見つかりません。');
  }
  return dialogs;
};

export const ConfirmDialogContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [positiveButtonLabel, setPositiveButtonLabel] = useState('はい');
  const [negativeButtonLabel, setNegativeButtonLabel] = useState('いいえ');
  let onPositiveButtonClick: (() => void) | undefined = undefined;
  let onNegativeButtonClick: (() => void) | undefined = undefined;
  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    M.Modal.init(modalElement);
  }, []);
  const showConfirmDialog = ({
    title,
    content,
    positiveButton,
    negativeButton,
  }: {
    title: string;
    content: ReactNode;
    positiveButton: {
      label: string;
      classes?: string[];
      onPresed?: () => void;
    };
    negativeButton: {
      label: string;
      classes?: string[];
      onPresed?: () => void;
    };
  }) => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    setModalTitle(title);
    setModalContent(content);
    setPositiveButtonLabel(positiveButton.label);
    setNegativeButtonLabel(negativeButton.label);
    onPositiveButtonClick = positiveButton.onPresed;
    onNegativeButtonClick = negativeButton.onPresed;
    const modalInstance = M.Modal.getInstance(modalElement);
    modalInstance.options.onCloseEnd = doNothing;
    modalInstance.open();
  };
  return (
    <ConfirmDialogContext.Provider value={{ showConfirmDialog }}>
      {children}
      <div className="modal" ref={modalRef}>
        <div className="modal-content">
          <h4 className="title">{modalTitle}</h4>
          <div className="content">{modalContent}</div>
        </div>
        <div className="modal-footer">
          <a href="#!" className="modal-close" onClick={onPositiveButtonClick}>
            {negativeButtonLabel}
          </a>
          <a href="#!" className="modal-close" onClick={onNegativeButtonClick}>
            {positiveButtonLabel}
          </a>
        </div>
      </div>
    </ConfirmDialogContext.Provider>
  );
};
