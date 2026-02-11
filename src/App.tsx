import { useState, useEffect } from 'react';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { SmartButton } from './components/SmartButton';
import { LogTable } from './components/LogTable';
import { HistoryModal } from './components/HistoryModal';
import { EditLogModal } from './components/EditLogModal';
import { EditProfileModal } from './components/EditProfileModal';
import { ExportOptionsModal } from './components/ExportOptionsModal';
import { SettingsModal } from './components/SettingsModal';
import { Onboarding } from './components/Onboarding';
import { StartHaltModal } from './components/StartHaltModal';
import { DashboardPage } from './components/DashboardPage';
import { useTrainLog } from './hooks/useTrainLog';
import { exportToExcel, exportToPDF } from './utils/export';
import { format } from 'date-fns';
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

// Inner App component that uses Context
function InnerApp() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('timeLog_hasOnboarded') === 'true';
  });

  const { showAlert, showConfirm } = useModal();
  useSyncNotifications();
  const { broadcastSiteChange } = useSyncActions();

  // OTA Update Logic
  useEffect(() => {
    CapacitorUpdater.notifyAppReady();

    CapacitorUpdater.addListener('updateAvailable', (info) => {
      console.log('Update available:', info);
    });

    console.log('Download complete:', info);
    showConfirm({
      title: 'Update Ready',
      message: 'A new version has been downloaded. Restart now to apply?',
      confirmText: 'Restart',
      cancelText: 'Later'
    }).then((shouldRestart) => {
      if (shouldRestart) {
        // Fix: info has 'bundle', set() expects { id: string }
        CapacitorUpdater.set({ id: info.bundle });
      }
    });
  }, []);

  // Multi-Site Hook
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
    bulkDeleteEntries
  } = useTrainLog(null, selectedSite?.id || null);

  // Site Selection with Sync Guard
  const handleSelectSite = async (site: Site) => {
    if (partnerLogs.length > 0) {
      const confirmed = await showConfirm({
        title: 'Switch Site & Update Sync?',
        message: `You are currently sharing data. Switching to "${site.name}" will update what your partners see.\n\nContinue?`,
        type: 'warning',
        confirmText: 'Switch & Update',
        cancelText: 'Cancel'
      });

      if (!confirmed) return;

      // Notify Partners
      await broadcastSiteChange(site.id, site.name);
    }

    selectSite(site);
  };

  const { user } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
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

  const handleExportClick = () => {
    if (logs.length === 0) {
      showAlert({ title: 'No Logs', message: 'No logs to export today.', type: 'info' });
      return;
    }
    setShowExportOptions(true);
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


  /* New: Export Logic with Combined Logs */
  const processExport = (type: 'excel' | 'pdf', includeTeamLogs: boolean) => {
    let logsToExport = logs.map(l => ({ ...l, owner: user?.displayName || 'Me' }));

    if (includeTeamLogs && partnerLogs.length > 0) {
      partnerLogs.forEach(partner => {
        const partnerEntries = partner.logs.map(l => ({ ...l, owner: partner.displayName }));
        logsToExport = [...logsToExport, ...partnerEntries];
      });
    }

    // Sort combined logs by arrival time
    logsToExport.sort((a, b) => b.arrival_timestamp - a.arrival_timestamp);

    if (type === 'excel') {
      exportToExcel(logsToExport);
    } else {
      exportToPDF(logsToExport, userProfile || { displayName: user?.displayName });
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('timeLog_hasOnboarded', 'true');
    setHasOnboarded(true);
  };

  const totalHaltFormatted = new Date(totalHaltTime * 1000).toISOString().substr(11, 8);

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Dashboard View
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 p-4">
        <DashboardPage
          logs={logs}
          onBack={() => setView('logs')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onSelectSite={handleSelectSite}
        activeSiteId={selectedSite?.id}
      />

      {/* Header */}
      <header className="bg-white shadow-sm p-4 pt-12 sticky top-0 z-20 transition-all">
        <div className="max-w-md mx-auto flex justify-between items-center">
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
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {user ? `Team Logs (${logs.length})` : `Local Logs (${logs.length})`}
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
      < footer className="bg-white border-t border-gray-200 p-4 pb-12 sticky bottom-0 safe-area-bottom z-20" >
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
        showExportOptions && (
          <ExportOptionsModal
            onClose={() => setShowExportOptions(false)}
            onExport={processExport}
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

      {/* Profile Modal (Global) */}
      <EditProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
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
