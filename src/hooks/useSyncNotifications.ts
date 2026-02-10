import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useSyncActions, type SyncRequest } from './useSyncActions';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const useSyncNotifications = () => {
    const { user } = useAuth();
    const { showConfirm } = useModal();
    const { acceptRequest } = useSyncActions();

    // Track requests we've already shown a popup for to prevent duplicates/loops
    const processedIds = useRef<Set<string>>(new Set());

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

                    if (processedIds.current.has(req.id)) {
                        return; // Already handled/showing
                    }

                    // Mark as processed immediately so we don't show it again
                    processedIds.current.add(req.id);

                    const confirmed = await showConfirm({
                        title: 'New Sync Request',
                        message: `User "${req.fromUsername}" wants to sync logs with you.`,
                        type: 'info',
                        confirmText: 'Accept',
                        cancelText: 'Ignore'
                    });

                    if (confirmed) {
                        try {
                            await acceptRequest(req);
                        } catch (e) {
                            console.error("Accept failed", e);
                            // If failed, maybe remove from processedIds so they can try again? 
                            // Or let them use the manual menu. Safe to keep as processed.
                        }
                    }
                }
            });
        });

        return () => unsubscribe();
    }, [user, showConfirm, acceptRequest]);
};
