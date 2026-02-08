import React from 'react';
import { X, UserCircle, LogOut, Shield, Wifi, WifiOff, Users, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsModalProps {
    onClose: () => void;
    onOpenLobby: () => void;
    lobbyId: string | null;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onOpenLobby, lobbyId }) => {
    const { user, login, logout } = useAuth();
    const version = "2.0.0 (Build 14)";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-800">Settings</h2>
                    <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-6">

                    {/* User Section */}
                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                        {user ? (
                            <>
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="User" className="w-12 h-12 rounded-full border border-gray-200" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xl">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{user.displayName || 'User'}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserCircle className="w-8 h-8 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">Guest User</p>
                                    <p className="text-xs text-gray-500">Not signed in</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions List */}
                    <div className="space-y-2">
                        {/* Lobby / Sync */}
                        <button
                            onClick={() => {
                                if (user) {
                                    onOpenLobby();
                                    onClose();
                                } else {
                                    alert("Please sign in to use Team Sync.");
                                }
                            }}
                            className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-indigo-600" />
                                <span className="font-medium text-gray-700">Team Sync</span>
                            </div>
                            {lobbyId ? (
                                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                    <Wifi className="w-3 h-3" /> {lobbyId}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <WifiOff className="w-3 h-3" /> Offline
                                </span>
                            )}
                        </button>

                        {/* Sign In / Out */}
                        {user ? (
                            <button
                                onClick={() => {
                                    if (confirm('Log out?')) {
                                        logout();
                                        onClose();
                                    }
                                }}
                                className="w-full flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:bg-red-50 hover:border-red-100 hover:text-red-600 transition-colors text-gray-700"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Sign Out</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    login();
                                    onClose();
                                }}
                                className="w-full flex items-center gap-3 p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md"
                            >
                                <Shield className="w-5 h-5" />
                                <span className="font-bold">Sign In with Google</span>
                            </button>
                        )}
                    </div>

                    {/* Info Footer */}
                    <div className="text-center pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                            <Info className="w-3 h-3" />
                            TimeLog v{version}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
