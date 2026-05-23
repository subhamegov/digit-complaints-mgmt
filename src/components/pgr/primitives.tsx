import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ComplaintStatus, SlaState, Priority } from "@/lib/mock-data";
import { t } from "@/lib/i18n";

const STATUS_TOKEN: Record<ComplaintStatus, { bg: string; fg: string; label: string }> = {
  OPEN:        { bg: "bg-status-open-bg",     fg: "text-status-open",     label: "STATUS_OPEN" },
  ASSIGNED:    { bg: "bg-status-assigned-bg", fg: "text-status-assigned", label: "STATUS_ASSIGNED" },
  IN_PROGRESS: { bg: "bg-status-progress-bg", fg: "text-status-progress", label: "STATUS_IN_PROGRESS" },
  RESOLVED:    { bg: "bg-status-resolved-bg", fg: "text-status-resolved", label: "STATUS_RESOLVED" },
  REJECTED:    { bg: "bg-status-rejected-bg", fg: "text-status-rejected", label: "STATUS_REJECTED" },
  REOPENED:    { bg: "bg-status-overdue-bg",  fg: "text-status-overdue",  label: "STATUS_REOPENED" },
  CLOSED:      { bg: "bg-status-rejected-bg", fg: "text-status-rejected", label: "STATUS_CLOSED" },
};

export function StatusBadge({ status }: { status: ComplaintStatus }) {
  const tok = STATUS_TOKEN[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", tok.bg, tok.fg)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", tok.fg.replace("text-", "bg-"))} />
      {t(tok.label)}
    </span>
  );
}

export function SlaBadge({ state, remainingHrs }: { state: SlaState; remainingHrs: number }) {
  const map = {
    WITHIN:   { bg: "bg-status-resolved-bg", fg: "text-status-resolved", label: t("SLA_WITHIN") },
    NEARING:  { bg: "bg-status-progress-bg", fg: "text-status-progress", label: t("SLA_NEARING") },
    BREACHED: { bg: "bg-status-breach-bg",   fg: "text-status-breach",   label: t("SLA_BREACHED") },
  } as const;
  const tok = map[state];
  const hrs = Math.abs(remainingHrs);
  const suffix = state === "BREACHED" ? `+${hrs}h over` : `${hrs}h left`;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-medium", tok.bg, tok.fg)}>
      <span className="font-semibold">{tok.label}</span>
      <span className="opacity-70">·</span>
      <span className="tabular-nums">{suffix}</span>
    </span>
  );
}

export function PriorityPill({ p }: { p: Priority }) {
  const map = {
    LOW:    "text-muted-foreground border-border",
    MEDIUM: "text-status-assigned border-status-assigned/30",
    HIGH:   "text-status-breach border-status-breach/40",
  };
  return (
    <span className={cn("inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider", map[p])}>
      {p}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  children,
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  primaryAction?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-surface">
      <div className="px-6 pt-5 pb-4">
        {breadcrumbs && (
          <nav className="mb-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="opacity-50">/</span>}
                <span className={i === breadcrumbs.length - 1 ? "text-foreground" : ""}>{b.label}</span>
              </span>
            ))}
          </nav>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold leading-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>}
          </div>
          {primaryAction}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  intent = "neutral",
}: {
  label: string;
  value: string | number;
  delta?: string;
  intent?: "neutral" | "positive" | "warning" | "negative";
}) {
  const intentMap = {
    neutral:  "text-foreground",
    positive: "text-status-resolved",
    warning:  "text-status-progress",
    negative: "text-status-breach",
  };
  return (
    <div className="rounded border border-border bg-surface p-4">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-[26px] font-semibold tabular-nums leading-none", intentMap[intent])}>{value}</div>
      {delta && <div className="mt-2 text-[12px] text-muted-foreground">{delta}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  padded = true,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("rounded border border-border bg-surface", className)}>
      {title && (
        <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
          {action}
        </header>
      )}
      <div className={padded ? "p-4" : ""}>{children}</div>
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-2 text-[13px] font-medium text-foreground">{t("COMMON_NO_DATA")}</div>
      <div className="text-[12px] text-muted-foreground">{message}</div>
    </div>
  );
}
