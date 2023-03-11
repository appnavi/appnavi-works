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
  const dialog = useContext(ConfirmDialogContext);
  if (dialog === null) {
    throw new Error('ConfirmDialogContextProvider が見つかりません。');
  }
  return dialog;
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
  const [positiveClasses, setPositiveClasses] = useState<string[]>([]);
  const [negativeClasses, setNegativeClasses] = useState<string[]>([]);
  const onPositiveButtonClick = useRef<(() => void) | undefined>(undefined);
  const onNegativeButtonClick = useRef<(() => void) | undefined>(undefined);
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
    onPositiveButtonClick.current = positiveButton.onPresed;
    onNegativeButtonClick.current = negativeButton.onPresed;
    setPositiveClasses(positiveButton.classes ?? []);
    setNegativeClasses(negativeButton.classes ?? []);
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
          <a
            href="#!"
            className={`modal-close ${negativeClasses.join(' ')}`}
            onClick={() => onNegativeButtonClick.current?.()}
          >
            {negativeButtonLabel}
          </a>
          <a
            href="#!"
            className={`modal-close ${positiveClasses.join(' ')}`}
            onClick={() => onPositiveButtonClick.current?.()}
          >
            {positiveButtonLabel}
          </a>
        </div>
      </div>
    </ConfirmDialogContext.Provider>
  );
};
