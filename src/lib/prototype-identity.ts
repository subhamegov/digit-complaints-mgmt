export type PrototypeIdentity = {
  firstName: string;
  lastName: string;
  email: string;
  method: "google" | "github" | "email";
};

const KEY = "digit.prototype.identity";

export function setPrototypeIdentity(identity: PrototypeIdentity) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, JSON.stringify(identity));
}

export function getPrototypeIdentity(): PrototypeIdentity | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PrototypeIdentity;
  } catch {
    return null;
  }
}

export function clearPrototypeIdentity() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(KEY);
}
