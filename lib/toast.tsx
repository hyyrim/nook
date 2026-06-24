import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Toast, type ToastType } from '@/components/Toast';

type ToastOptions = {
  duration?: number | null;
};

type ToastState = {
  // 같은 메시지를 다시 띄울 때도 애니메이션을 재시작하기 위한 식별자
  key: number;
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number | null;
};

type ToastContextValue = {
  show: (message: string, type?: ToastType, options?: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({
    key: 0,
    visible: false,
    message: '',
    type: 'success',
    duration: undefined,
  });

  const show = useCallback<ToastContextValue['show']>((message, type = 'success', options) => {
    setState((prev) => ({
      key: prev.key + 1,
      visible: true,
      message,
      type,
      duration: options?.duration,
    }));
  }, []);

  const handleHide = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <Toast
        key={state.key}
        visible={state.visible}
        message={state.message}
        type={state.type}
        duration={state.duration}
        onHide={handleHide}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
