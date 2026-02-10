import { useState, useEffect } from 'react';
import { SmartButton } from './components/SmartButton';
import { LogTable } from './components/LogTable';
import { HistoryModal } from './components/HistoryModal';
import { EditLogModal } from './components/EditLogModal';
import { ExportOptionsModal } from './components/ExportOptionsModal';
import { SettingsModal } from './components/SettingsModal';
import { Onboarding } from './components/Onboarding';
import { useTrainLog } from './hooks/useTrainLog';
import { exportToExcel, exportToPDF } from './utils/export';
import { format } from 'date-fns';
import { Download, History, Settings, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { TrainLog } from './db';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SecurityCheck } from './components/SecurityCheck';
// Router removed

// Inner App component that uses Context
function InnerApp() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('timeLog_hasOnboarded') === 'true';
  });

  const {
    logs,
    partnerLogs,
    fetchPartnerLogs,
    addEntry,
    completeEntry,
    removeEntry,
    updateEntry,
    activeLog,
    totalHaltTime
  } = useTrainLog();

  const { user } = useAuth();

  const [showHistory, setShowHistory] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingLog, setEditingLog] = useState<TrainLog | null>(null);

  const handleSmartButtonPress = () => {
    if (activeLog) {
      completeEntry(activeLog);
    } else {
      addEntry();
    }
  };

  const handleExportClick = () => {
    if (logs.length === 0) {
      alert("No logs to export today.");
      return;
    }
    setShowExportOptions(true);
  };

  /* New State for Profile */
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        // We could duplicate logic or use a helper. 
        // To avoid complex imports cycle, let's just use direct firebase here if needed?
        // Or better: The AuthContext or a useProfile hook.
        // For now, let's try to export just the basic info we have in 'user'.
        // NOTE: user.displayName is available.
        // To get 'company', we need firestore.
        // Let's do a quick fetch
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const { db } = await import('./lib/firebase');
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            setUserProfile(snap.data());
          }
        } catch (e) {
          console.error("Profile fetch error", e);
        }
      }
    };
    fetchProfile();
  }, [user]);


  const processExport = (type: 'excel' | 'pdf') => {
    if (type === 'excel') {
      exportToExcel(logs);
    } else {
      exportToPDF(logs, userProfile || { displayName: user?.displayName });
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 pt-12 sticky top-0 z-20 transition-all">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">TimeLog</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 font-medium">
                {format(new Date(), 'EEEE, d MMMM')}
              </p>
              {user ? (
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
          />
        </section>

        {/* Partner Logs Section */}
        {user && partnerLogs.length > 0 && (
          <section className="flex-none space-y-4">
            {partnerLogs.map(partner => (
              <div key={partner.uid} className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
                <div className="bg-blue-50 p-3 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <h3 className="font-bold text-gray-800 text-sm">{partner.displayName}'s Logs</h3>
                  </div>
                  <button
                    onClick={() => fetchPartnerLogs(partner.uid, partner.username, partner.displayName)}
                    className="flex items-center gap-1 text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <RefreshCw size={12} />
                    Sync Logs
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {partner.logs.length === 0 ? (
                    <p className="text-xs text-gray-400 p-4 text-center">No logs for today.</p>
                  ) : (
                    <LogTable logs={partner.logs} readOnly={true} onDelete={() => { }} onEdit={() => { }} />
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="flex-none mb-4">
          <SmartButton
            status={activeLog ? 'RUNNING' : 'IDLE'}
            startTime={activeLog?.arrival_timestamp}
            onPress={handleSmartButtonPress}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 p-4 pb-12 sticky bottom-0 safe-area-bottom z-20">
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
      </footer>

      {/* Modals */}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}

      {editingLog && (
        <EditLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSave={updateEntry}
        />
      )}

      {showExportOptions && (
        <ExportOptionsModal
          onClose={() => setShowExportOptions(false)}
          onExport={processExport}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <SecurityCheck>
        <InnerApp />
      </SecurityCheck>
    </AuthProvider>
  );
}

export default App;
