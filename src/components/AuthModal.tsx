import React, { useState } from 'react';
import { X, Mail, Lock, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                if (password !== confirmPass) {
                    throw new Error("Passwords do not match");
                }
                if (password.length < 6) {
                    throw new Error("Password must be at least 6 characters");
                }
                await signUpWithEmail(email, password);
                setSuccessMsg("Account created! Please check your email for verification.");
                // Switch to sign in or just stay here? Stay here to show msg.
            } else {
                await signInWithEmail(email, password);
                onClose();
            }
        } catch (err: any) {
            console.error(err);
            // Firebase error mapping
            let msg = "Authentication failed";
            if (err.code === 'auth/email-already-in-use') msg = "Email already in use";
            if (err.code === 'auth/wrong-password') msg = "Invalid password";
            if (err.code === 'auth/user-not-found') msg = "User not found";
            if (err.message) msg = err.message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogle = async () => {
        try {
            setLoading(true);
            await signInWithGoogle();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Google Sign-In Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-scale-up">
                {/* Header */}
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">
                        {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 m-4 rounded-lg">
                    <button
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'signin' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                        onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${mode === 'signup' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}
                        onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                            <span className="font-bold">!</span> {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-100 flex items-center gap-2">
                            <Check size={16} /> {successMsg}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="name@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {mode === 'signup' && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 px-4 py-2">
                    <div className="h-px flex-1 bg-gray-200"></div>
                    <span className="text-xs text-gray-400 font-medium">OR CONTINUE WITH</span>
                    <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                {/* Google Button */}
                <div className="p-4 pt-0">
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 active:scale-95 text-gray-700 font-bold rounded-xl transition-all flex items-center justify-center gap-3"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        Google
                    </button>
                </div>
            </div>
        </div>
    );
};
