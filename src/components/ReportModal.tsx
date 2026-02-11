import { useState } from 'react';
import { X, Calendar, Users, FileText, Download, Check } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (options: ReportOptions) => void;
    availableUsers: { uid: string; displayName: string }[];
}

export interface ReportOptions {
    startDate: Date;
    endDate: Date;
    selectedUserIds: string[];
    format: 'pdf' | 'excel';
}

export function ReportModal({ isOpen, onClose, onGenerate, availableUsers }: ReportModalProps) {
    const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>(availableUsers.map(u => u.uid));
    const [reportFormat, setReportFormat] = useState<'pdf' | 'excel'>('pdf');

    if (!isOpen) return null;

    const handleToggleUser = (uid: string) => {
        if (selectedUserIds.includes(uid)) {
            setSelectedUserIds(prev => prev.filter(id => id !== uid));
        } else {
            setSelectedUserIds(prev => [...prev, uid]);
        }
    };

    const handleSelectAllUsers = () => {
        if (selectedUserIds.length === availableUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(availableUsers.map(u => u.uid));
        }
    };

    const handleQuickDate = (type: 'today' | 'yesterday' | 'thisMonth' | 'lastMonth') => {
        const today = new Date();
        switch (type) {
            case 'today':
                setStartDate(format(today, 'yyyy-MM-dd'));
                setEndDate(format(today, 'yyyy-MM-dd'));
                break;
            case 'yesterday':
                const yest = subDays(today, 1);
                setStartDate(format(yest, 'yyyy-MM-dd'));
                setEndDate(format(yest, 'yyyy-MM-dd'));
                break;
            case 'thisMonth':
                setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
                setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
                break;
            case 'lastMonth':
                const last = subDays(startOfMonth(today), 1);
                setStartDate(format(startOfMonth(last), 'yyyy-MM-dd'));
                setEndDate(format(endOfMonth(last), 'yyyy-MM-dd'));
                break;
        }
    };

    const handleGenerate = () => {
        onGenerate({
            startDate: startOfDay(new Date(startDate)),
            endDate: endOfDay(new Date(endDate)),
            selectedUserIds,
            format: reportFormat
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div className="flex items-center gap-2 text-gray-800">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-bold">Generate Report</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">

                    {/* 1. Date Range */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Calendar size={16} />
                            <h3>Date Range</h3>
                        </div>

                        <div className="flex gap-2 mb-2 overflow-x-auto pb-2 scrollbar-hide">
                            <button onClick={() => handleQuickDate('today')} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium hover:bg-gray-200 whitespace-nowrap">Today</button>
                            <button onClick={() => handleQuickDate('yesterday')} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium hover:bg-gray-200 whitespace-nowrap">Yesterday</button>
                            <button onClick={() => handleQuickDate('thisMonth')} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 whitespace-nowrap border border-blue-100">This Month</button>
                            <button onClick={() => handleQuickDate('lastMonth')} className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium hover:bg-gray-200 whitespace-nowrap">Last Month</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-medium">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 font-medium">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. Users */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Users size={16} />
                                <h3>Team Members</h3>
                            </div>
                            <button
                                onClick={handleSelectAllUsers}
                                className="text-xs text-blue-600 font-medium hover:underline"
                            >
                                {selectedUserIds.length === availableUsers.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 max-h-40 overflow-y-auto space-y-2">
                            {availableUsers.map(user => (
                                <label key={user.uid} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedUserIds.includes(user.uid) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                        {selectedUserIds.includes(user.uid) && <Check size={12} className="text-white" />}
                                    </div>
                                    <span className="text-sm text-gray-700 font-medium">{user.displayName}</span>
                                    {/* Hidden Native Checkbox */}
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={selectedUserIds.includes(user.uid)}
                                        onChange={() => handleToggleUser(user.uid)}
                                    />
                                </label>
                            ))}
                            {availableUsers.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No other members found.</p>}
                        </div>
                    </div>

                    {/* 3. Format */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setReportFormat('pdf')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${reportFormat === 'pdf' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            <FileText size={24} />
                            <span className="text-sm font-bold">PDF Report</span>
                        </button>

                        <button
                            onClick={() => setReportFormat('excel')}
                            className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${reportFormat === 'excel' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            <div className="relative">
                                <FileText size={24} />
                                <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-green-500 text-white px-1 rounded">XLS</span>
                            </div>
                            <span className="text-sm font-bold">Excel Sheet</span>
                        </button>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Download size={18} />
                        Generate Report
                    </button>
                </div>

            </div>
        </div>
    );
}
