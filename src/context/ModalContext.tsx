
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

interface ModalOptions {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'danger';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

interface ModalContextType {
    showAlert: (options: ModalOptions) => Promise<void>;
    showConfirm: (options: ModalOptions) => Promise<boolean>;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) throw new Error('useModal must be used within a ModalProvider');
    return context;
};

export const ModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modalState, setModalState] = useState<{
        isOpen: boolean;
        options: ModalOptions;
        resolve?: (value: boolean) => void;
    } | null>(null);

    const showAlert = useCallback((options: ModalOptions) => {
        return new Promise<void>((resolve) => {
            setModalState({
                isOpen: true,
                options: { ...options, cancelText: undefined }, // Alerts usually don't have cancel
                resolve: () => resolve(),
            });
        });
    }, []);

    const showConfirm = useCallback((options: ModalOptions) => {
        return new Promise<boolean>((resolve) => {
            setModalState({
                isOpen: true,
                options,
                resolve,
            });
        });
    }, []);

    const handleClose = (result: boolean) => {
        if (modalState?.resolve) {
            modalState.resolve(result);
        }
        if (result && modalState?.options.onConfirm) {
            modalState.options.onConfirm();
        }
        if (!result && modalState?.options.onCancel) {
            modalState.options.onCancel();
        }
        setModalState(null);
    };

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm }}>
            {children}
            {modalState && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-white/20">
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${modalState.options.type === 'danger' ? 'bg-red-100 text-red-600' :
                                modalState.options.type === 'success' ? 'bg-green-100 text-green-600' :
                                    modalState.options.type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                        'bg-blue-100 text-blue-600'
                                }`}>
                                {modalState.options.type === 'danger' ? <AlertTriangle size={32} /> :
                                    modalState.options.type === 'success' ? <CheckCircle2 size={32} /> :
                                        modalState.options.type === 'warning' ? <AlertTriangle size={32} /> :
                                            <Info size={32} />}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-2">{modalState.options.title}</h3>
                            <p className="text-gray-600 whitespace-pre-line leading-relaxed mb-6">
                                {modalState.options.message}
                            </p>

                            <div className="flex gap-3 justify-center">
                                {modalState.options.cancelText && (
                                    <button
                                        onClick={() => handleClose(false)}
                                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors active:scale-95"
                                    >
                                        {modalState.options.cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={() => handleClose(true)}
                                    className={`px-6 py-3 text-white font-bold rounded-xl transition-all shadow-lg active:scale-95 ${modalState.options.type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' :
                                        modalState.options.type === 'success' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' :
                                            'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                        } ${!modalState.options.cancelText ? 'w-full' : 'flex-1'}`}
                                >
                                    {modalState.options.confirmText || 'OK'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
};
