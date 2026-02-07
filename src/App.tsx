import { SmartButton } from './components/SmartButton';
import { LogTable } from './components/LogTable';
import { useTrainLog } from './hooks/useTrainLog';
import { exportToExcel } from './utils/export';
import { format } from 'date-fns';
import { Download } from 'lucide-react';

function App() {
  const {
    logs,
    addEntry,
    completeEntry,
    removeEntry,
    activeLog,
    totalHaltTime
  } = useTrainLog();

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
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">ConsLog</h1>
            <p className="text-xs text-gray-500 font-medium">
              {format(new Date(), 'EEEE, d MMMM yyyy')}
            </p>
          </div>
          <button
            onClick={handleExport}
            className="p-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 transition-colors"
            title="Export Excel"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full flex flex-col gap-6">

        {/* Smart Button Area */}
        <section>
          <SmartButton
            status={activeLog ? 'RUNNING' : 'IDLE'}
            startTime={activeLog?.arrival_timestamp}
            onPress={handleSmartButtonPress}
          />
        </section>

        {/* Logs Table */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-end mb-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Today's Logs ({logs.length})
            </h2>
          </div>

          <LogTable logs={logs} onDelete={removeEntry} />
        </section>

      </main>

      {/* Footer / Total */}
      <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 safe-area-bottom">
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
    </div>
  );
}

export default App;
