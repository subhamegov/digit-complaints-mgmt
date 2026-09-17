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

type Phase = "email" | "loading" | "no-account" | "resolved";

const reveal = "animate-in fade-in slide-in-from-top-1 duration-300";
const eyebrowStyle: React.CSSProperties = {
  color: "#4E64B5",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

function LoginPage() {
  const navigate = useNavigate();
  const { role } = useRbac();
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("email");
  const [tenant, setTenant] = useState<string>("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>("en");
  const emailRef = useRef<HTMLInputElement>(null);

  const account = ACCOUNTS.find((a) => a.value === tenant) ?? null;
  const methods = account?.methods ?? [];
  const isOrgSignIn = account?.authMode === "organisation_sign_in";
  const emailValid = /\S+@\S+\.\S+/.test(email.trim());

  const workspaceRoute =
    role === "PLATFORM_ADMIN" ? "/platform" : role === "ACCOUNT_ADMIN" ? "/admin/home" : "/dashboard";

  const resetAuthState = () => {
    setTenant("");
    setPassword("");
    setUsePassword(false);
  };

  const continueWithEmail = () => {
    if (!emailValid) return;
    setPhase("loading");
    window.setTimeout(() => {
      if (isNoAccountEmail(email)) {
        setPhase("no-account");
        return;
      }
      resetAuthState();
      if (ACCOUNTS.length === 1) setTenant(ACCOUNTS[0]!.value);
      setPhase("resolved");
    }, 600);
  };

  const changeEmail = () => {
    resetAuthState();
    setPhase("email");
    window.setTimeout(() => emailRef.current?.focus(), 0);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "email") {
      continueWithEmail();
      return;
    }
    if (phase === "resolved" && usePassword) navigate({ to: workspaceRoute });
  };

  const orgSignInHref =
    account?.organisationSignInUrl
      ? `${account.organisationSignInUrl}?account=${encodeURIComponent(account.value)}&returnTo=${encodeURIComponent(workspaceRoute)}`
      : "#";

  const showMethodHeading = !isOrgSignIn && methods.length > 1;
  const showPasswordFields = methods.includes("password") && (methods.length === 1 || usePassword);
  const showUsePasswordAction = methods.includes("password") && methods.length > 1 && !usePassword;

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
          {phase === "email" || phase === "loading" ? (
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
          ) : (
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
                  onClick={changeEmail}
                  className="hover:underline"
                  style={{ color: "#2D4FC4", fontSize: 13, fontWeight: 500, background: "transparent" }}
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {phase === "email" && (
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
                onClick={changeEmail}
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
                    setUsePassword(false);
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

          {phase === "resolved" && account && !isOrgSignIn && (
            <div className={`space-y-3 ${reveal}`} style={{ borderTop: "1px solid #E7ECFB", paddingTop: 16 }}>
              <div style={eyebrowStyle}>Sign in method</div>
              {showMethodHeading && (
                <p style={{ color: "#5E6675", fontSize: 13 }}>Choose how you want to sign in</p>
              )}

              {methods.includes("google") && (
                <button
                  type="button"
                  onClick={() => navigate({ to: workspaceRoute })}
                  className="flex w-full items-center justify-center gap-2 hover:bg-[#F5F7FF]"
                  style={{
                    height: 46,
                    background: "#FFFFFF",
                    color: "#17191F",
                    border: "1px solid #CBD5F2",
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  Continue with Google
                </button>
              )}

              {methods.includes("github") && (
                <button
                  type="button"
                  onClick={() => navigate({ to: workspaceRoute })}
                  className="flex w-full items-center justify-center gap-2 hover:bg-[#F5F7FF]"
                  style={{
                    height: 46,
                    background: "#FFFFFF",
                    color: "#17191F",
                    border: "1px solid #CBD5F2",
                    borderRadius: 8,
                    fontWeight: 500,
                    fontSize: 14,
                  }}
                >
                  <Github className="h-4 w-4" />
                  Continue with GitHub
                </button>
              )}

              {showUsePasswordAction && (
                <button
                  type="button"
                  onClick={() => setUsePassword(true)}
                  className="w-full hover:underline"
                  style={{ color: "#2D4FC4", fontSize: 13, fontWeight: 500, background: "transparent" }}
                >
                  Use password
                </button>
              )}

              {showPasswordFields && (
                <div className={`space-y-3 ${reveal}`}>
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
            </div>
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
