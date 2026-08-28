import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, MailCheck } from "lucide-react";
import { AuthShell, AuthField, authInputCls, authInputStyle } from "@/components/auth/AuthShell";
import type { LanguageCode } from "@/lib/accounts";
import { clearPrototypeIdentity, getPrototypeIdentity, setPrototypeIdentity } from "@/lib/prototype-identity";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — DIGIT Complaint Management" },
      { name: "description", content: "Create your DIGIT Complaint Management account to start setting up your service." },
      { property: "og:title", content: "Sign Up — DIGIT Complaint Management" },
      { property: "og:description", content: "Create your DIGIT Complaint Management account." },
    ],
  }),
  component: SignupPage,
});

const DRAFT_KEY = "digit.prototype.signup.draft";

function SignupPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [email, setEmail] = useState("");
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stage, setStage] = useState<"form" | "check-email">("form");
  const [authMethod, setAuthMethod] = useState<"google" | "email" | null>(null);

  // Restore prototype identity (e.g. returning from the simulated Google step).
  useEffect(() => {
    const identity = getPrototypeIdentity();
    if (identity) {
      setFirstName(identity.firstName);
      setLastName(identity.lastName);
      setEmail(identity.email);
      setAuthMethod(identity.method);
    }
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(DRAFT_KEY) : null;
    if (raw) {
      try {
        const d = JSON.parse(raw) as { organisationName?: string; terms?: boolean; marketing?: boolean };
        if (d.organisationName) setOrganisationName(d.organisationName);
        if (d.terms) setTerms(true);
        if (d.marketing) setMarketing(true);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const authenticated = authMethod !== null;
  const emailValid = /\S+@\S+\.\S+/.test(email);
  const identityReady = firstName.trim() !== "" && lastName.trim() !== "" && emailValid && terms;
  const orgMissing = organisationName.trim() === "";
  const canContinue = authenticated && !orgMissing && terms;

  const saveDraft = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ organisationName, terms, marketing }));
  };

  const submitEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (authenticated) {
      if (!canContinue) return;
      if (typeof window !== "undefined") window.sessionStorage.removeItem(DRAFT_KEY);
      navigate({ to: "/setup/organisation" });
      return;
    }
    if (!identityReady || orgMissing) return;
    setStage("check-email");
  };

  const simulateVerification = () => {
    setPrototypeIdentity({ firstName, lastName, email, method: "email" });
    setAuthMethod("email");
    setStage("form");
    setSubmitted(false);
  };

  const useDifferentEmail = () => {
    clearPrototypeIdentity();
    setAuthMethod(null);
    setStage("form");
  };

  const startGoogle = () => {
    saveDraft();
    navigate({ to: "/auth/google" });
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: 460,
    background: "rgba(255,255,255,0.94)",
    border: "1px solid #DCE4FF",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
  };

  if (stage === "check-email") {
    return (
      <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
        <div className="w-full" style={cardStyle}>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ background: "#EEF2FF", color: "#2D4FC4" }}
          >
            <MailCheck className="h-5 w-5" />
          </span>
          <h1 style={{ marginTop: 16, color: "#17191F", fontSize: 28, fontWeight: 600 }}>Check your email</h1>
          <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
            We sent a sign-in link to <strong style={{ color: "#17191F" }}>{email}</strong>.
          </p>
          <p style={{ marginTop: 6, color: "#6F7684", fontSize: 13, lineHeight: 1.6 }}>
            Open the link in the email to verify your address and continue.
          </p>

          <button
            type="button"
            onClick={simulateVerification}
            className="mt-6 w-full focus:outline-none focus:ring-2"
            style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
          >
            Simulate email verification
          </button>
          <button
            type="button"
            onClick={useDifferentEmail}
            className="mt-2.5 w-full hover:bg-[#F5F7FF] focus:outline-none focus:ring-2"
            style={{
              height: 46,
              background: "#FFFFFF",
              border: "1px solid #CBD5F2",
              borderRadius: 8,
              color: "#17191F",
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
      <form onSubmit={submitEmail} className="w-full" style={cardStyle}>
        <h1 style={{ color: "#17191F", fontSize: 32, fontWeight: 600, lineHeight: 1.15 }}>Sign up for free</h1>
        <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
          Create your account to start setting up DIGIT Complaint Management.
        </p>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <AuthField label="First name">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoComplete="given-name"
                className={authInputCls}
                style={authInputStyle}
              />
            </AuthField>
            <AuthField label="Last name">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                autoComplete="family-name"
                className={authInputCls}
                style={authInputStyle}
              />
            </AuthField>
          </div>

          <div>
            <AuthField label="ACCOUNT NAME">
              <input
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                placeholder="Account name"
                autoComplete="organization"
                className={authInputCls}
                style={{
                  ...authInputStyle,
                  ...(authenticated && orgMissing ? { borderColor: "#2D4FC4", boxShadow: "0 0 0 3px rgba(45,79,196,0.12)" } : {}),
                }}
              />
            </AuthField>
            <p style={{ marginTop: 6, color: "#8A90A2", fontSize: 12, lineHeight: 1.5 }}>
              {authenticated
                ? "Tell us which organisation you are setting up."
                : "Enter the name of your account, it could be a government organisation, agency, department, parastatal body, or institution you are setting up."}
            </p>
            {submitted && orgMissing && (
              <p style={{ marginTop: 4, color: "#B42318", fontSize: 12 }}>Organisation name is required to continue.</p>
            )}
          </div>

          <AuthField label="Email address">
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                autoComplete="email"
                readOnly={authMethod === "google"}
                className={authInputCls}
                style={{
                  ...authInputStyle,
                  ...(authMethod === "google" ? { background: "#F4F6FB", color: "#5E6675", paddingRight: 92 } : {}),
                }}
              />
              {authMethod === "google" && (
                <span
                  className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: "#ECFDF3", color: "#12703A", fontSize: 11, fontWeight: 600 }}
                >
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              )}
            </div>
          </AuthField>

          <label className="flex cursor-pointer items-start gap-2.5" style={{ color: "#4A5162", fontSize: 13, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ accentColor: "#2D4FC4" }}
            />
            <span>
              By continuing, you agree to the{" "}
              <Link to="/legal/terms" style={{ color: "#2D4FC4", fontWeight: 600 }} className="hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/legal/privacy" style={{ color: "#2D4FC4", fontWeight: 600 }} className="hover:underline">
                Privacy Notice
              </Link>
              .
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-2.5" style={{ color: "#4A5162", fontSize: 13, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ accentColor: "#2D4FC4" }}
            />
            <span>Send me product updates, release information and relevant service announcements.</span>
          </label>
        </div>

        {authenticated && (
          <div
            className="mt-5 flex items-start gap-2.5 rounded-md px-3 py-2.5"
            style={{ background: "#ECFDF3", border: "1px solid #BBF0CE" }}
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#12703A" }} />
            <div>
              <div style={{ color: "#12703A", fontSize: 13, fontWeight: 600 }}>Authentication successful</div>
              <div style={{ color: "#3F6B4F", fontSize: 12.5, lineHeight: 1.5 }}>
                {authMethod === "google"
                  ? "Your Google account has been verified. Add your organisation name to continue."
                  : "Your identity has been verified. Complete your organisation details to continue."}
              </div>
            </div>
          </div>
        )}

        {submitted && !authenticated && !identityReady && (
          <div style={{ marginTop: 14, color: "#B42318", fontSize: 13 }}>
            Please complete all required fields and accept the terms to continue.
          </div>
        )}

        <button
          type="submit"
          disabled={authenticated ? !canContinue : false}
          className="mt-6 w-full transition-colors focus:outline-none focus:ring-2"
          style={{
            height: 46,
            background: authenticated && !canContinue ? "#AFBBE4" : "#2D4FC4",
            color: "#FFFFFF",
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            cursor: authenticated && !canContinue ? "not-allowed" : "pointer",
          }}
        >
          {authenticated ? "Continue" : "Continue with email"}
        </button>

        <div style={{ marginTop: 14, textAlign: "center", color: "#6F7684", fontSize: 13 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2D4FC4", fontWeight: 600 }} className="hover:underline">
            Sign in
          </Link>
        </div>

        {!authenticated && (
          <>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1" style={{ background: "#DCE4FF" }} />
              <span style={{ color: "#8A90A2", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>OR</span>
              <span className="h-px flex-1" style={{ background: "#DCE4FF" }} />
            </div>

            <button
              type="button"
              onClick={startGoogle}
              className="flex w-full items-center justify-center gap-2.5 transition-colors hover:bg-[#F5F7FF] focus:outline-none focus:ring-2 focus:ring-[#355BE0]/30"
              style={{
                height: 46,
                background: "#FFFFFF",
                border: "1px solid #CBD5F2",
                borderRadius: 8,
                color: "#17191F",
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              <GoogleIcon />
              Sign up with Google
            </button>
          </>
        )}
      </form>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.63Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.17l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.97 10.73a5.4 5.4 0 0 1 0-3.46V4.94H.96a9 9 0 0 0 0 8.12l3.01-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.01 2.33C4.68 5.15 6.66 3.58 9 3.58Z" />
    </svg>
  );
}
