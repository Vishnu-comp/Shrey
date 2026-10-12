import { useEffect, useState } from 'react';
import { emptyState } from '../lib/logic.js';

export const STORAGE_KEY = 'word-streak-v1';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

// Player progress, saved to localStorage on every change.
export function useProgress() {
  const [state, setState] = useState(load);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: keep playing */
    }
  }, [state]);
  return [state, setState];
}
