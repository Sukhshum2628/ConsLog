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
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <Mail className="text-orange-600" size={36} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Verify Your Email</h1>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        We sent a verification link to<br />
                        <span className="font-semibold text-gray-900">{user?.email}</span>
                        <br /><span className="text-xs text-gray-400 mt-2 block">Please check your inbox and spam folder.</span>
                    </p>

                    {msg && <div className="bg-green-50 text-green-700 p-3 rounded-xl mb-6 text-sm font-semibold border border-green-100">{msg}</div>}

                    <div className="space-y-3 w-full">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                        >
                            I've Verified It
                        </button>
                        <button
                            onClick={handleResend}
                            className="w-full py-3.5 bg-white border-2 border-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-gray-200 active:scale-95 transition-all duration-200"
                        >
                            Resend Email
                        </button>
                        <button
                            onClick={() => logout()}
                            className="w-full py-3 text-gray-400 font-medium text-sm hover:text-gray-600 transition-colors"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 'password_setup') {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-center p-8 animate-in zoom-in-95 duration-200">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-blue-600" size={36} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">Secure Your Account</h1>
                    <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                        To ensure you never lose access, please set a <span className="font-semibold text-gray-900">backup password</span> for your account.
                    </p>

                    {msg && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-6 text-sm font-semibold border border-red-100">{msg}</div>}

                    <form onSubmit={handleSetPassword} className="w-full space-y-4">
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                                placeholder="Create a strong password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200"
                        >
                            Save & Continue
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};
