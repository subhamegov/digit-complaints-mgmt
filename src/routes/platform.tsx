import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useId, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Globe,
  Info,
  ShieldCheck,
} from "lucide-react";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Admin Console — DIGIT Complaints" },
      {
        name: "description",
        content:
          "Platform administrator entry for DIGIT Complaints Management. Sign in or complete first-time setup.",
      },
    ],
  }),
  component: PlatformLanding,
});

/* ---------------- Constants ---------------- */

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "fr", label: "French" },
  { code: "pt", label: "Portuguese" },
  { code: "sw", label: "Swahili" },
];

const USE_CASES = [
  "Grievance Redressal",
  "Case Management",
  "Incident Management",
  "Emergency Response",
  "Pilot Setup",
];

/**
 * Mock directory probe. Toggle to demo first-time install.
 * Real call: GET /user/_search?type=PLATFORM_ADMIN&email=…
 */
const KNOWN_ADMIN_EMAILS = new Set<string>([
  "platform.admin@digit.org",
  "priya.nair@digit.org",
]);

type Screen =
  | { kind: "email" }
  | { kind: "login"; email: string }
  | { kind: "setup"; email: string }
  | { kind: "success"; email: string };

/* ---------------- Page ---------------- */

function PlatformLanding() {
  const [language, setLanguage] = useState("en");
  const [screen, setScreen] = useState<Screen>({ kind: "email" });

  const onContinueEmail = (email: string) => {
    if (KNOWN_ADMIN_EMAILS.has(email.trim().toLowerCase())) {
      setScreen({ kind: "login", email });
    } else {
      setScreen({ kind: "setup", email });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[oklch(0.97_0.005_250)] text-foreground">
      {/* Top bar */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary font-bold text-primary-foreground">
              P
            </div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">DIGIT Platform</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Complaints Management
              </div>
            </div>
          </div>
          <LanguageSelector value={language} onChange={setLanguage} compact />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-10 sm:py-14 lg:grid-cols-[460px_1fr] lg:gap-10">
        <div className="flex flex-col items-center">
          <PageHeader />

          <section className="w-full max-w-[460px] rounded-sm border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            {screen.kind === "email" && (
              <EmailEntryCard onContinue={onContinueEmail} />
            )}
            {screen.kind === "login" && (
              <LoginCard
                email={screen.email}
                onBack={() => setScreen({ kind: "email" })}
              />
            )}
            {screen.kind === "setup" && (
              <SetupStepper
                initialEmail={screen.email}
                initialLanguage={language}
                onCancel={() => setScreen({ kind: "email" })}
                onComplete={(email) =>
                  setScreen({ kind: "success", email })
                }
              />
            )}
            {screen.kind === "success" && (
              <SuccessStateCard email={screen.email} />
            )}
          </section>

          <div className="mt-5 w-full max-w-[460px] lg:hidden">
            <HelpLinksAccordion />
          </div>

          <AuditFooter />
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-10">
            <HelpLinksPanel />
          </div>
        </div>
      </main>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-6 w-full max-w-[460px] text-center">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Platform Administrator
      </div>
      <h1 className="mt-1 text-[22px] font-semibold leading-tight sm:text-[24px]">
        Admin Console
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
        Set up or access your platform administration workspace.
      </p>
    </div>
  );
}

function HelpLinksPanel() {
  return (
    <div className="w-full rounded-sm border border-border bg-background px-4 py-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Need help setting up?
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12px]">
        <a href="#" className="text-foreground/80 hover:text-primary hover:underline">
          Setup Guide
        </a>
        <a href="#" className="text-foreground/80 hover:text-primary hover:underline">
          Installation Checklist
        </a>
        <a href="#" className="text-foreground/80 hover:text-primary hover:underline">
          Contact Support
        </a>
      </div>
    </div>
  );
}

function HelpLinksAccordion() {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full rounded-sm border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Need help setting up?
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex flex-col gap-2 text-[12px]">
            <a href="#" className="text-foreground/80 hover:text-primary hover:underline">
              Setup Guide
            </a>
            <a href="#" className="text-foreground/80 hover:text-primary hover:underline">
              Installation Checklist
            </a>
            <a href="#" className="text-foreground/80 hover:text-primary hover:underline">
              Contact Support
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditFooter() {
  return (
    <div className="mt-5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <ShieldCheck className="h-3 w-3" />
      Console access is audited.
    </div>
  );
}


/* ---------------- Email entry ---------------- */

function EmailEntryCard({
  onContinue,
}: {
  onContinue: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const valid = /.+@.+\..+/.test(email);
  return (
    <form
      className="px-6 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onContinue(email);
      }}
    >
      <CardHeading
        title="Enter Work Email"
        subtitle="We'll check whether this platform is already set up."
      />
      <div className="mt-5 space-y-3">
        <Field label="Work Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@your-org.org"
            autoComplete="email"
            className={inputCls}
            autoFocus
          />
        </Field>
        <button
          type="submit"
          disabled={!valid}
          className={
            "flex h-9 w-full items-center justify-center gap-1.5 rounded-sm text-[13px] font-medium transition-colors " +
            (valid
              ? "bg-[oklch(0.62_0.12_195)] text-white hover:bg-[oklch(0.56_0.12_195)]"
              : "bg-muted text-muted-foreground cursor-not-allowed")
          }
        >
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          New installation? Setup starts automatically if no administrator exists.
        </p>
      </div>

    </form>
  );
}

/* ---------------- Login ---------------- */

function LoginCard({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const { setRole } = useRbac();
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setRole("PLATFORM_ADMIN");
    navigate({ to: "/dashboard" });
  };

  return (
    <form className="px-6 py-6" onSubmit={submit}>
      <CardHeading title="Sign In" subtitle="Enter your password." />
      <div className="mt-5 space-y-4">
        <Field label="Work Email">
          <input value={email} readOnly className={readOnlyInputCls} />
        </Field>
        <Field
          label="Password"
          trailing={
            <a href="#" className="text-[11px] text-primary hover:underline">
              Forgot Password
            </a>
          }
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            autoComplete="current-password"
            autoFocus
          />
        </Field>

        <PrimaryButton type="submit" disabled={password.length < 1}>
          Sign In
          <ArrowRight className="h-3.5 w-3.5" />
        </PrimaryButton>

        <SecondaryButton type="button" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </SecondaryButton>
      </div>
    </form>
  );
}

/* ---------------- Setup stepper ---------------- */

const SETUP_STEPS = [
  "Language",
  "Platform",
  "Domain",
  "Administrator",
  "Review",
] as const;

type SetupData = {
  language: string;
  platformName: string;
  platformCode: string;
  domainName: string;
  domainCode: string;
  useCase: string;
  fullName: string;
  email: string;
  password: string;
  confirm: string;
};

function SetupStepper({
  initialEmail,
  initialLanguage,
  onCancel,
  onComplete,
}: {
  initialEmail: string;
  initialLanguage: string;
  onCancel: () => void;
  onComplete: (email: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SetupData>({
    language: initialLanguage,
    platformName: "DIGIT Complaints Management",
    platformCode: "digit-cms",
    domainName: "Complaint Management",
    domainCode: "complaints",
    useCase: USE_CASES[0],
    fullName: "",
    email: initialEmail,
    password: "",
    confirm: "",
  });

  const set = <K extends keyof SetupData>(k: K, v: SetupData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, SETUP_STEPS.length - 1));
  const back = () => (step === 0 ? onCancel() : setStep((s) => s - 1));

  return (
    <div className="px-6 py-6">
      <Banner>
        No administrator found. Complete setup to create the first administrator.
      </Banner>

      <div className="mt-4">
        <StepStrip current={step} />
      </div>

      <div className="mt-5">
        {step === 0 && (
          <StepLanguage
            value={data.language}
            onChange={(v) => set("language", v)}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 1 && (
          <PlatformSetupForm
            data={data}
            set={set}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 2 && (
          <DomainSetupForm
            data={data}
            set={set}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
          <AdministratorSetupForm
            data={data}
            set={set}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 4 && (
          <ReviewSetupCard
            data={data}
            onBack={back}
            onCreate={() => onComplete(data.email)}
          />
        )}
      </div>
    </div>
  );
}

function StepStrip({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
      {SETUP_STEPS.map((label, i) => {
        const active = i === current;
        const done = i < current;
        return (
          <li key={label} className="flex shrink-0 items-center gap-1.5">
            <span
              className={
                "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium " +
                (active
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                  ? "border-primary bg-background text-primary"
                  : "border-border bg-background text-muted-foreground")
              }
            >
              {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={
                active
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }
            >
              {label}
            </span>
            {i < SETUP_STEPS.length - 1 && (
              <span className="mx-1 h-px w-4 bg-border" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

/* ---- Step 1: Language ---- */
function StepLanguage({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <CardHeading title="Select Language" />
      <Field label="Preferred Language">
        <LanguageSelector value={value} onChange={onChange} />
      </Field>
      <StepActions onBack={onBack}>Continue</StepActions>
    </form>
  );
}

/* ---- Step 2: Platform ---- */
function PlatformSetupForm({
  data,
  set,
  onNext,
  onBack,
}: {
  data: SetupData;
  set: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid =
    data.platformName.trim().length > 1 && /^[a-z0-9-]+$/.test(data.platformCode);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onNext();
      }}
    >
      <CardHeading title="Name Platform" />
      <Field label="Platform Name">
        <input
          value={data.platformName}
          onChange={(e) => set("platformName", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Platform Code" hint="Lowercase, no spaces.">
        <input
          value={data.platformCode}
          onChange={(e) => set("platformCode", e.target.value)}
          className={inputCls}
        />
      </Field>
      <StepActions onBack={onBack} disabled={!valid}>
        Continue
      </StepActions>
    </form>
  );
}

/* ---- Step 3: Domain ---- */
function DomainSetupForm({
  data,
  set,
  onNext,
  onBack,
}: {
  data: SetupData;
  set: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid =
    data.domainName.trim().length > 1 && /^[a-z0-9-]+$/.test(data.domainCode);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onNext();
      }}
    >
      <CardHeading title="Name Domain" />
      <Field label="Domain Name">
        <input
          value={data.domainName}
          onChange={(e) => set("domainName", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Domain Code" hint="Lowercase, no spaces.">
        <input
          value={data.domainCode}
          onChange={(e) => set("domainCode", e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Default Use Case">
        <select
          value={data.useCase}
          onChange={(e) => set("useCase", e.target.value)}
          className={inputCls}
        >
          {USE_CASES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </Field>
      <StepActions onBack={onBack} disabled={!valid}>
        Continue
      </StepActions>
    </form>
  );
}

/* ---- Step 4: Administrator ---- */
function AdministratorSetupForm({
  data,
  set,
  onNext,
  onBack,
}: {
  data: SetupData;
  set: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const valid =
    data.fullName.trim().length > 1 &&
    /.+@.+\..+/.test(data.email) &&
    data.password.length >= 8 &&
    data.password === data.confirm;
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onNext();
      }}
    >
      <CardHeading title="Create Administrator" />
      <Field label="Full Name">
        <input
          value={data.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Priya Nair"
          className={inputCls}
        />
      </Field>
      <Field label="Work Email">
        <input
          type="email"
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Password" hint="Min. 8 characters.">
          <input
            type="password"
            value={data.password}
            onChange={(e) => set("password", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Confirm Password">
          <input
            type="password"
            value={data.confirm}
            onChange={(e) => set("confirm", e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <StepActions onBack={onBack} disabled={!valid}>
        Continue
      </StepActions>
    </form>
  );
}

/* ---- Step 5: Review ---- */
function ReviewSetupCard({
  data,
  onBack,
  onCreate,
}: {
  data: SetupData;
  onBack: () => void;
  onCreate: () => void;
}) {
  const languageLabel =
    LANGUAGES.find((l) => l.code === data.language)?.label ?? data.language;
  const rows: [string, string][] = [
    ["Language", languageLabel],
    ["Platform Name", data.platformName],
    ["Platform Code", data.platformCode],
    ["Domain Name", data.domainName],
    ["Domain Code", data.domainCode],
    ["Administrator Email", data.email],
  ];
  return (
    <div className="space-y-4">
      <CardHeading title="Review Setup" />
      <dl className="divide-y divide-border rounded-sm border border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between px-3 py-2">
            <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {k}
            </dt>
            <dd className="text-[12.5px] font-medium text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex gap-2">
        <SecondaryButton type="button" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </SecondaryButton>
        <PrimaryButton type="button" onClick={onCreate}>
          Create Platform
          <ArrowRight className="h-3.5 w-3.5" />
        </PrimaryButton>
      </div>
    </div>
  );
}

/* ---------------- Success ---------------- */

function SuccessStateCard({ email }: { email: string }) {
  const navigate = useNavigate();
  const { setRole } = useRbac();
  const enter = (to: "/dashboard" | "/audit") => {
    setRole("PLATFORM_ADMIN");
    navigate({ to });
  };
  return (
    <div className="px-6 py-7 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
        <CheckCircle2 className="h-5 w-5" />
      </div>
      <h2 className="mt-3 text-[16px] font-semibold">Platform Created</h2>
      <p className="mt-1 text-[12.5px] text-muted-foreground">
        The first administrator account is ready.
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{email}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <PrimaryButton type="button" onClick={() => enter("/dashboard")}>
          Go to Home
          <ArrowRight className="h-3.5 w-3.5" />
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => enter("/audit")}>
          View Audit Log
        </SecondaryButton>
      </div>
    </div>
  );
}

/* ---------------- Primitives ---------------- */

function CardHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold leading-tight">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  trailing,
  children,
}: {
  label: string;
  hint?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {trailing}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}

function PrimaryButton({
  children,
  disabled,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-primary text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  type = "button",
  onClick,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-sm border border-border bg-background text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}

function StepActions({
  children,
  disabled,
  onBack,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onBack: () => void;
}) {
  return (
    <div className="flex gap-2 pt-1">
      <SecondaryButton type="button" onClick={onBack}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </SecondaryButton>
      <PrimaryButton type="submit" disabled={disabled}>
        {children}
        <ArrowRight className="h-3.5 w-3.5" />
      </PrimaryButton>
    </div>
  );
}

function Banner({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-sm border border-border bg-[oklch(0.985_0.003_250)] px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  );
}

function LanguageSelector({
  value,
  onChange,
  compact,
}: {
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const id = useMemo(() => `lang-${Math.random().toString(36).slice(2, 7)}`, []);
  if (compact) {
    return (
      <label
        htmlFor={id}
        className="flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-2 text-[12px] text-foreground"
      >
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="sr-only">Language</span>
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-[12px] outline-none"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
      aria-label="Language"
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}

const inputCls =
  "h-9 w-full rounded-sm border border-border bg-background px-2.5 text-[13px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

const readOnlyInputCls =
  "h-9 w-full rounded-sm border border-border bg-[oklch(0.985_0.003_250)] px-2.5 text-[13px] text-muted-foreground outline-none";
