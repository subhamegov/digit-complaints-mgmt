import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useRbac } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { ShieldCheck, ExternalLink, Loader2 } from "lucide-react";
import { ACCOUNTS, type LanguageCode } from "@/lib/accounts";
import { AuthShell, AuthField, authInputCls, authInputStyle, authSelectStyle } from "@/components/auth/AuthShell";
import { PoweredByDigit } from "@/components/PoweredByDigit";
import {
  isNoAccountEmail,
  setSignupPrefillEmail,
  clearSignupPrefillEmail,
} from "@/lib/signup-prefill";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In - DIGIT Complaint Management" }] }),
  component: LoginPage,
});

type Phase = "lookup" | "loading" | "accounts" | "no-account";

function LoginPage() {
  const navigate = useNavigate();
  const { role } = useRbac();
  const [email, setEmail] = useState("manjit.singh@example.org");
  const [password, setPassword] = useState("");
  const [tenant, setTenant] = useState("acc.makueni.cg");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [phase, setPhase] = useState<Phase>("lookup");
  const accountRef = useRef<HTMLSelectElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const account = ACCOUNTS.find((a) => a.value === tenant)!;
  const mode = account.authMode;

  // Authentication state is scoped to the selected account.
  useEffect(() => {
    setPassword("");
  }, [tenant]);

  const workspaceRoute =
    role === "PLATFORM_ADMIN" ? "/platform" : role === "ACCOUNT_ADMIN" ? "/admin/home" : "/dashboard";

  const lookup = () => {
    setPhase("loading");
    window.setTimeout(() => {
      setPhase(isNoAccountEmail(email) ? "no-account" : "accounts");
    }, 900);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "lookup") {
      lookup();
      return;
    }
    if (phase === "accounts") navigate({ to: workspaceRoute });
  };

  const orgSignInHref = account.organisationSignInUrl
    ? `${account.organisationSignInUrl}?account=${encodeURIComponent(account.value)}&returnTo=${encodeURIComponent(workspaceRoute)}`
    : "#";

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());


  return (
    <AuthShell language={language} onLanguageChange={setLanguage}>
      <form
        onSubmit={submit}
        className="w-full"
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
          <div
            style={{ color: "#4E64B5", fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            Secure Sign In
          </div>
          <h2 style={{ marginTop: 8, color: "#17191F", fontSize: 34, fontWeight: 600, lineHeight: 1.15 }}>
            Access your account
          </h2>
        </div>

        <div className="space-y-4">
          <AuthField label="Administrator email">
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setPhase("lookup");
              }}
              className={authInputCls}
              style={authInputStyle}
            />
          </AuthField>

          {phase === "lookup" && (
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
            <div aria-live="polite" className="rounded-md px-4 py-4" style={{ background: "#F5F7FF", border: "1px solid #DCE4FF" }}>
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
                onClick={() => emailRef.current?.focus()}
                className="mt-2 w-full hover:underline"
                style={{ color: "#4A5162", fontSize: 13, background: "transparent" }}
              >
                Use a different email
              </button>
            </div>
          )}

          {phase === "accounts" && (
          <AuthField label={t("COMMON_TENANT")}>
            <select
              ref={accountRef}
              value={tenant}
              onChange={(e) => setTenant(e.target.value)}
              className={authInputCls}
              style={authSelectStyle}
            >
              {ACCOUNTS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </AuthField>
          )}

          {phase === "accounts" && mode === "organisation_sign_in" && (
            <div className="rounded-md px-3 py-3" style={{ background: "#EEF3FF", border: "1px solid #DCE4FF" }}>
              <div
                className="flex items-center gap-1.5"
                style={{ color: "#2D4FC4", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Organisation sign-in
              </div>
              <p style={{ marginTop: 6, color: "#4A5162", fontSize: 13, lineHeight: 1.5 }}>
                This organisation uses its own sign-in page.
              </p>
              <a
                href={orgSignInHref}
                className="mt-3 flex w-full items-center justify-center gap-1.5 transition-colors"
                style={{
                  height: 44,
                  background: "#2D4FC4",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 14,
                }}
              >
                Continue to organisation sign-in
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => accountRef.current?.focus()}
                className="mt-2 w-full hover:underline"
                style={{ color: "#4A5162", fontSize: 13, background: "transparent" }}
              >
                Choose another account
              </button>
            </div>
          )}

          {phase === "accounts" && (mode === "platform_password" || mode === "hybrid") && (
            <>
              {mode === "hybrid" && (
                <p style={{ color: "#5E6675", fontSize: 13 }}>Choose how you want to sign in.</p>
              )}
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
                <button type="button" className="hover:underline" style={{ color: "#2D4FC4", fontSize: 13, fontWeight: 500 }}>
                  Forgot password?
                </button>
              </div>
            </>
          )}
        </div>

        {phase === "accounts" && (mode === "platform_password" || mode === "hybrid") && (
          <button
            type="submit"
            className="mt-5 w-full transition-colors focus:outline-none focus:ring-2"
            style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#2443B0")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2D4FC4")}
          >
            {t("COMMON_SIGN_IN")}
          </button>
        )}

        {phase === "accounts" && (mode === "platform_sso" || mode === "hybrid") && (
          <button
            type="button"
            onClick={() => navigate({ to: workspaceRoute })}
            className="mt-3 flex w-full items-center justify-center gap-2 hover:bg-[#F5F7FF]"
            style={{
              height: 46,
              background: mode === "platform_sso" ? "#2D4FC4" : "#FFFFFF",
              color: mode === "platform_sso" ? "#FFFFFF" : "#17191F",
              border: mode === "platform_sso" ? "none" : "1px solid #CBD5F2",
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 14,
            }}
          >
            Continue with {account.provider ?? "SSO"}
          </button>
        )}

        <div style={{ marginTop: 16, color: "#6F7684", fontSize: 13, textAlign: "center" }}>
          New to the platform?{" "}
          <Link to="/signup" search={{}} style={{ color: "#2D4FC4", fontWeight: 600 }} className="hover:underline">
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
