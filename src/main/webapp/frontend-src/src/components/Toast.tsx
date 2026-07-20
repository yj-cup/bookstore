import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const iconMap: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400',
  error: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400',
  info: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400',
  warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = 'toast_' + Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const Icon = iconMap[toast.type];
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur text-xs font-medium max-w-sm ${colorMap[toast.type]}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{toast.message}</span>
                <button
                  onClick={() => dismiss(toast.id)}
                  className="shrink-0 p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
