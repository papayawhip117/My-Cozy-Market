// Where the save file lives.
//
// There are two "backends" with the same functions (load, save, clear):
//   localStorageBackend  this browser only (guest / offline mode)
//   supabaseBackend      your account's cloud save (when logged in)
// main.js picks one with gameState.useBackend(...) before loading.
// Nothing else in the game needs to know which one is in use.
//
// Both functions are `async` even though localStorage is instant, because
// a real server takes time to answer. Writing them this way now means the
// rest of the game already knows how to wait.

const KEY = 'paw-pal-save';

export const localStorageBackend = {
  // Returns the saved data, or null if there isn't any yet.
  async load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      // Private browsing or a broken save: just start fresh.
      return null;
    }
  },

  async save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Storage full or blocked. The game keeps working, it just won't remember.
    }
  },

  async clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  },
};

// ---------- the Supabase backend (when you're logged in) ----------
//
// Your save lives in your row of the `profiles` table (the `save` column),
// so it follows you to any computer. A copy is also kept in this
// browser's localStorage, as a cache:
//   - saving writes the cache instantly, and the cloud a few seconds later
//     (lots of little saves in a row become one trip to the server)
//   - loading uses whichever is newer, so a save that didn't reach the
//     cloud before the tab closed isn't lost
//
//   const backend = supabaseBackend(supabase, session.user.id);

const CLOUD_DELAY_MS = 3000; // wait this long after the last save before uploading

export function supabaseBackend(supabase, userId) {
  const cacheKey = `${KEY}:${userId}`; // one cache per account
  let timer = null;
  let pending = null; // the newest save that hasn't been uploaded yet

  const readCache = () => {
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };

  async function upload() {
    clearTimeout(timer);
    timer = null;
    if (!pending) return;
    const data = pending;
    pending = null;
    const { error } = await supabase
      .from('profiles')
      .update({ save: data, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) console.warn('[storage] cloud save failed, will retry on the next save:', error.message);
  }

  return {
    async load() {
      const cached = readCache();
      const { data, error } = await supabase.from('profiles').select('save').eq('id', userId).maybeSingle();
      if (error) {
        console.warn('[storage] could not load the cloud save, using this browser\'s copy:', error.message);
        return cached;
      }
      const cloud = data?.save ?? null;
      // Pick the newer one (lastSeen is stamped on every save).
      if (cached && (!cloud || (cached.lastSeen ?? 0) > (cloud.lastSeen ?? 0))) return cached;
      return cloud;
    },

    async save(data) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(data));
      } catch {
        // cache blocked; the cloud copy still works
      }
      pending = structuredClone(data);
      clearTimeout(timer);
      timer = setTimeout(upload, CLOUD_DELAY_MS);
    },

    // Upload right now instead of waiting (used before logging out).
    flush: upload,

    async clear() {
      pending = null;
      clearTimeout(timer);
      try {
        localStorage.removeItem(cacheKey);
      } catch {
        // ignore
      }
      await supabase.from('profiles').update({ save: null }).eq('id', userId);
    },
  };
}
