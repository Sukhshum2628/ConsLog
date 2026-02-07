import React from 'react';
import type { TrainLog } from '../db';
import { Trash2, AlertCircle, Pencil } from 'lucide-react';
import { format } from 'date-fns';

interface LogTableProps {
    logs: TrainLog[];
    onDelete: (id: number) => void;
    onEdit: (log: TrainLog) => void;
}

export const LogTable: React.FC<LogTableProps> = ({ logs, onDelete, onEdit }) => {

    const handleDeleteClick = (log: TrainLog) => {
        if (!log.id) return;
        // Native confirmation dialog
        if (window.confirm(`Are you sure you want to DELETE this entry?\n\nArrival: ${format(log.arrival_timestamp, 'HH:mm:ss')}`)) {
            onDelete(log.id);
        }
    };

    const handleEditClick = (log: TrainLog) => {
        if (window.confirm(`Do you want to EDIT this entry?`)) {
            onEdit(log);
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
                            <th className="p-3 w-16 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {logs.map((log) => {
                            const isRunning = log.status === 'RUNNING';

                            return (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-3 font-medium text-gray-900">
                                        {format(log.arrival_timestamp, 'HH:mm')}
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        {log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm') : '--'}
                                    </td>
                                    <td className="p-3 text-right font-mono font-medium text-blue-600">
                                        {log.halt_duration_seconds
                                            ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8)
                                            : <span className="text-orange-500 animate-pulse">RUNNING</span>}
                                    </td>
                                    <td className="p-3 text-center">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleEditClick(log)}
                                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>

                                            {!isRunning && (
                                                <button
                                                    onClick={() => handleDeleteClick(log)}
                                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
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
