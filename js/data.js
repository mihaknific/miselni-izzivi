// js/data.js
// FETCH LOGIC za branje nalog in drugih JSON datotek

const TASKS_URL = './data/tasks.json';
const TASKS_CACHE_KEY = 'miselni_tasks_cache_v1';

const FALLBACK_TASKS = [
  {
    id: 'fallback1',
    kategorija: 'Offline način',
    vprasanje:
      'Aplikacija trenutno nima dostopa do mreže ali pa podatki še niso bili predpomnjeni. Poskusi znova, ko boš enkrat odprl aplikacijo z internetom.',
    opcije: ['Razumem', 'Ne razumem'],
    pravilen_odgovor: 0,
  },
];

function isValidTaskList(data) {
  return (
    Array.isArray(data) &&
    data.every(
      task =>
        task &&
        typeof task === 'object' &&
        typeof task.id === 'string' &&
        task.id.length > 0 &&
        typeof task.title === 'string' &&
        task.title.length > 0 &&
        typeof task.description === 'string' &&
        task.description.length > 0 &&
        typeof task.tag === 'string' &&
        task.tag.length > 0
    )
  );
}

async function readCachedTasks() {
  if ('caches' in window) {
    try {
      const response = await caches.match(TASKS_URL);
      if (response) {
        const data = await response.json();
        return isValidTaskList(data) ? data : null;
      }
    } catch {
      /* noop */
    }
  }

  try {
    const localCache = localStorage.getItem(TASKS_CACHE_KEY);
    if (localCache) {
      const data = JSON.parse(localCache);
      return isValidTaskList(data) ? data : null;
    }
  } catch {
    /* noop */
  }

  return null;
}

export async function fetchTasks() {
  try {
    const response = await fetch(TASKS_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Ni mogoče naložiti nalog.');
    }

    const data = await response.json();
    if (!isValidTaskList(data)) {
      throw new Error('Podatki nalog niso v pričakovani obliki.');
    }

    try {
      localStorage.setItem(TASKS_CACHE_KEY, JSON.stringify(data));
    } catch {
      /* noop */
    }

    return data;
  } catch (error) {
    console.error('fetchTasks Error:', error);
    const cached = await readCachedTasks();
    if (Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    return FALLBACK_TASKS;
  }
}
