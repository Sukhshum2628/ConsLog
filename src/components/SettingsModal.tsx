import React, { useState } from 'react';
import { X, User, LogOut, Settings, Shield, Users, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { EditProfileModal } from './EditProfileModal';
import { SyncManager } from './SyncManager';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user, logout } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showSyncManager, setShowSyncManager] = useState(false);
    const version = "2.0.0 (Build 15)";

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-scale-up">
                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Settings size={20} className="text-gray-600" />
                            Settings
                        </h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 space-y-3">
                        {user ? (
                            <>
                                <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {user.displayName?.[0] || user.email?.[0] || 'U'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h3 className="font-bold text-gray-900 truncate">{user.displayName || 'User'}</h3>
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { onClose(); setShowProfileModal(true); }}
                                    className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-all text-left"
                                >
                                    <User size={20} className="text-gray-500" />
                                    <span className="font-medium text-gray-700">Edit Profile & Username</span>
                                </button>

                                <button
                                    onClick={() => { onClose(); setShowSyncManager(true); }}
                                    className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-all text-left"
                                >
                                    <Users size={20} className="text-gray-500" />
                                    <span className="font-medium text-gray-700">Manage Team Sync</span>
                                </button>

                                <button className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-xl transition-all text-left"
                                    onClick={() => alert("Privacy Policy: Your data is stored securely on Google Cloud.")}
                                >
                                    <Shield size={20} className="text-gray-500" />
                                    <span className="font-medium text-gray-700">Security & Privacy</span>
                                </button>

                                <div className="h-px bg-gray-100 my-2"></div>

                                <button
                                    onClick={() => { onClose(); logout(); }}
                                    className="w-full p-3 flex items-center gap-3 hover:bg-red-50 text-red-600 rounded-xl transition-all text-left"
                                >
                                    <LogOut size={20} />
                                    <span className="font-bold">Log Out</span>
                                </button>
                            </>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-gray-500 mb-4">Log in to sync your data and access professional features.</p>
                                <button
                                    onClick={() => setShowAuthModal(true)}
                                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all"
                                >
                                    Sign In / Sign Up
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 text-center border-t border-gray-100">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                            <Info size={12} /> ConsLogger v{version}
                        </p>
                    </div>
                </div>
            </div>

            <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
            <EditProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
            <SyncManager isOpen={showSyncManager} onClose={() => setShowSyncManager(false)} />
        </>
    );
};
