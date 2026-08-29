import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/pgr/primitives";
import { COMPLAINT_TYPES, OFFICERS } from "@/lib/mock-data";
import { JURISDICTIONS, useRbac } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { Upload, X } from "lucide-react";

export const Route = createFileRoute("/complaints/new")({
  head: () => ({ meta: [{ title: "Register Complaint - DIGIT PGR" }] }),
  component: NewComplaintPage,
});

function NewComplaintPage() {
  const navigate = useNavigate();
  const { hasPermission } = useRbac();
  const [step] = useState<1 | 2>(1);
  const [typeCode, setTypeCode] = useState(COMPLAINT_TYPES[0].code);
  const [ward, setWard] = useState(JURISDICTIONS[1].code);
  const [channel, setChannel] = useState("CALL_CENTER");
  const [priority, setPriority] = useState("MEDIUM");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [desc, setDesc] = useState("");

  if (!hasPermission("PGR_COMPLAINT_CREATE")) {
    return <div className="p-10 text-center text-muted-foreground">Your role does not permit registering complaints.</div>;
  }

  const type = COMPLAINT_TYPES.find((c) => c.code === typeCode)!;
  const suggested = OFFICERS.filter((o) => o.department === type.department).sort((a, b) => a.activeLoad - b.activeLoad).slice(0, 3);

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: t("COMMON_INBOX") }, { label: t("CS_HEADER_NEW_COMPLAINT") }]}
        title={t("CS_HEADER_NEW_COMPLAINT")}
        subtitle="Capture details accurately. Fields marked * are required."
        primaryAction={
          <div className="flex gap-2">
            <button onClick={() => navigate({ to: "/inbox" })} className="h-8 rounded-sm border border-border bg-surface px-3 text-[12px] hover:bg-muted">{t("COMMON_CANCEL")}</button>
            <button onClick={() => navigate({ to: "/inbox" })} className="h-8 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">{t("ACTION_REGISTER")}</button>
          </div>
        }
      >
        <Stepper step={step} />
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 p-6">
        <div className="space-y-4 xl:col-span-2">
          <Panel title={t("CS_CITIZEN_DETAILS")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={`${t("COMMON_NAME")} *`}><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Citizen name" className={inp} /></Field>
              <Field label={`${t("COMMON_MOBILE_NUMBER")} *`}><input value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile" maxLength={10} className={inp} /></Field>
              <Field label={t("CS_CHANNEL")}>
                <select value={channel} onChange={(e) => setChannel(e.target.value)} className={inp}>
                  <option value="CALL_CENTER">Call Centre</option>
                  <option value="COUNTER">Counter Walk-in</option>
                  <option value="MOBILE_APP">Mobile App</option>
                  <option value="WEB">Web Portal</option>
                  <option value="WHATSAPP">WhatsApp Bot</option>
                </select>
              </Field>
              <Field label="Alternate contact"><input placeholder="Optional" className={inp} /></Field>
            </div>
          </Panel>

          <Panel title={t("CS_COMPLAINT_DETAILS")}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label={`${t("CS_COMPLAINT_TYPE")} *`}>
                <select value={typeCode} onChange={(e) => setTypeCode(e.target.value)} className={inp}>
                  {COMPLAINT_TYPES.filter((c) => c.active).map((c) => (
                    <option key={c.code} value={c.code}>{c.name} - {c.department}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("CS_PRIORITY")}>
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inp}>
                  <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
                </select>
              </Field>
              <Field label={`${t("COMMON_WARD")} *`}>
                <select value={ward} onChange={(e) => setWard(e.target.value)} className={inp}>
                  {JURISDICTIONS.filter((j) => j.code !== "ALL").map((j) => <option key={j.code} value={j.code}>{j.name}</option>)}
                </select>
              </Field>
              <Field label={t("COMMON_LOCALITY")}><input placeholder="Locality / landmark" className={inp} /></Field>
              <Field label={t("COMMON_ADDRESS")} full><input placeholder="House / street / nearest landmark" className={inp} /></Field>
              <Field label={`${t("CS_COMPLAINT_DESCRIPTION")} *`} full>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} placeholder="Describe the issue clearly" className={`${inp} h-auto py-2`} />
              </Field>
            </div>
          </Panel>

          <Panel title={t("CS_ATTACHMENTS")}>
            <div className="flex items-center justify-center rounded-sm border border-dashed border-border bg-surface-2 px-4 py-8 text-center">
              <div>
                <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                <div className="mt-2 text-[13px] font-medium">Drop photos here or click to upload</div>
                <div className="text-[11px] text-muted-foreground">JPG / PNG · Max 5 MB · Up to 5 files</div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="SLA preview">
            <div className="text-[26px] font-semibold tabular-nums">{type.slaHours}h</div>
            <div className="text-[12px] text-muted-foreground mt-1">Target resolution for <strong>{type.name}</strong></div>
            <div className="mt-3 border-t border-border pt-3 text-[12px]">Department: <strong className="font-medium">{type.department}</strong></div>
          </Panel>

          <Panel title="Suggested officers">
            <ul className="space-y-2 text-[13px]">
              {suggested.map((o) => (
                <li key={o.id} className="flex items-start justify-between rounded-sm border border-border bg-surface-2 px-2.5 py-2">
                  <div>
                    <div className="font-medium">{o.name}</div>
                    <div className="text-[11px] text-muted-foreground">{o.designation} · {o.ward}</div>
                  </div>
                  <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] tabular-nums">load {o.activeLoad}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 text-[11px] text-muted-foreground">GRO will confirm assignment after submission.</div>
          </Panel>

          <Panel title="Duplicates check">
            <div className="text-[12px] text-muted-foreground">No similar complaints found in selected locality for the last 24 hours.</div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

const inp = "h-9 w-full rounded-sm border border-border bg-background px-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Stepper({ step }: { step: 1 | 2 }) {
  const steps = ["Capture details", "Review & submit"];
  return (
    <ol className="flex items-center gap-3 text-[12px]">
      {steps.map((s, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <li key={s} className="flex items-center gap-2">
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${active ? "bg-primary text-primary-foreground" : done ? "bg-status-resolved text-white" : "bg-muted text-muted-foreground"}`}>{n}</span>
            <span className={active ? "font-medium text-foreground" : "text-muted-foreground"}>{s}</span>
            {i < steps.length - 1 && <span className="mx-2 h-px w-8 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}
