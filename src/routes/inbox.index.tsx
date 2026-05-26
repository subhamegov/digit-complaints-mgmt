import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import {
  PageHeader, Panel, StatusBadge, SlaBadge, PriorityPill,
  ActionButton, Toolbar, OwnerCell, DataTable, nextActionFor,
  type Column,
} from "@/components/pgr/primitives";
import {
  COMPLAINTS, COMPLAINT_TYPES, complaintTypeOf,
  type Complaint, type ComplaintStatus, type SlaState,
} from "@/lib/mock-data";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/inbox/")({
  head: () => ({ meta: [{ title: "Inbox — DIGIT PGR" }] }),
  component: InboxPage,
});

const STATUSES: ComplaintStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "REOPENED"];
const SLA_STATES: SlaState[] = ["WITHIN", "NEARING", "BREACHED"];

function InboxPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ComplaintStatus | "ALL">("ALL");
  const [sla, setSla] = useState<SlaState | "ALL">("ALL");
  const [dept, setDept] = useState<string>("ALL");
  const [ward, setWard] = useState<string>("ALL");

  const rows = useMemo(() => {
    return COMPLAINTS.filter((c) => {
      if (status !== "ALL" && c.status !== status) return false;
      if (sla !== "ALL" && c.slaState !== sla) return false;
      if (dept !== "ALL" && c.department !== dept) return false;
      if (ward !== "ALL" && c.ward !== ward) return false;
      if (q) {
        const hay = `${c.id} ${c.citizen.name} ${c.citizen.mobile} ${c.description}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [q, status, sla, dept, ward]);

  const reset = () => { setQ(""); setStatus("ALL"); setSla("ALL"); setDept("ALL"); setWard("ALL"); };
  const departments = Array.from(new Set(COMPLAINT_TYPES.map((t) => t.department)));
  const wards = Array.from(new Set(COMPLAINTS.map((c) => c.ward)));

  const summary = {
    total: rows.length,
    open: rows.filter((c) => c.status === "OPEN").length,
    breached: rows.filter((c) => c.slaState === "BREACHED").length,
  };

  const columns: Column<Complaint>[] = [
    {
      key: "id", header: t("CS_COMPLAINT_NO"),
      cell: (c) => (
        <Link to="/inbox/$id" params={{ id: c.id }} className="font-mono text-[12px] text-primary hover:underline">
          {c.id}
        </Link>
      ),
    },
    {
      key: "type", header: t("CS_COMPLAINT_TYPE"),
      cell: (c) => (
        <div className="leading-tight">
          <div className="text-[13px] font-medium text-foreground">{complaintTypeOf(c.typeCode)?.name}</div>
          <div className="text-[11px] text-muted-foreground">{c.department}</div>
        </div>
      ),
    },
    {
      key: "citizen", header: t("COMMON_NAME"), requires: "PGR_CITIZEN_PII_VIEW",
      cell: (c) => (
        <div className="leading-tight">
          <div className="text-[12px]">{c.citizen.name}</div>
          <div className="text-[11px] tabular-nums text-muted-foreground">{c.citizen.mobile}</div>
        </div>
      ),
    },
    { key: "locality", header: t("COMMON_LOCALITY"), cell: (c) => <span className="text-[12px]">{c.locality}</span> },
    { key: "owner", header: t("COMMON_OWNER"), cell: (c) => <OwnerCell id={c.assignedOfficerId} /> },
    { key: "priority", header: t("CS_PRIORITY"), cell: (c) => <PriorityPill p={c.priority} /> },
    { key: "sla", header: t("CS_SLA_STATUS"), cell: (c) => <SlaBadge state={c.slaState} remainingHrs={c.slaRemainingHrs} /> },
    { key: "status", header: t("CS_COMPLAINT_STATUS"), cell: (c) => <StatusBadge status={c.status} /> },
    {
      key: "next", header: t("CS_NEXT_ACTION"),
      cell: (c) => <span className="text-[12px] font-medium text-foreground">{nextActionFor(c)}</span>,
    },
    {
      key: "filed", header: t("CS_FILED_ON"), align: "right",
      cell: (c) => (
        <span className="text-[12px] tabular-nums text-muted-foreground">
          {new Date(c.filedOn).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("COMMON_INBOX")}
        subtitle="Citizen complaints in your jurisdiction"
        primaryAction={
          <div className="flex gap-2">
            <ActionButton variant="secondary" icon={<Download className="h-3.5 w-3.5" />}>
              {t("COMMON_EXPORT")}
            </ActionButton>
            <Link to="/complaints/new">
              <ActionButton permission="PGR_COMPLAINT_CREATE" variant="primary" icon={<Plus className="h-3.5 w-3.5" />}>
                {t("ACTION_REGISTER")}
              </ActionButton>
            </Link>
          </div>
        }
      >
        <Toolbar
          meta={
            <>
              <span><strong className="text-foreground tabular-nums">{summary.total}</strong> total</span>
              <span><strong className="text-status-open tabular-nums">{summary.open}</strong> open</span>
              <span><strong className="text-status-breach tabular-nums">{summary.breached}</strong> breached</span>
            </>
          }
        >
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search no., citizen, mobile…"
              className="h-8 w-[260px] rounded-sm border border-border bg-background pl-8 pr-3 text-[12px] outline-none focus:border-primary"
            />
          </div>
          <FilterSelect label={t("CS_COMPLAINT_STATUS")} value={status} onChange={(v) => setStatus(v as ComplaintStatus | "ALL")}
            options={[{ label: t("COMMON_ALL"), value: "ALL" }, ...STATUSES.map((s) => ({ label: t(`STATUS_${s}`), value: s }))]} />
          <FilterSelect label={t("CS_SLA_STATUS")} value={sla} onChange={(v) => setSla(v as SlaState | "ALL")}
            options={[{ label: t("COMMON_ALL"), value: "ALL" }, ...SLA_STATES.map((s) => ({ label: t(`SLA_${s}`), value: s }))]} />
          <FilterSelect label={t("CS_DEPARTMENT")} value={dept} onChange={setDept}
            options={[{ label: t("COMMON_ALL"), value: "ALL" }, ...departments.map((d) => ({ label: d, value: d }))]} />
          <FilterSelect label={t("COMMON_LOCALITY")} value={ward} onChange={setWard}
            options={[{ label: t("COMMON_ALL"), value: "ALL" }, ...wards.map((w) => ({ label: w, value: w }))]} />
          <button onClick={reset} className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 text-[12px] text-muted-foreground hover:bg-muted">
            <X className="h-3 w-3" /> {t("COMMON_RESET")}
          </button>
        </Toolbar>
      </PageHeader>

      <div className="p-4">
        <Panel padded={false}>
          <DataTable columns={columns} rows={rows} emptyMessage={t("EMPTY_INBOX")} />
          <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[12px] text-muted-foreground">
            <span>{t("COMMON_SHOWING")} 1–{rows.length} {t("COMMON_OF")} {rows.length}</span>
            <div className="flex gap-1">
              <button disabled className="rounded-sm border border-border px-2 py-1 text-[11px] opacity-50">{t("COMMON_PREV")}</button>
              <button className="rounded-sm border border-border px-2 py-1 text-[11px] hover:bg-muted">{t("COMMON_NEXT_PAGE")}</button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <label className="flex items-center gap-1.5 rounded-sm border border-border bg-background px-2 py-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-[12px] outline-none">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
