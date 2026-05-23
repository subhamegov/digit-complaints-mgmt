import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Download, Plus, Search, X } from "lucide-react";
import { PageHeader, Panel, StatusBadge, SlaBadge, PriorityPill, EmptyState } from "@/components/pgr/primitives";
import { COMPLAINTS, COMPLAINT_TYPES, complaintTypeOf, officerOf, type ComplaintStatus, type SlaState } from "@/lib/mock-data";
import { Can, useRbac } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/inbox/")({
  head: () => ({ meta: [{ title: "Inbox — DIGIT PGR" }] }),
  component: InboxPage,
});

const STATUSES: ComplaintStatus[] = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "REJECTED", "REOPENED"];
const SLA_STATES: SlaState[] = ["WITHIN", "NEARING", "BREACHED"];

function InboxPage() {
  const { hasPermission } = useRbac();
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

  // Summary strip
  const summary = {
    total: rows.length,
    open: rows.filter((c) => c.status === "OPEN").length,
    breached: rows.filter((c) => c.slaState === "BREACHED").length,
  };

  return (
    <div>
      <PageHeader
        title={t("COMMON_INBOX")}
        subtitle="All citizen complaints in your jurisdiction"
        primaryAction={
          <div className="flex gap-2">
            <button className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-3 text-[12px] font-medium hover:bg-muted">
              <Download className="h-3.5 w-3.5" /> {t("COMMON_DOWNLOAD")}
            </button>
            <Can perm="PGR_COMPLAINT_CREATE">
              <Link to="/complaints/new" className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-3.5 w-3.5" /> {t("ACTION_REGISTER")}
              </Link>
            </Can>
          </div>
        }
      >
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search complaint no., citizen, mobile…"
              className="h-8 w-[280px] rounded-sm border border-border bg-background pl-8 pr-3 text-[12px] outline-none focus:border-primary"
            />
          </div>
          <FilterSelect label={t("CS_COMPLAINT_STATUS")} value={status} onChange={(v) => setStatus(v as ComplaintStatus | "ALL")}
            options={[{ label: t("COMMON_ALL"), value: "ALL" }, ...STATUSES.map((s) => ({ label: t(`STATUS_${s}`), value: s }))]} />
          <FilterSelect label={t("CS_SLA_STATUS")} value={sla} onChange={(v) => setSla(v as SlaState | "ALL")}
            options={[{ label: t("COMMON_ALL"), value: "ALL" }, ...SLA_STATES.map((s) => ({ label: t(`SLA_${s}`), value: s }))]} />
          <FilterSelect label={t("CS_DEPARTMENT")} value={dept} onChange={setDept}
            options={[{ label: t("COMMON_ALL"), value: "ALL" }, ...departments.map((d) => ({ label: d, value: d }))]} />
          <FilterSelect label={t("COMMON_WARD")} value={ward} onChange={setWard}
            options={[{ label: t("COMMON_ALL"), value: "ALL" }, ...wards.map((w) => ({ label: w, value: w }))]} />
          <button onClick={reset} className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 text-[12px] text-muted-foreground hover:bg-muted">
            <X className="h-3 w-3" /> {t("COMMON_RESET")}
          </button>

          <div className="ml-auto flex items-center gap-3 text-[12px] text-muted-foreground">
            <span><strong className="text-foreground tabular-nums">{summary.total}</strong> total</span>
            <span><strong className="text-status-open tabular-nums">{summary.open}</strong> open</span>
            <span><strong className="text-status-breach tabular-nums">{summary.breached}</strong> breached</span>
          </div>
        </div>
      </PageHeader>

      <div className="p-6">
        <Panel padded={false}>
          {rows.length === 0 ? (
            <EmptyState message={t("EMPTY_INBOX")} />
          ) : (
            <table className="w-full text-[13px]">
              <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th>{t("CS_COMPLAINT_NO")}</Th>
                  <Th>{t("CS_COMPLAINT_TYPE")}</Th>
                  {/* Citizen column is PII-gated */}
                  {hasPermission("PGR_CITIZEN_PII_VIEW") && <Th>{t("COMMON_NAME")}</Th>}
                  <Th>{t("COMMON_WARD")}</Th>
                  <Th>{t("CS_ASSIGNED_OFFICER")}</Th>
                  <Th>{t("CS_PRIORITY")}</Th>
                  <Th>{t("CS_SLA_STATUS")}</Th>
                  <Th>{t("CS_COMPLAINT_STATUS")}</Th>
                  <Th className="text-right">{t("CS_FILED_ON")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => {
                  const officer = officerOf(c.assignedOfficerId);
                  return (
                    <tr key={c.id} className="hover:bg-muted/40">
                      <td className="px-4 py-2.5 font-mono text-[12px]">
                        <Link to="/inbox/$id" params={{ id: c.id }} className="text-primary hover:underline">{c.id}</Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-foreground">{complaintTypeOf(c.typeCode)?.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.department}</div>
                      </td>
                      {hasPermission("PGR_CITIZEN_PII_VIEW") && (
                        <td className="px-4 py-2.5">
                          <div>{c.citizen.name}</div>
                          <div className="text-[11px] text-muted-foreground tabular-nums">{c.citizen.mobile}</div>
                        </td>
                      )}
                      <td className="px-4 py-2.5">{c.ward}</td>
                      <td className="px-4 py-2.5 text-[12px]">{officer ? officer.name : <span className="text-muted-foreground italic">Unassigned</span>}</td>
                      <td className="px-4 py-2.5"><PriorityPill p={c.priority} /></td>
                      <td className="px-4 py-2.5"><SlaBadge state={c.slaState} remainingHrs={c.slaRemainingHrs} /></td>
                      <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                      <td className="px-4 py-2.5 text-right text-[12px] text-muted-foreground tabular-nums">{new Date(c.filedOn).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[12px] text-muted-foreground">
            <span>{t("COMMON_SHOWING")} 1–{rows.length} {t("COMMON_OF")} {rows.length}</span>
            <div className="flex gap-1">
              <button disabled className="rounded-sm border border-border px-2 py-1 text-[11px] opacity-50">Prev</button>
              <button className="rounded-sm border border-border px-2 py-1 text-[11px] hover:bg-muted">Next</button>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2 text-left font-medium", className)}>{children}</th>;
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
