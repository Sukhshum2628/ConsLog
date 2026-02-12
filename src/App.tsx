import { useState, useEffect, useMemo } from 'react';
import { SmartButton } from './components/SmartButton';
import { LogTable } from './components/LogTable';
import { HistoryModal } from './components/HistoryModal';
import { EditLogModal } from './components/EditLogModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ReportModal, type ReportOptions } from './components/ReportModal';
import { SettingsModal } from './components/SettingsModal';
import { Onboarding } from './components/Onboarding';
import { StartHaltModal } from './components/StartHaltModal';
import { DashboardPage } from './components/DashboardPage';
import { useTrainLog } from './hooks/useTrainLog';
import { exportToExcel, exportToPDF } from './utils/export';
import { format } from 'date-fns';
import { getShiftName, getCurrentShiftName } from './utils/shiftUtils';
import { Download, History, Settings, Wifi, WifiOff, RefreshCw, Menu, MapPin, BarChart2 } from 'lucide-react';
import { useModal, ModalProvider } from './context/ModalContext';
import type { TrainLog } from './db';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SecurityCheck } from './components/SecurityCheck';
import { ErrorBoundary } from './components/ErrorBoundary';

import { useSyncNotifications } from './hooks/useSyncNotifications';
import { useSyncActions } from './hooks/useSyncActions';
import { useSites, type Site } from './hooks/useSites';
import { Sidebar } from './components/Sidebar';
import { SwitchSiteOptionsModal } from './components/SwitchSiteOptionsModal'; // Added

// Inner App component that uses Context
function InnerApp() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('timeLog_hasOnboarded') === 'true';
  });

  const { showAlert, showConfirm } = useModal();
  useSyncNotifications();
  const { broadcastSiteChange } = useSyncActions();

  const { selectedSite, selectSite } = useSites();
  const [showSidebar, setShowSidebar] = useState(false);

  // View State
  const [view, setView] = useState<'logs' | 'dashboard'>('logs');

  // Network Status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const {
    logs,
    partnerLogs,
    fetchPartnerLogs,
    addEntry,
    completeEntry,
    removeEntry,
    updateEntry,
    activeLog,
    totalHaltTime,
    copyLogToPersonal,
    bulkDeleteEntries,
    fetchLogsByRange
  } = useTrainLog(null, selectedSite?.id || null);

  const { sendRequest, broadcastSiteChange } = useSyncActions();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [pendingSite, setPendingSite] = useState<Site | null>(null);

  // Site Selection with Sync Logic
  const handleSelectSite = async (site: Site) => {
    // If we have functional partners (not just historic), we need to decide what to do.
    if (partnerLogs.length > 0) {
      setPendingSite(site);
      setShowSwitchModal(true);
      return;
    }
    selectSite(site);
  };

  const handleSwitchOption = async (option: 'limit-current' | 'add-new' | 'solo' | 'cancel', extraData?: string) => {
    if (!pendingSite) return;

    if (option === 'cancel') {
      setPendingSite(null);
      return;
    }

    // Perform Site Switch
    selectSite(pendingSite);

    // Handle Sync Logic
    switch (option) {
      case 'limit-current':
        // Upgrade ALL current partners to the new site
        // This maintains the "session" across sites
        const partnerUids = partnerLogs.map(p => p.uid);
        await broadcastSiteChange(pendingSite.id, pendingSite.name, partnerUids);
        break;

      case 'add-new':
        // Invite a NEW user for this site
        // We assume current partners STAY on the old site context mentally, 
        // but visually we switch sites, so they will disappear from view (filtered out).
        if (extraData) {
          await sendRequest(extraData, pendingSite.id, pendingSite.name);
        }
        break;

      case 'solo':
        // Switch to site, but don't bring anyone. 
        // Effectively "Pause" sync for this view?
        // The useTrainLog filter will naturally hide partners not synced to this site.
        // So we don't need to do anything except NOT broadcast.
        break;
    }

    setPendingSite(null);
    setShowSidebar(false);
  };

  const { user } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingLog, setEditingLog] = useState<TrainLog | null>(null);

  /* New State for Halt Categorization */
  const [showStartModal, setShowStartModal] = useState(false);

  const handleSmartButtonPress = () => {
    if (activeLog) {
      completeEntry(activeLog);
    } else {
      setShowStartModal(true);
    }
  };

  const handleStartHalt = (data: { category: string; subcategory?: string }) => {
    addEntry(data);
    setShowStartModal(false);
  };

  /* New State for Profile */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);

            if (!data.username) {
              setShowProfileModal(true);
            }
          } else {
            // New user (no doc yet), definitely show it
            setShowProfileModal(true);
          }
        } catch (e) {
          console.error("Profile fetch error", e);
        }
      }
    };
    fetchProfile();
  }, [user]);

  /* Reports Logic */
  const handleExportClick = () => {
    if (logs.length === 0) {
      showAlert({ title: 'No Logs', message: 'No logs to export today.', type: 'info' });
      return;
    }
    setShowReportModal(true);
  };

  const handleGenerateReport = async (options: ReportOptions) => {
    try {
      // Fetch logs for ALL selected users (Me + Partners) in parallel
      const logsPromises = options.selectedUserIds.map(async (uid) => {
        // Determine if this is "Me" or a Partner
        const isMe = uid === user?.uid || uid === 'me';
        // If "me", use user.uid (or let fetchLogsByRange handle fallbacks).
        // If partner, use their UID directly.
        const targetUnderlyingUid = (uid === 'me' && user?.uid) ? user.uid : uid;

        // Skip if we can't resolve a valid UID (e.g. unauth "me")
        // Actually fetchLogsByRange handles !user internally for local IDB.

        let fetchUid: string | undefined = targetUnderlyingUid;
        if (uid === 'me' && !user) fetchUid = undefined; // Trigger local IDB in hook

        // Find display name
        let displayName = 'Unknown';
        if (isMe) {
          displayName = user?.displayName || 'Me';
        } else {
          const partner = partnerLogs.find(p => p.uid === uid);
          // If not in partnerLogs (maybe historic?), try to find in availableUsers?
          // availableUsers is built from partnerLogs + Me.
          displayName = partner?.displayName || 'Partner';
        }

        // Fetch
        const fetched = await fetchLogsByRange(options.startDate, options.endDate, selectedSite?.id, fetchUid);

        // Tag with owner info
        return fetched.map(log => ({
          ...log,
          owner: displayName,
          ownerId: uid // Keep 'me' or real UID
        }));
      });

      const nestedLogs = await Promise.all(logsPromises);
      const finalLogs = nestedLogs.flat();

      // Sort
      finalLogs.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);

      if (finalLogs.length === 0) {
        showAlert({ title: 'No Logs Found', message: 'No logs match the selected filters.', type: 'info' });
        return;
      }

      if (options.format === 'excel') {
        exportToExcel(finalLogs);
      } else {
        exportToPDF(finalLogs, userProfile || { displayName: user?.displayName });
      }

    } catch (e) {
      console.error("Report generation failed", e);
      showAlert({ title: 'Error', message: 'Failed to generate report.', type: 'danger' });
    }
  };

  // Prepare available users for the modal
  const availableUsers = useMemo(() => {
    const list = [];
    if (user) {
      list.push({ uid: user.uid, displayName: user.displayName || 'Me' });
    }
    partnerLogs.forEach(p => {
      list.push({ uid: p.uid, displayName: p.displayName });
    });
    return list;
  }, [user, partnerLogs]);


  const handleOnboardingComplete = () => {
    localStorage.setItem('timeLog_hasOnboarded', 'true');
    setHasOnboarded(true);
  };

  const totalHaltFormatted = new Date(totalHaltTime * 1000).toISOString().substr(11, 8);

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (view === 'dashboard') {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col font-sans text-gray-900 px-4 pb-4 pt-safe-card animate-slideInRight relative">
        <DashboardPage
          logs={logs}
          onBack={() => setView('logs')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col font-sans text-gray-900 animate-fadeIn pt-safe pb-safe relative">
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectSite={handleSelectSite}
        activeSiteId={selectedSite?.id}
      />

      {/* Header */}
      <header className="bg-white shadow-sm px-4 py-4 transition-all border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-md mx-auto py-4 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSidebar(true)}
                className="p-1 -ml-1 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-800 truncate max-w-[150px]">
                {selectedSite?.name || 'TimeLog'}
              </h1>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500 font-medium">
                {format(new Date(), 'EEEE, d MMMM')}
              </p>
              {!isOnline ? (
                <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold animate-pulse">
                  <WifiOff className="w-3 h-3" /> OFFLINE
                </span>
              ) : user ? (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <Wifi className="w-3 h-3" /> SYNC ON
                </span>
              ) : (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <WifiOff className="w-3 h-3" /> LOCAL
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">

            <button
              onClick={() => setView('dashboard')}
              className="p-2 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors"
              title="Dashboard"
            >
              <BarChart2 className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowHistory(true)}
              className="p-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={handleExportClick}
              className="p-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col gap-6 overflow-hidden">
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              {user ? `Team Logs (${logs.length})` : `Local Logs (${logs.length})`}
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100 normal-case">
                {getCurrentShiftName()}
              </span>
            </h2>
          </div>

          <LogTable
            logs={logs}
            onDelete={removeEntry}
            onEdit={(log) => setEditingLog(log)}
            onBulkDelete={bulkDeleteEntries}
          />
        </section>

        {/* Partner Logs Section */}
        {
          user && partnerLogs.length > 0 && (
            <section className="flex-none space-y-4">
              {partnerLogs.map(partner => {
                const primarySiteId = partner.logs[0]?.siteId;
                // @ts-ignore 
                const siteInfo = primarySiteId && partner.sites ? partner.sites[primarySiteId] : null;

                return (
                  <div
                    key={partner.uid + (partner.syncedSiteId || '')}
                    className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden animate-in fade-in duration-500"
                  >
                    <div className="bg-blue-50 p-3 flex justify-between items-center">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <h3 className="font-bold text-gray-800 text-sm">{partner.displayName}</h3>
                          {partner.logs.length > 0 && (
                            <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 uppercase font-bold">
                              {getShiftName(partner.logs[0].arrival_timestamp)}
                            </span>
                          )}
                        </div>
                        {siteInfo && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 ml-4">
                            <MapPin size={10} />
                            <span className="font-medium">{siteInfo.name}</span>
                            {siteInfo.location && <span className="opacity-75">• {siteInfo.location}</span>}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => fetchPartnerLogs(partner.uid, partner.username, partner.displayName, partner.syncedSiteId)}
                        className="flex items-center gap-1 text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <RefreshCw size={12} />
                        Sync
                      </button>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {partner.logs.length === 0 ? (
                        <p className="text-xs text-gray-400 p-4 text-center">No logs for today.</p>
                      ) : (
                        <LogTable
                          logs={partner.logs}
                          readOnly={true}
                          onDelete={() => { }}
                          onEdit={() => { }}
                          onCopy={copyLogToPersonal}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )
        }

        <section className="flex-none mb-4">
          <SmartButton
            status={activeLog ? 'RUNNING' : 'IDLE'}
            startTime={activeLog?.arrival_timestamp}
            onPress={handleSmartButtonPress}
          />
        </section>
      </main >

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 p-4 pb-safe sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-xl shadow-lg">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                Total Halt Time
              </span>
              <span className="text-2xl font-mono font-bold">
                {totalHaltFormatted}
              </span>
            </div>
            <div className={`w-3 h-3 rounded-full ${activeLog ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
          </div>
        </div>
      </footer >

      {/* Modals */}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} siteId={selectedSite?.id} />}

      {
        editingLog && (
          <EditLogModal
            log={editingLog}
            onClose={() => setEditingLog(null)}
            onSave={updateEntry}
          />
        )
      }

      {
        showReportModal && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            onGenerate={handleGenerateReport}
            availableUsers={availableUsers}
          />
        )
      }

      {
        showStartModal && (
          <StartHaltModal
            isOpen={showStartModal}
            onClose={() => setShowStartModal(false)}
            onStart={handleStartHalt}
          />
        )
      }

      {
        showSettings && (
          <SettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            onEditProfile={() => {
              setShowSettings(false);
              setShowProfileModal(true);
            }}
          />
        )
      }

      <EditProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      <SwitchSiteOptionsModal
        isOpen={showSwitchModal}
        onClose={() => setShowSwitchModal(false)}
        targetSite={pendingSite!}
        currentPartners={partnerLogs}
        onOptionSelect={handleSwitchOption}
      />
    </div >
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ModalProvider>
          <SecurityCheck>
            <InnerApp />
          </SecurityCheck>
        </ModalProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
