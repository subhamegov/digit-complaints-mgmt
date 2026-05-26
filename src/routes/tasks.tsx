import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, Panel, StatusBadge, SlaBadge, PriorityPill, EmptyState } from "@/components/pgr/primitives";
import { COMPLAINTS, complaintTypeOf } from "@/lib/mock-data";
import { useRbac } from "@/lib/rbac";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "My Tasks — DIGIT PGR" }] }),
  component: TasksPage,
});

function TasksPage() {
  const { role, userName } = useRbac();

  // Filter "my" tasks based on role for the demo
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
      <PageHeader
        title={t("COMMON_MY_TASKS")}
        subtitle={`Open items assigned to ${userName}`}
      >
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
