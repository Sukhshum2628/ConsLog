import * as React from 'react';
import { useState } from 'react';
import { ArrowRight, X, Shield, Settings, User, Users, Trash2, LogOut, Info, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTrainLog } from '../hooks/useTrainLog';
import { useModal } from '../context/ModalContext';
import { AuthModal } from './AuthModal';
import { SyncManager } from './SyncManager';

import { App } from '@capacitor/app';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEditProfile: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onEditProfile }) => {
    const { user, logout } = useAuth();
    const { activeLog, clearAllLogs } = useTrainLog();
    const { showAlert, showConfirm } = useModal();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showSyncManager, setShowSyncManager] = useState(false);
    const [view, setView] = useState<'main' | 'privacy'>('main');
    const [version, setVersion] = useState<string>('Loading...');

    React.useEffect(() => {
        const fetchVersion = async () => {
            try {
                const info = await App.getInfo();
                setVersion(`${info.version}`);
            } catch (e) {
                console.error("Failed to get app version", e);
                setVersion('Unknown');
            }
        };
        fetchVersion();
    }, []);

    if (!isOpen) return null;

    if (view === 'privacy') {
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleIn border border-white/20">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b flex justify-between items-center">
                        <button onClick={() => setView('main')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
                            <ArrowRight className="rotate-180 group-hover:-translate-x-1 transition-transform" size={20} />
                            <span className="font-bold">Back</span>
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 transform duration-200 hover:scale-110 active:scale-95">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                        <div className="flex justify-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center ring-8 ring-blue-50/50">
                                <Shield size={40} className="text-blue-500" />
                            </div>
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Security & Privacy</h2>
                            <p className="text-gray-500 text-sm">How we protect your data</p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="text-gray-700 text-sm leading-relaxed mb-4">
                                Your data is securely stored on <b>Google Cloud Firestore</b>.
                                We use industry-standard encryption for transmission.
                            </p>
                            <ul className="text-sm text-gray-600 space-y-3">
                                <li className="flex gap-2.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                                    <span>We never sell your personal data.</span>
                                </li>
                                <li className="flex gap-2.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                                    <span>Sync data is only visible to authorized partners.</span>
                                </li>
                                <li className="flex gap-2.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></div>
                                    <span>You can request account deletion.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-scaleIn border border-white/20">
                    <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Settings size={22} className="text-gray-700" />
                                Settings
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600 transform duration-200 hover:scale-110 active:scale-95">
                            <X size={22} />
                        </button>
                    </div>

                    <div className="p-5 space-y-3">
                        {user ? (
                            <>
                                <div className="p-5 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl flex items-center gap-4 shadow-sm mb-2">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md ring-4 ring-blue-50">
                                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-gray-900 truncate text-lg">{user.displayName || 'User'}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                                            <p className="text-xs text-gray-500 truncate font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onEditProfile}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 rounded-2xl transition-all text-left group border border-transparent hover:border-gray-100"
                                >
                                    <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-blue-100 transition-colors">
                                        <User size={20} className="text-gray-500 group-hover:text-blue-600" />
                                    </div>
                                    <span className="font-semibold text-gray-700 group-hover:text-gray-900">Edit Profile & Username</span>
                                </button>

                                <button
                                    onClick={() => setShowSyncManager(true)}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 rounded-2xl transition-all text-left group border border-transparent hover:border-gray-100"
                                >
                                    <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-purple-100 transition-colors">
                                        <Users size={20} className="text-gray-500 group-hover:text-purple-600" />
                                    </div>
                                    <span className="font-semibold text-gray-700 group-hover:text-gray-900">Manage Team Sync</span>
                                </button>

                                <button
                                    onClick={() => setView('privacy')}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 rounded-2xl transition-all text-left group border border-transparent hover:border-gray-100"
                                >
                                    <div className="p-2 bg-gray-100 rounded-xl group-hover:bg-green-100 transition-colors">
                                        <Shield size={20} className="text-gray-500 group-hover:text-green-600" />
                                    </div>
                                    <span className="font-semibold text-gray-700 group-hover:text-gray-900">Security & Privacy</span>
                                </button>

                                <div className="h-px bg-gray-100 my-2 mx-2"></div>

                                <button
                                    onClick={async () => {
                                        const confirmed = await showConfirm({
                                            title: 'Clear Database',
                                            message: 'Are you sure? This will PERMANENTLY delete ALL your logs from the database. This action cannot be undone.',
                                            type: 'danger',
                                            confirmText: 'Yes, Delete Everything',
                                            cancelText: 'Cancel'
                                        });

                                        if (confirmed) {
                                            await clearAllLogs();
                                            onClose();
                                        }
                                    }}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-red-50 text-red-600 rounded-2xl transition-all text-left group border border-transparent hover:border-red-100"
                                >
                                    <div className="p-2 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                                        <Trash2 size={20} className="text-red-500 group-hover:text-red-600" />
                                    </div>
                                    <span className="font-bold">Clear Database (Logs Only)</span>
                                </button>

                                <div className="h-px bg-gray-100 my-2 mx-2"></div>

                                <button
                                    onClick={async () => {
                                        if (activeLog) {
                                            await showAlert({
                                                title: 'Cannot Log Out',
                                                message: 'A timer is currently running. Please stop the timer to save your data before logging out.',
                                                type: 'warning'
                                            });
                                            return;
                                        }

                                        const confirmed = await showConfirm({
                                            title: 'Log Out',
                                            message: 'Are you sure you want to log out?',
                                            type: 'danger',
                                            confirmText: 'Log Out',
                                            cancelText: 'Cancel'
                                        });

                                        if (confirmed) {
                                            try {
                                                await logout();
                                                onClose();
                                            } catch (error) {
                                                console.error("Logout failed", error);
                                            }
                                        }
                                    }}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-orange-50 text-orange-600 rounded-2xl transition-all text-left group border border-transparent hover:border-orange-100"
                                >
                                    <div className="p-2 bg-orange-50 rounded-xl group-hover:bg-orange-100 transition-colors">
                                        <LogOut size={20} className="text-orange-500 group-hover:text-orange-600" />
                                    </div>
                                    <span className="font-bold">Log Out</span>
                                </button>

                                <button
                                    onClick={async () => {
                                        const confirmed = await showConfirm({
                                            title: 'Hard Reset?',
                                            message: 'This will wipe LOCAL storage/cache and force a re-login. Safe for cloud data.',
                                            type: 'danger',
                                            confirmText: 'Reset App',
                                            cancelText: 'Cancel'
                                        });

                                        if (confirmed) {
                                            try {
                                                localStorage.clear();
                                                sessionStorage.clear();
                                                await logout();
                                                window.location.reload();
                                            } catch (error) {
                                                console.error("Reset failed", error);
                                            }
                                        }
                                    }}
                                    className="w-full p-4 flex items-center gap-4 hover:bg-red-50 text-red-600 rounded-2xl transition-all text-left group border border-transparent hover:border-red-100 mt-2"
                                >
                                    <div className="p-2 bg-red-100 rounded-xl group-hover:bg-red-200 transition-colors">
                                        <RefreshCw size={20} className="text-red-600" />
                                    </div>
                                    <span className="font-bold">Hard Reset (Fix Issues)</span>
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="text-blue-500" size={32} />
                                </div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">Sign In Required</h3>
                                <p className="text-gray-500 mb-6 text-sm px-4">Log in to sync your data across devices and access professional features.</p>
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Sign In / Sign Up
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1 font-medium">
                            <Info size={12} /> ConsLogger v{version}
                        </p>
                    </div>
                </div>
            </div>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

            <SyncManager isOpen={showSyncManager} onClose={() => setShowSyncManager(false)} />
        </>
    );
};
