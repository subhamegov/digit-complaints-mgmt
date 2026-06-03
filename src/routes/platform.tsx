import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useId, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  HelpCircle,
  Info,
  KeyRound,
  LogIn,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  { code: "en_IN", label: "English", native: "English" },
  { code: "hi_IN", label: "Hindi", native: "हिन्दी" },
  { code: "fr_FR", label: "French", native: "Français" },
  { code: "pt_PT", label: "Portuguese", native: "Português" },
  { code: "sw_KE", label: "Swahili", native: "Kiswahili" },
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
  const [language, setLanguage] = useState("en_IN");
  const [email, setEmail] = useState("");
  const [screen, setScreen] = useState<Screen>({ kind: "email" });

  const onContinueEmail = (value: string) => {
    setEmail(value);
    if (KNOWN_ADMIN_EMAILS.has(value.trim().toLowerCase())) {
      setScreen({ kind: "login", email: value });
    } else {
      setScreen({ kind: "setup", email: value });
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
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
            >
              <LogIn className="h-3.5 w-3.5" />
              Back to Sign In
            </Link>
            <LanguageSelector value={language} onChange={setLanguage} compact />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-8 sm:py-12">
        <PageHeader />

        <section className="relative w-full max-w-[460px] rounded-sm border border-border bg-background shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {screen.kind === "email" && (
            <>
              <SetupHelpRail stepKey="email" />
              <EmailEntryCard initialEmail={email} onContinue={onContinueEmail} />
            </>
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

        <SetupAuditFooter />
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
        Set up or access platform administration.
      </p>
    </div>
  );
}

type HelpStepKey = "email" | "language" | "essentials" | "platform" | "review";

type HelpLink = { label: string; href: string };

type HelpContent = {
  about: string;
  need: string;
  links: HelpLink[];
};

const COMMON_LINKS: HelpLink[] = [
  { label: "Setup guide", href: "#" },
  { label: "Installation checklist", href: "#" },
  { label: "Contact support", href: "#" },
];

const HELP_CONTENT: Record<HelpStepKey, HelpContent> = {
  email: {
    about:
      "Enter your work email to sign in or start first-time setup.",
    need: "A valid work email for the platform administrator.",
    links: COMMON_LINKS,
  },
  language: {
    about: "Choose the default language for setup.",
    need: "Preferred platform language.",
    links: COMMON_LINKS,
  },
  essentials: {
    about:
      "Define how the installation will run and who manages it first.",
    need:
      "Operating mode, setup location, expected accounts, first administrator email.",
    links: COMMON_LINKS,
  },
  platform: {
    about:
      "Define platform name, access URLs, tenant code, and environment.",
    need:
      "Platform URL, admin URL, API URL, root tenant code, support email.",
    links: [
      { label: "DNS setup guide", href: "#" },
      { label: "SSL/TLS checklist", href: "#" },
      { label: "Installation checklist", href: "#" },
      { label: "Contact support", href: "#" },
    ],
  },
  review: {
    about: "Review setup details before creating the platform.",
    need:
      "Confirm administrator, installation context, and platform settings.",
    links: [
      { label: "Installation checklist", href: "#" },
      { label: "Contact support", href: "#" },
    ],
  },
};

function SetupAuditFooter() {
  return (
    <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
      <ShieldCheck className="h-3 w-3" />
      Console access is audited.
    </div>
  );
}

function SetupHelpRail({ stepKey }: { stepKey: HelpStepKey }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* Desktop: slim vertical rail anchored to the right of the card */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open help"
        className="group absolute right-[-44px] top-4 hidden h-auto w-9 flex-col items-center gap-1.5 rounded-sm border border-border bg-background py-3 text-[11px] font-medium text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:inline-flex"
      >
        <HelpCircle className="h-4 w-4" />
        <span className="[writing-mode:vertical-rl] rotate-180 tracking-wide">
          Help
        </span>
      </button>
      {/* Mobile / small screens: compact floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open help"
        className="absolute right-2 top-2 inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-background px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 md:hidden"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        Help
      </button>
      <SetupHelpDrawer open={open} onOpenChange={setOpen} stepKey={stepKey} />
    </>
  );
}

function SetupHelpDrawer({
  open,
  onOpenChange,
  stepKey,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  stepKey: HelpStepKey;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full border-l border-border bg-background p-0 sm:max-w-[360px]"
      >
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="text-[15px] font-semibold text-foreground">
            Need help with this step?
          </SheetTitle>
        </SheetHeader>
        <div className="px-5 py-5">
          <ContextualHelpContent stepKey={stepKey} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ContextualHelpContent({ stepKey }: { stepKey: HelpStepKey }) {
  const content = HELP_CONTENT[stepKey];
  return (
    <div className="space-y-5 text-[13px] text-muted-foreground">
      <section>
        <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-foreground">
          About this step
        </h3>
        <p className="leading-relaxed">{content.about}</p>
      </section>
      <section>
        <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-wider text-foreground">
          What you need
        </h3>
        <p className="leading-relaxed">{content.need}</p>
      </section>
      <section>
        <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-foreground">
          Helpful links
        </h3>
        <ul className="space-y-1.5">
          {content.links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}





/* ---------------- Email entry ---------------- */

function EmailEntryCard({
  initialEmail = "",
  onContinue,
}: {
  initialEmail?: string;
  onContinue: (email: string) => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const valid = /.+@.+\..+/.test(email);
  return (
    <form
      className="px-6 py-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onContinue(email);
      }}
    >
      <CardHeading title="Enter Work Email" />
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
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed")
          }
        >
          Continue
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          New installation? Setup starts automatically.
        </p>
        <div className="flex justify-center pt-1">
          <DemoSkipSetupLink />
        </div>
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
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== "DIGIT") {
      setError("Incorrect password. Use DIGIT for the demo.");
      return;
    }
    setRole("PLATFORM_ADMIN");
    navigate({ to: "/admin/home" });
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
            onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }}
            className={inputCls}
            autoComplete="current-password"
            autoFocus
          />
        </Field>

        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Demo password: <span className="font-mono font-medium text-foreground">DIGIT</span>
        </p>

        {error && (
          <p className="text-[12px] text-destructive">{error}</p>
        )}

        <PrimaryButton type="submit" disabled={password.length < 1}>
          Sign In
          <ArrowRight className="h-3.5 w-3.5" />
        </PrimaryButton>

        <SecondaryButton type="button" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </SecondaryButton>

        <div className="flex justify-center pt-1">
          <DemoSkipSetupLink />
        </div>
      </div>
    </form>
  );
}


/* ---------------- Setup stepper ---------------- */

const SETUP_STEPS = [
  "Language",
  "Essentials",
  "Platform",
  "Review",
] as const;

type OperationMode = "demo" | "saas" | "own";
type SetupLocation = "laptop" | "captive" | "hyperscaler" | "datacenter";
type AccountScale = "1" | "2-5" | "6-25" | "25+";

type SetupData = {
  language: string;
  platformName: string;
  platformCode: string;
  domainName: string;
  domainCode: string;
  fullName: string;
  email: string;
  recoveryEmail: string;
  operationMode: OperationMode | "";
  setupLocation: SetupLocation | "";
  accountScale: AccountScale | "";
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
    fullName: "",
    email: initialEmail,
    recoveryEmail: "",
    operationMode: "",
    setupLocation: "",
    accountScale: "",
  });

  const set = <K extends keyof SetupData>(k: K, v: SetupData[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, SETUP_STEPS.length - 1));
  const back = () => (step === 0 ? onCancel() : setStep((s) => s - 1));

  const stepKeys: HelpStepKey[] = ["language", "essentials", "platform", "review"];

  return (
    <div className="px-6 py-6">
      <SetupHelpRail stepKey={stepKeys[step]} />

      <Banner>
        No administrator found. Complete setup to create the first administrator.
      </Banner>

      <div className="mt-5">
        <StepStrip current={step} />
      </div>

      <div className="mt-8">

        {step === 0 && (
          <StepLanguage
            value={data.language}
            onChange={(v) => set("language", v)}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 1 && (
          <AdministratorSetupForm
            data={data}
            set={set}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 2 && (
          <PlatformSetupForm
            data={data}
            set={set}
            onNext={next}
            onBack={back}
          />
        )}
        {step === 3 && (
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
      <CardHeading title="Confirm default display language for configuration" />
      <Field label="Default display language">
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
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
  const [codeEdited, setCodeEdited] = useState(
    () => data.platformCode !== "" && data.platformCode !== slugify(data.platformName),
  );
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onNext();
      }}
    >
      <CardHeading title="Name Platform" />
      <Field label="What do you want to name this installation?">
        <input
          value={data.platformName}
          onChange={(e) => {
            const name = e.target.value;
            set("platformName", name);
            if (!codeEdited) set("platformCode", slugify(name));
          }}
          placeholder="DIGIT Complaints Management"
          className={inputCls}
        />
      </Field>
      <Field label="What do you want to name the default account?" hint="Lowercase, no spaces.">
        <input
          value={data.platformCode}
          onChange={(e) => {
            setCodeEdited(true);
            set("platformCode", e.target.value);
          }}
          placeholder="default"
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
      <StepActions onBack={onBack} disabled={!valid}>
        Continue
      </StepActions>
    </form>
  );
}

/* ---- Administration Essentials ---- */

const OPERATION_OPTIONS: { value: OperationMode; label: string; hint: string }[] = [
  { value: "demo", label: "Demo", hint: "Pilots and demos" },
  { value: "saas", label: "SaaS", hint: "Multiple accounts" },
  { value: "own", label: "Own deployment", hint: "Dedicated installation" },
];

const LOCATION_OPTIONS: { value: SetupLocation; label: string; hint: string }[] = [
  { value: "laptop", label: "Laptop", hint: "Local setup" },
  { value: "captive", label: "Captive cloud", hint: "Private managed cloud" },
  { value: "hyperscaler", label: "Hyperscaler cloud", hint: "AWS, Azure, GCP, OCI" },
  { value: "datacenter", label: "Data center", hint: "Dedicated infrastructure" },
];

const ACCOUNT_OPTIONS: { value: AccountScale; label: string }[] = [
  { value: "1", label: "1" },
  { value: "2-5", label: "2–5" },
  { value: "6-25", label: "6–25" },
  { value: "25+", label: "25+" },
];

const OPERATION_DEFAULTS: Record<
  OperationMode,
  { location: SetupLocation; scale: AccountScale }
> = {
  demo: { location: "laptop", scale: "1" },
  saas: { location: "hyperscaler", scale: "6-25" },
  own: { location: "datacenter", scale: "1" },
};

function InstallationUseCards({
  value,
  onChange,
}: {
  value: OperationMode | "";
  onChange: (v: OperationMode) => void;
}) {
  return (
    <div className="grid grid-cols-3 items-stretch gap-2">
      {OPERATION_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "flex h-full min-h-[64px] flex-col items-start justify-start gap-1 rounded-sm border px-3 py-2.5 text-left transition-colors " +
              (active
                ? "border-primary bg-primary/[0.06]"
                : "border-border bg-background hover:border-primary/40")
            }
          >
            <span
              className={
                "text-[13px] font-semibold leading-tight " +
                (active ? "text-primary" : "text-foreground")
              }
            >
              {opt.label}
            </span>
            <span className="block w-full text-[12px] leading-snug text-muted-foreground">
              {opt.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function SetupLocationCards({
  value,
  onChange,
}: {
  value: SetupLocation | "";
  onChange: (v: SetupLocation) => void;
}) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-2">
      {LOCATION_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "flex h-full min-h-[64px] flex-col items-start justify-start gap-1 rounded-sm border px-3 py-2.5 text-left transition-colors " +
              (active
                ? "border-primary bg-primary/[0.06]"
                : "border-border bg-background hover:border-primary/40")
            }
          >
            <span
              className={
                "text-[13px] font-semibold leading-tight " +
                (active ? "text-primary" : "text-foreground")
              }
            >
              {opt.label}
            </span>
            <span className="block w-full text-[12px] leading-snug text-muted-foreground">
              {opt.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AccountVolumeSelector({
  value,
  onChange,
}: {
  value: AccountScale | "";
  onChange: (v: AccountScale) => void;
}) {
  return (
    <div className="inline-flex w-full rounded-sm border border-border bg-background p-0.5">
      {ACCOUNT_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              "flex-1 rounded-sm px-2 py-1.5 text-[12.5px] font-medium transition-colors " +
              (active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function FirstAdministratorForm({
  data,
  set,
}: {
  data: SetupData;
  set: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <PlainField
        label={
          <>
            Administrator name <span className="text-destructive">*</span>
          </>
        }
      >
        <input
          value={data.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          required
          className={compactInputCls}
        />
      </PlainField>
      <PlainField
        label={
          <>
            Work email <span className="text-destructive">*</span>
          </>
        }
      >
        <input
          type="email"
          value={data.email}
          onChange={(e) => set("email", e.target.value)}
          required
          className={compactInputCls}
        />
      </PlainField>
      <PlainField label="Recovery email" hint="Optional backup email.">
        <input
          type="email"
          value={data.recoveryEmail}
          onChange={(e) => set("recoveryEmail", e.target.value)}
          className={compactInputCls}
        />
      </PlainField>
    </div>
  );
}

function InstallationContextSection({
  data,
  onOperationChange,
  set,
  tempPassword,
  onOpenTempPasswordModal,
}: {
  data: SetupData;
  onOperationChange: (mode: OperationMode) => void;
  set: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void;
  tempPassword: string | null;
  onOpenTempPasswordModal: () => void;
}) {
  return (
    <section className="space-y-5">
      <SectionTitle>Installation context</SectionTitle>
      <PlainField variant="question" label="How will this installation be used?">
        <InstallationUseCards
          value={data.operationMode}
          onChange={onOperationChange}
        />
      </PlainField>
      <PlainField variant="question" label="Where will it run?">
        <SetupLocationCards
          value={data.setupLocation}
          onChange={(v) => set("setupLocation", v)}
        />
        {data.setupLocation === "laptop" && (
          <LaptopPasswordNotice
            generated={!!tempPassword}
            onAction={onOpenTempPasswordModal}
          />
        )}
      </PlainField>
      <PlainField variant="question" label="Expected accounts">
        <ExpectedAccountsSegment
          value={data.accountScale}
          onChange={(v) => set("accountScale", v)}
        />
      </PlainField>
    </section>
  );
}

function LaptopPasswordNotice({
  generated,
  onAction,
}: {
  generated: boolean;
  onAction: () => void;
}) {
  return (
    <div className="mt-2 flex items-start justify-between gap-3 rounded-sm border border-amber-300/70 bg-amber-50/70 p-3 dark:border-amber-500/30 dark:bg-amber-500/[0.06]">
      <div className="flex items-start gap-2 min-w-0">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground">
            {generated
              ? t("SETUP_TEMP_PWD_GENERATED_TITLE", "Temporary password generated")
              : t("SETUP_TEMP_PWD_REQUIRED_TITLE", "Temporary password required")}
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
            {generated
              ? t(
                  "SETUP_TEMP_PWD_GENERATED_BODY",
                  "Save this password before continuing. It will be required for first login.",
                )
              : t(
                  "SETUP_TEMP_PWD_REQUIRED_BODY",
                  "No email server is configured for a laptop setup. We will generate a temporary password for the first administrator. Save it and use it for first login.",
                )}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 self-start rounded-sm border border-border bg-background px-2.5 py-1 text-[12px] font-medium text-foreground hover:border-primary/40"
      >
        {generated
          ? t("SETUP_TEMP_PWD_VIEW", "View password")
          : t("SETUP_TEMP_PWD_GENERATE", "Generate temporary password")}
      </button>
    </div>
  );
}

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = 0; i < 12; i++) chars.push(pick(all));
  return chars.sort(() => Math.random() - 0.5).join("");
}

function TemporaryPasswordModal({
  open,
  onOpenChange,
  password,
  onRegenerate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  password: string;
  onRegenerate: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast(t("SETUP_TEMP_PWD_COPIED", "Password copied."));
    } catch {
      toast(t("ADMIN_ACTION_NOT_CONFIGURED", "Action not configured in prototype."));
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("SETUP_TEMP_PWD_TITLE", "Temporary password")}</DialogTitle>
          <DialogDescription>
            {t(
              "SETUP_TEMP_PWD_BODY",
              "Save this password. It will be required for first login.",
            )}
          </DialogDescription>
        </DialogHeader>
        <TemporaryPasswordField password={password} visible={visible} />
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? (
              <EyeOff className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Eye className="mr-1.5 h-3.5 w-3.5" />
            )}
            {visible
              ? t("SETUP_TEMP_PWD_HIDE", "Hide password")
              : t("SETUP_TEMP_PWD_SHOW", "Show password")}
          </Button>
          <Button variant="outline" size="sm" onClick={onRegenerate}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t("SETUP_TEMP_PWD_REGEN", "Regenerate")}
          </Button>
          <Button size="sm" onClick={handleCopy}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {t("SETUP_TEMP_PWD_COPY", "Copy password")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t("SETUP_CLOSE", "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemporaryPasswordField({
  password,
  visible,
}: {
  password: string;
  visible: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-foreground">
        {t("SETUP_TEMP_PWD_TITLE", "Temporary password")}
      </label>
      <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/40 px-2.5 py-2">
        <code className="flex-1 truncate font-mono text-[13px] text-foreground">
          {visible ? password : "•".repeat(password.length)}
        </code>
      </div>
    </div>
  );
}

function FirstAdministratorSection({
  data,
  set,
}: {
  data: SetupData;
  set: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void;
}) {
  return (
    <section className="space-y-5">
      <SectionTitle>First administrator</SectionTitle>
      <FirstAdministratorForm data={data} set={set} />
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[18px] font-semibold leading-tight text-foreground">
      {children}
    </h3>
  );
}

function PlainField({
  label,
  hint,
  children,
  variant = "field",
}: {
  label: React.ReactNode;
  hint?: string;
  children: React.ReactNode;
  variant?: "field" | "question";
}) {
  const labelCls =
    variant === "question"
      ? "mb-3 block text-[16px] font-medium leading-snug text-foreground"
      : "mb-2 block text-[15px] font-medium leading-snug text-foreground";
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
      {hint && (
        <span className="mt-2 block text-[14px] leading-relaxed text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}

function SetupFooterActions({
  onBack,
  disabled,
}: {
  onBack: () => void;
  disabled: boolean;
}) {
  return (
    <div className="-mx-6 -mb-6 mt-8 flex items-center justify-between gap-2 border-t border-border bg-background px-6 py-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-10 items-center gap-1.5 rounded-sm px-3 text-[14px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
      <DemoSkipSetupLink />
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex h-10 items-center gap-1.5 rounded-sm bg-primary px-5 text-[14px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground/55"
      >
        Continue
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function DemoSkipSetupLink() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setRole } = useRbac();

  const confirmSkip = () => {
    try {
      localStorage.setItem("demoSetupActive", "1");
      localStorage.setItem("setupStatus", "incomplete");
    } catch {
      // ignore storage errors in demo
    }
    setRole("PLATFORM_ADMIN");
    setOpen(false);
    navigate({ to: "/admin/home" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center rounded-sm px-2 text-[13px] font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        Skip setup for demo
      </button>
      <SkipSetupConfirmationModal
        open={open}
        onOpenChange={setOpen}
        onConfirm={confirmSkip}
      />
    </>
  );
}

function SkipSetupConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-[16px]">Skip setup for demo?</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            We&rsquo;ll use sample settings so you can explore the admin
            console. You can complete setup later.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-9 items-center justify-center rounded-sm border border-border bg-background px-3 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-9 items-center justify-center rounded-sm bg-primary px-3 text-[13px] font-medium text-primary-foreground hover:opacity-90"
          >
            Use sample setup
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Backwards-compatible aliases
const ExpectedAccountsSegment = AccountVolumeSelector;

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
  const emailValid = /.+@.+\..+/.test(data.email);
  const recoveryProvided = data.recoveryEmail.trim().length > 0;
  const recoveryValid = !recoveryProvided || /.+@.+\..+/.test(data.recoveryEmail);

  const valid =
    data.operationMode !== "" &&
    data.setupLocation !== "" &&
    data.accountScale !== "" &&
    data.fullName.trim().length > 0 &&
    emailValid &&
    recoveryValid;

  const onOperationChange = (mode: OperationMode) => {
    const defaults = OPERATION_DEFAULTS[mode];
    set("operationMode", mode);
    set("setupLocation", defaults.location);
    set("accountScale", defaults.scale);
    if (defaults.location !== "laptop") setTempPassword(null);
  };

  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);
  const isLaptop = data.setupLocation === "laptop";

  // Clear temp password if user switches away from laptop
  if (!isLaptop && tempPassword !== null) {
    setTempPassword(null);
    setPwdModalOpen(false);
  }

  const openPwdModal = () => {
    if (!tempPassword) setTempPassword(generateTempPassword());
    setPwdModalOpen(true);
  };
  const regeneratePwd = () => {
    setTempPassword(generateTempPassword());
    toast(t("SETUP_TEMP_PWD_REGENERATED", "New password generated."));
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) onNext();
      }}
    >
      <div>
        <h2 className="text-[24px] font-bold leading-tight text-foreground">
          Administration essentials
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          Set how this installation will run and who manages it first.
        </p>
      </div>

      <InstallationContextSection
        data={data}
        onOperationChange={onOperationChange}
        set={set}
        tempPassword={isLaptop ? tempPassword : null}
        onOpenTempPasswordModal={openPwdModal}
      />

      <FirstAdministratorSection data={data} set={set} />

      <SetupFooterActions onBack={onBack} disabled={!valid} />

      {isLaptop && tempPassword && (
        <TemporaryPasswordModal
          open={pwdModalOpen}
          onOpenChange={setPwdModalOpen}
          password={tempPassword}
          onRegenerate={regeneratePwd}
        />
      )}
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
  const operationLabel: Record<OperationMode, string> = {
    demo: "Demo",
    saas: "SaaS",
    own: "Own Deployment",
  };
  const locationLabel: Record<SetupLocation, string> = {
    laptop: "Laptop",
    captive: "Captive Cloud",
    hyperscaler: "Hyperscaler Cloud",
    datacenter: "Data Center",
  };
  const scaleLabel: Record<AccountScale, string> = {
    "1": "1",
    "2-5": "2–5",
    "6-25": "6–25",
    "25+": "25+",
  };
  const rows: [string, string][] = [
    ["Language", languageLabel],
    ["Installation Use", data.operationMode ? operationLabel[data.operationMode] : "—"],
    ["Setup Location", data.setupLocation ? locationLabel[data.setupLocation] : "—"],
    ["Account Volume", data.accountScale ? scaleLabel[data.accountScale] : "—"],
    ["Administrator name", data.fullName || "—"],
    ["Work email", data.email],
    ["Recovery email", data.recoveryEmail || "—"],
    ["Installation name", data.platformName],
    ["Default account", data.platformCode],
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
  const enter = (to: "/admin/home" | "/admin/audit-log") => {
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
        <PrimaryButton type="button" onClick={() => enter("/admin/home")}>
          Go to Home
          <ArrowRight className="h-3.5 w-3.5" />
        </PrimaryButton>
        <SecondaryButton type="button" onClick={() => enter("/admin/audit-log")}>
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
  label: React.ReactNode;
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
    <div className="flex items-start gap-1.5 rounded-sm border border-border/60 bg-[oklch(0.985_0.003_250)] px-2.5 py-1.5 text-[12px] leading-snug text-muted-foreground">
      <Info className="mt-0.5 h-3 w-3 shrink-0 text-primary/70" />
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
  const reactId = useId();
  const id = `lang-${reactId}`;
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
              {l.native}
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
          {l.native}
        </option>
      ))}
    </select>
  );
}

const inputCls =
  "h-9 w-full rounded-sm border border-border bg-background px-2.5 text-[13px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

const compactInputCls =
  "h-8 w-full rounded-sm border border-border bg-background px-2.5 text-[13px] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15";

const readOnlyInputCls =
  "h-9 w-full rounded-sm border border-border bg-[oklch(0.985_0.003_250)] px-2.5 text-[13px] text-muted-foreground outline-none";
