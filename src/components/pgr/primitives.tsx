import type { ReactNode, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { ComplaintStatus, SlaState, Priority, Complaint } from "@/lib/mock-data";
import { officerOf } from "@/lib/mock-data";
import { t } from "@/lib/i18n";
import { useRbac, type Permission } from "@/lib/rbac";
import { X } from "lucide-react";

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
      <div className="px-4 lg:px-6 pt-4 pb-3 lg:pt-5 lg:pb-4">
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
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-[18px] lg:text-[20px] font-semibold leading-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1 text-[12px] lg:text-[13px] text-muted-foreground">{subtitle}</p>}
          </div>
          {primaryAction && <div className="shrink-0">{primaryAction}</div>}
        </div>
        {children && <div className="mt-3 lg:mt-4">{children}</div>}
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  intent = "neutral",
  onRemove,
  history,
  deltaValue,
  improveDirection,
}: {
  label: string;
  value: string | number;
  delta?: string;
  intent?: "neutral" | "positive" | "warning" | "negative";
  onRemove?: () => void;
  /** Series for the bottom sparkline. */
  history?: number[];
  /** Change amount label rendered next to the value (e.g. "18%" or "0.6"). */
  deltaValue?: string;
  /** Which direction is "good" for this metric. Drives the delta colour. */
  improveDirection?: "up" | "down";
}) {
  const intentMap = {
    neutral:  "text-foreground",
    positive: "text-status-resolved",
    warning:  "text-status-progress",
    negative: "text-status-breach",
  };

  // Derive the arrow direction from the sparkline (first vs last point).
  let trendDir: "up" | "down" | "flat" = "flat";
  if (history && history.length >= 2) {
    const diff = history[history.length - 1] - history[0];
    trendDir = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  }
  const isGood =
    improveDirection && trendDir !== "flat"
      ? trendDir === improveDirection
      : null;
  const deltaColor =
    isGood === null
      ? "text-muted-foreground"
      : isGood
        ? "text-status-resolved"
        : "text-status-breach";

  // Sparkline geometry.
  const sparkPath = (() => {
    if (!history || history.length < 2) return null;
    const w = 100;
    const h = 24;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min || 1;
    const step = w / (history.length - 1);
    return history
      .map((v, i) => {
        const x = i * step;
        const y = h - ((v - min) / range) * h;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  })();

  return (
    <div className="relative rounded border border-border bg-surface p-4 pb-6 group overflow-hidden">
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-status-breach focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label={`Remove ${label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className={cn("text-[26px] font-semibold tabular-nums leading-none", intentMap[intent])}>{value}</div>
        {deltaValue && trendDir !== "flat" && (
          <div className={cn("text-[12px] font-medium tabular-nums leading-none", deltaColor)}>
            <span aria-hidden>{trendDir === "up" ? "▲" : "▼"}</span>
            {deltaValue}
          </div>
        )}
      </div>
      {delta && <div className="mt-2 text-[12px] text-muted-foreground">{delta}</div>}
      {sparkPath && (
        <svg
          className="absolute bottom-0 left-0 h-6 w-full"
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d={sparkPath}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            className={deltaColor}
          />
        </svg>
      )}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  padded = true,
  onRemove,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  onRemove?: () => void;
}) {
  return (
    <section className={cn("relative rounded border border-border bg-surface", className)}>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute top-1 right-1 z-10 inline-flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-status-breach focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label={title ? `Remove ${title}` : "Remove"}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
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

/* ---------- Reusable RBAC-aware primitives ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: Permission;
  anyOf?: Permission[];
  variant?: ButtonVariant;
  icon?: ReactNode;
}

/**
 * Permission-aware action button. Hides itself when the current role lacks
 * the required permission(s). Use for every page-level / row-level action so
 * RBAC stays at the component layer, not the page layer.
 */
export function ActionButton({
  permission,
  anyOf,
  variant = "secondary",
  icon,
  className,
  children,
  ...rest
}: ActionButtonProps) {
  const { hasPermission, hasAnyPermission } = useRbac();
  const allowed = permission
    ? hasPermission(permission)
    : anyOf
    ? hasAnyPermission(anyOf)
    : true;
  if (!allowed) return null;

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "border border-border bg-surface text-foreground hover:bg-muted",
    ghost: "text-muted-foreground hover:bg-muted",
    danger: "border border-status-breach/40 bg-status-breach-bg text-status-breach hover:opacity-90",
  };

  return (
    <button
      {...rest}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-sm px-3 text-[12px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** Filter / action strip used above tables — keeps every page consistent. */
export function Toolbar({
  children,
  meta,
}: {
  children: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {meta && <div className="ml-auto flex items-center gap-3 text-[12px] text-muted-foreground">{meta}</div>}
    </div>
  );
}

/** Owner cell — shows assigned officer with designation, or Unassigned. */
export function OwnerCell({ id }: { id?: string }) {
  const o = officerOf(id);
  if (!o)
    return <span className="text-[12px] italic text-muted-foreground">{t("COMMON_UNASSIGNED")}</span>;
  return (
    <div className="leading-tight">
      <div className="text-[12px] font-medium text-foreground">{o.name}</div>
      <div className="text-[11px] text-muted-foreground">{o.designation}</div>
    </div>
  );
}

/** Computes the next action expected for a complaint, by status. */
export function nextActionFor(c: Complaint): string {
  switch (c.status) {
    case "OPEN":        return t("ACTION_ROUTE");
    case "ASSIGNED":    return t("ACTION_PICK_UP");
    case "IN_PROGRESS": return t("ACTION_RESOLVE");
    case "REOPENED":    return t("ACTION_RESOLVE");
    case "RESOLVED":    return t("ACTION_VERIFY");
    case "REJECTED":    return "—";
    case "CLOSED":      return "—";
  }
}

/** Table column type — supports component-level RBAC via `requires`. */
export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  requires?: Permission;
  className?: string;
}

/** Permission-aware data table. Columns with `requires` are hidden for roles
 *  that lack the permission. Keeps RBAC out of page-level JSX. */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage,
}: {
  columns: Column<T>[];
  rows: T[];
  emptyMessage: string;
}) {
  const { hasPermission } = useRbac();
  const visible = columns.filter((c) => !c.requires || hasPermission(c.requires));
  if (rows.length === 0) return <EmptyState message={emptyMessage} />;
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[720px] text-[13px]">
        <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            {visible.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-3 py-2 font-medium whitespace-nowrap",
                  c.align === "right" ? "text-right" : "text-left",
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-muted/40">
              {visible.map((c) => (
                <td
                  key={c.key}
                  className={cn("px-3 py-2 align-top", c.align === "right" ? "text-right" : "text-left", c.className)}
                >
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
