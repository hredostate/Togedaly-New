
import { openDB } from 'idb'; // We'll simulate idb logic if package not available, but standard approach below
// Since 'idb' might not be in importmap, using raw IndexedDB wrapper

const DB_NAME = 'TogedalyDB';
const STORE_NAME = 'swr_cache';
const DB_VERSION = 2; // Bump version to ensure store creation

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME); // Key-value store
      }
      // Ensure receipt_queue from previous version exists if we are upgrading
      if (!db.objectStoreNames.contains('receipt_queue')) {
        db.createObjectStore('receipt_queue', { keyPath: 'id' });
      }
    };
  });
}

export class IDBCache {
  private map: Map<string, any>;
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.map = new Map();
    this.dbPromise = openDatabase();
  }

  // SWR Cache Interface: get
  get(key: string) {
    return this.map.get(key);
  }

  // SWR Cache Interface: set
  set(key: string, value: any) {
    this.map.set(key, value);
    // Fire and forget write to IDB
    this.dbPromise.then(db => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({ value, timestamp: Date.now() }, key);
    }).catch(err => console.warn('Failed to cache to IDB', err));
  }

  // SWR Cache Interface: delete
  delete(key: string) {
    this.map.delete(key);
    this.dbPromise.then(db => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(key);
    });
  }

  // SWR Cache Interface: keys
  keys() {
    return this.map.keys();
  }

  // Initialize: Load everything from IDB to Memory
  async initialize() {
    try {
      const db = await this.dbPromise;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const keysRequest = store.getAllKeys();
      const valuesRequest = store.getAll();

      const [keys, values] = await Promise.all([
        new Promise<IDBValidKey[]>((res, rej) => { keysRequest.onsuccess = () => res(keysRequest.result); keysRequest.onerror = () => rej(keysRequest.error); }),
        new Promise<any[]>((res, rej) => { valuesRequest.onsuccess = () => res(valuesRequest.result); valuesRequest.onerror = () => rej(valuesRequest.error); })
      ]);

      keys.forEach((key, index) => {
        if (typeof key === 'string') {
          // We store { value, timestamp } but SWR just wants value
          this.map.set(key, values[index]?.value); 
        }
      });
      console.log(`[Offline Cache] Hydrated ${keys.length} items from IndexedDB.`);
    } catch (e) {
      console.error('[Offline Cache] Failed to hydrate:', e);
    }
  }
}

export const idbCache = new IDBCache();
