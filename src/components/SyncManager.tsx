import React, { useState, useEffect } from 'react';
import { X, UserPlus, Check, X as XIcon, RefreshCw, Trash2, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSyncActions, type SyncRequest } from '../hooks/useSyncActions';
import {
    collection,
    query,
    where,
    onSnapshot,
    getDocs // Imported
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SyncManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ConnectedUser {
    uid: string;
    username: string;
    displayName: string;
}

interface Site {
    id: string;
    name: string;
    location: string;
}

export const SyncManager: React.FC<SyncManagerProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { sendRequest, acceptRequest, rejectRequest, disconnect, loading } = useSyncActions();

    const [targetUsername, setTargetUsername] = useState('');
    const [requests, setRequests] = useState<SyncRequest[]>([]);
    const [connections, setConnections] = useState<ConnectedUser[]>([]);

    // Config State
    const [configuringRequest, setConfiguringRequest] = useState<SyncRequest | null>(null);
    const [senderSites, setSenderSites] = useState<Site[]>([]);
    const [loadingSites, setLoadingSites] = useState(false);

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
        const success = await sendRequest(targetUsername);
        if (success) {
            setTargetUsername('');
        }
    };

    const handleConfigureRequest = async (req: SyncRequest) => {
        setConfiguringRequest(req);
        setLoadingSites(true);
        try {
            // Fetch Sender's Sites
            const sitesRef = collection(db, 'users', req.fromUid, 'sites');
            const snap = await getDocs(sitesRef);
            const sites = snap.docs.map(d => ({ id: d.id, ...d.data() } as Site));
            setSenderSites(sites);
        } catch (error) {
            console.error("Error fetching sites:", error);
            setSenderSites([]);
        } finally {
            setLoadingSites(false);
        }
    };

    const handleConfirmAccept = async (siteId: string, siteName: string) => {
        if (!configuringRequest) return;

        await acceptRequest(configuringRequest, siteId, siteName);
        setConfiguringRequest(null);
        setSenderSites([]);
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
                                                onClick={() => handleConfigureRequest(req)}
                                                className="p-2 bg-green-500 text-white rounded-xl hover:bg-green-600 shadow-md shadow-green-500/20 transition-transform active:scale-95"
                                                title="Accept & Configure"
                                            >
                                                <Check size={18} />
                                            </button>
                                            <button
                                                onClick={() => rejectRequest(req.id)}
                                                className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20 transition-transform active:scale-95"
                                                title="Reject"
                                            >
                                                <XIcon size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Site Selection Overlay (Nested in Modal) */}
                    {configuringRequest && (
                        <div className="absolute inset-0 bg-white z-20 p-6 animate-in slide-in-from-right duration-300 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Select Site Scope</h3>
                                    <p className="text-xs text-gray-500">Choose which logs to sync from {configuringRequest.fromUsername}</p>
                                </div>
                                <button
                                    onClick={() => setConfiguringRequest(null)}
                                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                                >
                                    <XIcon size={16} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2">
                                {loadingSites ? (
                                    <div className="flex justify-center py-8">
                                        <RefreshCw className="animate-spin text-blue-500" />
                                    </div>
                                ) : (
                                    <>
                                        {/* All Sites Option */}
                                        {/*
                                        <button
                                            onClick={() => handleConfirmAccept('all', 'All Sites')}
                                            className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                                        >
                                            <div className="font-bold text-gray-800 group-hover:text-blue-700">All Sites</div>
                                            <div className="text-xs text-gray-400">View logs from all locations</div>
                                        </button>
                                        */}

                                        {senderSites.length === 0 ? (
                                            <div className="text-center p-8 text-gray-400">
                                                <p>No sites found for this user.</p>
                                                <button
                                                    onClick={() => handleConfirmAccept('all', 'All Sites')}
                                                    className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-bold"
                                                >
                                                    Sync All Anyway
                                                </button>
                                            </div>
                                        ) : (
                                            senderSites.map(site => (
                                                <button
                                                    key={site.id}
                                                    onClick={() => handleConfirmAccept(site.id, site.name)}
                                                    className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all group relative"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-bold text-gray-800 group-hover:text-blue-700">{site.name}</div>
                                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                                                {site.location || 'No location'}
                                                            </div>
                                                        </div>
                                                        <Check size={16} className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </>
                                )}
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
                                            onClick={() => disconnect(conn.uid)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
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
