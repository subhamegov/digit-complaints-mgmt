import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { AuthShell, AuthField, authInputCls, authInputStyle } from "@/components/auth/AuthShell";
import type { LanguageCode } from "@/lib/accounts";

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

const RULES = [
  { id: "len", label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { id: "case", label: "Upper and lower case letters", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { id: "num", label: "At least one number", test: (v: string) => /\d/.test(v) },
];

function SignupPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passwordValid = password.length > 0 && RULES.every((r) => r.test(password));
  const formValid =
    firstName.trim() !== "" && lastName.trim() !== "" && /\S+@\S+\.\S+/.test(email) && passwordValid && terms;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!formValid) return;
    navigate({ to: "/login" });
  };

  return (
    <AuthShell
      headline="Start managing complaints in minutes."
      narrative="Create an account to configure complaint types, route work to the right teams, and track service timelines from intake to closure."
      language={language}
      onLanguageChange={setLanguage}
      cardMaxWidth={460}
    >
      <form
        onSubmit={submit}
        className="w-full"
        style={{
          maxWidth: 460,
          background: "rgba(255,255,255,0.94)",
          border: "1px solid #DCE4FF",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
        }}
      >
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

          <AuthField label="Email address">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className={authInputCls}
              style={authInputStyle}
            />
          </AuthField>

          <AuthField label="Password">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="new-password"
                className={authInputCls}
                style={{ ...authInputStyle, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#355BE0]/30"
                style={{ color: "#5E6675" }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </AuthField>

          {password.length > 0 && (
            <div
              className="rounded-md px-3 py-2.5"
              style={{
                background: passwordValid ? "#ECFDF3" : "#FFF6ED",
                border: `1px solid ${passwordValid ? "#BBF0CE" : "#FBD9B5"}`,
              }}
            >
              <div
                className="flex items-center gap-1.5"
                style={{ color: passwordValid ? "#12703A" : "#9A5B12", fontSize: 13, fontWeight: 600 }}
              >
                {passwordValid ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {passwordValid ? "Password meets requirements" : "Password does not meet requirements"}
              </div>
              {!passwordValid && (
                <ul className="mt-1.5 space-y-1" style={{ color: "#6F7684", fontSize: 12 }}>
                  {RULES.map((r) => (
                    <li key={r.id} className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{ background: r.test(password) ? "#16A34A" : "#C7CCD8" }}
                      />
                      {r.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

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

        {submitted && !formValid && (
          <div style={{ marginTop: 14, color: "#B42318", fontSize: 13 }}>
            Please complete all required fields and accept the terms to continue.
          </div>
        )}

        <button
          type="submit"
          disabled={!terms}
          className="mt-6 w-full transition-colors focus:outline-none focus:ring-2"
          style={{
            height: 46,
            background: terms ? "#2D4FC4" : "#AFBBE4",
            color: "#FFFFFF",
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 14,
            cursor: terms ? "pointer" : "not-allowed",
          }}
        >
          Continue
        </button>

        <div style={{ marginTop: 14, textAlign: "center", color: "#6F7684", fontSize: 13 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2D4FC4", fontWeight: 600 }} className="hover:underline">
            Sign in
          </Link>
        </div>

        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1" style={{ background: "#DCE4FF" }} />
          <span style={{ color: "#8A90A2", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>OR</span>
          <span className="h-px flex-1" style={{ background: "#DCE4FF" }} />
        </div>

        <button
          type="button"
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
