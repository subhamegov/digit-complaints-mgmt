/**
 * Prototype account (tenant) configuration.
 *
 * `authMode` drives the sign-in experience shown on the central sign-in page:
 *  - platform_password   : DIGIT-managed password authentication
 *  - platform_sso        : centrally configured SSO provider
 *  - hybrid              : password and SSO both available
 *  - organisation_sign_in: the account runs its own sign-in page
 *
 * `methods` lists the exact sign-in methods configured for the account. The
 * sign-in page reveals only these once the account has been selected.
 */
export type AuthMode = "platform_password" | "platform_sso" | "hybrid" | "organisation_sign_in";

export type AuthMethod = "password" | "google" | "github";

export interface AccountConfig {
  value: string;
  label: string;
  country: string;
  authMode: AuthMode;
  /** Configured sign-in methods; empty for organisation_sign_in accounts. */
  methods: AuthMethod[];
  /** SSO provider name, for platform_sso / hybrid accounts. */
  provider?: string;
  /** Sign-in URL for organisation_sign_in accounts. */
  organisationSignInUrl?: string;
  /** Legacy alias retained for the /$org/login placeholder route. */
  hasCustomLogin: boolean;
  customLoginUrl: string | null;
}

export const ACCOUNTS: AccountConfig[] = [
  {
    value: "acc.makueni.cg",
    label: "Makueni County Government, Kenya",
    country: "Kenya",
    authMode: "hybrid",
    methods: ["password", "google"],
    provider: "Google",
    hasCustomLogin: false,
    customLoginUrl: null,
  },
  {
    value: "acc.bomet.cg",
    label: "Bomet County Government, Kenya",
    country: "Kenya",
    authMode: "platform_sso",
    methods: ["google"],
    provider: "Google",
    hasCustomLogin: false,
    customLoginUrl: null,
  },
  {
    value: "acc.ethekwini.mm",
    label: "eThekwini Metropolitan Municipality, South Africa",
    country: "South Africa",
    authMode: "organisation_sign_in",
    methods: [],
    organisationSignInUrl: "/auth/ethekwini",
    hasCustomLogin: true,
    customLoginUrl: "/ethekwini/login",
  },
  {
    value: "acc.egov.foundation",
    label: "eGov Foundation, India",
    country: "India",
    authMode: "platform_sso",
    methods: ["google", "github"],
    provider: "Google",
    hasCustomLogin: false,
    customLoginUrl: null,
  },
  {
    value: "acc.diredawa.ca",
    label: "Dire Dawa City Administration, Ethiopia",
    country: "Ethiopia",
    authMode: "platform_password",
    methods: ["password"],
    hasCustomLogin: false,
    customLoginUrl: null,
  },
  {
    value: "acc.enugu.sg",
    label: "Enugu State Government, Nigeria",
    country: "Nigeria",
    authMode: "platform_password",
    methods: ["password"],
    hasCustomLogin: false,
    customLoginUrl: null,
  },
  {
    value: "acc.maputo.mc",
    label: "Maputo Municipal Council, Mozambique",
    country: "Mozambique",
    authMode: "platform_password",
    methods: ["password"],
    hasCustomLogin: false,
    customLoginUrl: null,
  },
  {
    value: "acc.banyuwangi.rg",
    label: "Banyuwangi Regency Government, Indonesia",
    country: "Indonesia",
    authMode: "platform_password",
    methods: ["password"],
    hasCustomLogin: false,
    customLoginUrl: null,
  },
  {
    value: "acc.amritsar.mc",
    label: "Amritsar Municipal Corporation, India",
    country: "India",
    authMode: "platform_password",
    methods: ["password", "github"],
    hasCustomLogin: false,
    customLoginUrl: null,
  },
];

export const LANGUAGES = [{ code: "en", label: "English" }] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];
