import { ErrorResponse } from '@common/types';
import M from '@materializecss/materialize';
import {
  useState,
  createContext,
  useContext,
  ReactNode,
  useRef,
  useEffect,
} from 'react';

export type ErrorDialogContextProps = {
  showErrorDialog: (params: {
    title: string;
    errorMessage: string;
    onClose?: () => void;
  }) => void;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const doNothing = () => {};

const ErrorDialogContext = createContext<ErrorDialogContextProps | null>(null);

export const useErrorDialogContext = () => {
  const dialog = useContext(ErrorDialogContext);
  if (dialog === null) {
    throw new Error('ErrorDialogContextProvider が見つかりません。');
  }
  return dialog;
};

export const ErrorDialogContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    M.Modal.init(modalElement);
  }, []);
  const showErrorDialog = ({
    title,
    errorMessage,
    onClose,
  }: {
    title: string;
    errorMessage: string;
    onClose?: () => void;
  }) => {
    const modalElement = modalRef.current;
    if (modalElement === null) {
      return;
    }
    setModalTitle(title);
    const parsed = ErrorResponse.safeParse(JSON.parse(errorMessage));
    if (parsed.success) {
      setErrors(parsed.data.errors);
    } else {
      setErrors(['想定外のエラーが発生しました']);
    }
    const modalInstance = M.Modal.getInstance(modalElement);
    modalInstance.options.onCloseEnd = onClose ?? doNothing;
    modalInstance.open();
  };
  return (
    <ErrorDialogContext.Provider value={{ showErrorDialog }}>
      {children}
      <div className="modal" ref={modalRef}>
        <div className="modal-content">
          <h4 className="title">{modalTitle}</h4>
          <div className="content">
            {errors.map((err) => (
              <p key={err}>{err}</p>
            ))}
          </div>
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
    </ErrorDialogContext.Provider>
  );
};
