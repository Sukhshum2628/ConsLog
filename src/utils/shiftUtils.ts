/**
 * Automatically determines the shift name based on the timestamp.
 * Day Shift: 06:00 (inclusive) - 18:00 (exclusive)
 * Night Shift: 18:00 (inclusive) - 06:00 (exclusive)
 */
export const getShiftName = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours();

    if (hours >= 6 && hours < 18) {
        return 'Day Shift';
    } else {
        return 'Night Shift';
    }
};

/**
 * Returns the current shift name based on the current time.
 */
export const getCurrentShiftName = (): string => {
    return getShiftName(Date.now());
};
