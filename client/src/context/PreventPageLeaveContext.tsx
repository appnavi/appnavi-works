import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';

function alertBeforeLeave(event: BeforeUnloadEvent) {
  event.preventDefault();
  event.returnValue = '';
}

const PreventPageLeaveContext = createContext<{
  preventPageLeave: boolean;
  setPreventPageLeave: (preventPageLeave: boolean) => void;
} | null>(null);

export const useSetPreventPageLeave = () => {
  const context = useContext(PreventPageLeaveContext);
  if (context === null) {
    throw new Error('PreventPageLeaveProviderを追加してください');
  }
  return context;
};

export const PreventPageLeaveContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [preventPageLeave, setPreventPageLeave] = useState(false);
  useEffect(() => {
    if (preventPageLeave) {
      window.addEventListener('beforeunload', alertBeforeLeave);
      return () => {
        window.removeEventListener('beforeunload', alertBeforeLeave);
      };
    }
  }, [preventPageLeave]);
  return (
    <PreventPageLeaveContext.Provider
      value={{ preventPageLeave, setPreventPageLeave }}
    >
      {children}
    </PreventPageLeaveContext.Provider>
  );
};
