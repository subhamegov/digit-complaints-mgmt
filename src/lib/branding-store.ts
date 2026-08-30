/**
 * Account Administration > Branding configuration store (prototype).
 *
 * Presentation-only configuration. Nothing in this module touches complaint
 * workflows, SLAs, roles, permissions, geography or routing.
 *
 * Model:
 *   - `draft`     : working copy edited in the console
 *   - `published` : the copy that the live citizen/employee experience uses
 *
 * Every mutation that is saved or published is written to the shared
 * Audit Log through `appendAudit` in `user-admin-store`.
 *
 * Scope is account-wide: changing the Working Context locality must never
 * change branding. The shape keeps room for future sub-account overrides
 * (`overrides` is reserved) without exposing them in the UI today.
 */

import { useEffect, useSyncExternalStore } from "react";
import { appendAudit, CURRENT_ADMIN, type AuditAction } from "@/lib/user-admin-store";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type BackgroundStyle = "LIGHT" | "NEUTRAL";
export type ButtonStyle = "STANDARD" | "ROUNDED";

export type ThemeConfig = {
  primary_colour: string;
  secondary_colour: string;
  background_style: BackgroundStyle;
  button_style: ButtonStyle;
};

export type ImageAsset = {
  url: string;
  fileName: string;
  width: number;
  height: number;
  alt: string;
  decorative: boolean;
} | null;

export type LogosConfig = {
  primary_logo: ImageAsset;
  compact_logo: ImageAsset;
  favicon: ImageAsset;
};

export type SignInConfig = {
  employee: {
    title: string;
    supporting_text: string;
    background_image: ImageAsset;
    illustration: ImageAsset;
  };
  citizen: {
    title: string;
    supporting_text: string;
  };
};

export const INFORMATION_BLOCKS = [
  { id: "service_information", label: "Service information" },
  { id: "emergency_guidance", label: "Emergency guidance" },
  { id: "contact_support", label: "Contact support" },
  { id: "frequently_asked_questions", label: "Frequently asked questions" },
] as const;

export type InformationBlockId = (typeof INFORMATION_BLOCKS)[number]["id"];

export type CitizenLandingConfig = {
  hero: {
    heading: string;
    supporting_text: string;
    image: ImageAsset;
  };
  primary_actions: {
    file_complaint_label: string;
    track_complaint_label: string;
  };
  enabled_information_blocks: InformationBlockId[];
  information_block_order: InformationBlockId[];
  featured_complaint_types: string[];
};

export type BrandingConfiguration = {
  account_id: string;
  theme: ThemeConfig;
  logos: LogosConfig;
  sign_in: SignInConfig;
  citizen_landing: CitizenLandingConfig;
};

export type BrandingState = {
  draft: BrandingConfiguration;
  published: BrandingConfiguration;
  status: "DRAFT" | "PUBLISHED";
  updated_at: string;
  updated_by: string;
  published_at: string | null;
};

/* ------------------------------------------------------------------ */
/* Defaults                                                           */
/* ------------------------------------------------------------------ */

export const DEFAULT_CONFIG: BrandingConfiguration = {
  account_id: "acc.makueni.cg",
  theme: {
    primary_colour: "#2563EB",
    secondary_colour: "#0B1F3A",
    background_style: "LIGHT",
    button_style: "STANDARD",
  },
  logos: {
    primary_logo: null,
    compact_logo: null,
    favicon: null,
  },
  sign_in: {
    employee: {
      title: "Sign in to Makueni County Complaint Management",
      supporting_text: "Sign in to manage, resolve and monitor complaints.",
      background_image: null,
      illustration: null,
    },
    citizen: {
      title: "Access your complaints",
      supporting_text:
        "Sign in to track existing complaints or continue a saved request.",
    },
  },
  citizen_landing: {
    hero: {
      heading: "How can we help?",
      supporting_text: "Report an issue or track an existing complaint.",
      image: null,
    },
    primary_actions: {
      file_complaint_label: "Report an issue",
      track_complaint_label: "Track a complaint",
    },
    enabled_information_blocks: ["service_information", "contact_support"],
    information_block_order: [
      "service_information",
      "emergency_guidance",
      "contact_support",
      "frequently_asked_questions",
    ],
    featured_complaint_types: [],
  },
};

const STORAGE_KEY = "pgr.branding.v1";
const INITIAL_TIMESTAMP = "2026-01-01T00:00:00.000Z";

const clone = (c: BrandingConfiguration): BrandingConfiguration =>
  JSON.parse(JSON.stringify(c)) as BrandingConfiguration;

function baseState(): BrandingState {
  return {
    draft: clone(DEFAULT_CONFIG),
    published: clone(DEFAULT_CONFIG),
    status: "PUBLISHED",
    updated_at: INITIAL_TIMESTAMP,
    updated_by: CURRENT_ADMIN,
    published_at: INITIAL_TIMESTAMP,
  };
}

function readStoredState(base: BrandingState): BrandingState {
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<BrandingState>;
    return {
      ...base,
      ...parsed,
      draft: { ...clone(DEFAULT_CONFIG), ...(parsed.draft ?? {}) },
      published: { ...clone(DEFAULT_CONFIG), ...(parsed.published ?? {}) },
    };
  } catch {
    return base;
  }
}

let state: BrandingState = baseState();
let hydrated = false;
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useBranding(): BrandingState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

/** Live (published) branding - what citizens and employees actually see. */
export function usePublishedBranding(): BrandingConfiguration {
  return useBranding().published;
}

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

export type BrandingArea = "THEME" | "LOGO" | "SIGN_IN" | "CITIZEN_LANDING";

const AREA_ACTION: Record<BrandingArea, AuditAction> = {
  THEME: "BRANDING_THEME_UPDATED",
  LOGO: "BRANDING_LOGO_UPDATED",
  SIGN_IN: "BRANDING_SIGN_IN_UPDATED",
  CITIZEN_LANDING: "CITIZEN_LANDING_UPDATED",
};

export const AREA_LABEL: Record<BrandingArea, string> = {
  THEME: "Branding > Theme",
  LOGO: "Branding > Logo",
  SIGN_IN: "Branding > Sign-in Personalisation",
  CITIZEN_LANDING: "Branding > Citizen Landing Page",
};

/** Update the working draft without auditing (local, unsaved edit). */
export function updateDraft(
  updater: (d: BrandingConfiguration) => BrandingConfiguration,
) {
  state = { ...state, draft: updater(clone(state.draft)) };
  emit();
}

export function hasUnpublishedChanges(s: BrandingState = state): boolean {
  return JSON.stringify(s.draft) !== JSON.stringify(s.published);
}

type Change = { field: string; previous: string; next: string };

/** Diff two plain objects into readable audit changes. */
export function diffChanges(
  before: unknown,
  after: unknown,
  labels: Record<string, string>,
): Change[] {
  const out: Change[] = [];
  const walk = (a: unknown, b: unknown, path: string) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    const isObj = (v: unknown) =>
      v !== null && typeof v === "object" && !Array.isArray(v);
    if (isObj(a) && isObj(b)) {
      const keys = new Set([
        ...Object.keys(a as object),
        ...Object.keys(b as object),
      ]);
      keys.forEach((k) =>
        walk(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k],
          path ? `${path}.${k}` : k,
        ),
      );
      return;
    }
    out.push({
      field: labels[path] ?? path,
      previous: fmt(a),
      next: fmt(b),
    });
  };
  walk(before, after, "");
  return out;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined || v === "") return "Not set";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "None";
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    return typeof o.fileName === "string" ? o.fileName : JSON.stringify(v);
  }
  return String(v);
}

/** Save the draft for one configuration area and audit the change. */
export function saveArea(
  area: BrandingArea,
  changes: Change[],
  summary: string,
) {
  state = {
    ...state,
    status: hasUnpublishedChanges() ? "DRAFT" : state.status,
    updated_at: new Date().toISOString(),
    updated_by: CURRENT_ADMIN,
  };
  emit();
  appendAudit({
    userType: "CONFIGURATION",
    targetLabel: AREA_LABEL[area],
    targetIdentifier: state.draft.account_id,
    targetId: `BRANDING-${area}`,
    action: AREA_ACTION[area],
    performedBy: CURRENT_ADMIN,
    result: "SUCCESS",
    lastLoggedIn: null,
    changes: changes.length ? changes : [{ field: summary, previous: "-", next: "-" }],
    context: { source: "Account Administration > Branding", reason: summary },
  });
}

/** Publish the draft to the live experience and audit the publication. */
export function publishBranding() {
  const changed = hasUnpublishedChanges();
  state = {
    ...state,
    published: clone(state.draft),
    status: "PUBLISHED",
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updated_by: CURRENT_ADMIN,
  };
  emit();
  appendAudit({
    userType: "CONFIGURATION",
    targetLabel: "Branding configuration",
    targetIdentifier: state.draft.account_id,
    targetId: "BRANDING-PUBLISH",
    action: "BRANDING_PUBLISHED",
    performedBy: CURRENT_ADMIN,
    result: "SUCCESS",
    lastLoggedIn: null,
    changes: [
      {
        field: "Published branding configuration",
        previous: changed ? "Draft" : "Published",
        next: "Published",
      },
    ],
    context: { source: "Account Administration > Branding" },
  });
}

/** Discard unpublished edits. */
export function discardDraft() {
  state = { ...state, draft: clone(state.published), status: "PUBLISHED" };
  emit();
}

/* ------------------------------------------------------------------ */
/* Accessibility helpers (WCAG AA)                                    */
/* ------------------------------------------------------------------ */

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.padEnd(6, "0").slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Best readable foreground (white or near-black) for a background. */
export function readableForeground(bg: string): "#FFFFFF" | "#0B1F3A" {
  return contrastRatio(bg, "#FFFFFF") >= contrastRatio(bg, "#0B1F3A")
    ? "#FFFFFF"
    : "#0B1F3A";
}

/** Darken a hex colour by `amount` (0-1) - used for accessible suggestions. */
export function darken(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * (1 - amount))))
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`.toUpperCase();
}

/** Nearest darker shade that clears AA (4.5:1) against white text. */
export function suggestAccessible(hex: string): string {
  let candidate = hex.toUpperCase();
  for (let i = 1; i <= 20; i++) {
    if (contrastRatio(candidate, "#FFFFFF") >= 4.5) return candidate;
    candidate = darken(hex, i * 0.05);
  }
  return "#0B1F3A";
}

export type ContrastCheck = {
  label: string;
  foreground: string;
  background: string;
  ratio: number;
  required: number;
  passes: boolean;
  blocking: boolean;
  suggestion?: string;
};

export function themeContrastChecks(theme: ThemeConfig): ContrastCheck[] {
  const surface = theme.background_style === "LIGHT" ? "#FFFFFF" : "#F4F6F9";
  const checks: ContrastCheck[] = [];

  const primaryFg = readableForeground(theme.primary_colour);
  const primaryRatio = contrastRatio(theme.primary_colour, primaryFg);
  checks.push({
    label: "Primary button text on primary colour",
    foreground: primaryFg,
    background: theme.primary_colour,
    ratio: primaryRatio,
    required: 4.5,
    passes: primaryRatio >= 4.5,
    blocking: true,
    suggestion: primaryRatio >= 4.5 ? undefined : suggestAccessible(theme.primary_colour),
  });

  const secondaryFg = readableForeground(theme.secondary_colour);
  const secondaryRatio = contrastRatio(theme.secondary_colour, secondaryFg);
  checks.push({
    label: "Secondary button text on secondary colour",
    foreground: secondaryFg,
    background: theme.secondary_colour,
    ratio: secondaryRatio,
    required: 4.5,
    passes: secondaryRatio >= 4.5,
    blocking: true,
    suggestion: secondaryRatio >= 4.5 ? undefined : suggestAccessible(theme.secondary_colour),
  });

  const linkRatio = contrastRatio(theme.primary_colour, surface);
  checks.push({
    label: "Link text on page background",
    foreground: theme.primary_colour,
    background: surface,
    ratio: linkRatio,
    required: 4.5,
    passes: linkRatio >= 4.5,
    blocking: true,
    suggestion: linkRatio >= 4.5 ? undefined : suggestAccessible(theme.primary_colour),
  });

  return checks;
}

export function formatRatio(r: number): string {
  return `${r.toFixed(2)}:1`;
}

/* ------------------------------------------------------------------ */
/* Last visited Branding subsection                                   */
/* ------------------------------------------------------------------ */

const LAST_KEY = "pgr.branding.lastSection";

export function rememberBrandingSection(path: string) {
  try {
    window.localStorage.setItem(LAST_KEY, path);
  } catch {
    /* ignore */
  }
}

export function lastBrandingSection(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(LAST_KEY);
  } catch {
    return null;
  }
}
