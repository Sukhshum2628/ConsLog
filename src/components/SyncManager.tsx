import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, X as XIcon, RefreshCw, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    onSnapshot,
    doc,
    deleteDoc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SyncManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SyncRequest {
    id: string;
    fromUid: string;
    fromUsername: string;
    fromDisplayName?: string;
    fromPhoto?: string;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: any;
}

interface ConnectedUser {
    uid: string;
    username: string;
    displayName: string;
}

export const SyncManager: React.FC<SyncManagerProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { showConfirm } = useModal();
    const [targetUsername, setTargetUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [requests, setRequests] = useState<SyncRequest[]>([]);
    const [connections, setConnections] = useState<ConnectedUser[]>([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!isOpen || !user) return;

        // 1. Listen for Incoming Requests
        const qReq = query(
            collection(db, 'users', user.uid, 'requests'),
            where('status', '==', 'pending')
        );
        const unsubReq = onSnapshot(qReq, (snap) => {
            const reqs = snap.docs.map(d => ({ id: d.id, ...d.data() } as SyncRequest));
            setRequests(reqs);
        });

        // 2. Listen for Active Connections
        const qConn = collection(db, 'users', user.uid, 'connections');
        const unsubConn = onSnapshot(qConn, (snap) => {
            const conns = snap.docs.map(d => ({ uid: d.id, ...d.data() } as ConnectedUser));
            setConnections(conns);
        });

        return () => {
            unsubReq();
            unsubConn();
        };
    }, [isOpen, user]);

    const handleSendRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !targetUsername) return;
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // 1. Find Target User by Username
            const q = query(collection(db, 'users'), where('username', '==', targetUsername));
            const snap = await getDocs(q);

            if (snap.empty) {
                throw new Error("User not found. Check the username.");
            }

            const targetUserDoc = snap.docs[0];
            const targetUid = targetUserDoc.id;
            const targetData = targetUserDoc.data();

            if (targetUid === user.uid) {
                throw new Error("You cannot sync with yourself.");
            }

            // 2. Check if already connected
            const existingConn = await getDoc(doc(db, 'users', user.uid, 'connections', targetUid));
            if (existingConn.exists()) {
                throw new Error(`Already synced with ${targetData.displayName || targetUsername}`);
            }

            // 3. Send Request (Write to THEIR requests collection)
            // We include OUR details so they know who is asking
            // Need to fetch my own profile to get my username/photo
            const myProfileSnap = await getDoc(doc(db, 'users', user.uid));
            const myProfile = myProfileSnap.data();

            await addDoc(collection(db, 'users', targetUid, 'requests'), {
                fromUid: user.uid,
                fromUsername: myProfile?.username || user.email,
                fromDisplayName: myProfile?.displayName || user.displayName,
                fromPhoto: user.photoURL || null,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            setSuccess(`Request sent to ${targetData.displayName || targetUsername}!`);
            setTargetUsername('');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (req: SyncRequest) => {
        if (!user) return;
        try {
            // 1. Add to MY connections
            await setDoc(doc(db, 'users', user.uid, 'connections', req.fromUid), {
                uid: req.fromUid,
                username: req.fromUsername,
                displayName: req.fromUsername, // Fallback
                connectedAt: new Date()
            });

            // 2. Add ME to THEIR connections (Bidirectional)
            // Fetch my details again
            const myProfileSnap = await getDoc(doc(db, 'users', user.uid));
            const myProfile = myProfileSnap.data();

            await setDoc(doc(db, 'users', req.fromUid, 'connections', user.uid), {
                uid: user.uid,
                username: myProfile?.username || 'Unknown',
                displayName: myProfile?.displayName || 'Unknown',
                connectedAt: new Date()
            });

            // 3. Delete the request
            await deleteDoc(doc(db, 'users', user.uid, 'requests', req.id));
            setSuccess(`You are now synced with ${req.fromUsername}`);
        } catch (e) {
            console.error(e);
            setError("Failed to accept request");
        }
    };

    const handleReject = async (reqId: string) => {
        if (!user) return;
        await deleteDoc(doc(db, 'users', user.uid, 'requests', reqId));
    };

    const handleDisconnect = async (targetUid: string) => {
        if (!user) return;

        const confirmed = await showConfirm({
            title: 'Disconnect Partner',
            message: 'Are you sure? This will remove shared logs and stop syncing.',
            type: 'danger',
            confirmText: 'Disconnect',
            cancelText: 'Cancel'
        });

        if (!confirmed) return;

        try {
            // Remove from BOTH sides
            await deleteDoc(doc(db, 'users', user.uid, 'connections', targetUid));
            await deleteDoc(doc(db, 'users', targetUid, 'connections', user.uid));
        } catch (e) {
            console.error(e);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-white/20 flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-white flex-none">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users size={22} className="text-blue-600" />
                        Sync Partners
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Add Connection */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Add Partner</label>
                        <form onSubmit={handleSendRequest} className="flex gap-3">
                            <input
                                type="text"
                                value={targetUsername}
                                onChange={e => setTargetUsername(e.target.value)}
                                placeholder="Enter Username (e.g. john.doe)"
                                className="flex-1 px-5 py-3 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all placeholder:text-gray-400"
                            />
                            <button
                                type="submit"
                                disabled={loading || !targetUsername}
                                className="px-5 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30"
                            >
                                <UserPlus size={20} />
                            </button>
                        </form>
                        {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>{error}</div>}
                        {success && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>{success}</div>}
                    </div>

                    {/* Incoming Requests */}
                    {requests.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2 tracking-wider">
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                                Pending Requests
                            </label>
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl overflow-hidden divide-y divide-blue-100">
                                {requests.map(req => (
                                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-blue-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold shadow-sm">
                                                {req.fromUsername[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{req.fromUsername}</p>
                                                <p className="text-xs text-blue-600 font-medium">wants to sync log with you</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(req)}
                                                className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 shadow-md shadow-green-500/20 transition-transform active:scale-95"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20 transition-transform active:scale-95"
                                            >
                                                <XIcon size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Connections */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block ml-1">Active Connections</label>
                        {connections.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                                <RefreshCw size={32} className="mx-auto mb-3 opacity-30" />
                                <p className="text-sm font-medium">No synced partners yet.</p>
                                <p className="text-xs mt-1 opacity-70">Add a username above to start syncing.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {connections.map(conn => (
                                    <div key={conn.uid} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-bold text-lg ring-4 ring-green-50">
                                                {conn.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{conn.displayName || conn.username}</p>
                                                <p className="text-xs text-green-600 flex items-center gap-1 font-medium">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                    Synced
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDisconnect(conn.uid)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                            title="Disconnect"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
