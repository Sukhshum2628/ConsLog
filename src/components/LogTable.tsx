import React from 'react';
import type { TrainLog } from '../db';
import { Trash2, AlertCircle } from 'lucide-react';
import { format, set } from 'date-fns';

interface LogTableProps {
    logs: TrainLog[];
    onDelete: (id: number) => void;
    onUpdate: (log: TrainLog) => void;
}

export const LogTable: React.FC<LogTableProps> = ({ logs, onDelete, onUpdate }) => {

    const handleTimeChange = (log: TrainLog, field: 'arrival' | 'departure', newTimeStr: string) => {
        try {
            // Parse the new time string (HH:mm)
            const [hours, minutes] = newTimeStr.split(':').map(Number);

            // Create new timestamp based on the log's original date
            // We use the existing timestamp to get the base date, or current date if missing
            const baseDate = log.arrival_timestamp ? new Date(log.arrival_timestamp) : new Date();

            const newDate = set(baseDate, { hours, minutes, seconds: 0, milliseconds: 0 });
            const newTimestamp = newDate.getTime();

            const updatedLog = { ...log };
            if (field === 'arrival') {
                updatedLog.arrival_timestamp = newTimestamp;
            } else {
                updatedLog.departure_timestamp = newTimestamp;
            }

            onUpdate(updatedLog);
        } catch (e) {
            console.error("Invalid time format", e);
        }
    };

    return (
        <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-100">
            {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                    <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                    <p>No logs for today yet.</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Arrival</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Departure</th>
                            <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Halt</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => {
                            const isRunning = log.status === 'RUNNING';

                            return (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-3">
                                        <input
                                            type="time"
                                            className="bg-transparent font-medium text-gray-900 focus:bg-blue-50 rounded px-1 outline-none w-24"
                                            value={format(log.arrival_timestamp, 'HH:mm')}
                                            onChange={(e) => handleTimeChange(log, 'arrival', e.target.value)}
                                        />
                                    </td>
                                    <td className="p-3">
                                        {isRunning ? (
                                            <span className="text-gray-400 text-sm italic">--:--</span>
                                        ) : (
                                            <input
                                                type="time"
                                                className="bg-transparent font-medium text-gray-900 focus:bg-blue-50 rounded px-1 outline-none w-24"
                                                value={log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm') : ''}
                                                onChange={(e) => handleTimeChange(log, 'departure', e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td className="p-3 text-right font-mono font-medium text-blue-600">
                                        {log.halt_duration_seconds
                                            ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8)
                                            : <span className="text-orange-500 animate-pulse">RUNNING</span>}
                                    </td>
                                    <td className="p-3 text-right">
                                        {!isRunning && (
                                            <button
                                                onClick={() => log.id && onDelete(log.id)}
                                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
};
