import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Network } from "lucide-react";
import { PageHeader, Panel, StatusBadge, SlaBadge, PriorityPill, EmptyState } from "@/components/pgr/primitives";
import { ComplaintList } from "@/components/pgr/ComplaintList";
import { OrgStructureDrawer } from "@/components/pgr/OrgStructureDrawer";
import { COMPLAINTS, OFFICERS, complaintTypeOf, COMPLAINT_TYPES } from "@/lib/mock-data";
import { useRbac, type Role } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  EMPTY_COPY, ORG_FILTERS, PERSONA_DEFAULT_TAB, PERSONA_FILTER_FIELDS, STATUS_SENTENCE,
  groupComplaints, matchesOrgFilter, orgProfileFor, orgScoped, personallyOwned,
  type OrgFilterKey,
} from "@/lib/my-complaints";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "My Complaints — DIGIT Complaint Management" },
      { name: "description", content: "Complaints assigned to you and complaints handled by your organisation, grouped by operational priority." },
      { property: "og:title", content: "My Complaints — DIGIT Complaint Management" },
      { property: "og:description", content: "Complaints assigned to you and complaints handled by your organisation, grouped by operational priority." },
    ],
  }),
  component: TasksPage,
});

const WORKSPACE_ROLES: Role[] = ["LME", "GRO", "DEPT_HEAD"];

function TasksPage() {
  const { role } = useRbac();
  return WORKSPACE_ROLES.includes(role) ? <MyComplaintsWorkspace /> : <LegacyTasks />;
}

/* ------------------------------------------------------------------ */
/* My Complaints workspace (Field Employee, GRO, Department Head)      */
/* ------------------------------------------------------------------ */

function MyComplaintsWorkspace() {
  const { role, tenant, jurisdiction } = useRbac();
  const profile = useMemo(() => orgProfileFor(role, tenant.name), [role, tenant.name]);
  const [tab, setTab] = useState<"mine" | "org">(PERSONA_DEFAULT_TAB[role] ?? "mine");
  // Persona default tab; re-applied when the working-context role resolves/changes.
  const lastRole = useRef(role);
  useEffect(() => {
    if (lastRole.current !== role) {
      lastRole.current = role;
      setTab(PERSONA_DEFAULT_TAB[role] ?? "mine");
    }
  }, [role]);
  const [drawer, setDrawer] = useState(false);

  const mineGroups = useMemo(
    () => (profile ? groupComplaints(personallyOwned(profile, jurisdiction.code), role) : []),
    [profile, jurisdiction.code, role],
  );

  return (
    <div>
      <PageHeader
        title="My Complaints"
        subtitle="View complaints assigned to you and complaints handled by your organisation."
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-sm border border-border bg-muted/50 px-3 py-1.5">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Working context</div>
            <div className="text-[12px] font-medium">
              {jurisdiction.name} · {profile?.department ?? "Unmapped unit"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-[12px] font-medium hover:bg-muted"
          >
            <Network className="h-3.5 w-3.5" /> View my organisation structure
          </button>
        </div>
      </PageHeader>

      <div className="p-4 lg:p-6 space-y-4">
        {!profile ? (
          <Panel title="My Complaints" padded={false}>
            <EmptyState message={EMPTY_COPY.noOrg} />
          </Panel>
        ) : (
          <>
            <div className="flex items-center gap-1 border-b border-border">
              {([
                { key: "mine", label: "My Complaints" },
                { key: "org", label: "My Organisation’s Complaints" },
              ] as const).map((x) => (
                <button
                  key={x.key}
                  type="button"
                  onClick={() => setTab(x.key)}
                  className={cn(
                    "-mb-px border-b-2 px-3 py-2 text-[13px] font-medium",
                    tab === x.key
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={tab === x.key}
                >
                  {x.label}
                </button>
              ))}
            </div>

            {tab === "mine" ? (
              <Panel title="Grouped by operational priority" padded={false}>
                <ComplaintList
                  groups={mineGroups}
                  role={role}
                  grouped
                  emptyMessage={EMPTY_COPY.mine}
                />
              </Panel>
            ) : (
              <OrgTab />
            )}
          </>
        )}
      </div>

      <OrgStructureDrawer
        open={drawer}
        onOpenChange={setDrawer}
        profile={profile}
        jurisdictionName={jurisdiction.name}
      />
    </div>
  );
}

function OrgTab() {
  const { role, tenant, jurisdiction } = useRbac();
  const profile = useMemo(() => orgProfileFor(role, tenant.name), [role, tenant.name]);
  const [summary, setSummary] = useState<OrgFilterKey>("needs_action");
  const [unit, setUnit] = useState("ALL");
  const [assignee, setAssignee] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [service, setService] = useState("ALL");
  const [locality, setLocality] = useState("ALL");
  const [sla, setSla] = useState("ALL");
  const [range, setRange] = useState("ALL");

  const allowed = PERSONA_FILTER_FIELDS[role] ?? [];
  const scoped = useMemo(() => (profile ? orgScoped(profile, jurisdiction.code) : []), [profile, jurisdiction.code]);

  const rows = useMemo(() => {
    const cutoff = range === "ALL" ? 0 : Date.now() - Number(range) * 86_400_000;
    return scoped.filter((c) => {
      if (!matchesOrgFilter(c, summary, role)) return false;
      if (unit !== "ALL" && c.department !== unit) return false;
      if (assignee !== "ALL" && (c.assignedOfficerId ?? "UNASSIGNED") !== assignee) return false;
      if (status !== "ALL" && c.status !== status) return false;
      if (service !== "ALL" && c.typeCode !== service) return false;
      if (locality !== "ALL" && c.ward !== locality) return false;
      if (sla !== "ALL" && c.slaState !== sla) return false;
      if (new Date(c.filedOn).getTime() < cutoff) return false;
      return true;
    });
  }, [scoped, summary, unit, assignee, status, service, locality, sla, range, role]);

  const units = Array.from(new Set(scoped.map((c) => c.department)));
  const localities = Array.from(new Set(scoped.map((c) => c.ward)));

  const sel = "h-8 rounded-sm border border-border bg-background px-2 text-[12px]";

  return (
    <Panel title="Organisation workload" padded={false}>
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
        {ORG_FILTERS.map((f) => {
          const count = scoped.filter((c) => matchesOrgFilter(c, f.key, role)).length;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setSummary(f.key)}
              className={cn(
                "rounded-sm border px-2 py-1 text-[12px]",
                summary === f.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label} <span className="tabular-nums opacity-80">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
        {allowed.includes("unit") && (
          <select className={sel} value={unit} onChange={(e) => setUnit(e.target.value)} aria-label="Organisational unit">
            <option value="ALL">All units</option>
            {units.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        )}
        {allowed.includes("assignee") && (
          <select className={sel} value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Assignee">
            <option value="ALL">All assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {OFFICERS.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        {allowed.includes("status") && (
          <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Complaint status">
            <option value="ALL">All statuses</option>
            {Object.entries(STATUS_SENTENCE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        {allowed.includes("service") && (
          <select className={sel} value={service} onChange={(e) => setService(e.target.value)} aria-label="Service">
            <option value="ALL">All services</option>
            {COMPLAINT_TYPES.map((ct) => <option key={ct.code} value={ct.code}>{ct.name}</option>)}
          </select>
        )}
        {allowed.includes("locality") && (
          <select className={sel} value={locality} onChange={(e) => setLocality(e.target.value)} aria-label="Locality">
            <option value="ALL">All localities</option>
            {localities.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        )}
        {allowed.includes("sla") && (
          <select className={sel} value={sla} onChange={(e) => setSla(e.target.value)} aria-label="SLA condition">
            <option value="ALL">Any SLA condition</option>
            <option value="WITHIN">Within SLA</option>
            <option value="NEARING">Due soon</option>
            <option value="BREACHED">Overdue</option>
          </select>
        )}
        {allowed.includes("date") && (
          <select className={sel} value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range">
            <option value="ALL">Any date</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last 12 months</option>
          </select>
        )}
      </div>

      <ComplaintList
        groups={[{ key: "flat", label: "All", rows }]}
        role={role}
        grouped={false}
        emptyMessage={EMPTY_COPY.org}
      />
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/* Legacy task list — unchanged for all other personas                 */
/* ------------------------------------------------------------------ */

function LegacyTasks() {
  const { role, userName } = useRbac();

  const mine = COMPLAINTS.filter((c) => {
    if (role === "LME") return c.assignedOfficerId === "EMP-1042" || c.assignedOfficerId === "EMP-1071" || c.assignedOfficerId === "EMP-1103";
    if (role === "GRO") return c.status === "OPEN";
    if (role === "DEPT_HEAD") return c.slaState === "BREACHED" || c.slaState === "NEARING";
    return c.status !== "RESOLVED" && c.status !== "REJECTED";
  });

  const buckets = [
    { key: "today", label: t("TASK_BUCKET_TODAY"), rows: mine.filter((c) => c.slaState !== "WITHIN").slice(0, 6) },
    { key: "week",  label: t("TASK_BUCKET_WEEK"), rows: mine.filter((c) => c.slaState === "WITHIN").slice(0, 6) },
    { key: "later", label: t("TASK_BUCKET_PENDING"), rows: COMPLAINTS.filter((c) => c.status === "RESOLVED").slice(0, 3) },
  ];

  return (
    <div>
      <PageHeader title={t("COMMON_MY_TASKS")} subtitle={`Open items assigned to ${userName}`}>
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span><strong className="text-foreground tabular-nums">{mine.length}</strong> active</span>
          <span><strong className="text-status-breach tabular-nums">{mine.filter((c) => c.slaState === "BREACHED").length}</strong> breached</span>
          <span><strong className="text-status-progress tabular-nums">{mine.filter((c) => c.slaState === "NEARING").length}</strong> nearing</span>
        </div>
      </PageHeader>

      <div className="p-4 lg:p-6 space-y-4">
        {buckets.map((b) => (
          <Panel key={b.key} title={b.label} action={<span className="text-[11px] text-muted-foreground">{b.rows.length} items</span>} padded={false}>
            {b.rows.length === 0 ? <EmptyState message={t("EMPTY_TASKS")} /> : (
              <ul className="divide-y divide-border">
                {b.rows.map((c) => (
                  <li key={c.id}>
                    <Link to="/inbox/$id" params={{ id: c.id }} className="grid grid-cols-12 items-center gap-3 px-4 py-2.5 hover:bg-muted/40">
                      <span className="col-span-2 font-mono text-[12px] text-primary">{c.id}</span>
                      <span className="col-span-4 truncate text-[13px] font-medium">{complaintTypeOf(c.typeCode)?.name}</span>
                      <span className="col-span-1 text-[12px] text-muted-foreground">{c.ward}</span>
                      <span className="col-span-1"><PriorityPill p={c.priority} /></span>
                      <span className="col-span-2"><SlaBadge state={c.slaState} remainingHrs={c.slaRemainingHrs} /></span>
                      <span className="col-span-2 justify-self-end"><StatusBadge status={c.status} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ))}
      </div>
    </div>
  );
}
