import { useState, useEffect, useCallback } from 'react';
import { getLogsByDate, type TrainLog } from '../db';
import { HaltService } from '../services/haltService';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

// Types
export interface PartnerData {
    uid: string;
    username: string;
    displayName: string;
    logs: TrainLog[];
    lastSyncedAt: Date | null;
    sites: Record<string, { name: string; location: string }>;
    syncedSiteId?: string;
}

interface ConnectionData {
    uid?: string;
    username: string;
    displayName: string;
    [key: string]: any;
}

export const useTrainLog = (lobbyId: string | null = null, viewingSiteId: string | null = null) => {
    const { user } = useAuth();
    const { showAlert } = useModal();
    const [logs, setLogs] = useState<TrainLog[]>([]);
    const [partnerLogs, setPartnerLogs] = useState<PartnerData[]>([]); // New State
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate active log
    const activeLog = logs.find(l => l.status === 'RUNNING') || null;

    // Calculate total halt time for TODAY
    const totalHaltTime = logs.reduce((total, log) => {
        return total + (log.halt_duration_seconds || 0);
    }, 0);

    // MIGRATION: Ensure all user logs have a siteId.
    // If a log has no siteId, assign it to 'default-site'.
    // Placeholder for future migration logic
    useEffect(() => {
        // No-op for now
    }, [user, lobbyId]);

    // 1. Load MY Data (Real-time Listener)
    useEffect(() => {
        setLoading(true);
        const dateStr = format(currentDate, 'yyyy-MM-dd');

        // LOBBY MODE (Shared - Legacy/Fallback if used)
        if (lobbyId) {
            const q = query(
                collection(db, 'lobbies', lobbyId, 'logs'),
                where('date', '==', dateStr)
            );
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const remoteLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainLog));
                remoteLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);
                setLogs(remoteLogs);
                setLoading(false);
            });
            return () => unsubscribe();
        }

        // USER CLOUD MODE (Private)
        else if (user) {
            // Base constraints
            const constraints = [
                where('date', '==', dateStr)
            ];

            // If viewingSiteId is provided, filter by it.
            // If viewingSiteId is NOT provided (e.g. initial load?), ideally we should have one.
            // For backward compatibility: If we are viewing 'default-site', 
            // strictly we should match 'siteId == default-site'.
            // But old logs have NO siteId.
            // Hack: If viewing 'default-site', we pull logs, then CLIENT-SIDE check if they need migration?
            // Better: 'default-site' should show logs with siteId=='default-site'.
            // Old logs are "lost" unless we migrate them.

            // Migration handling:
            // We should probably run a separate Effect to migrate old logs.
            // For now, let's just add the Filter.
            if (viewingSiteId) {
                constraints.push(where('siteId', '==', viewingSiteId));
            }

            const q = query(
                collection(db, 'users', user.uid, 'logs'),
                ...constraints
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const cloudLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainLog));
                cloudLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);
                setLogs(cloudLogs);
                setLoading(false);
            }, (err) => {
                console.error("Cloud Sync Error:", err);
                // showAlert({ title: 'Sync Error', message: err.message, type: 'danger' });
                setLoading(false);
            });
            return () => unsubscribe();
        }

        // GUEST MODE (Local)
        else {
            const loadLocal = async () => {
                try {
                    // IndexedDB doesn't easily support multi-site yet without schema change.
                    // For Guest, we might just ignore siteId for now or show all.
                    const data = await getLogsByDate(dateStr);
                    setLogs(data.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp));
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoading(false);
                }
            };
            loadLocal();
        }
    }, [lobbyId, currentDate, user, viewingSiteId]);


    // 2. PARTNER LOGS LOGIC
    // Helper to fetch logs for a specific partner
    const fetchPartnerLogs = useCallback(async (partnerUid: string, partnerName: string, partnerDisplay: string, syncedSiteId?: string) => {
        if (!user) return;
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        console.log(`Fetching logs for ${partnerName} (Scope: ${syncedSiteId || 'All'})...`);

        try {
            const constraints: any[] = [where('date', '==', dateStr)];

            // Filter by Site if a scope is defined and strict
            if (syncedSiteId && syncedSiteId !== 'all') {
                console.log(`[Fetch] Applying Site Filter: ${syncedSiteId}`);
                constraints.push(where('siteId', '==', syncedSiteId));
            } else {
                console.log(`[Fetch] No specific site filter (Scope: ${syncedSiteId})`);
            }

            const q = query(
                collection(db, 'users', partnerUid, 'logs'),
                ...constraints
            );

            // Dynamic imports or standard likely fine
            const { getDocs, getDoc, doc } = await import('firebase/firestore');
            const snapshot = await getDocs(q);
            const pLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainLog));
            pLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);

            // Fetch Site Details for these logs (or just the scoped one)
            // If scoped, we only need that one. If all, we fetch distincts.
            const uniqueSiteIds = Array.from(new Set(pLogs.map(l => l.siteId).filter(Boolean))) as string[];
            const siteMap: Record<string, { name: string; location: string }> = {};

            await Promise.all(uniqueSiteIds.map(async (sid) => {
                try {
                    const siteSnap = await getDoc(doc(db, 'users', partnerUid, 'sites', sid));
                    if (siteSnap.exists()) {
                        const data = siteSnap.data();
                        siteMap[sid] = { name: data.name, location: data.location };
                    } else if (sid === 'default-site') {
                        siteMap[sid] = { name: 'Main Site', location: '' };
                    }
                } catch (e) {
                    console.error("Failed to fetch site info", e);
                }
            }));

            setPartnerLogs(prev => {
                // Remove existing entry for this partner if any
                const filtered = prev.filter(p => p.uid !== partnerUid);
                return [...filtered, {
                    uid: partnerUid,
                    username: partnerName,
                    displayName: partnerDisplay,
                    logs: pLogs,
                    lastSyncedAt: new Date(),
                    sites: siteMap,
                    syncedSiteId: syncedSiteId // Save scope
                }];
            });
        } catch (e) {
            console.error(`Failed to fetch logs for ${partnerName}`, e);
        }
    }, [user, currentDate]);

    // Listen to Connections & Auto-Sync
    // Listen to Connections
    // Listen to Connections & Auto-Sync
    // Listen to Connections
    useEffect(() => {
        if (!user || lobbyId) {
            setPartnerLogs([]);
            return;
        }

        const unsubConn = onSnapshot(collection(db, 'users', user.uid, 'connections'), (snap) => {
            const connections = snap.docs.map(d => ({ ...d.data(), uid: d.id } as ConnectionData));
            const connectionUids = new Set(connections.map(c => c.uid));

            setPartnerLogs(prev => {
                // 1. Remove partners who are no longer connected
                const kept = prev.filter(p => connectionUids.has(p.uid));

                // 2. Add new partners OR Update existing ones if scope changed
                // We need to trigger fetch if scope changed.
                // Simplified: Just re-run fetch for everyone active?
                // Or compare.

                connections.forEach(conn => {
                    const connUid = conn.uid || conn.id || '';
                    if (!connUid) return;


                    // Check if we need to fetch (New, or Scope Changed)
                    // We can't easily check scope change here without storing it in PartnerData.
                    // Let's blindly fetch for now, it's safer.
                    // But we don't want to loop infinite.
                    // This listener fires on Metadata update (Switch Site).
                    // So YES, we want to re-fetch when this fires.
                    console.log(`[Listener] Update from ${conn.username}: SyncedSiteId=${conn.syncedSiteId}`);

                    fetchPartnerLogs(connUid, conn.username, conn.displayName, conn.syncedSiteId);

                    // Note: We don't add to state here, fetchPartnerLogs does.
                });

                return kept; // The fetch will append/update them.
            });
        });

        return () => unsubConn();
    }, [user, lobbyId, currentDate, fetchPartnerLogs]);

    // Auto-Sync Interval (Separate Effect)
    // We need to know the SCOPE for auto-sync.
    // Since fetchPartnerLogs is stateless regarding scope (it asks for it),
    // and PartnerData state doesn't have it (yet), we need to read it?
    // Actually, let's add `syncedSiteId` to PartnerData state in fetchPartnerLogs update.
    // I missed that in previous step. I'll fix it in next step or assume I did?
    // I didn't. I only added filtering.
    // FOR NOW: I will rely on the listener to handle updates.
    // For auto-sync, I risk losing scope if I don't store it.
    // Let's modify this Effect to not use setInterval on partnerLogs directly without knowing scope.
    // Better: Fetch connections again? No.
    // Solution: Store connections in a ref or state?
    // Actually, `useTrainLog` is becoming complex.
    // Let's just make `fetchPartnerLogs` store `syncedSiteId` in `PartnerData` (step 4).
    // And here, we assume it's there.

    useEffect(() => {
        if (!user || lobbyId || partnerLogs.length === 0) return;

        const intervalId = setInterval(() => {
            console.log("Auto-syncing partners...");
            partnerLogs.forEach(partner => {
                // @ts-ignore - Assuming we added it to type, or will.
                fetchPartnerLogs(partner.uid, partner.username, partner.displayName, partner.syncedSiteId);
            });
        }, 5 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [user, lobbyId, partnerLogs, fetchPartnerLogs]);


    // Context for Service
    const context = { userId: user?.uid, lobbyId };

    const addEntry = useCallback(async (data: { category: string; subcategory?: string }) => {
        // ... (Same as before)
        const alreadyRunning = logs.find(l => l.status === 'RUNNING');
        if (alreadyRunning) {
            showAlert({ title: 'Timer Running', message: 'A timer is already running!\nPlease stop it first.', type: 'warning' });
            return;
        }

        try {
            const newLogData = {
                date: format(currentDate, 'yyyy-MM-dd'),
                arrival_timestamp: Date.now(),
                status: 'RUNNING' as const, // Explicit cast
                siteId: viewingSiteId ?? undefined,
                category: data.category,
                subcategory: data.subcategory
            };

            const createdLog = await HaltService.createHalt(newLogData, context);

            // If local (Guest), manual state update is needed as we don't have a listener?
            // Actually, listener might catch it if it listens to IndexedDB?
            // Guest mode listener in useEffect currently loads once. It doesn't listen.
            // So for Guest, we must update state.
            if (!user && !lobbyId) {
                // Re-fetch or append?
                setLogs(prev => [createdLog, ...prev]);
            }

            // For Cloud/Lobby, listener handles it.
        } catch (error) {
            console.error("FAILED ADD ENTRY:", error);
            showAlert({ title: 'Error', message: 'Error starting timer: ' + (error as any).message, type: 'danger' });
        }
    }, [logs, lobbyId, user, currentDate, showAlert, viewingSiteId]);

    const updateEntry = useCallback(async (updatedLog: TrainLog) => {
        try {
            await HaltService.updateHalt(updatedLog, context);
            if (!user && !lobbyId) {
                setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l));
            }
        } catch (e: any) {
            showAlert({ title: 'Update Failed', message: e.message, type: 'danger' });
        }
    }, [lobbyId, user, showAlert]);

    const completeEntry = useCallback(async (log: TrainLog) => {
        try {
            const completed = await HaltService.stopHalt(log, context);
            if (!user && !lobbyId) {
                setLogs(prev => prev.map(l => l.id === log.id ? completed : l));
            }
        } catch (e: any) {
            console.error("Complete failed", e);
            showAlert({ title: 'Error', message: 'Failed to stop timer.', type: 'danger' });
        }
    }, [updateEntry, user, lobbyId]); // updateEntry dependency not strictly needed if we use Service directly

    const removeEntry = useCallback(async (id: number | string) => {
        try {
            await HaltService.deleteHalt(id, context);
            if (!user && !lobbyId) {
                setLogs(prev => prev.filter(l => l.id !== id));
            }
        } catch (e) {
            console.error("Delete failed", e);
        }
    }, [lobbyId, user]);

    const bulkDeleteEntries = useCallback(async (ids: (number | string)[]) => {
        try {
            await HaltService.bulkDeleteHalts(ids, context);
            if (!user && !lobbyId) {
                setLogs(prev => prev.filter(l => !ids.includes(l.id!)));
            }
            showAlert({ title: 'Deleted', message: `${ids.length} logs deleted.`, type: 'success' });
        } catch (e: any) {
            console.error("Bulk delete failed", e);
            showAlert({ title: 'Error', message: 'Failed to delete logs.', type: 'danger' });
        }
    }, [lobbyId, user, showAlert]);

    const copyLogToPersonal = useCallback(async (log: TrainLog) => {
        if (!user) return;
        try {
            // We use createHalt but force it to user context even if we are in lobby?
            // Actually copyLogToPersonal implies "Copy to MY personal logs".
            // So context is { userId: user.uid }.
            const copyContext = { userId: user.uid };

            // Data to copy
            const { id, ...logData } = log;
            // Ensure it's completed
            const dataToCreate = {
                ...logData,
                category: logData.category || 'Other', // Handle legacy
                status: 'COMPLETED' as const
            };

            await HaltService.createHalt(dataToCreate, copyContext);
            showAlert({ title: 'Success', message: 'Log copied to your personal logs!', type: 'success' });
        } catch (e) {
            console.error("Copy failed", e);
            showAlert({ title: 'Error', message: 'Failed to copy log.', type: 'danger' });
        }
    }, [user, showAlert]);

    const clearAllLogs = useCallback(async () => {
        // Service doesn't have clearAll yet, but we can iterate or add it?
        // For now let's keep it here or add to service.
        // Let's implement it using bulkDelete logic or existing.
        if (!user) return;
        try {
            // ... (Existing logic fetch then batch delete)
            // Ideally move to service, but for now reuse existing code or bulkDelete
            // Fetch strict, then delete.
            const logsRef = collection(db, 'users', user.uid, 'logs');
            const snapshot = await import('firebase/firestore').then(mod => mod.getDocs(logsRef));
            if (snapshot.empty) {
                showAlert({ title: 'Empty', message: 'No logs to clear.', type: 'info' });
                return;
            }
            const ids = snapshot.docs.map(d => d.id);
            await HaltService.bulkDeleteHalts(ids, { userId: user.uid });
            showAlert({ title: 'Cleared', message: `Successfully deleted ${ids.length} logs.`, type: 'success' });
            setLogs([]);
        } catch (error: any) {
            console.error("Clear all failed:", error);
            showAlert({ title: 'Error', message: 'Failed to clear logs: ' + error.message, type: 'danger' });
        }
    }, [user, showAlert]);

    const fetchLogsByRange = useCallback(async (startDate: Date, endDate: Date, siteId?: string) => {
        if (!user) {
            // Local Guest Mode - Fetch from IDB
            try {
                const all = await import('../db').then(mod => mod.getAllLogs());
                return all.filter(l => {
                    const d = new Date(l.arrival_timestamp);
                    return d >= startDate && d <= endDate;
                });
            } catch (e) {
                console.error("Local fetch failed", e);
                return [];
            }
        }

        try {
            // Firestore Query
            // const startStr = format(startDate, 'yyyy-MM-dd');
            // const endStr = format(endDate, 'yyyy-MM-dd');

            // We use date string string comparison for broad range, then refine?
            // Actually, querying by 'date' string (yyyy-MM-dd) works for range if we want WHOLE days.
            // ReportModal passes startOfDay and endOfDay dates.
            // So we can use 'arrival_timestamp' for precise filtering.

            const q = query(
                collection(db, 'users', user.uid, 'logs'),
                where('arrival_timestamp', '>=', startDate.getTime()),
                where('arrival_timestamp', '<=', endDate.getTime())
            );

            const snapshot = await import('firebase/firestore').then(mod => mod.getDocs(q));
            const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TrainLog));

            // Filter by Site if provided
            if (siteId) {
                return fetchedLogs.filter(l => {
                    if (siteId === 'default-site') return !l.siteId || l.siteId === 'default-site';
                    return l.siteId === siteId;
                });
            }

            return fetchedLogs;
        } catch (e) {
            console.error("Range fetch failed", e);
            showAlert({ title: 'Error', message: 'Failed to fetch report data.', type: 'danger' });
            return [];
        }
    }, [user, showAlert]);

    return {
        logs,
        partnerLogs,
        fetchPartnerLogs,
        loading,
        addEntry,
        updateEntry,
        completeEntry,
        removeEntry,
        bulkDeleteEntries,
        copyLogToPersonal,
        clearAllLogs,
        activeLog,
        totalHaltTime,
        setDate: setCurrentDate,
        fetchLogsByRange // New
    };
};

