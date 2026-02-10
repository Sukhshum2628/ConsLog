import { useState, useEffect } from 'react';
import { addLog, updateLog, deleteLog, getLogsByDate, getAllLogs, type TrainLog } from '../db';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

export const useTrainLog = (lobbyId: string | null = null) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<TrainLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate active log
    const activeLog = logs.find(l => l.status === 'RUNNING') || null;

    // Calculate total halt time for TODAY
    const totalHaltTime = logs.reduce((total, log) => {
        return total + (log.halt_duration_seconds || 0);
    }, 0);

    // Migration Logic: Local -> Cloud
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
                        console.log("Migration Complete. Clearing local DB.");
                        // Optional: Clear local DB after successful migration
                        // await clearDB(); // Need to implement clearDB if we want this
                        // For now, we leave them as "backup" or manually delete?
                        // Actually, if we leave them, "Guest Mode" will still show them. 
                        // Let's keep them for safety, but maybe mark them? 
                        // User wants "Forever Data". Cloud is forever. 
                    } catch (e) {
                        console.error("Migration Failed", e);
                    }
                }
            }
        };
        migrateLogs();
    }, [user, lobbyId]);

    // Load Data (Listener)
    useEffect(() => {
        setLoading(true);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // 1. LOBBY MODE (Shared)
        if (lobbyId) {
            const q = query(
                collection(db, 'lobbies', lobbyId, 'logs'),
                where('date', '==', dateStr)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const remoteLogs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as TrainLog));
                // Client-side sort
                remoteLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);
                setLogs(remoteLogs);
                setLoading(false);
            }, (err) => {
                console.error("Lobby Sync Error:", err);
                // alert("Sync Error: " + err.message); // Optional: Enable if needed
                setLoading(false);
            });
            return () => unsubscribe();
        }

        // 2. USER CLOUD MODE (Private)
        else if (user) {
            const q = query(
                collection(db, 'users', user.uid, 'logs'),
                where('date', '==', dateStr)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const cloudLogs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as TrainLog));
                // Client-side sort
                cloudLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);
                setLogs(cloudLogs);
                setLoading(false);
            }, (err) => {
                console.error("Cloud Sync Error:", err);
                alert("Sync Error: " + err.message); // Alert user to real-time errors
                setLoading(false);
            });
            return () => unsubscribe();
        }

        // 3. GUEST MODE (Local)
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

    const addEntry = async () => {
        // 1. Prevent multiple running timers
        const alreadyRunning = logs.find(l => l.status === 'RUNNING');
        if (alreadyRunning) {
            alert("A timer is already running! Please stop it first.");
            return;
        }

        try {
            const newLog: TrainLog = {
                id: Date.now(),
                date: format(currentDate, 'yyyy-MM-dd'), // Use currentDate state to match listener
                arrival_timestamp: Date.now(),
                status: 'RUNNING',
                created_at: Date.now()
            };

            // Optimistic update for immediate feedback (optional, but Firestore is usually fast enough)
            // But if there's lag, this helps prevents double-clicks visually if we managed state manually
            // For now, relying on the check above is good.

            if (lobbyId) {
                await setDoc(doc(db, 'lobbies', lobbyId, 'logs', String(newLog.id)), newLog);
            } else if (user) {
                const logRef = doc(db, 'users', user.uid, 'logs', String(newLog.id));
                await setDoc(logRef, newLog);
            } else {
                await addLog(newLog);
                // Refresh local
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                const data = await getLogsByDate(dateStr);
                setLogs(data.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp));
            }
        } catch (error) {
            console.error("FAILED ADD ENTRY:", error);
            alert("Error starting timer: " + (error as any).message);
        }
    };

    const updateEntry = async (updatedLog: TrainLog) => {
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
            alert("Update failed: " + e.message);
        }
    };

    const completeEntry = async (log: TrainLog) => {
        const departure = Date.now();
        const duration = Math.floor((departure - log.arrival_timestamp) / 1000);

        const completedLog: TrainLog = {
            ...log,
            departure_timestamp: departure,
            halt_duration_seconds: duration,
            status: 'COMPLETED'
        };

        await updateEntry(completedLog);
    };

    const removeEntry = async (id: number | string) => {
        if (lobbyId) {
            await deleteDoc(doc(db, 'lobbies', lobbyId, 'logs', String(id)));
        } else if (user) {
            await deleteDoc(doc(db, 'users', user.uid, 'logs', String(id)));
        } else {
            await deleteLog(Number(id));
            setLogs(prev => prev.filter(l => l.id !== id));
        }
    };

    return {
        logs,
        loading,
        addEntry,
        updateEntry,
        completeEntry,
        removeEntry,
        activeLog,
        totalHaltTime,
        setDate: setCurrentDate
    };
};
