import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, Clock3, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import type { LanguageCode } from "@/lib/accounts";
import { getAccountRequest, MY_REQUEST_KEY, type AccountRequest } from "@/lib/account-requests";
import { PROVISIONING_KEY } from "@/routes/signup.provisioning";

export const Route = createFileRoute("/signup/pending-approval")({
  head: () => ({
    meta: [
      { title: "Account Request Submitted — DIGIT Complaint Management" },
      { name: "description", content: "Your account request is awaiting Platform Administrator approval before workspace setup begins." },
      { property: "og:title", content: "Account Request Submitted — DIGIT Complaint Management" },
      { property: "og:description", content: "Track the approval status of your DIGIT Complaint Management account request." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PendingApprovalPage,
});

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #DCE4FF",
  borderRadius: 16,
  padding: 28,
  boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
};

function PendingApprovalPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [request, setRequest] = useState<AccountRequest | null>(null);

  useEffect(() => {
    const load = () => {
      const id = window.sessionStorage.getItem(MY_REQUEST_KEY);
      setRequest(id ? getAccountRequest(id) ?? null : null);
    };
    load();
    const t = window.setInterval(load, 2000);
    return () => window.clearInterval(t);
  }, []);

  const status = request?.status ?? "pending_approval";

  const rows: [string, string][] = [
    ["Organisation name", request?.organisationName || "—"],
    ["Organisation code", request?.organisationCode || "—"],
    ["Base country", request?.country || "—"],
    ["Employee URL", request?.employeeUrl || "Pending"],
    ["Citizen URL", request?.citizenUrl || "Pending"],
    ["Requester email", request?.requesterEmail || "—"],
  ];

  const heading =
    status === "approved"
      ? "Your account has been approved"
      : status === "rejected"
        ? "Your account request needs attention"
        : "Your account request has been submitted";

  const body =
    status === "approved"
      ? "We're now setting up your workspace. This usually takes 30 to 45 minutes."
      : status === "rejected"
        ? "Your request was not approved. Review the reason below before submitting again."
        : "A Platform Administrator needs to review your request before your workspace can be created.";

  const tone =
    status === "approved"
      ? { bg: "#EEF7F0", border: "#CBE5D3", fg: "#1F6B3D" }
      : status === "rejected"
        ? { bg: "#FFF6ED", border: "#F3D9BC", fg: "#8A5218" }
        : { bg: "#F5F7FF", border: "#DCE4FF", fg: "#2D4FC4" };

  const Icon = status === "approved" ? CheckCircle2 : status === "rejected" ? AlertCircle : Clock3;

  const goProvisioning = () => {
    if (request) {
      window.sessionStorage.setItem(
        PROVISIONING_KEY,
        JSON.stringify({
          email: request.requesterEmail,
          organisationName: request.organisationName,
          organisationCode: request.organisationCode,
          baseCountry: request.country,
        }),
      );
    }
    navigate({ to: "/signup/provisioning" });
  };

  return (
    <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
      <div className="w-full" style={cardStyle}>
        <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: tone.bg, color: tone.fg }}>
          <Icon className="h-5 w-5" />
        </span>

        <h1 style={{ marginTop: 16, color: "#17191F", fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>{heading}</h1>
        <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>{body}</p>

        <div
          className="mt-5 flex items-center justify-between gap-3 rounded-md px-3 py-2.5"
          style={{ background: tone.bg, border: `1px solid ${tone.border}` }}
        >
          <div>
            <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>
              {status === "approved" ? "Workspace setup" : "Account request"}
            </div>
            <div style={{ color: "#6F7684", fontSize: 12.5 }}>
              {status === "approved"
                ? "Estimated 30–45 minutes"
                : status === "rejected"
                  ? "Reviewed by a Platform Administrator"
                  : "Awaiting Platform Administrator review"}
            </div>
          </div>
          <span className="shrink-0 rounded-full px-2.5 py-1" style={{ background: "#FFFFFF", color: tone.fg, fontSize: 12, fontWeight: 600 }}>
            {status === "approved" ? "In progress" : status === "rejected" ? "Rejected" : "Pending approval"}
          </span>
        </div>

        {status === "rejected" && request?.rejectionReason ? (
          <div className="mt-3 rounded-md px-3 py-2.5" style={{ background: "#FFFFFF", border: "1px solid #F3D9BC" }}>
            <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>Reason</div>
            <div style={{ color: "#5E6675", fontSize: 12.5, lineHeight: 1.5 }}>{request.rejectionReason}</div>
          </div>
        ) : null}

        <div className="mt-3 flex items-start gap-2.5 rounded-md px-3 py-2.5" style={{ background: "#FFFFFF", border: "1px solid #DCE4FF" }}>
          <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#2D4FC4" }} />
          <div style={{ color: "#5E6675", fontSize: 12.5, lineHeight: 1.55 }}>
            {status === "approved" ? (
              <>We'll email you when your workspace is ready for personalisation.</>
            ) : status === "rejected" ? (
              <>You can update your organisation details and submit your request again.</>
            ) : (
              <ul className="list-disc space-y-1 pl-4">
                <li>No further action is required from you right now.</li>
                <li>We'll email you when your request has been reviewed.</li>
                <li>If approved, workspace setup will begin automatically.</li>
                <li>Workspace setup usually takes 30 to 45 minutes after approval.</li>
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>Account details</div>
          <dl className="mt-2 space-y-1.5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-start justify-between gap-4">
                <dt style={{ color: "#8A90A2", fontSize: 12.5 }}>{k}</dt>
                <dd
                  style={{
                    color: v === "Pending" ? "#8A90A2" : "#17191F",
                    fontSize: 12.5,
                    fontWeight: 500,
                    textAlign: "right",
                    wordBreak: "break-all",
                  }}
                >
                  {v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {status === "approved" ? (
          <button
            type="button"
            onClick={goProvisioning}
            className="mt-6 w-full"
            style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
          >
            View workspace setup
          </button>
        ) : status === "rejected" ? (
          <Link
            to="/signup"
            search={{ flow: "approval" }}
            className="mt-6 flex w-full items-center justify-center"
            style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
          >
            Edit and resubmit
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-6 w-full"
            style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
          >
            Done
          </button>
        )}

        <Link
          to="/login"
          className="mt-2.5 flex w-full items-center justify-center hover:bg-[#F5F7FF]"
          style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontSize: 14, fontWeight: 500 }}
        >
          {status === "rejected" ? "Contact support" : "Back to sign in"}
        </Link>
      </div>
    </AuthShell>
  );
}
