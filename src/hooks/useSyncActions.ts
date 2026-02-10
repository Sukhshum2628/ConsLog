import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    deleteDoc,
    setDoc,
    getDoc,
    writeBatch,
    serverTimestamp,
    type Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface SyncRequest {
    id: string;
    fromUid: string;
    fromUsername: string;
    fromDisplayName?: string;
    fromPhoto?: string;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: Timestamp;
}

export const useSyncActions = () => {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [loading, setLoading] = useState(false);

    const sendRequest = async (targetUsername: string) => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Find Target User
            const q = query(collection(db, 'users'), where('username', '==', targetUsername));
            const snap = await getDocs(q);

            if (snap.empty) throw new Error("User not found. Check the username.");

            const targetUserDoc = snap.docs[0];
            const targetUid = targetUserDoc.id;
            const targetData = targetUserDoc.data();

            if (targetUid === user.uid) throw new Error("You cannot sync with yourself.");

            // 2. Check existing connection
            const existingConn = await getDoc(doc(db, 'users', user.uid, 'connections', targetUid));
            if (existingConn.exists()) throw new Error(`Already synced with ${targetData.displayName || targetUsername}`);

            // 3. Send Request
            const myProfileSnap = await getDoc(doc(db, 'users', user.uid));
            const myProfile = myProfileSnap.data();

            await addDoc(collection(db, 'users', targetUid, 'requests'), {
                fromUid: user.uid,
                fromUsername: myProfile?.username || user.email,
                fromDisplayName: myProfile?.displayName || user.displayName,
                fromPhoto: user.photoURL || null,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            // SUCCESS POPUP (Sender)
            await showAlert({
                title: 'Request Sent',
                message: `Sync request sent to ${targetData.displayName || targetUsername}!`,
                type: 'success'
            });
            return true;

        } catch (err: any) {
            console.error(err);
            await showAlert({
                title: 'Error',
                message: err.message || "Failed to send request",
                type: 'danger'
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const acceptRequest = async (req: SyncRequest, siteId?: string, siteName?: string) => {
        if (!user) return;
        setLoading(true);
        try {
            // 1. Add to MY connections (I am connecting to THEM)
            await setDoc(doc(db, 'users', user.uid, 'connections', req.fromUid), {
                uid: req.fromUid,
                username: req.fromUsername,
                displayName: req.fromDisplayName || req.fromUsername,
                connectedAt: new Date(),
                syncedSiteId: siteId || 'all',
                syncedSiteName: siteName || 'All Sites'
            });

            // 2. Add ME to THEIR connections (They connect to ME)
            const myProfileSnap = await getDoc(doc(db, 'users', user.uid));
            const myProfile = myProfileSnap.data();

            await setDoc(doc(db, 'users', req.fromUid, 'connections', user.uid), {
                uid: user.uid,
                username: myProfile?.username || 'Unknown',
                displayName: myProfile?.displayName || 'Unknown',
                connectedAt: new Date(),
                syncedSiteId: 'all', // Default for now
                syncedSiteName: 'All Sites'
            });

            // 3. Delete Request
            await deleteDoc(doc(db, 'users', user.uid, 'requests', req.id));

            await showAlert({
                title: 'Synced!',
                message: `You are now synced with ${req.fromUsername}.`,
                type: 'success'
            });
            return true;
        } catch (e: any) {
            console.error(e);
            await showAlert({ title: 'Error', message: 'Failed to accept request.', type: 'danger' });
            return false;
        } finally {
            setLoading(false);
        }
    };

    const rejectRequest = async (reqId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'requests', reqId));
            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const disconnect = async (targetUid: string) => {
        if (!user) return;

        const confirmed = await showConfirm({
            title: 'Disconnect Partner',
            message: 'Are you sure? This will remove shared logs and stop syncing.',
            type: 'danger',
            confirmText: 'Disconnect',
            cancelText: 'Cancel'
        });

        if (!confirmed) return false;

        setLoading(true);
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'connections', targetUid));
            await deleteDoc(doc(db, 'users', targetUid, 'connections', user.uid));
            return true;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const broadcastSiteChange = useCallback(async (newSiteId: string, newSiteName: string) => {
        if (!user) return;
        try {
            // Get my connections
            const myConnsRef = collection(db, 'users', user.uid, 'connections');
            const snapshot = await getDocs(myConnsRef);

            const batch = writeBatch(db);

            snapshot.docs.forEach(docSnap => {
                const partnerUid = docSnap.id;
                // Update Partner's view of ME
                // path: users/PARTNER/connections/ME
                const ref = doc(db, 'users', partnerUid, 'connections', user.uid);
                batch.update(ref, {
                    syncedSiteId: newSiteId,
                    syncedSiteName: newSiteName
                });
            });

            await batch.commit();
            // showAlert({ title: 'Sync Updated', message: 'Partners notified of site change.', type: 'info' });
        } catch (error) {
            console.error("Broadcast failed:", error);
        }
    }, [user]);

    return {
        sendRequest,
        acceptRequest,
        rejectRequest,
        disconnect,
        broadcastSiteChange,
        loading
    };
};
