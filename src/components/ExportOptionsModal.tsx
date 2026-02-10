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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all">
                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Export Options</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-500 font-medium mb-2 uppercase tracking-wider">Choose Format</p>

                    <button
                        onClick={() => setSelectedType('excel')}
                        className={`w-full flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedType === 'excel'
                            ? 'border-green-500 bg-green-50 text-green-700 shadow-md ring-2 ring-green-200 ring-offset-1'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50 text-gray-600'
                            }`}
                    >
                        <div className={`p-3 rounded-full mr-4 ${selectedType === 'excel' ? 'bg-green-200' : 'bg-gray-100'}`}>
                            <FileSpreadsheet className={`w-6 h-6 ${selectedType === 'excel' ? 'text-green-700' : 'text-gray-500'}`} />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-lg">Excel</span>
                            <span className="text-xs opacity-70">Spreadsheet (.xlsx)</span>
                        </div>
                    </button>

                    <button
                        onClick={() => setSelectedType('pdf')}
                        className={`w-full flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedType === 'pdf'
                            ? 'border-red-500 bg-red-50 text-red-700 shadow-md ring-2 ring-red-200 ring-offset-1'
                            : 'border-gray-200 hover:border-red-300 hover:bg-gray-50 text-gray-600'
                            }`}
                    >
                        <div className={`p-3 rounded-full mr-4 ${selectedType === 'pdf' ? 'bg-red-200' : 'bg-gray-100'}`}>
                            <FileText className={`w-6 h-6 ${selectedType === 'pdf' ? 'text-red-700' : 'text-gray-500'}`} />
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-lg">PDF</span>
                            <span className="text-xs opacity-70">Document (.pdf)</span>
                        </div>
                    </button>

                    <div className="pt-2">
                        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                checked={includeTeamLogs}
                                onChange={(e) => setIncludeTeamLogs(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="block font-medium text-gray-700">Include Team Logs</span>
                                <span className="text-xs text-gray-500">Combine my logs with partner logs</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={handleConfirm}
                        disabled={!selectedType}
                        className={`
                            w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all duration-300
                            ${selectedType
                                ? 'bg-blue-600 hover:bg-blue-700 text-white transform active:scale-95'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed grayscale'}
                        `}
                    >
                        <Download className="w-5 h-5" />
                        Download
                    </button>
                </div>
            </div>
        </div>
    );
};
