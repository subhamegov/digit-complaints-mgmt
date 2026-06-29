/**
 * userScope — RBAC scoping shim for the prototype.
 *
 * In production, this object will be populated by the RBAC backend (the
 * platform's Access Control service) from the signed-in user's role and
 * assigned organisational units. While there is no backend, we hardcode it
 * here and expose a small React store so the Department Head dashboard
 * (and any future role-scoped surface) can switch it for demo purposes.
 *
 * IMPORTANT: every panel in a scoped dashboard must call `filterByScope`
 * BEFORE aggregating. Do not scope individual panels independently and do
 * not hardcode department / ward strings anywhere except inside the scope
 * objects below.
 */
import { useEffect, useState } from "react";
import type { Complaint } from "./mock-data";

export type UserScope = {
  role: "department_head";
  /** Department codes/names the user owns. Empty = no access. */
  departments: string[];
  /** Wards the user covers. Empty = all wards within their departments. */
  wards: string[];
  /** Display label for the scope selector. */
  label: string;
};

/**
 * Preset scopes used by the demo selector. The first entry is the default.
 * Real backend will replace this list with a single object derived from
 * the signed-in user.
 */
export const SCOPE_PRESETS: UserScope[] = [
  {
    role: "department_head",
    label: "Sanitation · 3 wards",
    departments: ["Sanitation"],
    wards: ["Heritage City", "Financial District", "Town Square"],
  },
  {
    role: "department_head",
    label: "Public Works · 2 wards",
    departments: ["Public Works"],
    wards: ["Financial District", "East Village"],
  },
  {
    role: "department_head",
    label: "Water Supply + Sewerage · all wards",
    departments: ["Water Supply", "Sewerage"],
    wards: [],
  },
  {
    role: "department_head",
    label: "Electrical · single ward",
    departments: ["Electrical"],
    wards: ["Heritage City"],
  },
];

const STORAGE_KEY = "pgr.userScope.preset";

/** Single source of truth — what the rest of the app reads. */
export function useUserScope() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : 0;
    if (!Number.isNaN(n) && n >= 0 && n < SCOPE_PRESETS.length) setIdx(n);
  }, []);
  const setPreset = (n: number) => {
    setIdx(n);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, String(n));
  };
  return { scope: SCOPE_PRESETS[idx], presetIndex: idx, setPreset };
}

/** Filter a complaint dataset down to what the scope permits. */
export function filterByScope<T extends Complaint>(rows: T[], scope: UserScope): T[] {
  return rows.filter((c) => {
    if (scope.departments.length && !scope.departments.includes(c.department)) return false;
    if (scope.wards.length && !scope.wards.includes(c.ward)) return false;
    return true;
  });
}
