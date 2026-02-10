import { useState, useEffect, useCallback } from 'react';
import { addLog, updateLog, deleteLog, getLogsByDate, getAllLogs, clearLogs, type TrainLog } from '../db';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

// Types
export interface PartnerData {
    uid: string;
    username: string;
    displayName: string;
    logs: TrainLog[];
    lastSyncedAt: Date | null;
}

interface ConnectionData {
    uid?: string;
    username: string;
    displayName: string;
    [key: string]: any;
}

export const useTrainLog = (lobbyId: string | null = null) => {
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [logs, setLogs] = useState<TrainLog[]>([]);
    const [partnerLogs, setPartnerLogs] = useState<PartnerData[]>([]); // New State
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate active log
    const activeLog = logs.find(l => l.status === 'RUNNING') || null;

    // Calculate total halt time for TODAY
    const totalHaltTime = logs.reduce((total, log) => {
        return total + (log.halt_duration_seconds || 0);
    }, 0);
    useEffect(() => {
        const migrateLogs = async () => {
            if (user && !lobbyId) {
                const localLogs = await getAllLogs();
                if (localLogs.length > 0) {
                    console.log("Migrating local logs to Cloud...");
                    const batch = writeBatch(db);
                    localLogs.forEach(log => {
                        const ref = doc(db, 'users', user.uid, 'logs', String(log.id));
                        batch.set(ref, log);
                    });

                    try {
                        await batch.commit();
                        await clearLogs(); // Clear local DB after sync
                        console.log("Migration Complete. Local DB Verified Cleared.");
                        // Optional: showAlert({ title: 'Sync Complete', message: 'Guest logs have been synced.', type: 'success' });
                    } catch (e) {
                        console.error("Migration Failed", e);
                    }
                }
            }
        };
        migrateLogs();
    }, [user, lobbyId]);

    // 1. Load MY Data (Real-time Listener)
    useEffect(() => {
        setLoading(true);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // LOBBY MODE (Shared - Legacy/Fallback if used)
        if (lobbyId) {
            const q = query(
                collection(db, 'lobbies', lobbyId, 'logs'),
                where('date', '==', dateStr)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const remoteLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainLog));
                remoteLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);
                setLogs(remoteLogs);
                setLoading(false);
            });
            return () => unsubscribe();
        }

        // USER CLOUD MODE (Private)
        else if (user) {
            const q = query(
                collection(db, 'users', user.uid, 'logs'),
                where('date', '==', dateStr)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const cloudLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainLog));
                cloudLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);
                setLogs(cloudLogs);
                setLoading(false);
            }, (err) => {
                console.error("Cloud Sync Error:", err);
                // showAlert({ title: 'Sync Error', message: err.message, type: 'danger' });
                setLoading(false);
            });
            return () => unsubscribe();
        }

        // GUEST MODE (Local)
        else {
            const loadLocal = async () => {
                try {
                    const data = await getLogsByDate(dateStr);
                    setLogs(data.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp));
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            };
            loadLocal();
        }
    }, [lobbyId, currentDate, user]);


    // 2. PARTNER LOGS LOGIC
    // Helper to fetch logs for a specific partner
    const fetchPartnerLogs = useCallback(async (partnerUid: string, partnerName: string, partnerDisplay: string) => {
        if (!user) return;
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        console.log(`Fetching logs for ${partnerName}...`);

        try {
            const q = query(
                collection(db, 'users', partnerUid, 'logs'),
                where('date', '==', dateStr)
            );
            // Use getDocs for one-time fetch (Manual Sync / Interval)
            const { getDocs } = await import('firebase/firestore'); // Dynamic import to avoid top-level if needed, or just use standard
            const snapshot = await getDocs(q);
            const pLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainLog));
            pLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);

            setPartnerLogs(prev => {
                // Remove existing entry for this partner if any
                const filtered = prev.filter(p => p.uid !== partnerUid);
                return [...filtered, {
                    uid: partnerUid,
                    username: partnerName,
                    displayName: partnerDisplay,
                    logs: pLogs,
                    lastSyncedAt: new Date()
                }];
            });
        } catch (e) {
            console.error(`Failed to fetch logs for ${partnerName}`, e);
        }
    }, [user, currentDate]);

    // Listen to Connections & Auto-Sync
    useEffect(() => {
        if (!user || lobbyId) {
            setPartnerLogs([]);
            return;
        }

        // Listen to my connections
        const unsubConn = onSnapshot(collection(db, 'users', user.uid, 'connections'), (snap) => {
            const connections = snap.docs.map(d => ({ ...d.data(), uid: d.id } as ConnectionData));

            // Initialize partner entries if not exist
            setPartnerLogs(prev => {
                const newState = [...prev];
                connections.forEach(conn => {
                    // Fix: Ensure string
                    const connUid = conn.uid || conn.id || '';
                    if (!connUid) return;

                    if (!newState.find(p => p.uid === connUid)) {
                        newState.push({
                            uid: connUid,
                            username: conn.username || 'User',
                            displayName: conn.displayName || 'User',
                            logs: [],
                            lastSyncedAt: null
                        });
                        // Initial fetch
                        fetchPartnerLogs(connUid, conn.username, conn.displayName);
                    }
                });
                return newState;
            });

            // Set up Auto-Sync Interval (5 mins)
            const intervalId = setInterval(() => {
                connections.forEach(conn => {
                    const connUid = conn.uid || conn.id || '';
                    if (connUid) {
                        fetchPartnerLogs(connUid, conn.username, conn.displayName);
                    }
                });
            }, 5 * 60 * 1000); // 5 minutes

            return () => clearInterval(intervalId);
        });

        return () => unsubConn();
    }, [user, lobbyId, currentDate, fetchPartnerLogs]); // Re-run if date changes to fetch new date's logs


    const addEntry = useCallback(async () => {
        // ... (Same as before)
        const alreadyRunning = logs.find(l => l.status === 'RUNNING');
        if (alreadyRunning) {
            showAlert({ title: 'Timer Running', message: 'A timer is already running!\nPlease stop it first.', type: 'warning' });
            return;
        }

        try {
            const newLog: TrainLog = {
                id: Date.now(),
                date: format(currentDate, 'yyyy-MM-dd'),
                arrival_timestamp: Date.now(),
                status: 'RUNNING',
                created_at: Date.now()
            };

            if (lobbyId) {
                await setDoc(doc(db, 'lobbies', lobbyId, 'logs', String(newLog.id)), newLog);
            } else if (user) {
                const logRef = doc(db, 'users', user.uid, 'logs', String(newLog.id));
                await setDoc(logRef, newLog);
            } else {
                await addLog(newLog);
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const data = await getLogsByDate(dateStr);
                setLogs(data.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp));
            }
        } catch (error) {
            console.error("FAILED ADD ENTRY:", error);
            showAlert({ title: 'Error', message: 'Error starting timer: ' + (error as any).message, type: 'danger' });
        }
    }, [logs, lobbyId, user, currentDate, showAlert]);

    const updateEntry = useCallback(async (updatedLog: TrainLog) => {
        // ... (Same as before)
        try {
            if (lobbyId) {
                await setDoc(doc(db, 'lobbies', lobbyId, 'logs', String(updatedLog.id)), updatedLog);
            } else if (user) {
                await setDoc(doc(db, 'users', user.uid, 'logs', String(updatedLog.id)), updatedLog);
            } else {
                await updateLog(updatedLog);
                setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
            }
        } catch (e: any) {
            showAlert({ title: 'Update Failed', message: e.message, type: 'danger' });
        }
    }, [lobbyId, user, showAlert]);

    const completeEntry = useCallback(async (log: TrainLog) => {
        const departure = Date.now();
        const duration = Math.floor((departure - log.arrival_timestamp) / 1000);
        const completedLog: TrainLog = {
            ...log,
            departure_timestamp: departure,
            halt_duration_seconds: duration,
            status: 'COMPLETED'
        };
        await updateEntry(completedLog);
    }, [updateEntry]);

    const removeEntry = useCallback(async (id: number | string) => {
        if (lobbyId) {
            await deleteDoc(doc(db, 'lobbies', lobbyId, 'logs', String(id)));
        } else if (user) {
            await deleteDoc(doc(db, 'users', user.uid, 'logs', String(id)));
        } else {
            await deleteLog(Number(id));
            setLogs(prev => prev.filter(l => l.id !== id));
        }
    }, [lobbyId, user]);

    const copyLogToPersonal = useCallback(async (log: TrainLog) => {
        if (!user) return;
        const newLog: TrainLog = {
            ...log,
            id: Date.now(),
            created_at: Date.now(),
            status: 'COMPLETED', // Ensure copied logs are completed or keep status? Better to be completed if source was completed.
            // If source is running, we might want to copy it as running? No, tricky.
            // Let's assume we copy as is, but generate new ID.
            // Actually, if it's running, we probably shouldn't copy it yet, or copy as running.
        };

        try {
            await setDoc(doc(db, 'users', user.uid, 'logs', String(newLog.id)), newLog);
            showAlert({ title: 'Success', message: 'Log copied to your personal logs!', type: 'success' });
        } catch (e) {
            console.error("Copy failed", e);
            showAlert({ title: 'Error', message: 'Failed to copy log.', type: 'danger' });
        }
    }, [user, showAlert]);

    return {
        logs,
        partnerLogs,
        fetchPartnerLogs,
        loading,
        addEntry,
        updateEntry,
        completeEntry,
        removeEntry,
        copyLogToPersonal, // <--- Exported
        activeLog,
        totalHaltTime,
        setDate: setCurrentDate
    };

};
