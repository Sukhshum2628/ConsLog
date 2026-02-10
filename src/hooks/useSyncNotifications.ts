import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useSyncActions, type SyncRequest } from './useSyncActions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useSyncNotifications = () => {
    const { user } = useAuth();
    const { showConfirm } = useModal();
    const { acceptRequest } = useSyncActions();

    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'users', user.uid, 'requests'),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach(async (change) => {
                if (change.type === 'added') {
                    const req = { id: change.doc.id, ...change.doc.data() } as SyncRequest;

                    // Show Popup for NEW requests
                    // Ensure we don't spam if multiple load at once? 
                    // onSnapshot calls 'added' for initial load too. 
                    // We might want to filter by timestamp if we only want "real-time" ones, 
                    // but showing pending requests on load is also good feature.

                    const confirmed = await showConfirm({
                        title: 'New Sync Request',
                        message: `User "${req.fromUsername}" wants to sync logs with you.`,
                        type: 'info',
                        confirmText: 'Accept',
                        cancelText: 'Ignore/Reject'
                    });

                    if (confirmed) {
                        await acceptRequest(req);
                    } else {
                        // Optional: Reject on ignore? Or just leave it pending?
                        // If we reject, it deletes it.
                        // Let's ask via another modal? No, too complex.
                        // Let's assume 'Ignore' leaves it pending (so they can accept in SyncManager later),
                        // OR we make the secondary button "Reject".
                        // standard 'showConfirm' has cancelText.

                        // If we want explicit reject, we might need a custom modal or just let them manage in UI.
                        // For now, let's just leave it pending if they cancel.
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [user, showConfirm, acceptRequest]);
};
