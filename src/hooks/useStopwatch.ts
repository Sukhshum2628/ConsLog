import { useState, useEffect, useRef } from 'react';

export const useStopwatch = (startTime: number | null) => {
    const [seconds, setSeconds] = useState(0);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!startTime) {
            setSeconds(0);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Initial calculation
        const updateTimer = () => {
            const now = Date.now();
            const diff = Math.floor((now - startTime) / 1000);
            setSeconds(diff >= 0 ? diff : 0);
        };

        updateTimer();
        intervalRef.current = setInterval(updateTimer, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [startTime]);

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return { seconds, formatted: formatTime(seconds), formatTime };
};
