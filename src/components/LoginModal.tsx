import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, X } from 'lucide-react';

interface LoginModalProps {
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
    const { signInWithGoogle } = useAuth();

    const handleLogin = async () => {
        await signInWithGoogle();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8">
                <div className="flex justify-end mb-2">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex justify-center mb-6">
                    <div className="bg-blue-100 p-4 rounded-full">
                        <LogIn className="w-10 h-10 text-blue-600" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to TimeLog</h2>
                <p className="text-gray-500 mb-8">Sign in to sync your logs with your team in real-time.</p>

                <button
                    onClick={handleLogin}
                    className="w-full py-3 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-sm"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 4.63c1.69 0 3.21.58 4.39 1.7L19.71 3a9.96 9.96 0 00-7.71-3C7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                    </svg>
                    Continue with Google
                </button>

                <button
                    onClick={onClose}
                    className="mt-4 text-sm text-gray-400 hover:text-gray-600 underline"
                >
                    Continue as Guest (Offline)
                </button>
            </div>
        </div>
    );
};
