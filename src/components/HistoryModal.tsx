import React, { useEffect, useState, useMemo } from 'react';
import { X, Download, Check, Calendar, Eye } from 'lucide-react';
import { getAllLogs, type TrainLog } from '../db';
import { exportToExcel, exportToPDF } from '../utils/export';
import { format } from 'date-fns';
import { db } from '../lib/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ExportOptionsModal } from './ExportOptionsModal';
import { LogViewerModal } from './LogViewerModal';

interface HistoryModalProps {
    onClose: () => void;
    siteId?: string;
}

interface DateGroup {
    date: string;
    count: number;
    logs: TrainLog[];
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, siteId }) => {
    const [logs, setLogs] = useState<TrainLog[]>([]);
    const [selectedDates, setSelectedDates] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [showExportOptions, setShowExportOptions] = useState(false);

    // UI State
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [viewingGroup, setViewingGroup] = useState<DateGroup | null>(null);

    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, [user, siteId]);

    const loadData = async () => {
        setLoading(true);
        try {
            let allLogs: TrainLog[] = [];

            if (user) {
                const q = query(
                    collection(db, 'users', user.uid, 'logs'),
                    orderBy('arrival_timestamp', 'desc')
                );
                const snapshot = await getDocs(q);
                const rawLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainLog));

                if (siteId) {
                    allLogs = rawLogs.filter(log => {
                        if (log.siteId === siteId) return true;
                        if (siteId === 'default-site' && !log.siteId) return true;
                        return false;
                    });
                } else {
                    allLogs = rawLogs;
                }
            } else {
                allLogs = await getAllLogs();
                allLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);
            }

            setLogs(allLogs);
        } catch (e) {
            console.error("Failed to load history:", e);
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

        // Auto-exit selection if empty? No, keep it.
    };

    const handleSelectAll = () => {
        if (selectedDates.size === groupedLogs.length) {
            setSelectedDates(new Set());
            setIsSelectionMode(false);
        } else {
            setSelectedDates(new Set(groupedLogs.map(g => g.date)));
            setIsSelectionMode(true);
        }
    };

    const toggleSelectionMode = () => {
        if (isSelectionMode) {
            setIsSelectionMode(false);
            setSelectedDates(new Set());
        } else {
            setIsSelectionMode(true);
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
            // Need user profile for name? Passing undefined for now or we could grab it
            await exportToPDF(logsToExport, undefined, fileName);
        }

        setShowExportOptions(false);
        setIsSelectionMode(false);
        setSelectedDates(new Set());
    };

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col animate-slideUp">
            {/* Header */}
            <div className="p-4 pt-12 border-b flex justify-between items-center bg-gray-50 sticky top-0 z-10 transition-colors">
                {isSelectionMode ? (
                    <div className="flex items-center gap-3">
                        <button onClick={toggleSelectionMode} className="p-2 -ml-2 rounded-full hover:bg-gray-200">
                            <X size={20} />
                        </button>
                        <span className="font-bold text-lg">{selectedDates.size} Selected</span>
                    </div>
                ) : (
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        History
                    </h2>
                )}

                <div className="flex items-center gap-2">
                    {/* 3-Dots Menu (Actually just a Select button/toggle for simplicity in header) */}
                    <button
                        onClick={isSelectionMode ? handleSelectAll : toggleSelectionMode}
                        className="text-sm font-semibold text-blue-600 px-3 py-1 rounded-full hover:bg-blue-50"
                    >
                        {isSelectionMode ? (selectedDates.size === groupedLogs.length ? 'Deselect All' : 'Select All') : 'Select'}
                    </button>
                    {!isSelectionMode && (
                        <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-4 content-container">
                {loading ? (
                    <div className="text-center p-10 text-gray-400">Loading history...</div>
                ) : groupedLogs.length === 0 ? (
                    <div className="text-center p-10 text-gray-400">No history available yet.</div>
                ) : (
                    <div className="space-y-3">
                        {groupedLogs.map(group => (
                            <div
                                key={group.date}
                                onClick={() => {
                                    if (isSelectionMode) {
                                        handleToggleDate(group.date);
                                    } else {
                                        setViewingGroup(group);
                                    }
                                }}
                                className={`
                                    p-4 rounded-xl border flex justify-between items-center cursor-pointer transition-all active:scale-[0.98]
                                    ${isSelectionMode && selectedDates.has(group.date)
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-blue-200 bg-white shadow-sm'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Checkbox Placeholder / Icon */}
                                    {isSelectionMode ? (
                                        <div className={`
                                            w-6 h-6 rounded border flex items-center justify-center transition-colors
                                            ${selectedDates.has(group.date) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}
                                        `}>
                                            {selectedDates.has(group.date) && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs uppercase">
                                            {format(new Date(group.date), 'dd')}
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {format(new Date(group.date), 'EEEE, MMMM do')}
                                        </h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                            <span>{group.count} logs</span>
                                            {!isSelectionMode && <span className="text-blue-500 text-[10px] font-bold">Tap to view</span>}
                                        </p>
                                    </div>
                                </div>

                                {!isSelectionMode && (
                                    <div className="text-gray-300">
                                        <Eye size={18} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Selection Footer */}
            {isSelectionMode && (
                <div className="p-4 pb-8 border-t bg-white safe-area-bottom sticky bottom-0 z-10 animate-in slide-in-from-bottom duration-200">
                    <button
                        disabled={selectedDates.size === 0}
                        onClick={handleExportClick}
                        className={`
                            w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-lg shadow-lg transition-colors
                            ${selectedDates.size > 0
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        <Download className="w-6 h-6" />
                        {selectedDates.size > 0
                            ? `Export ${selectedDates.size} Days`
                            : 'Select Days'}
                    </button>
                    {/* Add Delete here in future if needed */}
                </div>
            )}

            {/* Export Options Modal */}
            {showExportOptions && (
                <ExportOptionsModal
                    onClose={() => setShowExportOptions(false)}
                    onExport={processExport}
                />
            )}

            {/* View Modal */}
            {viewingGroup && (
                <LogViewerModal
                    date={viewingGroup.date}
                    logs={viewingGroup.logs}
                    onClose={() => setViewingGroup(null)}
                    siteName={siteId ? 'Site History' : 'All History'}
                    userInfo={user}
                />
            )}
        </div>
    );
};
