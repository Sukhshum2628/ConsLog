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
    copyLogToPersonal, // <--- New Destructure
    activeLog,
    totalHaltTime
  } = useTrainLog();

  // ... (lines 35-87 unchanged)

  const processExport = (type: 'excel' | 'pdf') => {
    if (type === 'excel') {
      exportToExcel(logs);
    } else {
      // Fix: Pass profile as 2nd arg, fileName as 3rd (default is fine)
      exportToPDF(logs, userProfile || { displayName: user?.displayName });
    }
  };

  // ... (lines 96-190 unchanged)

  {
    partner.logs.length === 0 ? (
      <p className="text-xs text-gray-400 p-4 text-center">No logs for today.</p>
    ) : (
    <LogTable
      logs={partner.logs}
      readOnly={true}
      onDelete={() => { }}
      onEdit={() => { }}
      onCopy={copyLogToPersonal} // <--- Passed prop
    />
  )
  }
                </div >
              </div >
            ))
}
          </section >
        )}

<section className="flex-none mb-4">
  <SmartButton
    status={activeLog ? 'RUNNING' : 'IDLE'}
    startTime={activeLog?.arrival_timestamp}
    onPress={handleSmartButtonPress}
  />
</section>
      </main >

  {/* Footer */ }
  < footer className = "bg-white border-t border-gray-200 p-4 pb-12 sticky bottom-0 safe-area-bottom z-20" >
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

  {/* Modals */ }
{ showHistory && <HistoryModal onClose={() => setShowHistory(false)} /> }

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
  showSettings && (
    <SettingsModal
      isOpen={showSettings}
      onClose={() => setShowSettings(false)}
    />
  )
}
    </div >
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
