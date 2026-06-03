import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { t } from "@/lib/i18n";
import { AlertTriangle, MailWarning, MailX, Copy, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/home")({
  head: () => ({ meta: [{ title: "Platform Administration — DIGIT" }] }),
  component: HomePage,
});

const HOME_CARDS: Array<{ code: string; label: string }> = [
  { code: "ADMIN_HOME_SETUP_READINESS", label: "Setup Readiness" },
  { code: "ADMIN_HOME_ACCOUNT_SUMMARY", label: "Account Summary" },
  { code: "ADMIN_HOME_USER_SUMMARY", label: "User Summary" },
  { code: "ADMIN_HOME_CONFIG_HEALTH", label: "Configuration Health" },
  { code: "ADMIN_HOME_RECENT_ACTIVITY", label: "Recent Activity" },
];

function HomePage() {
  const [pwOpen, setPwOpen] = useState(false);
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title={t("ADMIN_HOME_TITLE", "Platform Administration")}
        subtitle={t(
          "ADMIN_HOME_SUBTITLE",
          "Manage setup, accounts, users, templates, and platform readiness.",
        )}
      />
      <div className="flex-1 space-y-6 p-4 lg:p-6">
        <DemoSetupBanner />
        <ReadinessWarningSection onOpenGeneratePassword={() => setPwOpen(true)} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HOME_CARDS.map((c) => (
            <PlaceholderHomeCard key={c.code} title={t(c.code, c.label)} />
          ))}
        </div>
      </div>
      <GeneratePasswordModal open={pwOpen} onOpenChange={setPwOpen} />
    </div>
  );
}

/* ---------- Readiness warnings ---------- */

function ReadinessWarningSection({
  onOpenGeneratePassword,
}: {
  onOpenGeneratePassword: () => void;
}) {
  const noop = () =>
    toast(t("ADMIN_ACTION_NOT_CONFIGURED", "Action not configured in prototype."));
  return (
    <section aria-label={t("ADMIN_ACTION_REQUIRED", "Action required")}>
      <div className="mb-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h2 className="text-[13px] font-semibold tracking-tight text-foreground">
          {t("ADMIN_ACTION_REQUIRED", "Action required")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <WarningCard
          icon={MailWarning}
          title={t("ADMIN_WARN_ADMIN_EMAIL_TITLE", "Administrator email not verified")}
          body={t(
            "ADMIN_WARN_ADMIN_EMAIL_BODY",
            "Verify the platform administrator email to secure account recovery and access notifications.",
          )}
          status="pending"
          actions={
            <>
              <Button size="sm" className="h-7 text-[12px]" onClick={noop}>
                {t("ADMIN_VERIFY_EMAIL", "Verify email")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px]"
                onClick={noop}
              >
                {t("ADMIN_RESEND_VERIFICATION", "Resend verification")}
              </Button>
            </>
          }
        />
        <WarningCard
          icon={MailX}
          title={t("ADMIN_WARN_DEFAULT_EMAIL_TITLE", "Default email setup missing")}
          body={t(
            "ADMIN_WARN_DEFAULT_EMAIL_BODY",
            "Configure a default sender email before sending invites, password resets, or notifications.",
          )}
          status="required"
          actions={
            <>
              <Button size="sm" className="h-7 text-[12px]" onClick={noop}>
                {t("ADMIN_CONFIGURE_EMAIL", "Configure email")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px]"
                onClick={onOpenGeneratePassword}
              >
                {t("ADMIN_GENERATE_PASSWORD", "Generate password")}
              </Button>
            </>
          }
        />
      </div>
    </section>
  );
}

export function WarningCard({
  icon: Icon,
  title,
  body,
  status,
  actions,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  status: "pending" | "required";
  actions?: React.ReactNode;
}) {
  return (
    <div className="rounded border border-amber-300/70 bg-amber-50/70 p-3.5 dark:border-amber-500/30 dark:bg-amber-500/[0.06]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-foreground">{title}</div>
            <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
              {body}
            </p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>
      {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: "pending" | "required" }) {
  const isRequired = status === "required";
  return (
    <span
      className={cn(
        "shrink-0 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        isRequired
          ? "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200"
          : "border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
      )}
    >
      {isRequired
        ? t("ADMIN_STATUS_REQUIRED", "Required")
        : t("ADMIN_STATUS_PENDING", "Pending")}
    </span>
  );
}

/* ---------- Generate password modal ---------- */

function generatePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%^&*";
  const all = upper + lower + digits + symbols;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(symbols)];
  for (let i = 0; i < 12; i++) chars.push(pick(all));
  return chars.sort(() => Math.random() - 0.5).join("");
}

export function GeneratePasswordModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [password, setPassword] = useState(() => generatePassword());
  const [visible, setVisible] = useState(false);

  const handleRegenerate = () => {
    setPassword(generatePassword());
    toast(t("ADMIN_PASSWORD_REGENERATED", "New password generated."));
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast(t("ADMIN_PASSWORD_COPIED", "Password copied."));
    } catch {
      toast(t("ADMIN_ACTION_NOT_CONFIGURED", "Action not configured in prototype."));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("ADMIN_GENERATE_PASSWORD", "Generate password")}</DialogTitle>
          <DialogDescription>
            {t(
              "ADMIN_GENERATE_PASSWORD_BODY",
              "Create a temporary password for platform setup.",
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-foreground">
            {t("ADMIN_GENERATED_PASSWORD", "Generated password")}
          </label>
          <div className="flex items-center gap-2 rounded-sm border border-border bg-muted/40 px-2.5 py-2">
            <code className="flex-1 truncate font-mono text-[13px] text-foreground">
              {visible ? password : "•".repeat(password.length)}
            </code>
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={visible ? "Hide" : "Show"}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerate}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            {t("ADMIN_REGENERATE", "Regenerate")}
          </Button>
          <Button size="sm" onClick={handleCopy}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            {t("ADMIN_COPY_PASSWORD", "Copy password")}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t("ADMIN_CLOSE", "Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Placeholder card ---------- */

export function PlaceholderHomeCard({ title }: { title: string }) {
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="text-[13px] font-semibold text-foreground">{title}</div>
      <div className="mt-3 flex h-28 items-center justify-center rounded-sm border border-dashed border-border bg-background text-[12px] text-muted-foreground">
        {t("ADMIN_HOME_CARD_PLACEHOLDER", "Data will appear here.")}
      </div>
    </div>
  );
}

function DemoSetupBanner() {
  const active =
    typeof window !== "undefined" &&
    window.localStorage.getItem("demoSetupActive") === "1";
  if (!active) return null;
  return (
    <div className="flex items-center gap-2 rounded-sm border border-amber-300/60 bg-amber-50 px-3 py-2 text-[12.5px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>
        {t(
          "ADMIN_DEMO_BANNER",
          "Demo setup active. Complete setup before production use.",
        )}
      </span>
    </div>
  );
}
