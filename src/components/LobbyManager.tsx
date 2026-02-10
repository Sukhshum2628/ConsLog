import React, { useState } from 'react';
import { Users, LogOut, Plus, ArrowRight, Copy, Check, X } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface LobbyManagerProps {
    currentLobbyId: string | null;
    onJoinLobby: (id: string, isHost: boolean) => void;
    onLeaveLobby: () => void;
    onClose: () => void;
}

export const LobbyManager: React.FC<LobbyManagerProps> = ({ currentLobbyId, onJoinLobby, onLeaveLobby, onClose }) => {
    const { user } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    // Generate 4-char code (e.g., "AF2X")
    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleCreateLobby = async () => {
        if (!user) return;
        setLoading(true);
        setError('');
        try {
            const code = generateCode();
            await setDoc(doc(db, 'lobbies', code), {
                createdAt: new Date(),
                hostId: user.uid,
                hostName: user.displayName || 'Anonymous',
                participants: [user.uid]
            });
            onJoinLobby(code, true);
        } catch (err) {
            console.error(err);
            setError('Failed to create lobby');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinLobby = async () => {
        if (!user) return;
        if (joinCode.length !== 4) {
            setError('Code must be 4 characters');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const code = joinCode.toUpperCase();
            const lobbyRef = doc(db, 'lobbies', code);
            const lobbySnap = await getDoc(lobbyRef);

            if (lobbySnap.exists()) {
                onJoinLobby(code, false);
            } else {
                setError('Lobby not found');
            }
        } catch (err) {
            console.error(err);
            setError('Failed to join lobby');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (currentLobbyId) {
            navigator.clipboard.writeText(currentLobbyId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-in zoom-in-95 duration-200 border border-white/20">
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            {currentLobbyId ? 'Active Session' : 'Team Sync'}
                        </h2>
                        <p className="text-sm text-gray-500">Collaborate with your crew</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" /> // Replaced SVG with Lucide X
                    </button>
                </div>

                <div className="p-6">
                    {currentLobbyId ? (
                        <div className="space-y-6">
                            <div className="text-center bg-gradient-to-br from-green-50 to-white p-8 rounded-3xl border border-green-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={100} className="text-green-600" />
                                </div>
                                <p className="text-xs text-green-600 font-bold mb-3 uppercase tracking-widest">Lobby Code</p>
                                <div className="flex items-center justify-center gap-4 relative z-10">
                                    <span className="text-5xl font-mono font-black text-gray-900 tracking-widest drop-shadow-sm">{currentLobbyId}</span>
                                    <button onClick={copyToClipboard} className="p-3 bg-white hover:bg-green-50 rounded-xl shadow-sm border border-gray-100 transition-all active:scale-95">
                                        {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-gray-400" />}
                                    </button>
                                </div>
                            </div>

                            <p className="text-center text-sm text-gray-500 px-4">
                                Share this code with your team. Logs added by anyone will appear instantly for everyone.
                            </p>

                            <button
                                onClick={onLeaveLobby}
                                className="w-full py-4 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-600 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border border-gray-100 hover:border-red-100"
                            >
                                <LogOut className="w-5 h-5" />
                                Leave Lobby
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Join Section */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Join a Squad</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        placeholder="Enter 4-digit code"
                                        maxLength={4}
                                        className="flex-1 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-5 py-4 font-mono text-2xl uppercase text-center tracking-widest outline-none transition-all placeholder:text-gray-300"
                                    />
                                    <button
                                        onClick={handleJoinLobby}
                                        disabled={loading || joinCode.length !== 4}
                                        className="bg-blue-600 text-white rounded-2xl px-6 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30 active:scale-95 flex items-center justify-center"
                                    >
                                        {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                                    </button>
                                </div>
                            </div>

                            <div className="relative flex items-center">
                                <div className="flex-grow border-t border-gray-200"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-bold uppercase">Or start fresh</span>
                                <div className="flex-grow border-t border-gray-200"></div>
                            </div>

                            {/* Create Section */}
                            <button
                                onClick={handleCreateLobby}
                                disabled={loading}
                                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl shadow-gray-900/20"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <div className="p-1 bg-white/20 rounded-lg">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        Create New Lobby
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="text-red-500 text-sm font-medium text-center bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
