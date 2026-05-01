import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto min-w-[300px] max-w-sm glass p-4 rounded-xl border flex items-start gap-3 shadow-2xl transition-all duration-300 animate-[slideIn_0.3s_ease-out] ${
                            toast.type === 'success' ? 'border-green-500/40 bg-green-500/10' :
                            toast.type === 'error' ? 'border-red-500/40 bg-red-500/10' :
                            toast.type === 'warning' ? 'border-yellow-500/40 bg-yellow-500/10' :
                            'border-primary/40 bg-primary/10'
                        }`}
                    >
                        <span className={`material-symbols-outlined mt-0.5 ${
                            toast.type === 'success' ? 'text-green-500' :
                            toast.type === 'error' ? 'text-red-500' :
                            toast.type === 'warning' ? 'text-yellow-500' :
                            'text-primary'
                        }`}>
                            {toast.type === 'success' ? 'check_circle' :
                             toast.type === 'error' ? 'error' :
                             toast.type === 'warning' ? 'warning' : 'info'}
                        </span>
                        <div className="flex-1">
                            <h4 className={`text-xs font-black uppercase tracking-widest ${
                                toast.type === 'success' ? 'text-green-500' :
                                toast.type === 'error' ? 'text-red-500' :
                                toast.type === 'warning' ? 'text-yellow-500' :
                                'text-primary'
                            }`}>
                                {toast.type}
                            </h4>
                            <p className="text-white/80 text-sm mt-1 leading-snug">{toast.message}</p>
                        </div>
                        <button 
                            onClick={() => removeToast(toast.id)}
                            className="text-white/40 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                    </div>
                ))}
            </div>
            <style>
                {`
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                `}
            </style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
