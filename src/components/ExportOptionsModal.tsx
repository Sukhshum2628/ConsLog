import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, X } from 'lucide-react';

interface ExportOptionsModalProps {
    onClose: () => void;
    onExport: (type: 'excel' | 'pdf', includeTeamLogs: boolean) => void;
}

export const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({ onClose, onExport }) => {
    const [selectedType, setSelectedType] = useState<'excel' | 'pdf' | null>(null);
    const [includeTeamLogs, setIncludeTeamLogs] = useState(false);

    const handleConfirm = () => {
        if (selectedType) {
            onExport(selectedType, includeTeamLogs);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 border border-white/20">
                <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-gray-900">Export Report</h3>
                        <p className="text-sm text-gray-500">Choose your preferred format</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <button
                        onClick={() => setSelectedType('excel')}
                        className={`group w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 ${selectedType === 'excel'
                            ? 'border-green-500 bg-green-50/50 shadow-lg ring-2 ring-green-200 ring-offset-2'
                            : 'border-gray-100 hover:border-green-200 hover:bg-green-50/30 shadow-sm hover:shadow-md'
                            }`}
                    >
                        <div className={`p-4 rounded-2xl mr-4 transition-colors ${selectedType === 'excel' ? 'bg-green-100 text-green-700' : 'bg-green-50 text-green-600 group-hover:bg-green-100'}`}>
                            <FileSpreadsheet className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-lg text-gray-900">Excel Spreadsheet</span>
                            <span className="text-sm text-gray-500">Best for analysis & editing (.xlsx)</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedType('pdf')}
                        className={`group w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-200 ${selectedType === 'pdf'
                            ? 'border-red-500 bg-red-50/50 shadow-lg ring-2 ring-red-200 ring-offset-2'
                            : 'border-gray-100 hover:border-red-200 hover:bg-red-50/30 shadow-sm hover:shadow-md'
                            }`}
                    >
                        <div className={`p-4 rounded-2xl mr-4 transition-colors ${selectedType === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600 group-hover:bg-red-100'}`}>
                            <FileText className="w-8 h-8" />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-lg text-gray-900">PDF Document</span>
                            <span className="text-sm text-gray-500">Best for sharing & printing (.pdf)</span>
                        </div>
                    </button>

                    <div className="pt-2 px-1">
                        <label className="flex items-center gap-4 p-3 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors group">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={includeTeamLogs}
                                    onChange={(e) => setIncludeTeamLogs(e.target.checked)}
                                    className="peer w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                />
                            </div>
                            <div>
                                <span className="block font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">Include Team Data</span>
                                <span className="text-xs text-gray-500">Combine my logs with partner logs</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-6 border-t bg-gray-50">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedType}
                        className={`
                            w-full py-4 text-lg font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all duration-300
                            ${selectedType
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transform hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                        `}
                    >
                        <Download className="w-6 h-6" />
                        {selectedType ? `Download ${selectedType === 'excel' ? 'Excel' : 'PDF'}` : 'Select Format'}
                    </button>
                </div>
            </div>
        </div>
    );
};
