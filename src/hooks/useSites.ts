import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';

export interface Site {
    id: string;
    name: string;
    location: string;
    created_at?: any;
    isDefault?: boolean;
}

export const useSites = () => {
    const { user } = useAuth();
    const { showAlert, showConfirm } = useModal();
    const [sites, setSites] = useState<Site[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSite, setSelectedSite] = useState<Site | null>(() => {
        const saved = localStorage.getItem('consLogger_selectedSite');
        return saved ? JSON.parse(saved) : null;
    });

    // Load Sites
    useEffect(() => {
        if (!user) {
            setSites([]);
            setLoading(false);
            return;
        }

        const q = query(collection(db, 'users', user.uid, 'sites'), orderBy('created_at', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedSites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Site));

            // Auto-create default site if none exist
            if (loadedSites.length === 0 && !snapshot.metadata.fromCache) {
                createDefaultSite();
            } else {
                setSites(loadedSites);

                // Ensure a site is selected
                if (!selectedSite && loadedSites.length > 0) {
                    const defaultSite = loadedSites.find(s => s.isDefault) || loadedSites[0];
                    setSelectedSite(defaultSite);
                    localStorage.setItem('consLogger_selectedSite', JSON.stringify(defaultSite));
                } else if (selectedSite && !loadedSites.find(s => s.id === selectedSite.id)) {
                    // Selected site was deleted
                    const nextSite = loadedSites[0] || null;
                    setSelectedSite(nextSite);
                    if (nextSite) {
                        localStorage.setItem('consLogger_selectedSite', JSON.stringify(nextSite));
                    } else {
                        localStorage.removeItem('consLogger_selectedSite');
                    }
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const createDefaultSite = async () => {
        if (!user) return;
        try {
            const defaultId = 'default-site';
            const newSite: Site = {
                id: defaultId,
                name: 'Main Site',
                location: 'Default Location',
                created_at: serverTimestamp(),
                isDefault: true
            };
            await setDoc(doc(db, 'users', user.uid, 'sites', defaultId), newSite);
        } catch (error) {
            console.error("Error creating default site:", error);
        }
    };

    const addSite = useCallback(async (name: string, location: string) => {
        if (!user) return;
        try {
            const id = Date.now().toString();
            const newSite: Site = {
                id,
                name,
                location,
                created_at: serverTimestamp()
            };
            await setDoc(doc(db, 'users', user.uid, 'sites', id), newSite);
            showAlert({ title: 'Success', message: 'New site added successfully.', type: 'success' });
            return id;
        } catch (error) {
            console.error("Add site error:", error);
            showAlert({ title: 'Error', message: 'Failed to add site.', type: 'danger' });
        }
    }, [user, showAlert]);

    const deleteSite = useCallback(async (siteId: string) => {
        if (!user) return;

        // Prevent deleting the last site or default site? Maybe just warn.
        // For now, let's allow deleting any site, but if it's the last one, we might recreate default.

        const confirmed = await showConfirm({
            title: 'Delete Site',
            message: 'Are you sure you want to delete this site? Logs associated with it will be hidden.',
            type: 'danger',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });

        if (confirmed) {
            try {
                await deleteDoc(doc(db, 'users', user.uid, 'sites', siteId));
                showAlert({ title: 'Deleted', message: 'Site removed.', type: 'success' });
            } catch (error) {
                console.error("Delete site error:", error);
                showAlert({ title: 'Error', message: 'Failed to delete site.', type: 'danger' });
            }
        }
    }, [user, showConfirm, showAlert]);

    const selectSite = (site: Site) => {
        setSelectedSite(site);
        localStorage.setItem('consLogger_selectedSite', JSON.stringify(site));
    };

    return {
        sites,
        loading,
        selectedSite,
        addSite,
        deleteSite,
        selectSite
    };
};
