/**
 * Prototype-only helpers for the government SaaS account setup wizard.
 * All uniqueness checks, code generation, and URL generation are simulated.
 */

export const BASE_DOMAIN = "cms.digit.org";

export const EXISTING_ORG_CODES = [
  "KE-MCG",
  "KE-BCG",
  "ET-DDCA",
  "UG-KCCA",
  "NG-ESG",
  "IN-PMIDC",
  "BD-DNCC",
];

export const EXISTING_ORG_SLUGS = ["makueni", "bomet", "dire-dawa", "kcca", "pmidc"];

export interface CountryOption {
  code: string;
  label: string;
  timezone: string;
  languages: string[];
}

export const COUNTRIES: CountryOption[] = [
  { code: "KE", label: "Kenya", timezone: "Africa/Nairobi", languages: ["en"] },
  { code: "IN", label: "India", timezone: "Asia/Kolkata", languages: ["en", "hi"] },
  { code: "ET", label: "Ethiopia", timezone: "Africa/Addis_Ababa", languages: ["en"] },
  { code: "NG", label: "Nigeria", timezone: "Africa/Lagos", languages: ["en"] },
  { code: "SN", label: "Senegal", timezone: "Africa/Dakar", languages: ["fr"] },
  { code: "MZ", label: "Mozambique", timezone: "Africa/Maputo", languages: ["pt"] },
  { code: "ZA", label: "South Africa", timezone: "Africa/Johannesburg", languages: ["en"] },
  { code: "UG", label: "Uganda", timezone: "Africa/Kampala", languages: ["en"] },
  { code: "ID", label: "Indonesia", timezone: "Asia/Jakarta", languages: ["en"] },
  { code: "BD", label: "Bangladesh", timezone: "Asia/Dhaka", languages: ["en"] },
];

export const TIMEZONES = [
  "Africa/Nairobi",
  "Africa/Addis_Ababa",
  "Africa/Lagos",
  "Africa/Dakar",
  "Africa/Maputo",
  "Africa/Johannesburg",
  "Africa/Kampala",
  "Asia/Kolkata",
  "Asia/Jakarta",
  "Asia/Dhaka",
  "Europe/London",
  "UTC",
];

export const SETUP_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "pt", label: "Portuguese" },
  { code: "hi", label: "Hindi" },
];

export const FINANCIAL_YEARS = [
  { value: "JAN", label: "January to December" },
  { value: "APR", label: "April to March" },
  { value: "JUL", label: "July to June" },
  { value: "OCT", label: "October to September" },
];

const STOP_WORDS = new Set(["of", "the", "and", "for", "in", "at", "a", "an"]);

/** Acronym from an organisation name, e.g. "Makueni County Government" -> "MCG". */
export function orgAcronym(name: string): string {
  const words = name
    .trim()
    .split(/[\s./-]+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length > 0 && !STOP_WORDS.has(w.toLowerCase()));
  if (words.length === 0) return "";
  const acronym = words.map((w) => w[0]!.toUpperCase()).join("");
  if (acronym.length >= 2) return acronym.slice(0, 12);
  return words[0]!.slice(0, 4).toUpperCase();
}

export function normaliseCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CODE_RE = /^[A-Z]{2}-[A-Z0-9]{2,12}(?:-[0-9]{2})?$/;
const CODE_PRE_COUNTRY_RE = /^[A-Z0-9]{2,12}(?:-[0-9]{2})?$/;

export function isCodeValid(code: string, hasCountry: boolean): boolean {
  return hasCountry ? CODE_RE.test(code) : CODE_RE.test(code) || CODE_PRE_COUNTRY_RE.test(code);
}

export function isCodeTaken(code: string): boolean {
  return EXISTING_ORG_CODES.some((c) => c.toUpperCase() === code.toUpperCase());
}

/** Next available code by appending a two-digit suffix starting at 02. */
export function suggestCode(code: string): string {
  const base = code.replace(/-\d{2}$/, "");
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${String(i).padStart(2, "0")}`;
    if (!isCodeTaken(candidate)) return candidate;
  }
  return base;
}

const NAME_RE = /^(?=.{3,120}$)[\p{L}\p{M}\p{N}][\p{L}\p{M}\p{N}\s.,'’&()/-]*$/u;

export function normaliseOrgName(raw: string): string {
  return raw.trim().replace(/\s{2,}/g, " ");
}

export function isOrgNameValid(raw: string): boolean {
  return NAME_RE.test(normaliseOrgName(raw));
}

export function slugify(name: string): string {
  const acronym = orgAcronym(name);
  const words = normaliseOrgName(name).split(/\s+/).filter(Boolean);
  // Long names collapse to their acronym (e.g. PMIDC), short ones keep words.
  if (words.length >= 5) return acronym.toLowerCase();
  return normaliseOrgName(name)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normaliseSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 40);
}

export function isSlugValid(slug: string): boolean {
  return SLUG_RE.test(slug) && slug.length <= 40;
}

export function isSlugTaken(slug: string): boolean {
  return EXISTING_ORG_SLUGS.includes(slug.toLowerCase());
}

export function suggestSlug(slug: string): string {
  const candidates = [`${slug}-gov`, `${slug}-county`, `${slug}-01`];
  for (const c of candidates) if (!isSlugTaken(c) && isSlugValid(c)) return c;
  return `${slug}-02`;
}

export function urlsFor(slug: string) {
  const base = `https://${slug}.${BASE_DOMAIN}`;
  return { citizenUrl: base, employeeUrl: `${base}/employee`, adminUrl: `${base}/admin` };
}
