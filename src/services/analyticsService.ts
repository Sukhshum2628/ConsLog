import type { TrainLog } from '../db';
import { isSameDay, subDays } from 'date-fns';

export interface DailySummary {
    date: string;
    totalHaltSeconds: number;
    haltCount: number;
    categoryBreakdown: Record<string, number>; // Category -> Seconds
}

export const AnalyticsService = {
    /**
     * Calculates summary statistics for a given list of logs.
     * Useful for "Today's Overview" or range reports.
     */
    calculateSummary: (logs: TrainLog[]) => {
        let totalSeconds = 0;
        const categorySeconds: Record<string, number> = {};
        const categoryCounts: Record<string, number> = {};

        logs.forEach(log => {
            const duration = log.halt_duration_seconds || 0;
            totalSeconds += duration;

            const cat = log.category || 'Uncategorized';
            categorySeconds[cat] = (categorySeconds[cat] || 0) + duration;
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });

        return {
            totalSeconds,
            haltCount: logs.length,
            categorySeconds,
            categoryCounts
        };
    },

    /**
     * Groups logs by day for the last N days.
     */
    getLastNDaysData: (logs: TrainLog[], days = 7) => {
        const today = new Date();
        const result: DailySummary[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = subDays(today, i);
            const dayLogs = logs.filter(l => isSameDay(l.arrival_timestamp, d));
            const summary = AnalyticsService.calculateSummary(dayLogs);

            result.push({
                date: d.toISOString(),
                totalHaltSeconds: summary.totalSeconds,
                haltCount: summary.haltCount,
                categoryBreakdown: summary.categorySeconds
            });
        }

        return result;
    },

    /**
     * Formats seconds into HH:MM:SS
     */
    formatDuration: (seconds: number) => {
        return new Date(seconds * 1000).toISOString().substr(11, 8);
    },

    /**
     * Formats seconds into discrete units (e.g. "2h 15m")
     */
    formatDurationHuman: (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m`;
        return `${seconds}s`;
    }
};
