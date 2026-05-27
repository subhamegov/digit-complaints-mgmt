import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, KeyRound, Building2, Mail, User, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: "Platform Console — DIGIT Complaints" },
      { name: "description", content: "Sign in or complete first-time setup for the DIGIT Complaints Management platform." },
    ],
  }),
  component: PlatformLanding,
});

type Mode = "login" | "setup";

/**
 * Mock probe: in a real deployment this would call
 *   GET /user/_search?type=PLATFORM_ADMIN&limit=1
 * and switch to setup when the response is empty.
 * Toggle the constant below to demo first-time install.
 */
const PLATFORM_ADMIN_EXISTS = true;

function PlatformLanding() {
  const navigate = useNavigate();
  const { setRole } = useRbac();
  const [mode, setMode] = useState<Mode>("login");

  useEffect(() => {
    if (!PLATFORM_ADMIN_EXISTS) setMode("setup");
  }, []);

  return (
    <div className="min-h-screen w-full bg-[oklch(0.97_0.005_250)] text-foreground">
      {/* Top bar */}
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary font-bold text-primary-foreground">P</div>
            <div className="leading-tight">
              <div className="text-[13px] font-semibold">DIGIT Platform</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Complaints Management</div>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Secure Platform Console
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-10 sm:py-14">
        <div className="mb-6 w-full max-w-[460px] text-center">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Platform Administrator</div>
          <h1 className="mt-1 text-[22px] font-semibold leading-tight sm:text-[24px]">
            Welcome to the Admin Console
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
            Sign in to manage accounts, modules, and platform configuration. First-time installation completes the initial administrator setup.
          </p>
        </div>

        {/* Card */}
        <section className="w-full max-w-[460px] rounded-sm border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {/* Mode tabs */}
          <div role="tablist" aria-label="Console mode" className="grid grid-cols-2 border-b border-border">
            <TabButton active={mode === "login"} onClick={() => setMode("login")} icon={<KeyRound className="h-3.5 w-3.5" />} label="Login" />
            <TabButton active={mode === "setup"} onClick={() => setMode("setup")} icon={<Building2 className="h-3.5 w-3.5" />} label="Setup" />
          </div>

          <div className="px-6 py-6">
            {mode === "login" ? (
              <LoginForm
                onSubmit={() => {
                  setRole("PLATFORM_ADMIN");
                  navigate({ to: "/dashboard" });
                }}
              />
            ) : (
              <SetupForm
                onSubmit={() => {
                  setRole("PLATFORM_ADMIN");
                  navigate({ to: "/dashboard" });
                }}
              />
            )}
          </div>
        </section>

        <div className="mt-5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" />
          All console actions are signed, audited, and rate-limited.
        </div>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3 text-[11px] text-muted-foreground">
          <div>© 2026 eGovernments Foundation · DIGIT 2.9</div>
          <div className="hidden sm:block">support@digit.org</div>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Tabs ---------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-medium transition-colors " +
        (active
          ? "bg-background text-foreground border-b-2 border-primary -mb-px"
          : "bg-[oklch(0.985_0.003_250)] text-muted-foreground hover:text-foreground")
      }
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------- Login ---------- */

function LoginForm({ onSubmit }: { onSubmit: () => void }) {
  const [email, setEmail] = useState("platform.admin@digit.org");
  const [password, setPassword] = useState("••••••••");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <Header title="Sign in to console" subtitle="Use your platform administrator credentials." />

      <Field label="Email" icon={<Mail className="h-3.5 w-3.5 text-muted-foreground" />}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} autoComplete="email" />
      </Field>

      <Field label="Password" icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} autoComplete="current-password" />
      </Field>

      <div className="flex items-center justify-between text-[11px]">
        <label className="flex items-center gap-1.5 text-muted-foreground">
          <input type="checkbox" className="h-3 w-3 rounded-sm border-border" defaultChecked />
          Keep me signed in
        </label>
        <a href="#" className="text-primary hover:underline">Forgot password?</a>
      </div>

      <PrimaryButton type="submit">
        Sign in
        <ArrowRight className="h-3.5 w-3.5" />
      </PrimaryButton>

      <div className="rounded-sm border border-border bg-[oklch(0.985_0.003_250)] px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        Need an account? Platform administrator access is provisioned by your organisation's owner. Contact your installation lead.
      </div>
    </form>
  );
}

/* ---------- Setup ---------- */

function SetupForm({ onSubmit }: { onSubmit: () => void }) {
  const [org, setOrg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accept, setAccept] = useState(false);

  const valid =
    org.trim().length > 1 &&
    name.trim().length > 1 &&
    /.+@.+\..+/.test(email) &&
    password.length >= 8 &&
    password === confirm &&
    accept;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onSubmit();
      }}
    >
      <Header
        title="First-time platform setup"
        subtitle="No administrator user was detected. Create the initial platform administrator to complete installation."
      />

      <StepStrip />

      <Field label="Organisation name" icon={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />}>
        <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="eGovernments Foundation" className={inputCls} />
      </Field>

      <Field label="Full name" icon={<User className="h-3.5 w-3.5 text-muted-foreground" />}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Priya Nair" className={inputCls} />
      </Field>

      <Field label="Email" icon={<Mail className="h-3.5 w-3.5 text-muted-foreground" />}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@your-org.org" className={inputCls} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Password" icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" className={inputCls} />
        </Field>
        <Field label="Confirm password" icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />}>
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" className={inputCls} />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
        <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 h-3 w-3 rounded-sm border-border" />
        <span>
          I acknowledge that this account will have full platform administration rights and that all actions are recorded in the audit log.
        </span>
      </label>

      <PrimaryButton type="submit" disabled={!valid}>
        Create administrator and continue
        <ArrowRight className="h-3.5 w-3.5" />
      </PrimaryButton>

      <div className="rounded-sm border border-border bg-[oklch(0.985_0.003_250)] px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        After setup, additional administrators and account owners can be invited from the Users & Roles section.
      </div>
    </form>
  );
}

function StepStrip() {
  const steps = [
    { label: "Administrator", active: true, done: false },
    { label: "Organisation", active: false, done: false },
    { label: "Verification", active: false, done: false },
  ];
  return (
    <ol className="flex items-center gap-2 text-[11px]">
      {steps.map((s, i) => (
        <li key={s.label} className="flex items-center gap-2">
          <span
            className={
              "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-medium " +
              (s.active
                ? "border-primary bg-primary text-primary-foreground"
                : s.done
                ? "border-primary bg-background text-primary"
                : "border-border bg-background text-muted-foreground")
            }
          >
            {s.done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
          </span>
          <span className={s.active ? "text-foreground font-medium" : "text-muted-foreground"}>{s.label}</span>
          {i < steps.length - 1 && <span className="h-px w-6 bg-border" />}
        </li>
      ))}
    </ol>
  );
}

/* ---------- Primitives ---------- */

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold leading-tight">{title}</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function PrimaryButton({
  children,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="flex h-9 w-full items-center justify-center gap-1.5 rounded-sm bg-primary text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

const inputCls =
  "h-9 w-full rounded-sm border border-border bg-background px-2.5 text-[13px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";
