import React, { useEffect, useState, useMemo } from 'react';
import { X, Download, Check, Calendar } from 'lucide-react';
import { getAllLogs, type TrainLog } from '../db';
import { exportToExcel, exportToPDF } from '../utils/export';
import { format } from 'date-fns';
import { ExportOptionsModal } from './ExportOptionsModal';

interface HistoryModalProps {
    onClose: () => void;
}

interface DateGroup {
    date: string;
    count: number;
    logs: TrainLog[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose }) => {
    const [logs, setLogs] = useState<TrainLog[]>([]);
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [showExportOptions, setShowExportOptions] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const allLogs = await getAllLogs();
            // Sort by date descending
            allLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);
            setLogs(allLogs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const groupedLogs = useMemo(() => {
        const groups: Record<string, DateGroup> = {};
        logs.forEach(log => {
            if (!groups[log.date]) {
                groups[log.date] = { date: log.date, count: 0, logs: [] };
            }
            groups[log.date].count++;
            groups[log.date].logs.push(log);
        });
        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    }, [logs]);

    const handleToggleDate = (date: string) => {
        const newSelected = new Set(selectedDates);
        if (newSelected.has(date)) {
            newSelected.delete(date);
        } else {
            newSelected.add(date);
        }
        setSelectedDates(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedDates.size === groupedLogs.length) {
            setSelectedDates(new Set());
        } else {
            setSelectedDates(new Set(groupedLogs.map(g => g.date)));
        }
    };

    const handleExportClick = () => {
        if (selectedDates.size === 0) return;
        setShowExportOptions(true);
    };

    const processExport = async (type: 'excel' | 'pdf') => {
        const logsToExport = logs.filter(log => selectedDates.has(log.date));

        const fileName = `TimeLog_History_${selectedDates.size}Days_${format(new Date(), 'yyyy-MM-dd')}`;

        if (type === 'excel') {
            await exportToExcel(logsToExport, fileName);
        } else {
            await exportToPDF(logsToExport, fileName);
        }

        setShowExportOptions(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in slide-in-from-bottom-5 duration-300">
            {/* Header */}
            <div className="p-4 pt-12 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    History & Export
                </h2>
                <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-4">
                {loading ? (
                    <div className="text-center p-10 text-gray-400">Loading history...</div>
                ) : groupedLogs.length === 0 ? (
                    <div className="text-center p-10 text-gray-400">No history available yet.</div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-gray-500">{groupedLogs.length} days recorded</span>
                            <button
                                onClick={handleSelectAll}
                                className="text-sm font-semibold text-blue-600"
                            >
                                {selectedDates.size === groupedLogs.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        {groupedLogs.map(group => (
                            <div
                                key={group.date}
                                onClick={() => handleToggleDate(group.date)}
                                className={`
                                    p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all
                                    ${selectedDates.has(group.date)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-6 h-6 rounded border flex items-center justify-center
                                        ${selectedDates.has(group.date)
                                            ? 'bg-blue-500 border-blue-500'
                                            : 'border-gray-400'}
                                    `}>
                                        {selectedDates.has(group.date) && <Check className="w-4 h-4 text-white" />}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {format(new Date(group.date), 'EEE, d MMM yyyy')}
                                        </h3>
                                        <p className="text-xs text-gray-500">
                                            {group.count} logs recorded
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 pb-8 border-t bg-white safe-area-bottom sticky bottom-0 z-10">
                <button
                    disabled={selectedDates.size === 0}
                    onClick={handleExportClick}
                    className={`
                        w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg shadow-lg
                        ${selectedDates.size > 0
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    <Download className="w-6 h-6" />
                    {selectedDates.size > 0
                        ? `Export ${selectedDates.size} Days`
                        : 'Select Days to Export'}
                </button>
            </div>

            {/* Export Options Modal */}
            {showExportOptions && (
                <ExportOptionsModal
                    onClose={() => setShowExportOptions(false)}
                    onExport={processExport}
                />
            )}
        </div>
    );
};
