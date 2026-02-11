import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Shift } from '../db';

const SHIFTS_COLLECTION = 'shifts';

export const ShiftService = {
    /**
     * Create a new shift for a site.
     */
    createShift: async (shiftData: Omit<Shift, 'id'>, userId: string): Promise<Shift> => {
        try {
            // Check for overlaps? (Optional enhancement)
            const shiftsRef = collection(db, 'users', userId, SHIFTS_COLLECTION);
            const docRef = await addDoc(shiftsRef, shiftData);
            return { id: docRef.id, ...shiftData };
        } catch (error) {
            console.error("Error creating shift:", error);
            throw error;
        }
    },

    /**
     * Get all shifts for a specific site.
     */
    getShiftsBySite: async (userId: string, siteId: string): Promise<Shift[]> => {
        try {
            const shiftsRef = collection(db, 'users', userId, SHIFTS_COLLECTION);
            const q = query(shiftsRef, where('siteId', '==', siteId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
        } catch (error) {
            console.error("Error fetching shifts:", error);
            return [];
        }
    },

    /**
     * Update an existing shift.
     */
    updateShift: async (shift: Shift, userId: string): Promise<void> => {
        try {
            const shiftRef = doc(db, 'users', userId, SHIFTS_COLLECTION, shift.id);
            const { id, ...data } = shift;
            await updateDoc(shiftRef, data);
        } catch (error) {
            console.error("Error updating shift:", error);
            throw error;
        }
    },

    /**
     * Delete a shift.
     */
    deleteShift: async (shiftId: string, userId: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, 'users', userId, SHIFTS_COLLECTION, shiftId));
        } catch (error) {
            console.error("Error deleting shift:", error);
            throw error;
        }
    },

    /**
     * Determine the current shift based on time.
     * Note: Handles overnight shifts (e.g. 22:00 - 06:00).
     */
    getCurrentShift: (shifts: Shift[]): Shift | null => {
        if (!shifts || shifts.length === 0) return null;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        for (const shift of shifts) {
            const [startH, startM] = shift.startTime.split(':').map(Number);
            const [endH, endM] = shift.endTime.split(':').map(Number);

            const startTotal = startH * 60 + startM;
            const endTotal = endH * 60 + endM;

            if (startTotal < endTotal) {
                // Normal day shift (e.g. 09:00 - 17:00)
                if (currentMinutes >= startTotal && currentMinutes < endTotal) {
                    return shift;
                }
            } else {
                // Overnight shift (e.g. 22:00 - 06:00)
                // Current time must be >= start OR < end
                if (currentMinutes >= startTotal || currentMinutes < endTotal) {
                    return shift;
                }
            }
        }

        return null;
    }
};
