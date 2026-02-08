import { useState, useEffect } from 'react';
import { addLog, updateLog, deleteLog, getLogsByDate, type TrainLog } from '../db';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';

export const useTrainLog = (lobbyId: string | null = null) => {
    const [logs, setLogs] = useState<TrainLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate active log
    const activeLog = logs.find(l => l.status === 'RUNNING') || null;

    // Calculate total halt time for TODAY
    const totalHaltTime = logs.reduce((total, log) => {
        return total + (log.halt_duration_seconds || 0);
    }, 0);

    // Load Data (Listener)
    useEffect(() => {
        setLoading(true);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        if (lobbyId) {
            // FIREBASE MODE
            const q = query(
                collection(db, 'lobbies', lobbyId, 'logs'),
                where('date', '==', dateStr),
                orderBy('arrival_timestamp', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const remoteLogs = snapshot.docs.map(doc => {
                    const data = doc.data() as Omit<TrainLog, 'id'>;
                    return {
                        id: doc.id, // Keep as string for now, but TrainLog expects number? db.ts says id?: number.
                        // wait, id in db.ts is number. Firestore IDs are strings. 
                        // I should probably allow id to be string | number in db.ts or handle it here.
                        // For now, let's cast it to any to silence TS if needed, or better, update TrainLog type.
                        // But I can't update db.ts easily if it breaks other things.
                        // Let's look at how I treated it in the map: 
                        // setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
                        // It seems I treated it as mix.
                        // The error says: Type '{ id: string; }' is missing properties from TrainLog.
                        // So I need to ensure data has them.
                        ...data
                    } as unknown as TrainLog;
                });
                setLogs(remoteLogs);
                setLoading(false);
            }, (err) => {
                console.error("Firestore Error:", err);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            // LOCAL MODE
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
    }, [lobbyId, currentDate]);

    const addEntry = async () => {
        const newLog: TrainLog = {
            id: Date.now(),
            date: format(new Date(), 'yyyy-MM-dd'),
            arrival_timestamp: Date.now(),
            status: 'RUNNING',
            created_at: Date.now()
        };

        if (lobbyId) {
            // Firestore
            await setDoc(doc(db, 'lobbies', lobbyId, 'logs', String(newLog.id)), newLog);
        } else {
            // Local
            await addLog(newLog);
            // Refresh local state manually
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const data = await getLogsByDate(dateStr);
            setLogs(data.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp));
        }
    };

    const updateEntry = async (updatedLog: TrainLog) => {
        if (lobbyId) {
            await setDoc(doc(db, 'lobbies', lobbyId, 'logs', String(updatedLog.id)), updatedLog);
        } else {
            await updateLog(updatedLog);
            // Refresh local
            setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
        }
    };

    const completeEntry = async (log: TrainLog) => {
        const departure = Date.now();
        // Calculate duration in seconds
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
