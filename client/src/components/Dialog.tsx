import M from '@materializecss/materialize';
import { ReactNode, useEffect, useRef } from 'react';

export const Dialog = ({
  open,
  onClose,
  dismissible,
  children,
}: {
  open: boolean;
  onClose: () => void;
  dismissible: boolean;
  children: ReactNode;
}) => {
  const modalDivRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const modalDiv = modalDivRef.current;
    if (modalDiv === null) {
      return;
    }
    const options: Partial<M.ModalOptions> = {
      onCloseEnd: onClose,
      dismissible,
    };
    const modal = M.Modal.getInstance(modalDiv);
    if (modal === undefined) {
      M.Modal.init(modalDiv, options);
    } else {
      modal.options = { ...modal.options, ...options };
    }
  }, [onClose, dismissible]);
  useEffect(() => {
    const modalDiv = modalDivRef.current;
    if (modalDiv === null) {
      return;
    }
    const modal = M.Modal.getInstance(modalDiv);
    if (open) {
      modal.open();
    } else {
      modal.close();
    }
  }, [open]);
  return (
    <div className="modal" ref={modalDivRef}>
      {children}
    </div>
  );
};
