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
  } catch (err) {
    console.debug('safeJsonParse napaka:', err);
    return fallback;
  }
}

/**
 * Varno prebere JSON vrednost iz localStorage.
 * Manjkajoč ali pokvarjen ključ vrne `fallback`.
 */
export function loadJson(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.debug(`loadJson napaka za ključ "${key}":`, err);
    return fallback;
  }
}

/**
 * Varno zapiše vrednost v localStorage kot JSON. Vrne true ob uspehu.
 */
export function saveJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Shranjevanje ključa "${key}" v localStorage ni uspelo:`, error);
    return false;
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
 * Pridobi vse nastavitve iz IndexedDB (za izvoz).
 */
async function getAllSettings() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const request = tx.objectStore(SETTINGS_STORE).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Izvozi celotni paket podatkov (format v2):
 * - nastavitve iz IndexedDB,
 * - zastareli store `user-progress`,
 * - vse aplikacijske localStorage ključe (rekordi, XP, dosežki, dnevni izzivi, per-game shranjevanja).
 */
export async function exportData() {
  const [settings, userProgress] = await Promise.all([getAllSettings(), getAllData()]);

  const localStorageData = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Nastavitve s prefiksom že prihajajo iz IndexedDB — ne podvajamo jih.
      if (key && !key.startsWith(SETTINGS_PREFIX)) {
        localStorageData[key] = localStorage.getItem(key);
      }
    }
  } catch (error) {
    console.warn('Branje localStorage pri izvozu ni uspelo:', error);
  }

  const payload = {
    format: 'miselni-izzivi-export',
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
    userProgress,
    localStorage: localStorageData,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `miselni-izzivi-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Uvoz celotnega paketa (format v2) ali zastarelega formata v1
 * (bodisi tabela zapisov `user-progress`).
 */
export async function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data) &&
      data.format === 'miselni-izzivi-export'
    ) {
      return await importV2(data);
    }

    if (Array.isArray(data)) {
      return await importUserProgress(data);
    }

    return { success: false, error: new Error('Neznan format izvoza.') };
  } catch (err) {
    console.error('Import err:', err);
    return { success: false, error: err };
  }
}

/**
 * Preveri in zapiše tabelo zapisov `user-progress`.
 */
async function importUserProgress(entries) {
  for (const item of entries) {
    if (
      !item ||
      typeof item !== 'object' ||
      Array.isArray(item) ||
      typeof item.id !== 'string' ||
      item.id.length === 0
    ) {
      return { success: false, error: new Error('Neveljaven zapis v importu (manjka id).') };
    }
  }

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  entries.forEach(item => store.put(item));

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve({ success: true, count: entries.length });
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Preveri in zapiše celoten paket v2: localStorage + IndexedDB (settings, user-progress).
 */
async function importV2(payload) {
  const { settings, userProgress, localStorage: localStorageData } = payload;

  if (settings !== undefined && !Array.isArray(settings)) {
    return { success: false, error: new Error('Neveljavne nastavitve v importu.') };
  }
  if (userProgress !== undefined && !Array.isArray(userProgress)) {
    return { success: false, error: new Error('Neveljaven user-progress v importu.') };
  }
  if (
    localStorageData !== undefined &&
    (typeof localStorageData !== 'object' ||
      localStorageData === null ||
      Array.isArray(localStorageData) ||
      Object.values(localStorageData).some(v => typeof v !== 'string'))
  ) {
    return { success: false, error: new Error('Neveljavni localStorage podatki v importu.') };
  }
  if (Array.isArray(userProgress)) {
    for (const item of userProgress) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item) ||
        typeof item.id !== 'string' ||
        item.id.length === 0
      ) {
        return { success: false, error: new Error('Neveljaven zapis v importu (manjka id).') };
      }
    }
  }

  // localStorage (rekordi, dosežki, per-game shranjevanja …)
  if (localStorageData) {
    for (const [key, value] of Object.entries(localStorageData)) {
      localStorage.setItem(key, value);
    }
  }

  // IndexedDB: settings
  if (Array.isArray(settings) && settings.length > 0) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SETTINGS_STORE, 'readwrite');
      const store = tx.objectStore(SETTINGS_STORE);
      settings.forEach(entry => {
        if (entry && typeof entry.key === 'string') {
          store.put({ key: entry.key, value: entry.value });
        }
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  // IndexedDB: user-progress
  if (Array.isArray(userProgress) && userProgress.length > 0) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      userProgress.forEach(item => store.put(item));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  const count =
    (Array.isArray(settings) ? settings.length : 0) +
    (Array.isArray(userProgress) ? userProgress.length : 0) +
    (localStorageData ? Object.keys(localStorageData).length : 0);

  return { success: true, count };
}

/**
 * Migriraj nastavitve iz localStorage v IndexedDB (samo enkrat na sejo).
 * Stare ključe `miselni_settings_*` počisti šele po uspešno zaključeni transakciji.
 */
let _settingsMigrated = false;
async function migrateSettings() {
  if (_settingsMigrated) return;
  let db;
  try {
    db = await openDB();
  } catch (err) {
    console.debug('IndexedDB nedostopen, fallback na localStorage:', err);
    return; // IndexedDB nedostopen — fallback na localStorage deluje naprej
  }
  const outcome = await new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    const req = store.count();
    req.onsuccess = () => {
      if (req.result > 0) return resolve('already');
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(SETTINGS_PREFIX)) {
            const settingKey = key.slice(SETTINGS_PREFIX.length);
            const raw = localStorage.getItem(key);
            if (raw != null) {
              store.put({ key: settingKey, value: safeJsonParse(raw, raw) });
            }
          }
        }
      } catch {
        return resolve('error');
      }
      tx.oncomplete = () => resolve('migrated');
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  }).catch(err => {
    console.warn('Migracija nastavitev ni uspela:', err);
    return 'error';
  });

  if (outcome === 'already' || outcome === 'migrated') {
    _settingsMigrated = true;
  }
  if (outcome === 'migrated') {
    try {
      const staleKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(SETTINGS_PREFIX)) staleKeys.push(key);
      }
      staleKeys.forEach(key => localStorage.removeItem(key));
    } catch {
      /* čiščenje ni kritično */
    }
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
    } catch (err) {
      console.debug(`Settings.get("${key}") fallback na localStorage:`, err);
      // Fallback na localStorage
      try {
        const raw = localStorage.getItem(`${SETTINGS_PREFIX}${key}`);
        if (raw == null) return defaultValue;
        return safeJsonParse(raw, defaultValue);
      } catch (fallbackErr) {
        console.debug(`Settings.get("${key}") localStorage napaka:`, fallbackErr);
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
      } catch (storageError) {
        console.error('Shranjevanje nastavitve v localStorage tudi ni uspelo:', storageError);
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
    } catch (err) {
      console.debug(`Settings.remove("${key}") napaka v IndexedDB:`, err);
      try {
        localStorage.removeItem(`${SETTINGS_PREFIX}${key}`);
      } catch (storageErr) {
        console.debug(`Settings.remove("${key}") napaka v localStorage:`, storageErr);
      }
    }
  },
};
