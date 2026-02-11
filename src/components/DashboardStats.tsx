import React from 'react';
import { Clock, Hash, AlertTriangle } from 'lucide-react';

interface DashboardStatsProps {
    summary: {
        totalSeconds: number;
        haltCount: number;
        categoryCounts: Record<string, number>;
    };
    formatDuration: (s: number) => string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ summary, formatDuration }) => {
    // Find most frequent category
    let maxFreq = 0;
    let mostFreqCat = 'N/A';
    Object.entries(summary.categoryCounts).forEach(([cat, count]) => {
        if (count > maxFreq) {
            maxFreq = count;
            mostFreqCat = cat;
        }
    });

    return (
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-start space-y-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Clock size={20} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Total Downtime</p>
                    <h3 className="text-xl font-bold text-gray-900">{formatDuration(summary.totalSeconds)}</h3>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-start space-y-2">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                    <Hash size={20} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium uppercase">Total Halts</p>
                    <h3 className="text-xl font-bold text-gray-900">{summary.haltCount}</h3>
                </div>
            </div>

            <div className="col-span-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Top Cause</p>
                        <h3 className="text-lg font-bold text-gray-900">{mostFreqCat}</h3>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600">{maxFreq}</span>
                    <span className="text-xs text-gray-400 block">occurrences</span>
                </div>
            </div>
        </div>
    );
};
