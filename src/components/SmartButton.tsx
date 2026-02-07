import React from 'react';
import { useStopwatch } from '../hooks/useStopwatch';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

interface SmartButtonProps {
    status: 'IDLE' | 'RUNNING';
    startTime?: number;
    onPress: () => void;
}

export const SmartButton: React.FC<SmartButtonProps> = ({ status, startTime, onPress }) => {
    const { formatted } = useStopwatch(status === 'RUNNING' && startTime ? startTime : null);

    const handlePress = async () => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        }
        onPress();
    };

    return (
        <div className="flex flex-col items-center justify-center py-4">
            <button
                onClick={handlePress}
                className={`
                    w-40 h-40 rounded-full shadow-2xl transition-all duration-200 transform active:scale-95
                    flex flex-col items-center justify-center gap-1 border-4
                    ${status === 'IDLE'
                        ? 'bg-green-600 border-green-400 hover:bg-green-700 text-white'
                        : 'bg-red-600 border-red-400 hover:bg-red-700 text-white animate-pulse'}
                `}
            >
                <span className="text-3xl font-black tracking-widest uppercase dropped-shadow-md">
                    {status === 'IDLE' ? 'START' : 'STOP'}
                </span>

                {status === 'RUNNING' && (
                    <div className="flex flex-col items-center mt-2">
                        <span className="text-xl font-mono font-bold bg-black/20 px-3 py-1 rounded-lg tabular-nums">
                            {formatted}
                        </span>
                    </div>
                )}
            </button>
            {status === 'RUNNING' && (
                <span className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-semibold animate-pulse">
                    Tap to Stop Halt
                </span>
            )}
        </div>
    );
};
