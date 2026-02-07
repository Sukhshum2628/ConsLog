import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

interface TrainLog {
  id?: number;
  date: string;
  arrival_timestamp: number;
  departure_timestamp?: number;
  halt_duration_seconds?: number;
  status: 'RUNNING' | 'COMPLETED';
  created_at: number;
}

interface ConstLoggerDB extends DBSchema {
  logs: {
    key: number;
    value: TrainLog;
    indexes: { 'by-date': string };
  };
}

const DB_NAME = 'cons-logger-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ConstLoggerDB>> | null = null;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<ConstLoggerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore('logs', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('by-date', 'date');
      },
    });
  }
  return dbPromise;
};

export const addLog = async (log: Omit<TrainLog, 'id'>) => {
  const db = await initDB();
  return db.add('logs', log);
};

export const updateLog = async (log: TrainLog) => {
  const db = await initDB();
  return db.put('logs', log);
};

export const getLogsByDate = async (date: string) => {
  const db = await initDB();
  return db.getAllFromIndex('logs', 'by-date', date);
};

export const getAllLogs = async () => {
  const db = await initDB();
  return db.getAll('logs');
};

export const deleteLog = async (id: number) => {
  const db = await initDB();
  return db.delete('logs', id);
};

export type { TrainLog };
