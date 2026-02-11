import React, { useMemo } from 'react';
import type { TrainLog } from '../db';
import { AnalyticsService } from '../services/analyticsService';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';
import { ArrowLeft } from 'lucide-react';

interface DashboardPageProps {
    logs: TrainLog[];
    onBack: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ logs, onBack }) => {

    const summary = useMemo(() => {
        return AnalyticsService.calculateSummary(logs);
    }, [logs]);

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-8">
                <DashboardStats
                    summary={summary}
                    formatDuration={AnalyticsService.formatDurationHuman}
                />

                <DashboardCharts
                    categoryData={summary.categorySeconds}
                    formatDuration={AnalyticsService.formatDurationHuman}
                />
            </div>
        </div>
    );
};
