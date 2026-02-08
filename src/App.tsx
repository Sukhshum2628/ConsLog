import { useState, useEffect } from 'react';
import { SmartButton } from './components/SmartButton';
import { LogTable } from './components/LogTable';
import { HistoryModal } from './components/HistoryModal';
import { EditLogModal } from './components/EditLogModal';
import { ExportOptionsModal } from './components/ExportOptionsModal';
import { LoginModal } from './components/LoginModal';
import { LobbyManager } from './components/LobbyManager';
import { useTrainLog } from './hooks/useTrainLog';
import { exportToExcel, exportToPDF } from './utils/export';
import { format } from 'date-fns';
import { Download, History, UserCircle, Users, Wifi, WifiOff } from 'lucide-react';
import type { TrainLog } from './db';
import { AuthProvider, useAuth } from './context/AuthContext';

function InnerApp() {
  const [lobbyId, setLobbyId] = useState<string | null>(localStorage.getItem('timeLog_lobbyId'));

  // Persist Lobby ID
  useEffect(() => {
    if (lobbyId) {
      localStorage.setItem('timeLog_lobbyId', lobbyId);
    } else {
      localStorage.removeItem('timeLog_lobbyId');
    }
  }, [lobbyId]);

  const {
    logs,
    addEntry,
    completeEntry,
    removeEntry,
    updateEntry,
    activeLog,
    totalHaltTime
  } = useTrainLog(lobbyId);

  const { user, logout } = useAuth();
  const [showHistory, setShowHistory] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showLobbyManager, setShowLobbyManager] = useState(false);
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

  const processExport = (type: 'excel' | 'pdf') => {
    if (type === 'excel') {
      exportToExcel(logs);
    } else {
      exportToPDF(logs);
    }
  };

  const totalHaltFormatted = new Date(totalHaltTime * 1000).toISOString().substr(11, 8);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 pt-12 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">TimeLog</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 font-medium">
                {format(new Date(), 'EEEE, d MMMM')}
              </p>
              {lobbyId ? (
                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold animate-pulse">
                  <Wifi className="w-3 h-3" /> LIVE: {lobbyId}
                </span>
              ) : (
                <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                  <WifiOff className="w-3 h-3" /> OFFLINE
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">

            {/* Lobby Button */}
            <button
              onClick={() => {
                if (!user) setShowLogin(true);
                else setShowLobbyManager(true);
              }}
              className={`p-2 rounded-full transition-colors ${lobbyId ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}
              title="Team Sync"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* Profile Button */}
            {user ? (
              <button
                onClick={() => {
                  if (confirm('Log out?')) logout();
                }}
                className="p-1 pr-2 bg-gray-100 rounded-full flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-300" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                title="Sign In"
              >
                <UserCircle className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setShowHistory(true)}
              className="p-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
              title="History"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportClick}
              className="p-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
              title="Export Today"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col gap-6 overflow-hidden">

        {/* Logs Table */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              {lobbyId ? `Team Logs (${logs.length})` : `Local Logs (${logs.length})`}
            </h2>
          </div>

          <LogTable
            logs={logs}
            onDelete={removeEntry}
            onEdit={(log) => setEditingLog(log)}
          />
        </section>

        {/* Smart Button */}
        <section className="flex-none mb-4">
          <SmartButton
            status={activeLog ? 'RUNNING' : 'IDLE'}
            startTime={activeLog?.arrival_timestamp}
            onPress={handleSmartButtonPress}
          />
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 p-4 pb-8 sticky bottom-0 safe-area-bottom">
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

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

      {showLobbyManager && (
        <LobbyManager
          currentLobbyId={lobbyId}
          onJoinLobby={(id) => {
            setLobbyId(id);
            setShowLobbyManager(false);
          }}
          onLeaveLobby={() => {
            setLobbyId(null);
            setShowLobbyManager(false);
          }}
          onClose={() => setShowLobbyManager(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <InnerApp />
    </AuthProvider>
  );
}

export default App;
