import { useEffect, useRef, useCallback } from 'react';
import { getPageState, setPageState, clearPageState, hasPageState } from '../utils/pageStateCache';

/**
 * Keeps form state while navigating between pages (clears on full browser refresh).
 * @param {string} pageKey
 * @param {object} snapshot - serializable state object (useMemo in caller)
 * @param {(cached: object) => void} restore
 * @param {{ onFirstMount?: () => void }} options
 */
export function usePageStatePersistence(pageKey, snapshot, restore, options = {}) {
  const { onFirstMount } = options;
  const bootstrapped = useRef(false);
  const skipNextPersist = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const cached = getPageState(pageKey);
    if (cached) {
      skipNextPersist.current = true;
      restore(cached);
      queueMicrotask(() => {
        skipNextPersist.current = false;
      });
    } else if (onFirstMount) {
      onFirstMount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!bootstrapped.current || skipNextPersist.current) return;
    setPageState(pageKey, snapshot);
  }, [pageKey, snapshot]);

  const clearPersistedState = useCallback(() => {
    clearPageState(pageKey);
  }, [pageKey]);

  const hasPersistedState = useCallback(() => hasPageState(pageKey), [pageKey]);

  return { clearPersistedState, hasPersistedState };
}
