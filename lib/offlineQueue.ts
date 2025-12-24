
export type MutationJob = {
  id: string;
  type: 'receipt' | 'mutation';
  createdAt: string;
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  payload?: any; // Legacy payload for receipts
};

const DB_NAME = 'TogedalyDB';
const STORE_NAME = 'mutation_queue';
const DB_VERSION = 3; // Bumped version

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      // Migrate old store if needed, or just let it be
    };
  });
}

async function addJob(job: MutationJob) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(job);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAllJobs(): Promise<MutationJob[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearJobs() {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Legacy support
export async function queueReceipt(payload: any) {
  const job: MutationJob = {
    id: crypto.randomUUID(),
    type: 'receipt',
    createdAt: new Date().toISOString(),
    payload,
  };
  await addJob(job);
  triggerSync();
}

// Generic mutation queue
export async function queueMutation(url: string, method: string, body: any, headers: Record<string, string> = {}) {
  const job: MutationJob = {
    id: crypto.randomUUID(),
    type: 'mutation',
    createdAt: new Date().toISOString(),
    url,
    method,
    body,
    headers
  };
  await addJob(job);
  triggerSync();
}

function triggerSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(reg => {
      // @ts-ignore
      return reg.sync.register('sync-mutations');
    }).catch(e => console.error('Background Sync registration failed:', e));
  }
}

export async function popAllJobs(): Promise<MutationJob[]> {
  const q = await getAllJobs();
  // We don't clear immediately in proper sync logic (SW does it one by one), 
  // but for manual recovery scenarios, fetching all is useful.
  return q;
}
