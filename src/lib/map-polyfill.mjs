/**
 * Polyfill for `Map.prototype.getOrInsert` / `getOrInsertComputed` (and the
 * WeakMap equivalents).
 *
 * PDF.js 6 uses these TC39 proposal methods throughout, including inside its
 * worker, but they are still missing from shipping browsers — Chromium 141
 * does not have them — so without this the very first render throws
 * "getOrInsertComputed is not a function". Kept as plain .mjs so the same
 * source can be imported by the app and served to the worker.
 */

function define(target, name, implementation) {
  if (typeof target?.prototype?.[name] === 'function') return;
  Object.defineProperty(target.prototype, name, {
    value: implementation,
    writable: true,
    enumerable: false,
    configurable: true,
  });
}

export function installMapPolyfill() {
  for (const Ctor of [Map, WeakMap]) {
    if (typeof Ctor !== 'function') continue;

    define(Ctor, 'getOrInsert', function getOrInsert(key, value) {
      if (this.has(key)) return this.get(key);
      this.set(key, value);
      return value;
    });

    define(Ctor, 'getOrInsertComputed', function getOrInsertComputed(key, callbackfn) {
      if (this.has(key)) return this.get(key);
      const value = callbackfn(key);
      // The callback may itself have inserted the key; the proposal specifies
      // that the freshly computed value still wins.
      this.set(key, value);
      return value;
    });
  }
}
