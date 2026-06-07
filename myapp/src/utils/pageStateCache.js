/** In-memory form cache — survives SPA navigation, clears on browser refresh. */
const cache = new Map();

export function getPageState(pageKey) {
  return cache.get(pageKey) ?? null;
}

export function setPageState(pageKey, state) {
  cache.set(pageKey, state);
}

export function clearPageState(pageKey) {
  cache.delete(pageKey);
}

export function hasPageState(pageKey) {
  return cache.has(pageKey);
}
