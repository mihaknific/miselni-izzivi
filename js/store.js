// js/store.js
// Upravljanje z IndexedDB in LocalStorage
const DB_NAME = 'MiselniIzziviDB';
const STORE_NAME = 'user-progress';
const SETTINGS_STORE = 'settings';
const VERSION = 2;
const SETTINGS_PREFIX = 'miselni_settings_';

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Odpre in inicializira IndexedDB bazo z migracijami
 */
let _dbPromise = null;
function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onerror = () => {
      _dbPromise = null;
      reject(request.error);
    };
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      const oldVersion = e.oldVersion;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }

      // Migracija iz v1: premakni nastavitve iz localStorage v IndexedDB
      if (oldVersion < 2) {
        // To se izvaja v browser kontekstu, ne more neposredno dostopati do localStorage
        // Migracija se bo izvedla ob prvi uporabi Settings.get/set
      }
    };
  });
}

/**
 * Pridobi podatek iz IndexedDB glede na ID
 */
export async function getProgress(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Shrani ali posodobi napredek uporabnika
 */
export async function saveProgress(data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(data);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Pridobi vse podatke iz baze za izvoz
 */
export async function getAllData() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Funkcija za izvoz (export JSON)
 */
export async function exportData() {
  const data = await getAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `miselni-izzivi-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Funkcija za uvoz v tekstovni/JSON obliki v IndexedDB
 */
export async function importData(jsonString) {
  try {
    const dataArray = JSON.parse(jsonString);
    if (!Array.isArray(dataArray)) {
      return { success: false, error: new Error('Import JSON mora biti tabela zapisov.') };
    }

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    dataArray.forEach(item => store.put(item));

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve({ success: true, count: dataArray.length });
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Import err:', err);
    return { success: false, error: err };
  }
}

/**
 * Migriraj nastavitve iz localStorage v IndexedDB
 */
async function migrateSettings() {
  const db = await openDB();
  const tx = db.transaction(SETTINGS_STORE, 'readwrite');
  const store = tx.objectStore(SETTINGS_STORE);
  const count = await new Promise(resolve => {
    const req = store.count();
    req.onsuccess = () => resolve(req.result);
  });

  if (count > 0) return; // že migrirano

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SETTINGS_PREFIX)) {
        const settingKey = key.slice(SETTINGS_PREFIX.length);
        const raw = localStorage.getItem(key);
        if (raw != null) {
          const value = safeJsonParse(raw, raw);
          store.put({ key: settingKey, value });
        }
      }
    }
  } catch (e) {
    console.warn('Migracija nastavitev ni uspela:', e);
  }
}

// Settings objekt - uporabi IndexedDB z localStorage fallback
export const Settings = {
  async get(key, defaultValue) {
    try {
      await migrateSettings();
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTINGS_STORE, 'readonly');
        const request = tx.objectStore(SETTINGS_STORE).get(key);
        request.onsuccess = () => {
          if (request.result === undefined) {
            resolve(defaultValue);
          } else {
            resolve(request.result.value);
          }
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      // Fallback na localStorage
      try {
        const raw = localStorage.getItem(`${SETTINGS_PREFIX}${key}`);
        if (raw == null) return defaultValue;
        return safeJsonParse(raw, defaultValue);
      } catch {
        return defaultValue;
      }
    }
  },

  async set(key, value) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        const request = tx.objectStore(SETTINGS_STORE).put({ key, value });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Shranjevanje nastavitve v IndexedDB ni uspelo:', error);
      // Fallback na localStorage
      try {
        localStorage.setItem(`${SETTINGS_PREFIX}${key}`, JSON.stringify(value));
      } catch (e) {
        console.error('Shranjevanje nastavitve v localStorage tudi ni uspelo:', e);
      }
    }
  },

  async remove(key) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(SETTINGS_STORE, 'readwrite');
        const request = tx.objectStore(SETTINGS_STORE).delete(key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      try {
        localStorage.removeItem(`${SETTINGS_PREFIX}${key}`);
      } catch {
        /* noop */
      }
    }
  },
};
