import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronRight, Clock3, X } from "lucide-react";
import {
  approveAccountRequest,
  formatSubmitted,
  getAccountRequest,
  listAccountRequests,
  rejectAccountRequest,
  REQUEST_STATUS_LABEL,
  type AccountRequest,
} from "@/lib/account-requests";
import { PROVISIONING_KEY } from "@/routes/signup.provisioning";

export const Route = createFileRoute("/platform-admin/account-requests")({
  head: () => ({
    meta: [
      { title: "Account Requests — DIGIT Complaint Management" },
      { name: "description", content: "Review and manage prototype account requests for DIGIT Complaint Management." },
      { property: "og:title", content: "Account Requests — DIGIT Complaint Management" },
      { property: "og:description", content: "Review approval-based account requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountRequestsPage,
});

const pageStyle: React.CSSProperties = { minHeight: "100vh", background: "#F5F7FF", color: "#17191F", fontFamily: "Arial, sans-serif" };
const panelStyle: React.CSSProperties = { background: "#FFFFFF", border: "1px solid #DCE4FF", borderRadius: 10 };

function AccountRequestsPage() {
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const navigate = useNavigate();

  const refresh = () => setRequests(listAccountRequests());
  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 1500);
    return () => window.clearInterval(timer);
  }, []);

  const selected = selectedId ? getAccountRequest(selectedId) : undefined;

  const handleApprove = () => {
    if (!selected) return;
    approveAccountRequest(selected.id);
    refresh();
  };

  const handleReject = () => {
    if (!selected || !reason.trim()) return;
    rejectAccountRequest(selected.id, reason.trim());
    setReason("");
    setRejecting(false);
    refresh();
  };

  return (
    <div style={pageStyle}>
      <header className="flex items-center justify-between border-b bg-white px-6 py-4" style={{ borderColor: "#DCE4FF" }}>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#2D4FC4" }}>DIGIT Complaint Management</div>
          <h1 className="mt-1 text-2xl font-semibold">Account requests</h1>
        </div>
        <Link to="/" className="text-sm font-medium" style={{ color: "#2D4FC4" }}>Back to home</Link>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-sm" style={{ color: "#5E6675" }}>Platform Administrator review queue</p>
          </div>
          <div className="text-sm" style={{ color: "#6F7684" }}>{requests.length} requests</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section style={panelStyle} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead style={{ background: "#F5F7FF", color: "#6F7684" }}>
                  <tr>
                    {['Organisation', 'Organisation Code', 'Country', 'Requested By', 'Submitted', 'Status', ''].map((label) => <th key={label} className="whitespace-nowrap px-4 py-3 font-medium">{label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((item) => (
                    <tr key={item.id} className="border-t" style={{ borderColor: "#E8ECF7", background: selectedId === item.id ? "#F8FAFF" : "#FFFFFF" }}>
                      <td className="px-4 py-4 font-medium">{item.organisationName}</td>
                      <td className="px-4 py-4" style={{ color: "#5E6675" }}>{item.organisationCode}</td>
                      <td className="px-4 py-4" style={{ color: "#5E6675" }}>{item.country}</td>
                      <td className="px-4 py-4"><div>{item.requesterName}</div><div className="text-xs" style={{ color: "#8A90A2" }}>{item.requesterEmail}</div></td>
                      <td className="whitespace-nowrap px-4 py-4" style={{ color: "#5E6675" }}>{formatSubmitted(item.submittedAt)}</td>
                      <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-4"><button type="button" aria-label={`Review ${item.organisationName}`} onClick={() => { setSelectedId(item.id); setRejecting(false); }} style={{ color: "#2D4FC4" }}><ChevronRight className="h-5 w-5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside style={panelStyle} className="h-fit p-5">
            {selected ? (
              <>
                <button type="button" onClick={() => setSelectedId(null)} className="mb-5 flex items-center gap-2 text-sm font-medium" style={{ color: "#2D4FC4" }}><ArrowLeft className="h-4 w-4" />All requests</button>
                <div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Review account request</h2><p className="mt-1 text-xs" style={{ color: "#8A90A2" }}>{selected.id}</p></div><StatusBadge status={selected.status} /></div>
                <dl className="mt-6 space-y-3 text-sm">
                  {[
                    ["Organisation Name", selected.organisationName], ["Organisation Code", selected.organisationCode], ["Base Country", selected.country], ["Languages", selected.languages], ["Timezone", selected.timezone], ["Financial Year", selected.financialYear], ["Employee URL", selected.employeeUrl], ["Citizen URL", selected.citizenUrl], ["Requester Name", selected.requesterName], ["Requester Email", selected.requesterEmail],
                  ].map(([key, value]) => <div key={key}><dt className="text-xs" style={{ color: "#8A90A2" }}>{key}</dt><dd className="mt-0.5 break-words font-medium">{value}</dd></div>)}
                </dl>
                {selected.status === "pending_approval" ? <div className="mt-6 space-y-2.5">
                  <button type="button" onClick={handleApprove} className="flex h-11 w-full items-center justify-center gap-2 rounded-md font-medium" style={{ background: "#2D4FC4", color: "#FFFFFF" }}><Check className="h-4 w-4" />Approve and create account</button>
                  {!rejecting ? <button type="button" onClick={() => setRejecting(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-md border font-medium" style={{ borderColor: "#CBD5F2", color: "#5E6675" }}><X className="h-4 w-4" />Reject request</button> : <div className="space-y-2"><textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter a short rejection reason" className="min-h-20 w-full rounded-md border p-2.5 text-sm outline-none" style={{ borderColor: "#CBD5F2" }} /><button type="button" onClick={handleReject} disabled={!reason.trim()} className="h-10 w-full rounded-md font-medium disabled:cursor-not-allowed disabled:opacity-50" style={{ background: "#8A5218", color: "#FFFFFF" }}>Confirm rejection</button></div>}
                </div> : selected.status === "approved" ? <button type="button" onClick={() => { window.sessionStorage.setItem(PROVISIONING_KEY, JSON.stringify({ email: selected.requesterEmail, organisationName: selected.organisationName, organisationCode: selected.organisationCode, baseCountry: selected.country })); navigate({ to: "/signup/provisioning", search: {} }); }} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md font-medium" style={{ background: "#2D4FC4", color: "#FFFFFF" }}><Clock3 className="h-4 w-4" />View provisioning experience</button> : null}
              </>
            ) : <div className="py-12 text-center"><div className="text-sm font-medium">Select a request to review</div><p className="mt-1 text-sm" style={{ color: "#8A90A2" }}>Request details and actions will appear here.</p></div>}
          </aside>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: AccountRequest["status"] }) {
  const styles = status === "pending_approval" ? { background: "#EEF2FF", color: "#2D4FC4" } : status === "approved" ? { background: "#EEF7F0", color: "#1F6B3D" } : { background: "#FFF6ED", color: "#8A5218" };
  return <span className="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold" style={styles}>{REQUEST_STATUS_LABEL[status]}</span>;
}
