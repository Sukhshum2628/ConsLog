import { X, Download, Calendar } from 'lucide-react';
import type { TrainLog } from '../db';
import { LogTable } from './LogTable';
import { format } from 'date-fns';
import { exportToExcel, exportToPDF } from '../utils/export';

interface LogViewerModalProps {
    date: string;
    logs: TrainLog[];
    onClose: () => void;
    siteName?: string;
    userInfo?: any;
}

export function LogViewerModal({ date, logs, onClose, siteName, userInfo }: LogViewerModalProps) {
    const formattedDate = format(new Date(date), 'EEEE, d MMMM yyyy');

    const handleExport = (type: 'pdf' | 'excel') => {
        const fileName = `TimeLog_${date}`;
        if (type === 'excel') {
            exportToExcel(logs, fileName);
        } else {
            exportToPDF(logs, userInfo || { displayName: 'User' }, fileName);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white animate-slideInRight">
            {/* Header */}
            <div className="p-4 pt-12 border-b bg-gray-50 flex justify-between items-center shadow-sm">
                <div>
                    <div className="flex items-center gap-2 text-gray-800">
                        <Calendar size={20} className="text-blue-600" />
                        <h2 className="text-lg font-bold">{formattedDate}</h2>
                    </div>
                    {siteName && <p className="text-xs text-gray-500 ml-7">{siteName}</p>}
                </div>
                <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors transform duration-200 hover:scale-110 active:scale-95">
                    <X size={20} />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                <LogTable
                    logs={logs}
                    readOnly={true}
                    onDelete={() => { }}
                    onEdit={() => { }}
                />
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-white safe-area-bottom sticky bottom-0 flex gap-3">
                <button
                    onClick={() => handleExport('pdf')}
                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                >
                    <Download size={18} /> PDF
                </button>
                <button
                    onClick={() => handleExport('excel')}
                    className="flex-1 py-3 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition-colors"
                >
                    <Download size={18} /> Excel
                </button>
            </div>
        </div>
    );
}
