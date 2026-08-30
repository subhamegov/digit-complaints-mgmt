/**
 * Account-level optional capability flags (prototype).
 *
 * Stored in localStorage so toggling a capability off never deletes the
 * underlying configuration - it only hides the capability from navigation.
 */

import { useEffect, useState } from "react";

export type AccountFeatures = {
  projects_enabled: boolean;
};

const STORAGE_KEY = "pgr.accountFeatures.v1";

const DEFAULTS: AccountFeatures = {
  projects_enabled: false,
};

const listeners = new Set<(f: AccountFeatures) => void>();

export function readFeatures(): AccountFeatures {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export function setFeature<K extends keyof AccountFeatures>(
  key: K,
  value: AccountFeatures[K],
) {
  const next = { ...readFeatures(), [key]: value };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l(next));
}

/** Reactive read. Starts from defaults so SSR and first client render match. */
export function useAccountFeatures(): AccountFeatures {
  const [features, setFeatures] = useState<AccountFeatures>(DEFAULTS);

  useEffect(() => {
    setFeatures(readFeatures());
    const listener = (f: AccountFeatures) => setFeatures(f);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return features;
}
