import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, AlertTriangle, Clock, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState, PriorityPill } from "@/components/pgr/primitives";
import type { Complaint } from "@/lib/mock-data";
import type { Role } from "@/lib/rbac";
import {
  ACTION_LABEL, DEFAULT_EXPANDED, STATUS_SENTENCE,
  actionsFor, assigneeLabel, escalationCell, escalationOf, serviceLabel, slaLabel, waitingReason,
  type GroupKey,
} from "@/lib/my-complaints";

export type ComplaintGroup = { key: GroupKey | "flat"; label: string; rows: Complaint[] };

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.round(diff / 3_600_000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  const d = Math.round(hrs / 24);
  return d === 1 ? "1 day ago" : `${d} days ago`;
}

/** Relative time is clock-dependent, so render it only after hydration. */
function RelTime({ iso }: { iso: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const absolute = new Date(iso).toISOString().slice(0, 10);
  return <span title={absolute}>{mounted ? relTime(iso) : absolute}</span>;
}

function SlaCell({ c }: { c: Complaint }) {
  const overdue = c.slaRemainingHrs < 0;
  const soon = !overdue && c.slaRemainingHrs <= 24;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] font-medium",
        overdue ? "text-status-breach" : soon ? "text-status-progress" : "text-muted-foreground",
      )}
    >
      {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
      {slaLabel(c)}
    </span>
  );
}

function EscalationDetails({ c, role }: { c: Complaint; role: Role }) {
  const e = escalationOf(c, role);
  if (!e) return null;
  const items: [string, string][] = [
    ["Escalation level", e.level],
    ["Escalated from", e.from],
    ["Escalated to", e.to],
    ["Escalation reason", e.reason],
    ["Time since escalation", `${e.sinceHrs}h`],
    ["Required intervention", e.requiredAction],
  ];
  return (
    <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 rounded-sm border border-border bg-muted/50 px-3 py-2 text-[11px] lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="truncate font-medium text-foreground">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function EscalationCell({ c }: { c: Complaint }) {
  const { escalated, label } = escalationCell(c);
  if (!escalated) return <span className="text-[12px] text-muted-foreground">{label}</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-border bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
      <ArrowUpCircle className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}

function Actions({ c, role }: { c: Complaint; role: Role }) {
  const keys = actionsFor(c, role);
  const [primary, ...rest] = keys;
  if (!primary) return null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link
        to="/inbox/$id"
        params={{ id: c.id }}
        className="rounded-sm bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground hover:opacity-90"
      >
        {ACTION_LABEL[primary]}
      </Link>
      {rest.slice(0, 1).map((k) => (
        <Link
          key={k}
          to="/inbox/$id"
          params={{ id: c.id }}
          className="rounded-sm border border-border px-2 py-1 text-[11px] text-foreground hover:bg-muted"
        >
          {ACTION_LABEL[k]}
        </Link>
      ))}
    </div>
  );
}

type RowProps = { c: Complaint; role: Role; group: GroupKey | "flat"; showEscalation: boolean };

function Row({ c, role, group, showEscalation }: RowProps) {
  const escalation = escalationOf(c, role);
  return (
    <div className="grid grid-cols-12 items-start gap-3 px-4 py-3 hover:bg-muted/40">
      <div className="col-span-3 min-w-0">
        <div className="flex items-center gap-2">
          <Link to="/inbox/$id" params={{ id: c.id }} className="font-mono text-[12px] text-primary hover:underline">
            {c.id}
          </Link>
          <PriorityPill p={c.priority} />
        </div>
        <p className="mt-0.5 line-clamp-2 text-[12px] text-muted-foreground">{c.description}</p>
      </div>
      <div className="col-span-2 min-w-0 text-[12px]">
        <div className="truncate font-medium">{serviceLabel(c)}</div>
        <div className="truncate text-muted-foreground">{c.locality} · {c.ward}</div>
      </div>
      <div className={cn("text-[12px]", showEscalation ? "col-span-1" : "col-span-2")}>
        <div className="font-medium">{STATUS_SENTENCE[c.status] ?? c.status}</div>
        {group === "waiting" && <div className="text-muted-foreground">{waitingReason(c)}</div>}
      </div>
      {showEscalation && <div className="col-span-2"><EscalationCell c={c} /></div>}
      <div className="col-span-1 truncate text-[12px]">{assigneeLabel(c)}</div>
      <div className="col-span-1 text-[12px] text-muted-foreground"><RelTime iso={c.lastUpdated} /></div>
      <div className="col-span-1"><SlaCell c={c} /></div>
      <div className={showEscalation ? "col-span-1" : "col-span-2"}><Actions c={c} role={role} /></div>
      {escalation && group === "escalated_to_me" && (
        <div className="col-span-12"><EscalationDetails c={c} role={role} /></div>
      )}
    </div>
  );
}

function Card({ c, role, group, showEscalation }: RowProps) {
  const escalation = escalationOf(c, role);
  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/inbox/$id" params={{ id: c.id }} className="font-mono text-[12px] text-primary">{c.id}</Link>
        <PriorityPill p={c.priority} />
      </div>
      <p className="text-[13px] font-medium">{serviceLabel(c)}</p>
      <p className="line-clamp-2 text-[12px] text-muted-foreground">{c.description}</p>
      <div className="grid grid-cols-2 gap-y-1 text-[12px]">
        <span className="text-muted-foreground">Locality</span><span>{c.locality} · {c.ward}</span>
        <span className="text-muted-foreground">Status</span><span>{STATUS_SENTENCE[c.status] ?? c.status}</span>
        {showEscalation && (<><span className="text-muted-foreground">Escalation</span><span><EscalationCell c={c} /></span></>)}
        <span className="text-muted-foreground">Assigned to</span><span>{assigneeLabel(c)}</span>
        <span className="text-muted-foreground">Last updated</span><span><RelTime iso={c.lastUpdated} /></span>
        <span className="text-muted-foreground">SLA</span><span><SlaCell c={c} /></span>
        {group === "waiting" && (<><span className="text-muted-foreground">Waiting</span><span>{waitingReason(c)}</span></>)}
      </div>
      {escalation && group === "escalated_to_me" && <EscalationDetails c={c} role={role} />}
      <Actions c={c} role={role} />
    </div>
  );
}

/**
 * Shared complaint list used by all three tabs — grouped (Assigned to me,
 * Needs my attention) and flat (My Organisation's Complaints).
 */
export function ComplaintList({
  groups,
  role,
  grouped,
  emptyMessage,
  showEscalation = false,
}: {
  groups: ComplaintGroup[];
  role: Role;
  grouped: boolean;
  emptyMessage: string;
  showEscalation?: boolean;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of groups) if (g.key !== "flat" && !DEFAULT_EXPANDED.includes(g.key as GroupKey)) init[g.key] = true;
    return init;
  });

  const headers = showEscalation
    ? [
        ["Complaint", "col-span-3"], ["Service and locality", "col-span-2"], ["Status", "col-span-1"],
        ["Escalation", "col-span-2"], ["Assigned to", "col-span-1"], ["Last updated", "col-span-1"],
        ["SLA", "col-span-1"], ["Action", "col-span-1 text-right"],
      ]
    : [
        ["Complaint", "col-span-3"], ["Service and locality", "col-span-2"], ["Status", "col-span-2"],
        ["Assigned to", "col-span-1"], ["Last updated", "col-span-1"], ["SLA", "col-span-1"],
        ["Action", "col-span-2 text-right"],
      ];

  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  if (total === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="divide-y divide-border">
      <div className="hidden grid-cols-12 gap-3 bg-muted/50 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground lg:grid">
        {headers.map(([h, span]) => <span key={h} className={span}>{h}</span>)}
      </div>
      {groups.map((g) => {
        const isCollapsed = !!collapsed[g.key];
        return (
          <div key={g.key}>
            {grouped && g.key !== "flat" && (
              <button
                type="button"
                onClick={() => setCollapsed((s) => ({ ...s, [g.key]: !s[g.key] }))}
                className="flex w-full items-center justify-between bg-muted/70 px-4 py-2 text-left hover:bg-muted"
                aria-expanded={!isCollapsed}
              >
                <span className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-foreground">
                  {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {g.label}
                </span>
                <span className="text-[12px] text-muted-foreground tabular-nums">
                  {g.rows.length} {g.rows.length === 1 ? "complaint" : "complaints"}
                </span>
              </button>
            )}
            {!isCollapsed && (
              <div className="divide-y divide-border">
                {g.rows.map((c) => (
                  <div key={c.id}>
                    <div className="hidden lg:block"><Row c={c} role={role} group={g.key} showEscalation={showEscalation} /></div>
                    <div className="lg:hidden"><Card c={c} role={role} group={g.key} showEscalation={showEscalation} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
