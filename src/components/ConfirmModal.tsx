import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel
}) => {
    const { t } = useLanguage();

    const finalConfirmLabel = confirmLabel === 'Confirm' ? t('common.save') : confirmLabel;
    const finalCancelLabel = cancelLabel === 'Cancel' ? t('common.cancel') : cancelLabel;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-hidden"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-4">
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDestructive ? 'bg-red-500/10 text-red-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>

                            {/* Content */}
                            <div>
                                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    {message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors border border-slate-700"
                                >
                                    {finalCancelLabel}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`flex-1 py-2.5 px-4 font-bold rounded-xl transition-colors shadow-lg ${isDestructive
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
                                        }`}
                                >
                                    {finalConfirmLabel}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
