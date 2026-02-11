import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { addLog, updateLog, deleteLog, type TrainLog } from '../db';


export interface LogContext {
    userId?: string | null;
    lobbyId?: string | null;
}

export const HaltService = {
    /**
     * Helper to sanitize data for Firestore (remove undefined)
     */
    sanitizeData: <T extends object>(data: T): T => {
        const sanitized = { ...data };
        Object.keys(sanitized).forEach(key => {
            // @ts-ignore
            if (sanitized[key] === undefined) {
                // @ts-ignore
                sanitized[key] = null;
            }
        });
        return sanitized;
    },

    /**
     * Create a new halt log
     */
    createHalt: async (data: Omit<TrainLog, 'id' | 'created_at'>, context: LogContext) => {
        const newLog: TrainLog = {
            ...data,
            id: Date.now(),
            created_at: Date.now(),
        };

        const sanitizedLog = HaltService.sanitizeData(newLog);

        if (context.lobbyId) {
            await setDoc(doc(db, 'lobbies', context.lobbyId, 'logs', String(newLog.id)), sanitizedLog);
        } else if (context.userId) {
            await setDoc(doc(db, 'users', context.userId, 'logs', String(newLog.id)), sanitizedLog);
        } else {
            // Local fallback (Guest)
            await addLog(newLog); // Local DB might handle undefined, but consistent is better
        }
        return newLog;
    },

    /**
     * Update an existing halt log
     */
    updateHalt: async (log: TrainLog, context: LogContext) => {
        const sanitizedLog = HaltService.sanitizeData(log);

        if (context.lobbyId) {
            await setDoc(doc(db, 'lobbies', context.lobbyId, 'logs', String(log.id)), sanitizedLog);
        } else if (context.userId) {
            await setDoc(doc(db, 'users', context.userId, 'logs', String(log.id)), sanitizedLog);
        } else {
            await updateLog(log);
        }
    },

    /**
     * Delete a halt log
     */
    deleteHalt: async (id: number | string, context: LogContext) => {
        if (context.lobbyId) {
            await deleteDoc(doc(db, 'lobbies', context.lobbyId, 'logs', String(id)));
        } else if (context.userId) {
            await deleteDoc(doc(db, 'users', context.userId, 'logs', String(id)));
        } else {
            await deleteLog(Number(id));
        }
    },

    /**
     * Stop a running halt
     */
    stopHalt: async (log: TrainLog, context: LogContext) => {
        const departure = Date.now();
        const duration = Math.floor((departure - log.arrival_timestamp) / 1000);
        const completedLog: TrainLog = {
            ...log,
            departure_timestamp: departure,
            halt_duration_seconds: duration,
            status: 'COMPLETED'
        };
        await HaltService.updateHalt(completedLog, context);
        return completedLog;
    },

    /**
     * Batch delete halts
     */
    bulkDeleteHalts: async (ids: (number | string)[], context: LogContext) => {
        if (ids.length === 0) return;

        if (context.lobbyId) {
            const batch = writeBatch(db);
            ids.forEach(id => {
                const ref = doc(db, 'lobbies', context.lobbyId!, 'logs', String(id));
                batch.delete(ref);
            });
            await batch.commit();
        } else if (context.userId) {
            const batch = writeBatch(db);
            ids.forEach(id => {
                const ref = doc(db, 'users', context.userId!, 'logs', String(id));
                batch.delete(ref);
            });
            await batch.commit();
        } else {
            // Local
            await Promise.all(ids.map(id => deleteLog(Number(id))));
        }
    }
};
