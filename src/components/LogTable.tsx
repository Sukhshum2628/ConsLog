import React from 'react';
import type { TrainLog } from '../db';
import { format } from 'date-fns';
import { Trash2, Clock } from 'lucide-react';
import { useStopwatch } from '../hooks/useStopwatch';

interface LogTableProps {
    logs: TrainLog[];
    onDelete: (id: number) => void;
}

const RunningRow: React.FC<{ log: TrainLog }> = ({ log }) => {
    const { formatted } = useStopwatch(log.arrival_timestamp);

    return (
        <tr className="bg-orange-50 border-l-4 border-orange-500 animate-pulse-subtle">
            <td className="p-3 text-center font-medium text-gray-500">#</td>
            <td className="p-3 text-gray-900">{format(log.arrival_timestamp, 'HH:mm:ss')}</td>
            <td className="p-3 text-gray-400 italic">--:--:--</td>
            <td className="p-3 font-mono font-bold text-orange-600 flex items-center gap-2">
                <Clock className="w-4 h-4 animate-spin-slow" />
                {formatted}
            </td>
            <td className="p-3 text-center">
                {/* Cannot delete running row */}
            </td>
        </tr>
    );
};

export const LogTable: React.FC<LogTableProps> = ({ logs, onDelete }) => {
    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                    <tr>
                        <th className="p-3 text-center w-12">#</th>
                        <th className="p-3">Arrival</th>
                        <th className="p-3">Departure</th>
                        <th className="p-3">Halt Time</th>
                        <th className="p-3 text-center w-16">Act</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {logs.map((log, index) => (
                        log.status === 'RUNNING' ? (
                            <RunningRow key={log.id || 'running'} log={log} />
                        ) : (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-3 text-center text-gray-400">{logs.length - index}</td>
                                <td className="p-3 text-gray-900">{format(log.arrival_timestamp, 'HH:mm:ss')}</td>
                                <td className="p-3 text-gray-900">
                                    {log.departure_timestamp ? format(log.departure_timestamp, 'HH:mm:ss') : '-'}
                                </td>
                                <td className="p-3 font-mono font-medium text-gray-700">
                                    {log.halt_duration_seconds ? new Date(log.halt_duration_seconds * 1000).toISOString().substr(11, 8) : '--'}
                                </td>
                                <td className="p-3 text-center">
                                    <button
                                        onClick={() => {
                                            if (confirm(`Delete entry?\nArrival: ${format(log.arrival_timestamp, 'HH:mm:ss')}`)) {
                                                onDelete(log.id!);
                                            }
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        )
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                No halts logged today.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
