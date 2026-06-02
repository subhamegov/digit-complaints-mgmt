import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { t } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/home")({
  head: () => ({ meta: [{ title: "Platform Administration — DIGIT" }] }),
  component: HomePage,
});

const HOME_CARDS: Array<{ code: string; label: string }> = [
  { code: "ADMIN_HOME_SETUP_READINESS",   label: "Setup Readiness" },
  { code: "ADMIN_HOME_ACCOUNT_SUMMARY",   label: "Account Summary" },
  { code: "ADMIN_HOME_USER_SUMMARY",      label: "User Summary" },
  { code: "ADMIN_HOME_CONFIG_HEALTH",     label: "Configuration Health" },
  { code: "ADMIN_HOME_RECENT_ACTIVITY",   label: "Recent Activity" },
];

function HomePage() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title={t("ADMIN_HOME_TITLE", "Platform Administration")}
        subtitle={t(
          "ADMIN_HOME_SUBTITLE",
          "Manage setup, accounts, users, templates, and platform readiness.",
        )}
      />
      <div className="flex-1 space-y-4 p-4 lg:p-6">
        <DemoSetupBanner />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {HOME_CARDS.map((c) => (
            <PlaceholderCard key={c.code} title={t(c.code, c.label)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderCard({ title }: { title: string }) {
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
