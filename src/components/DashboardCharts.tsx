import React from 'react';

interface DashboardChartsProps {
    categoryData: Record<string, number>; // Category -> Seconds
    formatDuration: (s: number) => string;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ categoryData, formatDuration }) => {
    const totalSeconds = Object.values(categoryData).reduce((a, b) => a + b, 0);
    const sortedCategories = Object.entries(categoryData)
        .sort(([, a], [, b]) => b - a); // Sort by duration desc

    return (
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Downtime by Category</h3>

            <div className="space-y-4">
                {sortedCategories.map(([cat, seconds]) => {
                    const percentage = totalSeconds > 0 ? (seconds / totalSeconds) * 100 : 0;

                    return (
                        <div key={cat}>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-gray-700">{cat}</span>
                                <span className="text-gray-500 font-mono">{formatDuration(seconds)}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}

                {sortedCategories.length === 0 && (
                    <p className="text-center text-gray-400 py-4 text-sm">No data available</p>
                )}
            </div>
        </div>
    );
};
