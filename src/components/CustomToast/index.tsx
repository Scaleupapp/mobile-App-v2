import React, {createContext, useContext, useState} from 'react';
import Toast from './Toast';

interface ToastMessage {
  text: string;
  type: string;
}

interface ToastContextType {
  showToast: (message: ToastMessage) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC = ({children}) => {
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const showToast = (message: ToastMessage) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => {
      setToastVisible(false);
    }, 1500);
  };

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      {toastVisible && <Toast visible={toastVisible} message={toastMessage!} />}
    </ToastContext.Provider>
  );
};
