import React from 'react';
import type { TrainLog } from '../db';
import { Trash2, AlertCircle, Pencil, PlusCircle, MoreVertical, X, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { useModal } from '../context/ModalContext';
import { getShiftName } from '../utils/shiftUtils';

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
    const [isSelectionMode, setIsSelectionMode] = React.useState(false);
    const [showMenu, setShowMenu] = React.useState(false);

    // Clear selection if logs change (e.g. date change)
    React.useEffect(() => {
        setSelectedIds(new Set());
        setIsSelectionMode(false);
    }, [logs]);

    const handleSelectAll = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (selectedIds.size === logs.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = new Set(logs.map(l => l.id!).filter(Boolean));
            setSelectedIds(allIds);
        }
        setIsSelectionMode(true);
        setShowMenu(false);
    };

    const handleEnterSelectionMode = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsSelectionMode(true);
        setShowMenu(false);
    };

    const handleExitSelectionMode = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setIsSelectionMode(false);
        setSelectedIds(new Set());
        setShowMenu(false);
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
            setIsSelectionMode(false);
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
            {/* Bulk Action Bar (Overlay) */}
            {selectedIds.size > 0 && !readOnly && (
                <div className="absolute top-0 left-0 right-0 h-10 bg-blue-600 z-20 flex items-center justify-between px-4 rounded-t-2xl shadow-md animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExitSelectionMode}
                            className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors"
                        >
                            <X size={16} />
                        </button>
                        <span className="font-bold text-white text-sm">{selectedIds.size} selected</span>
                    </div>
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-1 text-red-600 font-bold text-xs bg-white px-3 py-1.5 rounded-lg border border-red-200 shadow-sm hover:bg-red-50"
                    >
                        <Trash2 size={14} />
                        Delete
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
                                    <th className="p-3 w-10 text-center relative">
                                        <button
                                            onClick={() => setShowMenu(!showMenu)}
                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        {showMenu && (
                                            <>
                                                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                                                <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-100 z-40 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                                                    <button
                                                        onClick={handleEnterSelectionMode}
                                                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        <Square size={14} /> Select
                                                    </button>
                                                    <button
                                                        onClick={handleSelectAll}
                                                        className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        <CheckSquare size={14} /> Select All
                                                    </button>
                                                    {isSelectionMode && (
                                                        <button
                                                            onClick={handleExitSelectionMode}
                                                            className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                                        >
                                                            <X size={14} /> Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </th>
                                )}
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
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
                                            <td className="p-3 text-center h-10">
                                                {isSelectionMode && (
                                                    <input
                                                        type="checkbox"
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer animate-in fade-in duration-200"
                                                        checked={isSelected}
                                                        onChange={() => log.id && handleSelect(log.id)}
                                                        disabled={isRunning}
                                                    />
                                                )}
                                            </td>
                                        )}
                                        <td className="p-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md inline-block whitespace-nowrap">
                                                        {log.category || 'Other'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md inline-block whitespace-nowrap">
                                                        {getShiftName(log.arrival_timestamp)}
                                                    </span>
                                                </div>
                                                {log.subcategory && (
                                                    <span className="text-[10px] text-gray-400 truncate max-w-[80px]">
                                                        {log.subcategory}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
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
