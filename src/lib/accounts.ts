/**
 * Prototype account (tenant) configuration.
 * `hasCustomLogin` drives the organisation sign-in notice on the central login page.
 */
export interface AccountConfig {
  value: string;
  label: string;
  hasCustomLogin: boolean;
  customLoginUrl: string | null;
}

export const ACCOUNTS: AccountConfig[] = [
  { value: "acc.makueni.cg", label: "Makueni County Government, Kenya", hasCustomLogin: false, customLoginUrl: null },
  { value: "acc.bomet.cg", label: "Bomet County Government, Kenya", hasCustomLogin: true, customLoginUrl: "/bomet/login" },
  {
    value: "acc.ethekwini.mm",
    label: "eThekwini Metropolitan Municipality, South Africa",
    hasCustomLogin: true,
    customLoginUrl: "/ethekwini/login",
  },
  { value: "acc.diredawa.ca", label: "Dire Dawa City Administration, Ethiopia", hasCustomLogin: false, customLoginUrl: null },
  { value: "acc.enugu.sg", label: "Enugu State Government, Nigeria", hasCustomLogin: false, customLoginUrl: null },
  { value: "acc.maputo.mc", label: "Maputo Municipal Council, Mozambique", hasCustomLogin: false, customLoginUrl: null },
  { value: "acc.banyuwangi.rg", label: "Banyuwangi Regency Government, Indonesia", hasCustomLogin: false, customLoginUrl: null },
  { value: "acc.amritsar.mc", label: "Amritsar Municipal Corporation, India", hasCustomLogin: false, customLoginUrl: null },
];

export const LANGUAGES = [{ code: "en", label: "English" }] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];
