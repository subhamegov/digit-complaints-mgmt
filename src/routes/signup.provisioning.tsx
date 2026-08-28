import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Clock3, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import type { LanguageCode } from "@/lib/accounts";

export const PROVISIONING_KEY = "digit.provisioning.summary";

export interface ProvisioningSummary {
  email: string;
  organisationName: string;
  organisationCode: string;
  baseCountry: string;
  employeeUrl?: string;
  citizenUrl?: string;
}

export const Route = createFileRoute("/signup/provisioning")({
  head: () => ({
    meta: [
      { title: "Account Being Created — DIGIT Complaint Management" },
      {
        name: "description",
        content:
          "Your DIGIT Complaint Management account is being created. Workspace setup usually takes 30 to 45 minutes and we will email you when it is ready.",
      },
      { property: "og:title", content: "Account Being Created — DIGIT Complaint Management" },
      {
        property: "og:description",
        content: "Workspace provisioning is in progress. We will email you when your workspace is ready for personalisation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProvisioningPage,
});

const cardStyle: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #DCE4FF",
  borderRadius: 16,
  padding: 28,
  boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
};

function ProvisioningPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [summary, setSummary] = useState<ProvisioningSummary | null>(null);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(PROVISIONING_KEY);
    if (!raw) return;
    try {
      setSummary(JSON.parse(raw) as ProvisioningSummary);
    } catch {
      /* ignore malformed prototype state */
    }
  }, []);

  const email = summary?.email || "your registered email address";

  const rows: [string, string][] = [
    ["Organisation name", summary?.organisationName || "—"],
    ["Organisation code", summary?.organisationCode || "—"],
    ["Base country", summary?.baseCountry || "—"],
    ["Employee URL", summary?.employeeUrl || "Pending"],
    ["Citizen URL", summary?.citizenUrl || "Pending"],
  ];

  return (
    <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
      <div className="w-full" style={cardStyle}>
        <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: "#EEF2FF", color: "#2D4FC4" }}>
          <Clock3 className="h-5 w-5" />
        </span>

        <h1 style={{ marginTop: 16, color: "#17191F", fontSize: 26, fontWeight: 600, lineHeight: 1.2 }}>Your account is being created</h1>
        <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
          Setting up your workspace usually takes 30 to 45 minutes.
        </p>

        {/* Status */}
        <div
          className="mt-5 flex items-center justify-between gap-3 rounded-md px-3 py-2.5"
          style={{ background: "#F5F7FF", border: "1px solid #DCE4FF" }}
        >
          <div>
            <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>Workspace setup</div>
            <div style={{ color: "#6F7684", fontSize: 12.5 }}>Estimated 30–45 minutes</div>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1"
            style={{ background: "#E7EDFF", color: "#2D4FC4", fontSize: 12, fontWeight: 600 }}
          >
            In progress
          </span>
        </div>

        {/* Notification */}
        <div className="mt-3 flex items-start gap-2.5 rounded-md px-3 py-2.5" style={{ background: "#FFFFFF", border: "1px solid #DCE4FF" }}>
          <Mail className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#2D4FC4" }} />
          <div>
            <div style={{ color: "#17191F", fontSize: 13, fontWeight: 600 }}>We'll let you know when it's ready</div>
            <div style={{ color: "#5E6675", fontSize: 12.5, lineHeight: 1.5 }}>
              You can close this page. We'll send an email to <strong style={{ color: "#17191F" }}>{email}</strong> when your workspace has
              been set up and is ready for personalisation. The email will include a link to return and continue personalising your
              Complaints workspace.
            </div>
          </div>
        </div>

        {/* Read-only account summary */}
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

        <button
          type="button"
          onClick={() => {
            window.sessionStorage.removeItem(PROVISIONING_KEY);
            navigate({ to: "/" });
          }}
          className="mt-6 w-full"
          style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
        >
          Done
        </button>
        <Link
          to="/login"
          className="mt-2.5 flex w-full items-center justify-center hover:bg-[#F5F7FF]"
          style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontSize: 14, fontWeight: 500 }}
        >
          Back to sign in
        </Link>
      </div>
    </AuthShell>
  );
}
