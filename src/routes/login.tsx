import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useRbac } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { ShieldCheck, ExternalLink, Loader2, Github } from "lucide-react";
import { ACCOUNTS, type LanguageCode } from "@/lib/accounts";
import { AuthShell, AuthField, authInputCls, authInputStyle, authSelectStyle } from "@/components/auth/AuthShell";
import { PoweredByDigit } from "@/components/PoweredByDigit";
import { isNoAccountEmail, setSignupPrefillEmail, clearSignupPrefillEmail } from "@/lib/signup-prefill";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In - DIGIT Complaint Management" }] }),
  component: LoginPage,
});

type Phase = "start" | "loading" | "no-account" | "resolved";
type Identity = "email" | "google" | "github";

const reveal = "animate-in fade-in slide-in-from-top-1 duration-300";
const eyebrowStyle: React.CSSProperties = {
  color: "#4E64B5",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const ssoButtonStyle: React.CSSProperties = {
  height: 46,
  background: "#FFFFFF",
  color: "#17191F",
  border: "1px solid #CBD5F2",
  borderRadius: 8,
  fontWeight: 500,
  fontSize: 14,
};

function GoogleIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.7 30.2.5 24 .5 14.6.5 6.5 5.9 2.6 13.8l7.8 6.1C12.3 14 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.7z" />
      <path fill="#FBBC05" d="M10.4 28.1c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.8-6.1C.9 16.1 0 19.9 0 23.5s.9 7.4 2.6 10.7l7.8-6.1z" />
      <path fill="#34A853" d="M24 46.5c6.2 0 11.5-2 15.4-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.8 2.3-6.3 0-11.7-4.5-13.6-10.5l-7.8 6.1C6.5 41.1 14.6 46.5 24 46.5z" />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { role } = useRbac();
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("start");
  const [identity, setIdentity] = useState<Identity>("email");
  const [tenant, setTenant] = useState<string>("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const emailRef = useRef<HTMLInputElement>(null);

  const account = ACCOUNTS.find((a) => a.value === tenant) ?? null;
  const isOrgSignIn = account?.authMode === "organisation_sign_in";
  const emailValid = /\S+@\S+\.\S+/.test(email.trim());

  const workspaceRoute =
    role === "PLATFORM_ADMIN" ? "/platform" : role === "ACCOUNT_ADMIN" ? "/admin/home" : "/dashboard";

  const resetAuthState = () => {
    setTenant("");
    setPassword("");
  };

  const resolveAccounts = (source: Identity) => {
    setIdentity(source);
    setPhase("loading");
    window.setTimeout(() => {
      if (source === "email" && isNoAccountEmail(email)) {
        setPhase("no-account");
        return;
      }
      resetAuthState();
      if (ACCOUNTS.length === 1) setTenant(ACCOUNTS[0]!.value);
      setPhase("resolved");
    }, 600);
  };

  const startOver = () => {
    resetAuthState();
    setIdentity("email");
    setPhase("start");
    window.setTimeout(() => emailRef.current?.focus(), 0);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "start" && emailValid) resolveAccounts("email");
  };

  const orgSignInHref = account?.organisationSignInUrl
    ? `${account.organisationSignInUrl}?account=${encodeURIComponent(account.value)}&returnTo=${encodeURIComponent(workspaceRoute)}`
    : "#";

  const showPassword = identity === "email" && !!account && !isOrgSignIn;
  const showSsoContinue = identity !== "email" && !!account && !isOrgSignIn;

  return (
    <AuthShell language={language} onLanguageChange={setLanguage}>
      <form
        onSubmit={submit}
        className="w-full transition-all duration-300"
        style={{
          maxWidth: 400,
          background: "rgba(255,255,255,0.88)",
          border: "1px solid #DCE4FF",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...eyebrowStyle, fontSize: 12, letterSpacing: "0.14em" }}>Secure Sign In</div>
          <h2 style={{ marginTop: 8, color: "#17191F", fontSize: 34, fontWeight: 600, lineHeight: 1.15 }}>
            Access your account
          </h2>
        </div>

        <div className="space-y-4">
          {phase === "start" && (
            <>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => resolveAccounts("google")}
                  className="flex w-full items-center justify-center gap-2 hover:bg-[#F5F7FF]"
                  style={ssoButtonStyle}
                >
                  <GoogleIcon />
                  Sign in with Google
                </button>
                <button
                  type="button"
                  onClick={() => resolveAccounts("github")}
                  className="flex w-full items-center justify-center gap-2 hover:bg-[#F5F7FF]"
                  style={ssoButtonStyle}
                >
                  <Github className="h-[18px] w-[18px]" />
                  Sign in with GitHub
                </button>
              </div>

              <div className="flex items-center gap-3" style={{ paddingTop: 2, paddingBottom: 2 }}>
                <span style={{ flex: 1, height: 1, background: "#E7ECFB" }} />
                <span style={{ color: "#8A93A5", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em" }}>OR</span>
                <span style={{ flex: 1, height: 1, background: "#E7ECFB" }} />
              </div>
            </>
          )}

          {phase === "start" || phase === "loading" ? (
            <AuthField label="Administrator email">
              <input
                ref={emailRef}
                type="email"
                value={email}
                placeholder="name@organisation.org"
                onChange={(e) => setEmail(e.target.value)}
                className={authInputCls}
                style={authInputStyle}
              />
            </AuthField>
          ) : identity === "email" ? (
            <div>
              <div style={eyebrowStyle}>Administrator email</div>
              <div
                className="mt-1.5 flex items-center justify-between gap-3 rounded-md px-3"
                style={{ height: 46, background: "#F5F7FF", border: "1px solid #E2E8FA" }}
              >
                <span style={{ color: "#17191F", fontSize: 14, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {email.trim()}
                </span>
                <button
                  type="button"
                  onClick={startOver}
                  className="hover:underline"
                  style={{ color: "#2D4FC4", fontSize: 13, fontWeight: 500, background: "transparent" }}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={eyebrowStyle}>Signed in with {identity === "google" ? "Google" : "GitHub"}</div>
              <div
                className="mt-1.5 flex items-center justify-between gap-3 rounded-md px-3"
                style={{ height: 46, background: "#F5F7FF", border: "1px solid #E2E8FA" }}
              >
                <span className="flex items-center gap-2" style={{ color: "#17191F", fontSize: 14 }}>
                  {identity === "google" ? <GoogleIcon /> : <Github className="h-4 w-4" />}
                  Identity verified
                </span>
                <button
                  type="button"
                  onClick={startOver}
                  className="hover:underline"
                  style={{ color: "#2D4FC4", fontSize: 13, fontWeight: 500, background: "transparent" }}
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {phase === "start" && (
            <button
              type="submit"
              disabled={!emailValid}
              className="w-full transition-colors"
              style={{
                height: 46,
                background: emailValid ? "#2D4FC4" : "#AFBBE4",
                color: "#FFFFFF",
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
                cursor: emailValid ? "pointer" : "not-allowed",
              }}
            >
              Continue
            </button>
          )}

          {phase === "loading" && (
            <div
              className="flex items-center justify-center gap-2 py-3"
              aria-live="polite"
              style={{ color: "#4A5162", fontSize: 13 }}
            >
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#2D4FC4" }} />
              Finding your accounts...
            </div>
          )}

          {phase === "no-account" && (
            <div
              aria-live="polite"
              className={`rounded-md px-4 py-4 ${reveal}`}
              style={{ background: "#F5F7FF", border: "1px solid #DCE4FF" }}
            >
              <h3 style={{ color: "#17191F", fontSize: 17, fontWeight: 600 }}>No account found</h3>
              <p style={{ marginTop: 6, color: "#4A5162", fontSize: 13, lineHeight: 1.5 }}>
                We could not find an account associated with {email.trim()}.
              </p>
              <p style={{ marginTop: 8, color: "#4A5162", fontSize: 13, lineHeight: 1.5 }}>
                Create an account to get started. We will use this email address for your new account.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSignupPrefillEmail(email.trim());
                  navigate({ to: "/signup", search: {} });
                }}
                className="mt-3 w-full transition-colors"
                style={{ height: 44, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
              >
                Create an account
              </button>
              <button
                type="button"
                onClick={startOver}
                className="mt-2 w-full hover:underline"
                style={{ color: "#4A5162", fontSize: 13, background: "transparent" }}
              >
                Use a different email
              </button>
            </div>
          )}

          {phase === "resolved" && (
            <div className={reveal}>
              <AuthField label={t("COMMON_TENANT")}>
                <select
                  value={tenant}
                  onChange={(e) => {
                    setTenant(e.target.value);
                    setPassword("");
                  }}
                  className={authInputCls}
                  style={authSelectStyle}
                >
                  <option value="">Select an account</option>
                  {ACCOUNTS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </AuthField>
              <p style={{ marginTop: 6, color: "#6F7684", fontSize: 12 }}>Choose the account you want to access.</p>
            </div>
          )}

          {phase === "resolved" && account && isOrgSignIn && (
            <div
              className={`rounded-md px-3 py-3 ${reveal}`}
              style={{ background: "#EEF3FF", border: "1px solid #DCE4FF" }}
            >
              <div className="flex items-center gap-1.5" style={{ ...eyebrowStyle, color: "#2D4FC4", fontSize: 12 }}>
                <ShieldCheck className="h-3.5 w-3.5" />
                Organisation sign-in
              </div>
              <p style={{ marginTop: 6, color: "#4A5162", fontSize: 13, lineHeight: 1.5 }}>
                This organisation uses its own sign-in page.
              </p>
              <a
                href={orgSignInHref}
                className="mt-3 flex w-full items-center justify-center gap-1.5 transition-colors"
                style={{ height: 44, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
              >
                Continue to organisation sign-in
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}

          {phase === "resolved" && showPassword && (
            <div className={`space-y-3 ${reveal}`} style={{ borderTop: "1px solid #E7ECFB", paddingTop: 16 }}>
              <AuthField label="Password">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={authInputCls}
                  style={authInputStyle}
                  placeholder="Enter your password"
                />
              </AuthField>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="hover:underline"
                  style={{ color: "#2D4FC4", fontSize: 13, fontWeight: 500 }}
                >
                  Forgot password?
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: workspaceRoute })}
                className="w-full transition-colors"
                style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
              >
                {t("COMMON_SIGN_IN")}
              </button>
            </div>
          )}

          {phase === "resolved" && showSsoContinue && (
            <button
              type="button"
              onClick={() => navigate({ to: workspaceRoute })}
              className={`w-full transition-colors ${reveal}`}
              style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
            >
              Continue to account
            </button>
          )}
        </div>

        <div style={{ marginTop: 16, color: "#6F7684", fontSize: 13, textAlign: "center" }}>
          New to the platform?{" "}
          <Link
            to="/signup"
            search={{}}
            onClick={() => clearSignupPrefillEmail()}
            style={{ color: "#2D4FC4", fontWeight: 600 }}
            className="hover:underline"
          >
            Create an account
          </Link>
        </div>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #E7ECFB" }}>
          <PoweredByDigit />
        </div>
      </form>
    </AuthShell>
  );
}
