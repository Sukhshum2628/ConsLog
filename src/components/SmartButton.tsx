import React from 'react';
import { useStopwatch } from '../hooks/useStopwatch';

interface SmartButtonProps {
    status: 'IDLE' | 'RUNNING';
    startTime?: number;
    onPress: () => void;
}

export const SmartButton: React.FC<SmartButtonProps> = ({ status, startTime, onPress }) => {
    const { formatted } = useStopwatch(status === 'RUNNING' && startTime ? startTime : null);

    return (
        <button
            onClick={onPress}
            className={`
        w-full py-8 rounded-2xl shadow-xl transition-all duration-300 transform active:scale-95
        flex flex-col items-center justify-center gap-2
        ${status === 'IDLE'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white animate-pulse-slow'}
      `}
        >
            <span className="text-2xl font-bold uppercase tracking-wider">
                {status === 'IDLE' ? '🚆 Train Arrived' : '🛑 Train Departed'}
            </span>

            {status === 'RUNNING' && (
                <div className="flex flex-col items-center">
                    <span className="text-4xl font-mono font-black tracking-widest bg-black/20 px-4 py-2 rounded-lg">
                        {formatted}
                    </span>
                    <span className="text-sm opacity-80 mt-1 uppercase text-orange-100">Tap to Stop</span>
                </div>
            )}
        </button>
    );
};
