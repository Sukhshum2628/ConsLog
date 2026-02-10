import React from 'react';
import type { TrainLog } from '../db';
import { Trash2, AlertCircle, Pencil, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useModal } from '../context/ModalContext';

interface LogTableProps {
    logs: TrainLog[];
    onDelete: (id: number | string) => void;
    onEdit: (log: TrainLog) => void;
    readOnly?: boolean;
    onCopy?: (log: TrainLog) => void;
    onBulkDelete?: (ids: (number | string)[]) => void;
}

export const LogTable = React.memo<LogTableProps>(({ logs, onDelete, onEdit, readOnly, onCopy, onBulkDelete }) => {
    const { showConfirm } = useModal();
    const [selectedIds, setSelectedIds] = React.useState<Set<number | string>>(new Set());

    // Clear selection if logs change (e.g. date change)
    React.useEffect(() => {
        setSelectedIds(new Set());
    }, [logs]);

    const handleSelectAll = () => {
        if (selectedIds.size === logs.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(logs.map(l => l.id!).filter(Boolean));
            setSelectedIds(allIds);
        }
    };

    const handleSelect = (id: number | string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (!onBulkDelete || selectedIds.size === 0) return;

        const confirmed = await showConfirm({
            title: 'Delete Selected',
            message: `Are you sure you want to delete ${selectedIds.size} entries?`,
            type: 'danger',
            confirmText: 'Delete All',
            cancelText: 'Cancel'
        });

        if (confirmed) {
            onBulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
        }
    };

    const handleDeleteClick = async (log: TrainLog) => {
        if (!log.id) return;

        const confirmed = await showConfirm({
            title: 'Delete Log',
            message: `Are you sure you want to DELETE this entry?\n\nStart: ${format(log.arrival_timestamp, 'HH:mm:ss')}`,
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (confirmed) {
            onDelete(log.id);
        }
    };

    const handleEditClick = async (log: TrainLog) => {
        const confirmed = await showConfirm({
            title: 'Edit Entry',
            message: 'Do you want to edit this entry?',
            type: 'info',
            confirmText: 'Edit',
            cancelText: 'Cancel'
        });

        if (confirmed) {
            onEdit(log);
        }
    };

    return (
        <div className="flex-1 overflow-visible bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative">
            {/* Bulk Action Bar (Overlay or Header replacement) */}
            {selectedIds.size > 0 && !readOnly && (
                <div className="absolute top-0 left-0 right-0 h-12 bg-blue-50 z-20 flex items-center justify-between px-4 rounded-t-2xl border-b border-blue-100 animate-in slide-in-from-top-2 duration-200">
                    <span className="font-bold text-blue-800 text-sm">{selectedIds.size} selected</span>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1 text-red-600 font-bold text-xs bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-sm hover:bg-red-50"
                    >
                        <Trash2 size={14} />
                        Delete Selected
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-auto rounded-2xl">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center min-h-[200px]">
                        <AlertCircle className="w-12 h-12 mb-2 opacity-20" />
                        <p>No logs for today yet.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                {!readOnly && onBulkDelete && (
                                    <th className="p-3 w-10 text-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                            checked={logs.length > 0 && selectedIds.size === logs.length}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                )}
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Start</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">End</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Halt</th>
                                <th className="p-3 w-16 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map((log) => {
                                const isRunning = log.status === 'RUNNING';
                                const isSelected = log.id !== undefined && selectedIds.has(log.id);

                                return (
                                    <tr
                                        key={log.id}
                                        className={`transition-colors group ${isSelected ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                                    >
                                        {!readOnly && onBulkDelete && (
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => log.id && handleSelect(log.id)}
                                                    disabled={isRunning} // Prevent deleting running logs via bulk? Maybe safer.
                                                />
                                            </td>
                                        )}
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
                                                {!readOnly && (
                                                    <>
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
                                                    </>
                                                )}
                                                {readOnly && onCopy && (
                                                    <button
                                                        onClick={() => onCopy(log)}
                                                        className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-bold transition-colors"
                                                        title="Add to My Logs"
                                                    >
                                                        <PlusCircle size={14} />
                                                        Add
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
        </div>
    );
});
