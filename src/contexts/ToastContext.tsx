import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Types
export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Provider & Container
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container (Fixed Overlay) */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

// Individual Toast Component
const ToastItem: React.FC<{ toast: ToastData; onClose: () => void }> = ({ toast, onClose }) => {
    const icons = {
        success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
        error: <AlertCircle className="w-5 h-5 text-red-500" />,
        warning: <AlertCircle className="w-5 h-5 text-amber-400" />,
        info: <Info className="w-5 h-5 text-blue-400" />
    };

    const bgColors = {
        success: 'bg-slate-900/90 border-green-500/20',
        error: 'bg-slate-900/90 border-red-500/20',
        warning: 'bg-slate-900/90 border-amber-500/20',
        info: 'bg-slate-900/90 border-blue-500/20'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            layout
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md border ${bgColors[toast.type]} min-w-[300px]`}
        >
            <div className="shrink-0">
                {icons[toast.type]}
            </div>
            <p className="flex-1 text-sm font-medium text-slate-200">
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className="shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4 text-slate-500" />
            </button>
        </motion.div>
    );
};
