import React, { useState } from 'react';
import { Users, LogOut, Plus, ArrowRight, Copy, Check } from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
        if (!user) {
            alert("No user found. Please login.");
            return;
        }
        setLoading(true);
        setError('');
        try {
            const code = generateCode();
            alert(`Attempting to create lobby: ${code} for user: ${user.uid}`);

            // 10s Timeout Race
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Request timed out")), 10000)
            );

            await Promise.race([
                setDoc(doc(db, 'lobbies', code), {
                    createdAt: serverTimestamp(),
                    hostId: user.uid,
                    hostName: user.displayName || 'Anonymous',
                    participants: [user.uid]
                }),
                timeoutPromise
            ]);

            alert("Lobby created successfully!");
            onJoinLobby(code, true);
        } catch (err: any) {
            console.error(err);
            alert(`Lobby Create Error: ${err.message}`);
            setError(`Failed: ${err.message}`);
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" />
                    {currentLobbyId ? 'Current Session' : 'Team Sync'}
                </h2>

                {currentLobbyId ? (
                    <div className="space-y-6">
                        <div className="text-center bg-green-50 p-6 rounded-2xl border-2 border-green-100 border-dashed">
                            <p className="text-sm text-green-700 font-semibold mb-2 uppercase tracking-wide">LOBBY CODE</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-5xl font-mono font-bold text-gray-800 tracking-widest">{currentLobbyId}</span>
                                <button onClick={copyToClipboard} className="p-2 hover:bg-green-100 rounded-lg transition-colors">
                                    {copied ? <Check className="w-6 h-6 text-green-600" /> : <Copy className="w-6 h-6 text-gray-400" />}
                                </button>
                            </div>
                        </div>

                        <p className="text-center text-sm text-gray-500">
                            Share this code with your team to log data together in real-time.
                        </p>

                        <button
                            onClick={onLeaveLobby}
                            className="w-full py-3 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Leave Lobby
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Join Section */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Join Existing Lobby</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    placeholder="Enter 4-digit code"
                                    maxLength={4}
                                    className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-lg uppercase focus:border-blue-500 focus:outline-none"
                                />
                                <button
                                    onClick={handleJoinLobby}
                                    disabled={loading || joinCode.length !== 4}
                                    className="bg-blue-600 text-white rounded-xl px-4 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ArrowRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="relative flex items-center py-2">
                            <div className="flex-grow border-t border-gray-200"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
                            <div className="flex-grow border-t border-gray-200"></div>
                        </div>

                        {/* Create Section */}
                        <button
                            onClick={handleCreateLobby}
                            disabled={loading}
                            className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-transform active:scale-95 shadow-lg"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Create New Lobby
                                </>
                            )}
                        </button>

                        {error && (
                            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
