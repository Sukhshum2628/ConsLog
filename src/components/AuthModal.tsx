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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20">
                {/* Header */}
                <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Lock size={100} />
                    </div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-1">
                                {mode === 'signin' ? 'Welcome Back' : 'Join ConsLogger'}
                            </h2>
                            <p className="text-blue-100 text-sm">
                                {mode === 'signin' ? 'Sign in to access your logs' : 'Create an account to get started'}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-2 bg-gray-50 border-b border-gray-100">
                    <button
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'signin' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => { setMode('signin'); setError(''); setSuccessMsg(''); }}
                    >
                        Sign In
                    </button>
                    <button
                        className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${mode === 'signup' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => { setMode('signup'); setError(''); setSuccessMsg(''); }}
                    >
                        Sign Up
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-4 bg-green-50 text-green-600 text-sm rounded-2xl border border-green-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                            <Check size={16} /> {successMsg}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium placeholder:text-gray-400"
                                placeholder="Email Address"
                            />
                        </div>

                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium placeholder:text-gray-400"
                                placeholder="Password"
                            />
                        </div>

                        {mode === 'signup' && (
                            <div className="relative group animate-in slide-in-from-top-5">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all font-medium placeholder:text-gray-400"
                                    placeholder="Confirm Password"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:scale-100"
                    >
                        {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="h-px flex-1 bg-gray-100"></div>
                        <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Or continue with</span>
                        <div className="h-px flex-1 bg-gray-100"></div>
                    </div>

                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full py-4 bg-white border-2 border-gray-100 hover:bg-gray-50 hover:border-gray-200 active:scale-95 text-gray-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 relative overflow-hidden"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 relative z-10" alt="Google" />
                        <span className="relative z-10">Google</span>
                    </button>
                </form>
            </div>
        </div>
    );
};
