/**
 * In-memory store for the Complaints configuration screen.
 *
 * Persistence: sessionStorage (resets on full reload - demo intent).
 * Subscription: useSyncExternalStore so any component can read/write
 * without prop-drilling. No external state library required.
 */

import { useSyncExternalStore } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export const LOCALES = ["en", "hi", "kn"] as const;
export type LocaleCode = (typeof LOCALES)[number];
export const LOCALE_LABEL: Record<LocaleCode, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
};

export type LocalizedString = Partial<Record<LocaleCode, string>>;

export type Category = {
  id: string;
  code: string;
  parentId: string | null;
  label: LocalizedString;
  description: LocalizedString;
  defaultPriorityId: string | null;
  defaultSlaHours: number;
  department: string;
  active: boolean;
  order: number;
};

export type Priority = {
  id: string;
  code: string;
  label: LocalizedString;
  color: string;
  weight: number;
  isDefault: boolean;
  order: number;
};

export type StatusCategory =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "REJECTED";

export type Status = {
  id: string;
  code: string;
  label: LocalizedString;
  category: StatusCategory;
  color: string;
  terminal: boolean;
};

export type ResolutionCode = {
  id: string;
  code: string;
  label: LocalizedString;
  description: LocalizedString;
  applicableStatusIds: string[];
  applicableCategoryIds: string[]; // empty = all
  active: boolean;
};

export type AttrType =
  | "text"
  | "number"
  | "select"
  | "multiselect"
  | "date"
  | "boolean"
  | "file";

export type Channel = "web" | "mobile" | "csr";
export type AttrRole = "citizen" | "agent" | "supervisor";

export type AttrOption = { id: string; code: string; label: LocalizedString };

export type CustomAttribute = {
  id: string;
  code: string;
  label: LocalizedString;
  type: AttrType;
  required: boolean;
  channels: Channel[];
  roles: AttrRole[];
  validation: { min?: number; max?: number; regex?: string };
  options: AttrOption[];
  applicableCategoryIds: string[]; // empty = all
};

export type ComplaintsConfig = {
  categories: Category[];
  priorities: Priority[];
  statuses: Status[];
  resolutionCodes: ResolutionCode[];
  customAttributes: CustomAttribute[];
};

/* ------------------------------------------------------------------ */
/* Seed data                                                          */
/* ------------------------------------------------------------------ */

const uid = (() => {
  let n = 0;
  return (p: string) => `${p}_${++n}`;
})();

function L(en: string, hi?: string, kn?: string): LocalizedString {
  return { en, ...(hi ? { hi } : {}), ...(kn ? { kn } : {}) };
}

const PRI = {
  low: uid("pri"),
  med: uid("pri"),
  high: uid("pri"),
  urg: uid("pri"),
};

const STATUS = {
  open: uid("st"),
  assigned: uid("st"),
  inProgress: uid("st"),
  resolved: uid("st"),
  closed: uid("st"),
  rejected: uid("st"),
};

const CAT = {
  sanitation: uid("cat"),
  roads: uid("cat"),
  water: uid("cat"),
  streetlight: uid("cat"),
  drainage: uid("cat"),
  parks: uid("cat"),
};

const SUB = {
  garbage: uid("cat"),
  toilets: uid("cat"),
  dead: uid("cat"),
  pothole: uid("cat"),
  signage: uid("cat"),
  footpath: uid("cat"),
  noSupply: uid("cat"),
  leak: uid("cat"),
  quality: uid("cat"),
  outage: uid("cat"),
  flicker: uid("cat"),
  newPole: uid("cat"),
  blocked: uid("cat"),
  overflow: uid("cat"),
  maintenance: uid("cat"),
};

const SEED: ComplaintsConfig = {
  priorities: [
    { id: PRI.low,  code: "LOW",      label: L("Low", "कम", "ಕಡಿಮೆ"),         color: "#94a3b8", weight: 1, isDefault: false, order: 0 },
    { id: PRI.med,  code: "MEDIUM",   label: L("Medium", "मध्यम", "ಮಧ್ಯಮ"),    color: "#3b82f6", weight: 2, isDefault: true,  order: 1 },
    { id: PRI.high, code: "HIGH",     label: L("High", "उच्च", "ಹೆಚ್ಚು"),       color: "#f59e0b", weight: 3, isDefault: false, order: 2 },
    { id: PRI.urg,  code: "URGENT",   label: L("Urgent", "अत्यावश्यक"),         color: "#ef4444", weight: 4, isDefault: false, order: 3 },
  ],
  statuses: [
    { id: STATUS.open,       code: "OPEN",        label: L("Open", "खुला"),               category: "OPEN",        color: "#3b82f6", terminal: false },
    { id: STATUS.assigned,   code: "ASSIGNED",    label: L("Assigned", "सौंपा"),          category: "IN_PROGRESS", color: "#8b5cf6", terminal: false },
    { id: STATUS.inProgress, code: "IN_PROGRESS", label: L("In progress", "प्रगति पर"),    category: "IN_PROGRESS", color: "#f59e0b", terminal: false },
    { id: STATUS.resolved,   code: "RESOLVED",    label: L("Resolved", "हल"),             category: "RESOLVED",    color: "#10b981", terminal: false },
    { id: STATUS.closed,     code: "CLOSED",      label: L("Closed", "बंद"),              category: "CLOSED",      color: "#64748b", terminal: true  },
    { id: STATUS.rejected,   code: "REJECTED",    label: L("Rejected", "अस्वीकृत"),        category: "REJECTED",    color: "#ef4444", terminal: true  },
  ],
  categories: [
    { id: CAT.sanitation,  code: "SANITATION",  parentId: null, label: L("Sanitation", "स्वच्छता", "ನೈರ್ಮಲ್ಯ"), description: L("Waste, toilets, hygiene"), defaultPriorityId: PRI.med,  defaultSlaHours: 48, department: "Public Health",      active: true, order: 0 },
    { id: CAT.roads,       code: "ROADS",       parentId: null, label: L("Roads", "सड़कें", "ರಸ್ತೆಗಳು"),     description: L("Roads, footpaths, signage"), defaultPriorityId: PRI.high, defaultSlaHours: 72, department: "Public Works",        active: true, order: 1 },
    { id: CAT.water,       code: "WATER",       parentId: null, label: L("Water Supply", "जल आपूर्ति"),     description: L("Supply, leaks, quality"),    defaultPriorityId: PRI.high, defaultSlaHours: 24, department: "Water",               active: true, order: 2 },
    { id: CAT.streetlight, code: "STREETLIGHT", parentId: null, label: L("Streetlights", "स्ट्रीट लाइट"),    description: L("Lighting infrastructure"),   defaultPriorityId: PRI.med,  defaultSlaHours: 48, department: "Electrical",          active: true, order: 3 },
    { id: CAT.drainage,    code: "DRAINAGE",    parentId: null, label: L("Drainage", "जल निकासी"),         description: L("Storm and sewer drains"),    defaultPriorityId: PRI.high, defaultSlaHours: 36, department: "Public Works",        active: true, order: 4 },
    { id: CAT.parks,       code: "PARKS",       parentId: null, label: L("Parks", "उद्यान"),               description: L("Parks and open spaces"),     defaultPriorityId: PRI.low,  defaultSlaHours: 120, department: "Horticulture",       active: true, order: 5 },

    { id: SUB.garbage,     code: "GARBAGE",        parentId: CAT.sanitation,  label: L("Garbage not collected", "कचरा संग्रह नहीं"), description: L(""), defaultPriorityId: PRI.med,  defaultSlaHours: 24, department: "Public Health", active: true, order: 0 },
    { id: SUB.toilets,     code: "PUBLIC_TOILETS", parentId: CAT.sanitation,  label: L("Public toilets"),                          description: L(""), defaultPriorityId: PRI.med,  defaultSlaHours: 48, department: "Public Health", active: true, order: 1 },
    { id: SUB.dead,        code: "DEAD_ANIMAL",    parentId: CAT.sanitation,  label: L("Dead animal removal"),                     description: L(""), defaultPriorityId: PRI.high, defaultSlaHours: 12, department: "Public Health", active: true, order: 2 },
    { id: SUB.pothole,     code: "POTHOLE",        parentId: CAT.roads,       label: L("Pothole"),                                 description: L(""), defaultPriorityId: PRI.high, defaultSlaHours: 72, department: "Public Works",  active: true, order: 0 },
    { id: SUB.signage,     code: "SIGNAGE",        parentId: CAT.roads,       label: L("Damaged signage"),                         description: L(""), defaultPriorityId: PRI.low,  defaultSlaHours: 96, department: "Public Works",  active: true, order: 1 },
    { id: SUB.footpath,    code: "FOOTPATH",       parentId: CAT.roads,       label: L("Footpath damaged"),                        description: L(""), defaultPriorityId: PRI.med,  defaultSlaHours: 72, department: "Public Works",  active: true, order: 2 },
    { id: SUB.noSupply,    code: "NO_SUPPLY",      parentId: CAT.water,       label: L("No water supply"),                         description: L(""), defaultPriorityId: PRI.urg,  defaultSlaHours: 12, department: "Water",         active: true, order: 0 },
    { id: SUB.leak,        code: "PIPE_LEAK",      parentId: CAT.water,       label: L("Pipeline leak"),                           description: L(""), defaultPriorityId: PRI.high, defaultSlaHours: 24, department: "Water",         active: true, order: 1 },
    { id: SUB.quality,     code: "WATER_QUALITY",  parentId: CAT.water,       label: L("Water quality"),                           description: L(""), defaultPriorityId: PRI.high, defaultSlaHours: 24, department: "Water",         active: true, order: 2 },
    { id: SUB.outage,      code: "LIGHT_OUT",      parentId: CAT.streetlight, label: L("Light not working"),                       description: L(""), defaultPriorityId: PRI.med,  defaultSlaHours: 48, department: "Electrical",    active: true, order: 0 },
    { id: SUB.flicker,     code: "LIGHT_FLICKER",  parentId: CAT.streetlight, label: L("Flickering light"),                        description: L(""), defaultPriorityId: PRI.low,  defaultSlaHours: 72, department: "Electrical",    active: true, order: 1 },
    { id: SUB.newPole,     code: "NEW_POLE",       parentId: CAT.streetlight, label: L("New pole request"),                        description: L(""), defaultPriorityId: PRI.low,  defaultSlaHours: 240,department: "Electrical",    active: false, order: 2 },
    { id: SUB.blocked,     code: "BLOCKED_DRAIN",  parentId: CAT.drainage,    label: L("Blocked drain"),                           description: L(""), defaultPriorityId: PRI.high, defaultSlaHours: 24, department: "Public Works",  active: true, order: 0 },
    { id: SUB.overflow,    code: "DRAIN_OVERFLOW", parentId: CAT.drainage,    label: L("Drain overflow"),                          description: L(""), defaultPriorityId: PRI.urg,  defaultSlaHours: 12, department: "Public Works",  active: true, order: 1 },
    { id: SUB.maintenance, code: "PARK_MAINT",     parentId: CAT.parks,       label: L("Park maintenance"),                        description: L(""), defaultPriorityId: PRI.low,  defaultSlaHours: 168,department: "Horticulture",  active: true, order: 0 },
  ],
  resolutionCodes: [
    { id: uid("res"), code: "FIXED",          label: L("Fixed on site"),       description: L("Issue resolved at the location"),  applicableStatusIds: [STATUS.resolved, STATUS.closed], applicableCategoryIds: [], active: true },
    { id: uid("res"), code: "PARTIAL_FIX",    label: L("Partially resolved"),  description: L("Workaround applied; follow-up needed"), applicableStatusIds: [STATUS.resolved], applicableCategoryIds: [], active: true },
    { id: uid("res"), code: "REFERRED",       label: L("Referred to dept"),    description: L("Forwarded to another department"), applicableStatusIds: [STATUS.closed], applicableCategoryIds: [], active: true },
    { id: uid("res"), code: "DUPLICATE",      label: L("Duplicate complaint"), description: L("Already tracked under another ID"),applicableStatusIds: [STATUS.rejected], applicableCategoryIds: [], active: true },
    { id: uid("res"), code: "NOT_ACTIONABLE", label: L("Not actionable"),      description: L("Outside jurisdiction or invalid"), applicableStatusIds: [STATUS.rejected], applicableCategoryIds: [], active: true },
    { id: uid("res"), code: "NO_ACCESS",      label: L("No site access"),      description: L("Could not access the location"),   applicableStatusIds: [STATUS.rejected, STATUS.closed], applicableCategoryIds: [], active: true },
    { id: uid("res"), code: "WITHDRAWN",      label: L("Withdrawn by citizen"),description: L("Citizen withdrew the complaint"),  applicableStatusIds: [STATUS.closed], applicableCategoryIds: [], active: true },
    { id: uid("res"), code: "MATERIAL_PENDING", label: L("Material pending"),  description: L("Awaiting parts/materials"),        applicableStatusIds: [STATUS.inProgress], applicableCategoryIds: [], active: false },
  ],
  customAttributes: [
    {
      id: uid("attr"), code: "LANDMARK", label: L("Nearby landmark"),
      type: "text", required: false,
      channels: ["web", "mobile", "csr"], roles: ["citizen", "agent"],
      validation: { max: 120 }, options: [], applicableCategoryIds: [],
    },
    {
      id: uid("attr"), code: "SEVERITY", label: L("Severity"),
      type: "select", required: true,
      channels: ["web", "mobile", "csr"], roles: ["citizen", "agent", "supervisor"],
      validation: {},
      options: [
        { id: uid("opt"), code: "MINOR",    label: L("Minor") },
        { id: uid("opt"), code: "MODERATE", label: L("Moderate") },
        { id: uid("opt"), code: "SEVERE",   label: L("Severe") },
      ],
      applicableCategoryIds: [CAT.roads, CAT.drainage],
    },
    {
      id: uid("attr"), code: "PEOPLE_AFFECTED", label: L("People affected"),
      type: "number", required: false,
      channels: ["csr"], roles: ["agent", "supervisor"],
      validation: { min: 0, max: 100000 }, options: [], applicableCategoryIds: [],
    },
    {
      id: uid("attr"), code: "PHOTO", label: L("Photo evidence"),
      type: "file", required: false,
      channels: ["web", "mobile"], roles: ["citizen"],
      validation: {}, options: [], applicableCategoryIds: [],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Store                                                              */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "complaints-config:v1";

function loadInitial(): ComplaintsConfig {
  if (typeof window === "undefined") return SEED;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED;
    return JSON.parse(raw) as ComplaintsConfig;
  } catch {
    return SEED;
  }
}

let state: ComplaintsConfig = loadInitial();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window !== "undefined") {
    try { window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }
}

function setState(updater: (s: ComplaintsConfig) => ComplaintsConfig) {
  state = updater(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useComplaintsConfig(): ComplaintsConfig {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

export function resetComplaintsConfig() {
  state = SEED;
  persist();
  listeners.forEach((l) => l());
}

/* ---- Mutators ---------------------------------------------------- */

const rid = (p: string) =>
  `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const categoryActions = {
  create(input: Omit<Category, "id" | "order">) {
    setState((s) => {
      const siblings = s.categories.filter((c) => c.parentId === input.parentId);
      return { ...s, categories: [...s.categories, { ...input, id: rid("cat"), order: siblings.length }] };
    });
  },
  update(id: string, patch: Partial<Category>) {
    setState((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  },
  remove(id: string) {
    setState((s) => {
      const toRemove = new Set<string>();
      const collect = (pid: string) => {
        toRemove.add(pid);
        s.categories.filter((c) => c.parentId === pid).forEach((c) => collect(c.id));
      };
      collect(id);
      return { ...s, categories: s.categories.filter((c) => !toRemove.has(c.id)) };
    });
  },
  move(id: string, direction: -1 | 1) {
    setState((s) => {
      const cat = s.categories.find((c) => c.id === id);
      if (!cat) return s;
      const siblings = s.categories
        .filter((c) => c.parentId === cat.parentId)
        .sort((a, b) => a.order - b.order);
      const idx = siblings.findIndex((c) => c.id === id);
      const swap = siblings[idx + direction];
      if (!swap) return s;
      const a = swap.order, b = cat.order;
      return {
        ...s,
        categories: s.categories.map((c) =>
          c.id === cat.id ? { ...c, order: a } : c.id === swap.id ? { ...c, order: b } : c,
        ),
      };
    });
  },
};

export const priorityActions = {
  create(input: Omit<Priority, "id" | "order">) {
    setState((s) => ({ ...s, priorities: [...s.priorities, { ...input, id: rid("pri"), order: s.priorities.length }] }));
  },
  update(id: string, patch: Partial<Priority>) {
    setState((s) => {
      const next = s.priorities.map((p) => (p.id === id ? { ...p, ...patch } : p));
      if (patch.isDefault) {
        return { ...s, priorities: next.map((p) => (p.id === id ? p : { ...p, isDefault: false })) };
      }
      return { ...s, priorities: next };
    });
  },
  remove(id: string) {
    setState((s) => ({ ...s, priorities: s.priorities.filter((p) => p.id !== id) }));
  },
};

export const statusActions = {
  create(input: Omit<Status, "id">) {
    setState((s) => ({ ...s, statuses: [...s.statuses, { ...input, id: rid("st") }] }));
  },
  update(id: string, patch: Partial<Status>) {
    setState((s) => ({ ...s, statuses: s.statuses.map((st) => (st.id === id ? { ...st, ...patch } : st)) }));
  },
  remove(id: string) {
    setState((s) => ({ ...s, statuses: s.statuses.filter((st) => st.id !== id) }));
  },
};

export const resolutionActions = {
  create(input: Omit<ResolutionCode, "id">) {
    setState((s) => ({ ...s, resolutionCodes: [...s.resolutionCodes, { ...input, id: rid("res") }] }));
  },
  update(id: string, patch: Partial<ResolutionCode>) {
    setState((s) => ({ ...s, resolutionCodes: s.resolutionCodes.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  },
  remove(id: string) {
    setState((s) => ({ ...s, resolutionCodes: s.resolutionCodes.filter((r) => r.id !== id) }));
  },
};

export const attributeActions = {
  create(input: Omit<CustomAttribute, "id">) {
    setState((s) => ({ ...s, customAttributes: [...s.customAttributes, { ...input, id: rid("attr") }] }));
  },
  update(id: string, patch: Partial<CustomAttribute>) {
    setState((s) => ({ ...s, customAttributes: s.customAttributes.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  },
  remove(id: string) {
    setState((s) => ({ ...s, customAttributes: s.customAttributes.filter((a) => a.id !== id) }));
  },
};

/* ---- Helpers ----------------------------------------------------- */

export function labelFor(s: LocalizedString | undefined, locale: LocaleCode, fallback = ""): string {
  if (!s) return fallback;
  return s[locale] || s.en || Object.values(s).find(Boolean) || fallback;
}

export function newRid(prefix: string) {
  return rid(prefix);
}
