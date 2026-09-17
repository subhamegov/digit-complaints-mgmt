/** Email carried forward from the sign-in "no account found" flow. */
export const SIGNUP_PREFILL_EMAIL_KEY = "digit.prototype.signup.prefill-email";

/** The single prototype email for which no account exists. */
export const NO_ACCOUNT_EMAIL = "newuser@egovernments.org";

export function isNoAccountEmail(value: string): boolean {
  return value.trim().toLowerCase() === NO_ACCOUNT_EMAIL;
}

export function setSignupPrefillEmail(email: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SIGNUP_PREFILL_EMAIL_KEY, email);
}

export function getSignupPrefillEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SIGNUP_PREFILL_EMAIL_KEY);
}

export function clearSignupPrefillEmail() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SIGNUP_PREFILL_EMAIL_KEY);
}
