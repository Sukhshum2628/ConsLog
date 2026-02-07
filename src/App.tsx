import { useState } from 'react';
import { SmartButton } from './components/SmartButton';
import { LogTable } from './components/LogTable';
import { HistoryModal } from './components/HistoryModal';
import { EditLogModal } from './components/EditLogModal';
import { useTrainLog } from './hooks/useTrainLog';
import { exportToExcel } from './utils/export';
import { format } from 'date-fns';
import { Download, History } from 'lucide-react';
import type { TrainLog } from './db';

function App() {
  const {
    logs,
    addEntry,
    completeEntry,
    removeEntry,
    updateEntry,
    activeLog,
    totalHaltTime
  } = useTrainLog();

  const [showHistory, setShowHistory] = useState(false);
  const [editingLog, setEditingLog] = useState<TrainLog | null>(null);

  const handleSmartButtonPress = () => {
    if (activeLog) {
      completeEntry(activeLog);
    } else {
      addEntry();
    }
  };

  const handleExport = () => {
    exportToExcel(logs);
  };

  const totalHaltFormatted = new Date(totalHaltTime * 1000).toISOString().substr(11, 8);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Header - Increased Top Padding for Safe Area */}
      <header className="bg-white shadow-sm p-4 pt-12 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">ConsLog</h1>
            <p className="text-xs text-gray-500 font-medium">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
              title="History"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
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

        {/* Logs Table (Top) */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Today's Logs ({logs.length})
            </h2>
          </div>

          <LogTable
            logs={logs}
            onDelete={removeEntry}
            onEdit={(log) => setEditingLog(log)}
          />
        </section>

        {/* Smart Button Area (Bottom) */}
        <section className="flex-none mb-4">
          <SmartButton
            status={activeLog ? 'RUNNING' : 'IDLE'}
            startTime={activeLog?.arrival_timestamp}
            onPress={handleSmartButtonPress}
          />
        </section>

      </main>

      {/* Footer / Total */}
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
            {/* Minimal visual indicator */}
            <div className={`w-3 h-3 rounded-full ${activeLog ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
          </div>
        </div>
      </footer>

      {/* History Modal */}
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}

      {/* Edit Log Modal */}
      {editingLog && (
        <EditLogModal
          log={editingLog}
          onClose={() => setEditingLog(null)}
          onSave={updateEntry}
        />
      )}
    </div>
  );
}

export default App;
