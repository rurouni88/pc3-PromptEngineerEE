// src/test/setup.ts
// Test setup: in-memory localStorage shim (tests run in the node environment,
// no jsdom). Registered via vite.config.ts `test.setupFiles`.

const backing = new Map<string, string>();

const localStorageShim = {
  getItem: (key: string) => backing.get(key) ?? null,
  setItem: (key: string, value: string) => {
    backing.set(key, String(value));
  },
  removeItem: (key: string) => {
    backing.delete(key);
  },
  clear: () => {
    backing.clear();
  },
  key: (index: number) => [...backing.keys()][index] ?? null,
  get length() {
    return backing.size;
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageShim,
  configurable: true,
  writable: true,
});
