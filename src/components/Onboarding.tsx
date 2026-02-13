import React from 'react';
import { Shield, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { App } from '@capacitor/app';

interface OnboardingProps {
    onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const { signInWithGoogle } = useAuth();
    const [version, setVersion] = React.useState<string>('');

    React.useEffect(() => {
        App.getInfo().then(info => setVersion(info.version)).catch(() => setVersion(''));
    }, []);

    const handleGuest = () => {
        // Just complete, stay as guest
        onComplete();
    };

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
            onComplete();
        } catch (error) {
            console.error("Onboarding Login Error:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
            <div className="max-w-md w-full space-y-12">

                {/* Logo / Hero */}
                <div className="space-y-4">
                    <div className="w-24 h-24 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-blue-200">
                        <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">TimeLog v{version || '...'}</h1>
                    <p className="text-gray-500 text-lg">
                        Professional Time tracking application for construction workers
                    </p>
                </div>

                {/* Features */}
                <div className="space-y-3 text-left bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <Feature text="Offline-first reliability" />
                    <Feature text="Real-time Team Sync" />
                    <Feature text="One-tap PDF Reports" />
                </div>

                {/* Actions */}
                <div className="space-y-4 pt-4">
                    <button
                        onClick={handleLogin}
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
                    >
                        <Shield className="w-5 h-5" />
                        Sign In with Google
                    </button>

                    <button
                        onClick={handleGuest}
                        className="w-full py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                    >
                        <User className="w-5 h-5" />
                        Continue as Guest
                    </button>
                    <p className="text-xs text-gray-400 mt-4">
                        You can always sign in later from Settings.
                    </p>
                </div>
            </div>
        </div>
    );
};

const Feature = ({ text }: { text: string }) => (
    <div className="flex items-center gap-3 text-gray-700 font-medium">
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
        {text}
    </div>
);
