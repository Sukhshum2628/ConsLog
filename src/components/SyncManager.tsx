import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, X as XIcon, RefreshCw, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
                timestamp: serverTimestamp() // We can use serverTimestamp here as request creation is simple
                // If serverTimestamp causes issues (like before), use new Date()
                // timestamp: new Date()
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
        if (!user || !confirm("Are you sure? This will remove shared logs.")) return;
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-scale-up flex flex-col max-h-[80vh]">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 flex-none">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        Sync Partners
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Add Connection */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Add Partner</label>
                        <form onSubmit={handleSendRequest} className="flex gap-2">
                            <input
                                type="text"
                                value={targetUsername}
                                onChange={e => setTargetUsername(e.target.value)}
                                placeholder="Enter Username (e.g. john.doe)"
                                className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading || !targetUsername}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                            >
                                <UserPlus size={20} />
                            </button>
                        </form>
                        {error && <p className="text-red-500 text-xs">{error}</p>}
                        {success && <p className="text-green-500 text-xs">{success}</p>}
                    </div>

                    {/* Incoming Requests */}
                    {requests.length > 0 && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                                Pending Requests
                            </label>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl overflow-hidden divide-y divide-blue-100">
                                {requests.map(req => (
                                    <div key={req.id} className="p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold text-xs">
                                                {req.fromUsername[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{req.fromUsername}</p>
                                                <p className="text-[10px] text-gray-500">wants to sync</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(req)}
                                                className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shadow-sm"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleReject(req.id)}
                                                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-sm"
                                            >
                                                <XIcon size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Connections */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Active Connections</label>
                        {connections.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                                <RefreshCw size={24} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No synced partners yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {connections.map(conn => (
                                    <div key={conn.uid} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                                                {conn.username?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{conn.displayName || conn.username}</p>
                                                <p className="text-xs text-gray-500">Synced</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDisconnect(conn.uid)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={18} />
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
