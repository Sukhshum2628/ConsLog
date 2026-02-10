import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SecurityCheckProps {
    children: React.ReactNode;
}

export const SecurityCheck: React.FC<SecurityCheckProps> = ({ children }) => {
    const { user, sendVerification, setUserPassword, logout } = useAuth();
    const [step, setStep] = useState<'verifying' | 'password_setup' | 'complete'>('complete');
    const [loading, setLoading] = useState(true);
    const [passwordInput, setPasswordInput] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const checkSecurity = async () => {
            if (!user) {
                setStep('complete'); // Not logged in, handled by Onboarding
                setLoading(false);
                return;
            }

            // 1. Check Email Verification (Only if NOT Google? Or ALL?)
            // User requested: "keep this email verification for the normal email... for Google itself, don't keep this"
            const providerId = user.providerData[0]?.providerId;
            const isGoogle = providerId === 'google.com';

            if (!isGoogle && !user.emailVerified) {
                setStep('verifying');
                setLoading(false);
                return;
            }

            // 2. Check Password Setup (For Google Users)
            if (isGoogle) {
                // Check if we already forced them to set a password
                // We'll trust a flag in Firestore 'users/{uid}' -> 'setupComplete'
                // Or 'hasPassword'
                const userRef = doc(db, 'users', user.uid);
                const snap = await getDoc(userRef);

                if (snap.exists() && snap.data().hasPassword) {
                    setStep('complete');
                } else {
                    setStep('password_setup');
                }
                setLoading(false);
                return;
            }

            setStep('complete');
            setLoading(false);
        };

        checkSecurity();
    }, [user]);

    const handleResend = async () => {
        try {
            await sendVerification();
            setMsg('Verification email sent! Check your inbox (and spam).');
        } catch (e) {
            console.error(e);
            setMsg('Error sending email. Try again later.');
        }
    };

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await setUserPassword(passwordInput);
            // Mark as complete in Firestore
            if (user) {
                await setDoc(doc(db, 'users', user.uid), {
                    hasPassword: true,
                    email: user.email,
                    setupComplete: true
                }, { merge: true });
            }
            setStep('complete');
        } catch (e: any) {
            console.error(e);
            setMsg(e.message || 'Failed to set password');
        }
    };

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Loading Security...</div>;

    if (step === 'verifying') {
        return (
            <div className="min-h-screen bg-orange-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <Mail className="text-orange-600" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Verify Your Email</h1>
                <p className="text-gray-600 mb-8 max-w-sm">
                    We sent a verification link to <b>{user?.email}</b>.<br />
                    Please click the link to activate your account.
                </p>

                {msg && <p className="text-green-600 mb-4 text-sm font-semibold">{msg}</p>}

                <div className="space-y-3 w-full max-w-xs">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                        I've Verified It
                    </button>
                    <button
                        onClick={handleResend}
                        className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        Resend Email
                    </button>
                    <button
                        onClick={() => logout()}
                        className="w-full py-3 text-gray-400 font-medium text-sm hover:text-gray-600"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        );
    }

    if (step === 'password_setup') {
        return (
            <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                    <Lock className="text-blue-600" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Secure Your Account</h1>
                <p className="text-gray-600 mb-8 max-w-sm">
                    Since you signed in with Google, please verify your identity by checking your Gmail app for any prompts.
                    <br /><br />
                    <b>Actually, let's set a backup password so you can log in without Google next time.</b>
                </p>

                {msg && <p className="text-red-600 mb-4 text-sm font-semibold">{msg}</p>}

                <form onSubmit={handleSetPassword} className="w-full max-w-xs space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={passwordInput}
                            onChange={e => setPasswordInput(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Create a password"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                        Save Password
                    </button>
                </form>
            </div>
        );
    }

    return <>{children}</>;
};
