import { createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, Clock3, Copy, ExternalLink, Github, MailCheck, ShieldAlert } from "lucide-react";
import { AuthShell, AuthField, authInputCls, authInputStyle } from "@/components/auth/AuthShell";
import type { LanguageCode } from "@/lib/accounts";
import { clearPrototypeIdentity, getPrototypeIdentity, setPrototypeIdentity } from "@/lib/prototype-identity";
import { PROVISIONING_KEY } from "@/routes/signup.provisioning";
import { submitAccountRequest } from "@/lib/account-requests";
import { ACCOUNT_STATE_COPY, nonActiveAccountStatus, type NonActiveAccountStatus } from "@/lib/existing-accounts";

import {
  BASE_DOMAIN,
  COUNTRIES,
  FINANCIAL_YEARS,
  SETUP_LANGUAGES,
  TIMEZONES,
  isCodeTaken,
  isCodeValid,
  isOrgNameValid,
  isSlugTaken,
  isSlugValid,
  normaliseCode,
  normaliseSlug,
  orgAcronym,
  slugify,
  suggestCode,
  suggestSlug,
  urlsFor,
} from "@/lib/org-setup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Set Up Your Organisation — DIGIT Complaint Management" },
      {
        name: "description",
        content: "Create your organisation account, set your preferences, and get your employee and citizen access URLs.",
      },
      { property: "og:title", content: "Set Up Your Organisation — DIGIT Complaint Management" },
      { property: "og:description", content: "Create your DIGIT Complaint Management organisation account in three simple steps." },
    ],
  }),
  component: SignupPage,
});

const DRAFT_KEY = "digit.prototype.signup.draft";

type Availability = "idle" | "checking" | "available" | "unavailable";

const cardStyle: React.CSSProperties = {
  maxWidth: 460,
  background: "rgba(255,255,255,0.94)",
  border: "1px solid #DCE4FF",
  borderRadius: 16,
  padding: 32,
  boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
};

const helperStyle: React.CSSProperties = { marginTop: 6, color: "#8A90A2", fontSize: 12, lineHeight: 1.5 };
const errorStyle: React.CSSProperties = { marginTop: 6, color: "#B42318", fontSize: 12, lineHeight: 1.5 };
const okStyle: React.CSSProperties = { marginTop: 6, color: "#12703A", fontSize: 12, lineHeight: 1.5 };

function Stepper({ step }: { step: number }) {
  const labels = ["Account", "Preferences", "Access URLs"];
  return (
    <div className="mb-5 flex items-center gap-2">
      {labels.map((label, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <div key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              style={{
                height: 3,
                borderRadius: 999,
                background: done || active ? "#2D4FC4" : "#DCE4FF",
                display: "block",
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: active ? "#2D4FC4" : "#8A90A2" }}>
              {label.toUpperCase()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full transition-colors focus:outline-none focus:ring-2"
      style={{
        height: 46,
        background: disabled ? "#AFBBE4" : "#2D4FC4",
        color: "#FFFFFF",
        borderRadius: 8,
        fontWeight: 500,
        fontSize: 14,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

const selectStyle: React.CSSProperties = { ...authInputStyle, appearance: "auto", padding: "0 10px" };

function SignupPage() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (state) => state.location.search });
  const approvalFlow = new URLSearchParams(search).get("flow") === "approval";
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [step, setStep] = useState(0);

  // Step 1 — identity + organisation
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [organisationCode, setOrganisationCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [codeStatus, setCodeStatus] = useState<Availability>("idle");
  const [codeSuggestion, setCodeSuggestion] = useState<string | null>(null);
  const [terms, setTerms] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stage, setStage] = useState<"form" | "check-email">("form");
  const [authMethod, setAuthMethod] = useState<"google" | "email" | null>(null);
  const [accountState, setAccountState] = useState<NonActiveAccountStatus | null>(null);

  // Step 2 — preferences
  const [baseCountry, setBaseCountry] = useState("");
  const [languages, setLanguages] = useState<string[]>(["en"]);
  const [timezone, setTimezone] = useState("");
  const [financialYearStart, setFinancialYearStart] = useState("JAN");
  const [orgSlug, setOrgSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugStatus, setSlugStatus] = useState<Availability>("idle");
  const [slugSuggestion, setSlugSuggestion] = useState<string | null>(null);
  const [codeUpdatedNotice, setCodeUpdatedNotice] = useState<string | null>(null);

  const hydrated = useRef(false);

  // Restore prototype identity + wizard draft (e.g. returning from the Google step).
  useEffect(() => {
    const identity = getPrototypeIdentity();
    if (identity) {
      setFirstName(identity.firstName);
      setLastName(identity.lastName);
      setEmail(identity.email);
      setAuthMethod(identity.method);
      const existing = nonActiveAccountStatus(identity.email);
      if (existing) setAccountState(existing);
    }
    const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(DRAFT_KEY) : null;
    if (raw) {
      try {
        const d = JSON.parse(raw) as Record<string, unknown>;
        if (typeof d.organisationName === "string") setOrganisationName(d.organisationName);
        if (typeof d.organisationCode === "string") setOrganisationCode(d.organisationCode);
        if (typeof d.baseCountry === "string") setBaseCountry(d.baseCountry);
        if (Array.isArray(d.supportedLanguages)) setLanguages(d.supportedLanguages as string[]);
        if (typeof d.timezone === "string") setTimezone(d.timezone);
        if (typeof d.financialYearStart === "string") setFinancialYearStart(d.financialYearStart);
        if (typeof d.orgSlug === "string") setOrgSlug(d.orgSlug);
        if (d.terms) setTerms(true);
      } catch {
        /* ignore */
      }
    }
    hydrated.current = true;
  }, []);

  const saveDraft = () => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        organisationName,
        organisationCode,
        baseCountry,
        supportedLanguages: languages,
        timezone,
        financialYearStart,
        orgSlug,
        terms,
      }),
    );
  };

  // Auto-generate the organisation code from name (+ country prefix once known).
  useEffect(() => {
    if (!hydrated.current) return;
    if (codeTouched) return;
    const acronym = orgAcronym(organisationName);
    if (!acronym) {
      setOrganisationCode("");
      return;
    }
    setOrganisationCode(baseCountry ? `${baseCountry}-${acronym}` : acronym);
  }, [organisationName, baseCountry, codeTouched]);

  // When the country arrives after a manual edit, upgrade the code visibly.
  useEffect(() => {
    if (!hydrated.current || !baseCountry || !codeTouched) return;
    const code = organisationCode;
    if (!code || /^[A-Z]{2}-/.test(code)) return;
    const next = normaliseCode(`${baseCountry}-${code}`);
    setOrganisationCode(next);
    setCodeUpdatedNotice(`Organisation code updated to ${next} for ${baseCountry}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCountry]);

  // Simulated uniqueness check for the organisation code.
  useEffect(() => {
    if (!organisationCode) {
      setCodeStatus("idle");
      setCodeSuggestion(null);
      return;
    }
    if (!isCodeValid(organisationCode, Boolean(baseCountry))) {
      setCodeStatus("idle");
      setCodeSuggestion(null);
      return;
    }
    setCodeStatus("checking");
    const t = window.setTimeout(() => {
      if (isCodeTaken(organisationCode)) {
        setCodeStatus("unavailable");
        setCodeSuggestion(suggestCode(organisationCode));
      } else {
        setCodeStatus("available");
        setCodeSuggestion(null);
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [organisationCode, baseCountry]);

  // Suggest the organisation URL from the organisation name.
  useEffect(() => {
    if (!hydrated.current || slugTouched) return;
    setOrgSlug(slugify(organisationName));
  }, [organisationName, slugTouched]);

  useEffect(() => {
    if (!orgSlug || !isSlugValid(orgSlug)) {
      setSlugStatus("idle");
      setSlugSuggestion(null);
      return;
    }
    setSlugStatus("checking");
    const t = window.setTimeout(() => {
      if (isSlugTaken(orgSlug)) {
        setSlugStatus("unavailable");
        setSlugSuggestion(suggestSlug(orgSlug));
      } else {
        setSlugStatus("available");
        setSlugSuggestion(null);
      }
    }, 450);
    return () => window.clearTimeout(t);
  }, [orgSlug]);

  const onCountryChange = (code: string) => {
    setBaseCountry(code);
    const country = COUNTRIES.find((c) => c.code === code);
    if (country) {
      setTimezone(country.timezone);
      setLanguages((prev) => Array.from(new Set([...prev, ...country.languages])));
    }
  };

  const authenticated = authMethod !== null;
  const emailValid = /\S+@\S+\.\S+/.test(email);
  const nameValid = isOrgNameValid(organisationName);
  const codeValid = isCodeValid(organisationCode, Boolean(baseCountry));
  const step1Valid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    emailValid &&
    nameValid &&
    codeValid &&
    codeStatus === "available" &&
    terms &&
    authenticated;
  const step2Valid =
    Boolean(baseCountry) && languages.length > 0 && Boolean(timezone) && Boolean(financialYearStart) && isSlugValid(orgSlug) && slugStatus === "available";

  const urls = useMemo(() => urlsFor(orgSlug || "your-organisation"), [orgSlug]);

  const submitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const existing = emailValid ? nonActiveAccountStatus(email) : null;
    if (existing) {
      setAccountState(existing);
      return;
    }
    if (authenticated) {
      if (!step1Valid) return;
      saveDraft();
      setStep(1);
      setSubmitted(false);
      return;
    }
    if (firstName.trim() === "" || lastName.trim() === "" || !emailValid || !terms) return;
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
    setAccountState(null);
    setEmail("");
    setSubmitted(false);
    setStage("form");
  };

  const startGoogle = () => {
    saveDraft();
    navigate({ to: "/auth/google" });
  };

  const startGithub = () => {
    saveDraft();
    navigate({ to: "/auth/github" });
  };

  if (accountState) {
    const copy = ACCOUNT_STATE_COPY[accountState];
    const accent = copy.tone === "caution" ? "#8A5A00" : "#2D4FC4";
    const accentBg = copy.tone === "caution" ? "#FDF6E7" : "#EEF2FF";
    const accentBorder = copy.tone === "caution" ? "#F0DFB8" : "#DCE4FF";
    return (
      <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
        <div className="w-full" style={cardStyle}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: accentBg, color: accent }}>
            {copy.tone === "caution" ? <ShieldAlert className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}
          </span>
          <h1 style={{ marginTop: 16, color: "#17191F", fontSize: 24, fontWeight: 600, lineHeight: 1.25 }}>{copy.heading}</h1>
          <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>{copy.body}</p>
          <p style={{ marginTop: 6, color: "#6F7684", fontSize: 13, lineHeight: 1.6 }}>
            Email: <strong style={{ color: "#17191F" }}>{email}</strong>
          </p>

          {copy.status && (
            <div
              className="mt-5 flex items-center justify-between gap-3 rounded-md px-3 py-2.5"
              style={{ background: accentBg, border: `1px solid ${accentBorder}` }}
            >
              <div>
                <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>{copy.status.label}</div>
                <div style={{ color: "#6F7684", fontSize: 12.5 }}>{copy.status.note}</div>
              </div>
              <span className="shrink-0 rounded-full px-2.5 py-1" style={{ background: "#E7EDFF", color: "#2D4FC4", fontSize: 12, fontWeight: 600 }}>
                {copy.status.value}
              </span>
            </div>
          )}

          <div className="mt-6">
            {copy.primary.to ? (
              <Link
                to={copy.primary.to}
                className="flex w-full items-center justify-center"
                style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
              >
                {copy.primary.label}
              </Link>
            ) : (
              <a
                href="mailto:support@digit.org"
                className="flex w-full items-center justify-center"
                style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
              >
                {copy.primary.label}
              </a>
            )}
          </div>

          {copy.secondary.to ? (
            <Link
              to={copy.secondary.to}
              className="mt-2.5 flex w-full items-center justify-center hover:bg-[#F5F7FF]"
              style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontWeight: 500, fontSize: 14 }}
            >
              {copy.secondary.label}
            </Link>
          ) : (
            <button
              type="button"
              onClick={useDifferentEmail}
              className="mt-2.5 w-full hover:bg-[#F5F7FF] focus:outline-none focus:ring-2"
              style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontWeight: 500, fontSize: 14 }}
            >
              {copy.secondary.label}
            </button>
          )}
        </div>
      </AuthShell>
    );
  }

  if (stage === "check-email") {
    return (
      <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
        <div className="w-full" style={cardStyle}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "#EEF2FF", color: "#2D4FC4" }}>
            <MailCheck className="h-5 w-5" />
          </span>
          <h1 style={{ marginTop: 16, color: "#17191F", fontSize: 28, fontWeight: 600 }}>Check your email</h1>
          <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
            We sent a sign-in link to <strong style={{ color: "#17191F" }}>{email}</strong>.
          </p>
          <p style={{ marginTop: 6, color: "#6F7684", fontSize: 13, lineHeight: 1.6 }}>
            Open the link in the email to verify your address and continue.
          </p>
          <div className="mt-6">
            <PrimaryButton onClick={simulateVerification}>Simulate email verification</PrimaryButton>
          </div>
          <button
            type="button"
            onClick={useDifferentEmail}
            className="mt-2.5 w-full hover:bg-[#F5F7FF] focus:outline-none focus:ring-2"
            style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontWeight: 500, fontSize: 14 }}
          >
            Use a different email
          </button>
        </div>
      </AuthShell>
    );
  }


  return (
    <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
      <div className="w-full" style={cardStyle}>
        <Stepper step={step} />
        {step === 0 && (
          <StepAccount
            {...{
              firstName,
              setFirstName,
              lastName,
              setLastName,
              email,
              setEmail,
              organisationName,
              setOrganisationName,
              organisationCode,
              setOrganisationCode,
              setCodeTouched,
              codeStatus,
              codeSuggestion,
              codeValid,
              nameValid,
              terms,
              setTerms,
              submitted,
              authMethod,
              authenticated,
              step1Valid,
              submitStep1,
               startGoogle,
               startGithub,
            }}
          />
        )}
        {step === 1 && (
          <StepPreferences
            {...{
              baseCountry,
              onCountryChange,
              languages,
              setLanguages,
              timezone,
              setTimezone,
              financialYearStart,
              setFinancialYearStart,
              orgSlug,
              setOrgSlug,
              setSlugTouched,
              slugStatus,
              slugSuggestion,
              codeUpdatedNotice,
              organisationCode,
              step2Valid,
              onBack: () => setStep(0),
              onContinue: () => {
                saveDraft();
                setStep(2);
              },
            }}
          />
        )}
        {step === 2 && (
          <StepUrls
            urls={urls}
            summary={{
              organisationName,
              organisationCode,
              baseCountry,
              languages,
              timezone,
              financialYearStart,
            }}
            onBack={() => setStep(1)}
            onFinish={() => {
              if (approvalFlow) {
                submitAccountRequest({
                  organisationName,
                  organisationCode,
                  country: COUNTRIES.find((c) => c.code === baseCountry)?.label ?? baseCountry,
                  requesterName: `${firstName} ${lastName}`.trim(),
                  requesterEmail: email,
                  languages: languages.map((code) => SETUP_LANGUAGES.find((item) => item.code === code)?.label ?? code).join(", "),
                  timezone,
                  financialYear: FINANCIAL_YEARS.find((item) => item.value === financialYearStart)?.label ?? financialYearStart,
                  employeeUrl: urls.employeeUrl,
                  citizenUrl: urls.citizenUrl,
                });
                navigate({ to: "/signup/pending-approval", search: {} });
                return;
              }

              if (typeof window !== "undefined") {
                window.sessionStorage.removeItem(DRAFT_KEY);
                window.sessionStorage.setItem(
                  PROVISIONING_KEY,
                  JSON.stringify({
                    email,
                    organisationName,
                    organisationCode,
                    baseCountry: COUNTRIES.find((c) => c.code === baseCountry)?.label ?? baseCountry,
                    employeeUrl: undefined,
                    citizenUrl: undefined,
                  }),
                );
              }
              navigate({ to: "/signup/provisioning", search: {} });
            }}
          />
        )}

      </div>
    </AuthShell>
  );
}

/* ---------------------------------- Step 1 --------------------------------- */

function StepAccount(p: any) {
  return (
    <form onSubmit={p.submitStep1}>
      <h1 style={{ color: "#17191F", fontSize: 28, fontWeight: 600, lineHeight: 1.15 }}>
        {p.authenticated ? "Set up your account" : "Verify your email to begin"}
      </h1>
      <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
        {p.authenticated
          ? "Create the account details that will identify your account in DIGIT Complaint Management."
          : "Confirm who you are first. Once your email is verified, you can name your account and continue the setup."}
      </p>


      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <AuthField label="First name">
            <input
              value={p.firstName}
              onChange={(e: any) => p.setFirstName(e.target.value)}
              placeholder="First name"
              autoComplete="given-name"
              className={authInputCls}
              style={authInputStyle}
            />
          </AuthField>
          <AuthField label="Last name">
            <input
              value={p.lastName}
              onChange={(e: any) => p.setLastName(e.target.value)}
              placeholder="Last name"
              autoComplete="family-name"
              className={authInputCls}
              style={authInputStyle}
            />
          </AuthField>
        </div>

        <AuthField label="Email address">
          <div className="relative">
            <input
              type="email"
              value={p.email}
              onChange={(e: any) => p.setEmail(e.target.value)}
              placeholder="Email address"
              autoComplete="email"
              readOnly={p.authMethod === "google"}
              className={authInputCls}
              style={{ ...authInputStyle, ...(p.authMethod === "google" ? { background: "#F4F6FB", color: "#5E6675", paddingRight: 92 } : {}) }}
            />
            {p.authMethod === "google" && (
              <span
                className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full px-2 py-0.5"
                style={{ background: "#ECFDF3", color: "#12703A", fontSize: 11, fontWeight: 600 }}
              >
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            )}
          </div>
        </AuthField>

        {p.authenticated && (
          <>
          <AuthField label="Account name">
            <input
              value={p.organisationName}
              onChange={(e: any) => p.setOrganisationName(e.target.value)}
              placeholder="Makueni County Government"
              autoComplete="organization"
              className={authInputCls}
              style={authInputStyle}
            />
          </AuthField>
          <p style={helperStyle}>
            Enter the government organisation, agency, department, parastatal body, institution, or programme you are setting up.
          </p>
          {p.submitted && !p.nameValid && <p style={errorStyle}>Enter an organisation name between 3 and 120 characters.</p>}
        </div>

        <div>
          <AuthField label="Organisation code">
            <input
              value={p.organisationCode}
              onChange={(e: any) => {
                p.setCodeTouched(true);
                p.setOrganisationCode(normaliseCode(e.target.value));
              }}
              placeholder="KE-MCG"
              className={authInputCls}
              style={authInputStyle}
            />
          </AuthField>
          <p style={helperStyle}>Used as a short identifier for your organisation across configuration, URLs, and system references.</p>
          {p.organisationCode && !p.codeValid && <p style={errorStyle}>Use 2–12 letters or numbers, for example MCG or KE-MCG.</p>}
          {p.codeValid && p.codeStatus === "checking" && <p style={helperStyle}>Checking availability…</p>}
          {p.codeValid && p.codeStatus === "available" && (
            <p style={okStyle} className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Organisation code is available.
            </p>
          )}
          {p.codeValid && p.codeStatus === "unavailable" && (
            <div>
              <p style={errorStyle} className="flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" /> This organisation code is already in use.
              </p>
              {p.codeSuggestion && (
                <div className="mt-1.5 flex items-center gap-2" style={{ fontSize: 12, color: "#5E6675" }}>
                  <span>
                    Suggested code: <strong style={{ color: "#17191F" }}>{p.codeSuggestion}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      p.setCodeTouched(true);
                      p.setOrganisationCode(p.codeSuggestion);
                    }}
                    style={{ color: "#2D4FC4", fontWeight: 600 }}
                    className="hover:underline"
                  >
                    Use suggestion
                  </button>
                </div>
              )}
            </div>
          )}
            </div>
          </>
        )}

        <label className="flex cursor-pointer items-start gap-2.5" style={{ color: "#4A5162", fontSize: 13, lineHeight: 1.5 }}>
          <input
            type="checkbox"
            checked={p.terms}
            onChange={(e: any) => p.setTerms(e.target.checked)}
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
      </div>

      {p.authenticated && (
        <div className="mt-5 flex items-start gap-2.5 rounded-md px-3 py-2.5" style={{ background: "#ECFDF3", border: "1px solid #BBF0CE" }}>
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#12703A" }} />
          <div>
            <div style={{ color: "#12703A", fontSize: 13, fontWeight: 600 }}>Authentication successful</div>
            <div style={{ color: "#3F6B4F", fontSize: 12.5, lineHeight: 1.5 }}>Your identity has been verified.</div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <PrimaryButton type="submit" disabled={p.authenticated ? !p.step1Valid : false}>
          {p.authenticated ? "Continue" : "Continue with email"}
        </PrimaryButton>
      </div>

      <div style={{ marginTop: 14, textAlign: "center", color: "#6F7684", fontSize: 13 }}>
        Already have an account?{" "}
        <Link to="/login" style={{ color: "#2D4FC4", fontWeight: 600 }} className="hover:underline">
          Sign in
        </Link>
      </div>

      {!p.authenticated && (
        <>
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "#DCE4FF" }} />
            <span style={{ color: "#8A90A2", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}>OR</span>
            <span className="h-px flex-1" style={{ background: "#DCE4FF" }} />
          </div>
           <button
             type="button"
             onClick={p.startGoogle}
             className="flex w-full items-center justify-center gap-2.5 transition-colors hover:bg-[#F5F7FF] focus:outline-none focus:ring-2 focus:ring-[#355BE0]/30"
             style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontWeight: 500, fontSize: 14 }}
           >
             <GoogleIcon />
             Sign up with Google
           </button>
           <button
             type="button"
             onClick={p.startGithub}
             className="mt-2.5 flex w-full items-center justify-center gap-2.5 transition-colors hover:bg-[#F5F7FF] focus:outline-none focus:ring-2 focus:ring-[#355BE0]/30"
             style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontWeight: 500, fontSize: 14 }}
           >
             <Github className="h-[18px] w-[18px]" />
             Sign up with GitHub
           </button>
        </>
      )}
    </form>
  );
}

/* ---------------------------------- Step 2 --------------------------------- */

function StepPreferences(p: any) {
  const toggleLanguage = (code: string) => {
    p.setLanguages((prev: string[]) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  return (
    <div>
      <h1 style={{ color: "#17191F", fontSize: 28, fontWeight: 600, lineHeight: 1.15 }}>Personalise your account</h1>
      <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
        Set the defaults your organisation will use across the product.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <AuthField label="Base country of operations">
            <select
              value={p.baseCountry}
              onChange={(e: any) => p.onCountryChange(e.target.value)}
              className={authInputCls}
              style={selectStyle}
            >
              <option value="">Select a country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </AuthField>
          <p style={helperStyle}>Used to suggest locale, timezone, and organisation URL defaults.</p>
          {p.codeUpdatedNotice && <p style={okStyle}>{p.codeUpdatedNotice}</p>}
          {p.baseCountry && (
            <p style={helperStyle}>
              Organisation code: <strong style={{ color: "#17191F" }}>{p.organisationCode}</strong>
            </p>
          )}
        </div>

        <div>
          <AuthField label="Languages">
            <div className="flex flex-wrap gap-2">
              {SETUP_LANGUAGES.map((l) => {
                const on = p.languages.includes(l.code);
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => toggleLanguage(l.code)}
                    style={{
                      height: 34,
                      padding: "0 12px",
                      borderRadius: 999,
                      fontSize: 13,
                      fontWeight: 500,
                      background: on ? "#EEF2FF" : "#FFFFFF",
                      border: `1px solid ${on ? "#2D4FC4" : "#CBD5F2"}`,
                      color: on ? "#2D4FC4" : "#5E6675",
                    }}
                  >
                    {l.label}
                  </button>
                );
              })}
            </div>
          </AuthField>
          <p style={helperStyle}>Choose the languages your organisation may use in the product.</p>
        </div>

        <div>
          <AuthField label="Timezone">
            <select value={p.timezone} onChange={(e: any) => p.setTimezone(e.target.value)} className={authInputCls} style={selectStyle}>
              <option value="">Select a timezone</option>
              {TIMEZONES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </AuthField>
          <p style={helperStyle}>Suggested from your base country. You can change it if required.</p>
        </div>

        <div>
          <AuthField label="Financial year">
            <select
              value={p.financialYearStart}
              onChange={(e: any) => p.setFinancialYearStart(e.target.value)}
              className={authInputCls}
              style={selectStyle}
            >
              {FINANCIAL_YEARS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </AuthField>
          <p style={helperStyle}>Choose when your organisation's financial year begins.</p>
        </div>

        <div>
          <AuthField label="Organisation URL">
            <input
              value={p.orgSlug}
              onChange={(e: any) => {
                p.setSlugTouched(true);
                p.setOrgSlug(normaliseSlug(e.target.value));
              }}
              placeholder="makueni-county"
              className={authInputCls}
              style={authInputStyle}
            />
          </AuthField>
          <p style={helperStyle}>This short name will be used in your organisation URLs.</p>
          <p style={{ ...helperStyle, color: "#5E6675" }}>
            Preview: <strong style={{ color: "#17191F" }}>{`https://${p.orgSlug || "your-organisation"}.${BASE_DOMAIN}`}</strong>
          </p>
          {p.orgSlug && !isSlugValid(p.orgSlug) && <p style={errorStyle}>Use lowercase letters, numbers, and hyphens only.</p>}
          {p.slugStatus === "checking" && <p style={helperStyle}>Checking availability…</p>}
          {p.slugStatus === "available" && (
            <p style={okStyle} className="flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> This organisation URL is available.
            </p>
          )}
          {p.slugStatus === "unavailable" && (
            <div>
              <p style={errorStyle}>This organisation URL is already in use.</p>
              {p.slugSuggestion && (
                <div className="mt-1.5 flex items-center gap-2" style={{ fontSize: 12, color: "#5E6675" }}>
                  <span>
                    Suggested: <strong style={{ color: "#17191F" }}>{p.slugSuggestion}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      p.setSlugTouched(true);
                      p.setOrgSlug(p.slugSuggestion);
                    }}
                    style={{ color: "#2D4FC4", fontWeight: 600 }}
                    className="hover:underline"
                  >
                    Use suggestion
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={p.onBack}
          className="flex items-center justify-center gap-1.5 hover:bg-[#F5F7FF]"
          style={{ height: 46, width: 110, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontSize: 14, fontWeight: 500 }}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex-1">
          <PrimaryButton disabled={!p.step2Valid} onClick={p.onContinue}>
            Continue
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- Step 3 --------------------------------- */

function UrlCard({ label, description, url }: { label: string; description: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="rounded-lg px-3.5 py-3" style={{ background: "#FFFFFF", border: "1px solid #DCE4FF" }}>
      <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>{label}</div>
      <div style={{ marginTop: 2, color: "#8A90A2", fontSize: 12, lineHeight: 1.5 }}>{description}</div>
      <div className="mt-2 flex items-center gap-2">
        <code
          className="flex-1 truncate rounded px-2 py-1.5"
          style={{ background: "#F5F7FF", color: "#2D4FC4", fontSize: 12.5 }}
          title={url}
        >
          {url}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-[#F5F7FF]"
          style={{ border: "1px solid #CBD5F2", color: copied ? "#12703A" : "#5E6675" }}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${label}`}
          className="flex h-8 w-8 items-center justify-center rounded hover:bg-[#F5F7FF]"
          style={{ border: "1px solid #CBD5F2", color: "#5E6675" }}
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function StepUrls({
  urls,
  summary,
  onBack,
  onFinish,
}: {
  urls: { employeeUrl: string; citizenUrl: string; adminUrl: string };
  summary: {
    organisationName: string;
    organisationCode: string;
    baseCountry: string;
    languages: string[];
    timezone: string;
    financialYearStart: string;
  };
  onBack: () => void;
  onFinish: () => void;
}) {
  const country = COUNTRIES.find((c) => c.code === summary.baseCountry);
  const fy = FINANCIAL_YEARS.find((f) => f.value === summary.financialYearStart);
  const langLabels = summary.languages
    .map((c) => SETUP_LANGUAGES.find((l) => l.code === c)?.label ?? c)
    .join(", ");

  const rows: [string, string][] = [
    ["Organisation name", summary.organisationName],
    ["Organisation code", summary.organisationCode],
    ["Base country", country?.label ?? "—"],
    ["Languages", langLabels],
    ["Timezone", summary.timezone.replace(/_/g, " ")],
    ["Financial year", fy?.label ?? "—"],
  ];

  return (
    <div>
      <h1 style={{ color: "#17191F", fontSize: 28, fontWeight: 600, lineHeight: 1.15 }}>Review and create your account</h1>
      <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
        These will be the main entry points for your organisation once your workspace has been set up.
      </p>

      <div className="mt-5 flex items-start gap-2.5 rounded-md px-3 py-2.5" style={{ background: "#F5F7FF", border: "1px solid #DCE4FF" }}>
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#2D4FC4" }} />
        <div>
          <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>Ready to create</div>
          <div style={{ color: "#5E6675", fontSize: 12.5, lineHeight: 1.5 }}>
            Workspace setup starts after you create the account and usually takes 30 to 45 minutes.
          </div>
        </div>
      </div>


      <div className="mt-5 space-y-2.5">
        <UrlCard
          label="Employee URL"
          description="For administrators, supervisors, resolvers, and other government employees."
          url={urls.employeeUrl}
        />
        <UrlCard label="Citizen URL" description="Public entry point for residents to file and track complaints." url={urls.citizenUrl} />
        <UrlCard label="Administration URL" description="For account setup and administration." url={urls.adminUrl} />
      </div>

      <div className="mt-6">
        <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>Organisation details</div>
        <dl className="mt-2 space-y-1.5">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4">
              <dt style={{ color: "#8A90A2", fontSize: 12.5 }}>{k}</dt>
              <dd style={{ color: "#17191F", fontSize: 12.5, fontWeight: 500, textAlign: "right" }}>{v || "—"}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6">
        <PrimaryButton onClick={onFinish}>Create account</PrimaryButton>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-2.5 w-full hover:bg-[#F5F7FF]"
        style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontSize: 14, fontWeight: 500 }}
      >
        Back to preferences
      </button>
    </div>
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
