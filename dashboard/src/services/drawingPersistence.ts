import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Drawing, Timeframe } from '../types';

// ============================================================
// Drawing Persistence Layer
// Uses IndexedDB for persistent storage across sessions
// API designed to allow backend sync later
// ============================================================

const DB_NAME = 'bittensor-dashboard';
const DB_VERSION = 2;
const STORE_NAME = 'drawings';

interface DashboardDB extends DBSchema {
  drawings: {
    key: string; // drawingId
    value: Drawing;
    indexes: {
      'by-subnet': number;
      'by-subnet-chart-timeframe': [number, string, string];
    };
  };
}

let dbInstance: IDBPDatabase<DashboardDB> | null = null;

async function getDB(): Promise<IDBPDatabase<DashboardDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DashboardDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'drawingId' });
        store.createIndex('by-subnet', 'subnetId');
        store.createIndex('by-subnet-chart-timeframe', ['subnetId', 'chartId', 'timeframe']);
      }
      if (oldVersion < 2) {
        // Migration: ensure all drawings have version field
        const store = transaction.objectStore(STORE_NAME);
        store.openCursor().then(function migrate(cursor): Promise<void> | void {
          if (!cursor) return;
          const drawing = cursor.value;
          if (!drawing.version) {
            drawing.version = 1;
            cursor.update(drawing);
          }
          return cursor.continue().then(migrate);
        });
      }
    },
  });

  return dbInstance;
}

// --- CRUD Operations ---

export async function saveDrawing(drawing: Drawing): Promise<void> {
  const db = await getDB();
  drawing.updatedAt = new Date().toISOString();
  await db.put(STORE_NAME, drawing);
}

export async function getDrawing(drawingId: string): Promise<Drawing | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, drawingId);
}

export async function deleteDrawing(drawingId: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, drawingId);
}

export async function getDrawingsForChart(
  subnetId: number,
  chartId: string,
  timeframe: Timeframe
): Promise<Drawing[]> {
  const db = await getDB();
  return db.getAllFromIndex(
    STORE_NAME,
    'by-subnet-chart-timeframe',
    [subnetId, chartId, timeframe]
  );
}

export async function getDrawingsForSubnet(subnetId: number): Promise<Drawing[]> {
  const db = await getDB();
  return db.getAllFromIndex(STORE_NAME, 'by-subnet', subnetId);
}

export async function getAllDrawings(): Promise<Drawing[]> {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function clearAllDrawings(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_NAME);
}

// --- Export / Import ---

export async function exportDrawings(subnetId?: number): Promise<string> {
  const drawings = subnetId !== undefined
    ? await getDrawingsForSubnet(subnetId)
    : await getAllDrawings();
  return JSON.stringify({
    version: DB_VERSION,
    exportedAt: new Date().toISOString(),
    drawings,
  }, null, 2);
}

export interface DrawingImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export async function importDrawings(json: string): Promise<DrawingImportResult> {
  const result: DrawingImportResult = { imported: 0, skipped: 0, errors: [] };

  try {
    const data = JSON.parse(json);
    if (!data.drawings || !Array.isArray(data.drawings)) {
      result.errors.push('Invalid format: missing drawings array');
      return result;
    }

    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');

    for (const drawing of data.drawings) {
      try {
        // Migrate older versions
        if (!drawing.version) drawing.version = 1;
        if (data.version < DB_VERSION) {
          drawing.version = DB_VERSION;
          drawing.updatedAt = new Date().toISOString();
        }
        await tx.store.put(drawing);
        result.imported++;
      } catch {
        result.skipped++;
        result.errors.push(`Failed to import drawing ${drawing.drawingId}`);
      }
    }

    await tx.done;
  } catch {
    result.errors.push('Failed to parse JSON');
  }

  return result;
}
