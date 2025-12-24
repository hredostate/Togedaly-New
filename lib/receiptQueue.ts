
type ReceiptJob = {
  id: string;
  createdAt: string;
  payload: any;
};

const DB_NAME = 'TogedalyDB';
const STORE_NAME = 'receipt_queue';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

async function addJob(job: ReceiptJob) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(job);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAllJobs(): Promise<ReceiptJob[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function clearJobs() {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function queueReceipt(payload: any) {
  const job = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    payload,
  };
  
  await addJob(job);

  // Try immediate fire via Background Sync if supported
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
        const reg = await navigator.serviceWorker.ready;
        // @ts-ignore
        await reg.sync.register('sync-receipts');
    } catch (e) {
        console.error('Background Sync registration failed:', e);
    }
  }
}

export async function popAllReceipts(): Promise<ReceiptJob[]> {
  const q = await getAllJobs();
  await clearJobs();
  return q;
}
