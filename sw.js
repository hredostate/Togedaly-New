
// Existing caching logic
const CACHE_NAME = 'togedaly-cache-v1';
const urlsToCache = [
  '/',
  '/index.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Navigation preload strategy or Stale-While-Revalidate could go here
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Serve from cache
        }
        return fetch(event.request); // Fetch from network
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// --- NEW BACKGROUND SYNC LOGIC ---

const DB_NAME = 'TogedalyDB';
// Ensure this version matches lib/offlineQueue.ts (Version 3)
const DB_VERSION = 3; 
const STORE_NAME = 'mutation_queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = (event) => reject('DB open error');
    request.onsuccess = (event) => resolve(event.target.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = (event) => reject('Error getting all from store');
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    request.onerror = (event) => reject('Error deleting from store');
    request.onsuccess = () => resolve();
  });
}


async function syncMutations() {
  console.log('Service Worker: starting mutation sync.');
  const db = await openDB();
  const jobs = await getAllFromStore(db, STORE_NAME);

  if (!jobs || jobs.length === 0) {
    console.log('Service Worker: no mutations to sync.');
    return;
  }

  for (const job of jobs) {
    try {
      if (job.type === 'receipt') {
        // Legacy receipt sync
        const response = await fetch('/api/receipts/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(job.payload),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
      } else if (job.type === 'mutation') {
        // Generic mutation sync
        const response = await fetch(job.url, {
            method: job.method || 'POST',
            headers: job.headers || { 'Content-Type': 'application/json' },
            body: JSON.stringify(job.body),
        });
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
      }
      
      console.log('Service Worker: synced job', job.id);
      await deleteFromStore(db, STORE_NAME, job.id);
    } catch (e) {
      console.error('Service Worker: Sync failed for job', job.id, e);
      // Stop processing to maintain order if strictly required, or continue if independent.
      // For financial txns, strict order is safer.
      break; 
    }
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-mutations' || event.tag === 'sync-receipts') {
    event.waitUntil(syncMutations());
  }
});
