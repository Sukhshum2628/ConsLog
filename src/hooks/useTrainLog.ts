import { useState, useEffect, useCallback } from 'react';
import { addLog, updateLog, getLogsByDate, deleteLog, initDB } from '../db';
import type { TrainLog } from '../db';
import { format } from 'date-fns';

export const useTrainLog = () => {
    const [logs, setLogs] = useState<TrainLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate] = useState(new Date());

    const loadLogs = useCallback(async () => {
        try {
            setLoading(true);
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const data = await getLogsByDate(dateStr);
            // Sort by arrival time descending
            setLogs(data.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp));
        } catch (error) {
            console.error('Failed to load logs', error);
        } finally {
            setLoading(false);
        }
    }, [currentDate]);

    useEffect(() => {
        initDB().then(() => loadLogs());
    }, [loadLogs]);

    const addEntry = async () => {
        const newLog: Omit<TrainLog, 'id'> = {
            date: format(currentDate, 'yyyy-MM-dd'),
            arrival_timestamp: Date.now(),
            status: 'RUNNING',
            created_at: Date.now(),
        };
        await addLog(newLog);
        await loadLogs();
    };

    const completeEntry = async (log: TrainLog) => {
        const departureTime = Date.now();
        const duration = Math.floor((departureTime - log.arrival_timestamp) / 1000);

        const updatedLog: TrainLog = {
            ...log,
            departure_timestamp: departureTime,
            halt_duration_seconds: duration,
            status: 'COMPLETED',
        };

        await updateLog(updatedLog);
        await loadLogs();
    };

    const removeEntry = async (id: number) => {
        await deleteLog(id);
        await loadLogs();
    };

    const activeLog = logs.find(l => l.status === 'RUNNING');

    const totalHaltTime = logs.reduce((acc, curr) => {
        if (curr.status === 'COMPLETED' && curr.halt_duration_seconds) {
            return acc + curr.halt_duration_seconds;
        }
        return acc;
    }, 0);

    return {
        logs,
        loading,
        addEntry,
        completeEntry,
        removeEntry,
        activeLog,
        totalHaltTime,
        refreshLogs: loadLogs
    };
};
