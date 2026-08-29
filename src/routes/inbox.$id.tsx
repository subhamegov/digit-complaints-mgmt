import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Paperclip, MapPin, Phone, User, Send } from "lucide-react";
import { useState } from "react";
import { PageHeader, Panel, StatusBadge, SlaBadge, PriorityPill, ActionButton } from "@/components/pgr/primitives";
import { getComplaint, complaintTypeOf, officerOf, OFFICERS } from "@/lib/mock-data";
import { Can, useRbac } from "@/lib/rbac";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/inbox/$id")({
  head: ({ params }) => ({ meta: [{ title: `${params.id} - DIGIT PGR` }] }),
  component: ComplaintDetail,
  notFoundComponent: () => <div className="p-10 text-center text-muted-foreground">Complaint not found.</div>,
});

function ComplaintDetail() {
  const { id } = useParams({ from: "/inbox/$id" });
  const c = getComplaint(id);
  const { hasPermission } = useRbac();
  const [assignTo, setAssignTo] = useState<string>("");
  const [note, setNote] = useState("");

  if (!c) return <div className="p-10 text-center text-muted-foreground">Complaint not found.</div>;
  const type = complaintTypeOf(c.typeCode)!;
  const officer = officerOf(c.assignedOfficerId);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: t("COMMON_INBOX") }, { label: c.id }]}
        title={type.name}
        subtitle={`${c.id} · ${type.department} · ${c.locality}`}
        primaryAction={
          <div className="flex items-center gap-2">
            <Link to="/inbox">
              <ActionButton variant="secondary" icon={<ArrowLeft className="h-3.5 w-3.5" />}>{t("COMMON_BACK")}</ActionButton>
            </Link>
            <ActionButton permission="PGR_COMPLAINT_REJECT" variant="secondary">{t("ACTION_REJECT")}</ActionButton>
            <ActionButton permission="PGR_COMPLAINT_ESCALATE" variant="danger">{t("ACTION_ESCALATE")}</ActionButton>
            <ActionButton permission="PGR_COMPLAINT_RESOLVE" variant="primary">{t("ACTION_RESOLVE")}</ActionButton>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={c.status} />
          <SlaBadge state={c.slaState} remainingHrs={c.slaRemainingHrs} />
          <PriorityPill p={c.priority} />
          <span className="text-[12px] text-muted-foreground">{t("CS_CHANNEL")}: {c.channel.replace("_", " ").toLowerCase()}</span>
          <span className="text-[12px] text-muted-foreground">{t("CS_FILED_ON")}: {new Date(c.filedOn).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
          {c.reopenCount > 0 && <span className="text-[12px] text-status-overdue">Reopened ×{c.reopenCount}</span>}
        </div>
      </PageHeader>


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-6">
        {/* Main */}
        <div className="space-y-4 xl:col-span-2">
          <Panel title={t("CS_COMPLAINT_DETAILS")}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
              <DLItem label={t("CS_COMPLAINT_TYPE")}>{type.name}</DLItem>
              <DLItem label={t("CS_DEPARTMENT")}>{type.department}</DLItem>
              <DLItem label={t("COMMON_WARD")}>{c.ward}</DLItem>
              <DLItem label={t("COMMON_LOCALITY")}>{c.locality}</DLItem>
              <DLItem label={t("COMMON_ADDRESS")} full>
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3 w-3 text-muted-foreground" />{c.address}</span>
              </DLItem>
              <DLItem label={t("CS_COMPLAINT_DESCRIPTION")} full>{c.description}</DLItem>
            </dl>
          </Panel>

          {/* Citizen - PII-gated */}
          <Can perm="PGR_CITIZEN_PII_VIEW" fallback={
            <Panel title={t("CS_CITIZEN_DETAILS")}>
              <div className="text-[12px] text-muted-foreground italic">Citizen PII is masked for your role.</div>
            </Panel>
          }>
            <Panel title={t("CS_CITIZEN_DETAILS")}>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
                <DLItem label={t("COMMON_NAME")}>
                  <span className="inline-flex items-center gap-1.5"><User className="h-3 w-3 text-muted-foreground" />{c.citizen.name}</span>
                </DLItem>
                <DLItem label={t("COMMON_MOBILE_NUMBER")}>
                  <span className="inline-flex items-center gap-1.5 tabular-nums"><Phone className="h-3 w-3 text-muted-foreground" />{c.citizen.mobile}</span>
                </DLItem>
                <DLItem label={t("CS_CHANNEL")}>{c.channel.replace("_", " ")}</DLItem>
              </dl>
            </Panel>
          </Can>

          <Panel title={t("CS_WORKFLOW_HISTORY")}>
            <ol className="relative space-y-4 border-l border-border pl-5">
              {c.workflow.map((step, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 border-primary bg-surface" />
                  <div className="flex items-center gap-2 text-[12px]">
                    <span className="font-semibold text-foreground">{step.action.replace("_", " ")}</span>
                    {step.from && <span className="text-muted-foreground">· {step.from} → {step.to}</span>}
                  </div>
                  <div className="text-[12px] text-muted-foreground">{step.actor} ({step.role}) · {new Date(step.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</div>
                  {step.note && <div className="mt-1 rounded-sm border border-border bg-surface-2 px-2.5 py-1.5 text-[12px]">{step.note}</div>}
                </li>
              ))}
            </ol>
          </Panel>

          <Can perm="PGR_COMPLAINT_COMMENT">
            <Panel title={t("CS_COMMENTS")}>
              <div className="flex gap-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Add an internal note for the audit trail…"
                  className="flex-1 resize-none rounded-sm border border-border bg-background p-2 text-[13px] outline-none focus:border-primary"
                />
                <button className="h-9 self-end inline-flex items-center gap-1.5 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">
                  <Send className="h-3.5 w-3.5" />{t("ACTION_ADD_COMMENT")}
                </button>
              </div>
            </Panel>
          </Can>
        </div>

        {/* Side */}
        <div className="space-y-4">
          <Panel title="SLA & Routing">
            <dl className="space-y-3 text-[13px]">
              <DLItem label="SLA target">{type.slaHours} hours</DLItem>
              <DLItem label="Remaining">
                <SlaBadge state={c.slaState} remainingHrs={c.slaRemainingHrs} />
              </DLItem>
              <DLItem label={t("CS_ASSIGNED_OFFICER")}>
                {officer ? (
                  <div>
                    <div className="font-medium">{officer.name}</div>
                    <div className="text-[11px] text-muted-foreground">{officer.designation} · {officer.ward}</div>
                  </div>
                ) : <span className="italic text-muted-foreground">Unassigned</span>}
              </DLItem>
            </dl>
          </Panel>

          <Can anyOf={["PGR_COMPLAINT_ASSIGN", "PGR_COMPLAINT_REASSIGN"]}>
            <Panel title={officer ? t("ACTION_REASSIGN") : t("ACTION_ASSIGN_OFFICER")}>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Select officer</span>
                <select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} className="h-9 w-full rounded-sm border border-border bg-background px-2 text-[13px] outline-none focus:border-primary">
                  <option value="">- Select -</option>
                  {OFFICERS.filter((o) => o.department === type.department).map((o) => (
                    <option key={o.id} value={o.id}>{o.name} · {o.ward} · load {o.activeLoad}</option>
                  ))}
                </select>
              </label>
              <button disabled={!assignTo} className="mt-3 h-9 w-full rounded-sm bg-primary text-[13px] font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {officer ? t("ACTION_REASSIGN") : t("ACTION_ASSIGN_OFFICER")}
              </button>
            </Panel>
          </Can>

          <Panel title={t("CS_ATTACHMENTS")} action={<span className="text-[11px] text-muted-foreground">{c.attachments} files</span>}>
            {c.attachments > 0 ? (
              <ul className="space-y-1.5 text-[13px]">
                {Array.from({ length: c.attachments }).map((_, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-sm border border-border bg-surface-2 px-2.5 py-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">complaint-photo-{i + 1}.jpg</span>
                    <span className="text-[11px] text-muted-foreground">{(120 + i * 80)} KB</span>
                  </li>
                ))}
              </ul>
            ) : <div className="text-[12px] text-muted-foreground italic">No attachments uploaded.</div>}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function DLItem({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-foreground">{children}</dd>
    </div>
  );
}
