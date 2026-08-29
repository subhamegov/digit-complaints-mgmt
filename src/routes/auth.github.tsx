import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Github } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import type { LanguageCode } from "@/lib/accounts";
import { setPrototypeIdentity } from "@/lib/prototype-identity";

export const Route = createFileRoute("/auth/github")({
  head: () => ({
    meta: [
      { title: "Continue with GitHub - DIGIT Complaint Management" },
      { name: "description", content: "Prototype GitHub sign-in step for DIGIT Complaint Management signup." },
      { property: "og:title", content: "Continue with GitHub - DIGIT Complaint Management" },
      { property: "og:description", content: "Prototype GitHub sign-in step for DIGIT Complaint Management signup." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GithubAuthPage,
});

const MOCK_ACCOUNT = { email: "manjit.singh@github.example", firstName: "Manjit", lastName: "Singh" };

function GithubAuthPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<LanguageCode>("en");

  const proceed = () => {
    setPrototypeIdentity({ ...MOCK_ACCOUNT, method: "github" });
    navigate({ to: "/signup", search: {} });
  };

  return (
    <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
      <div className="w-full" style={{ maxWidth: 460, background: "rgba(255,255,255,0.94)", border: "1px solid #DCE4FF", borderRadius: 16, padding: 32, boxShadow: "0 12px 36px rgba(32,55,140,0.08)" }}>
        <div className="inline-flex items-center rounded-full px-2.5 py-1" style={{ background: "#EEF2FF", color: "#2D4FC4", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
          PROTOTYPE SIMULATION
        </div>
        <h1 style={{ marginTop: 12, color: "#17191F", fontSize: 26, fontWeight: 600 }}>Continue with GitHub</h1>
        <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14 }}>Use your GitHub identity to continue.</p>
        <div className="mt-5 flex items-center gap-3 rounded-md" style={{ padding: "12px 14px", border: "1px solid #DCE4FF", background: "#F5F7FF" }}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: "#17191F", color: "#FFFFFF" }}>
            <Github className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate" style={{ color: "#17191F", fontSize: 14, fontWeight: 600 }}>{MOCK_ACCOUNT.firstName} {MOCK_ACCOUNT.lastName}</span>
            <span className="block truncate" style={{ color: "#6F7684", fontSize: 13 }}>{MOCK_ACCOUNT.email}</span>
          </span>
        </div>
        <button type="button" onClick={proceed} className="mt-6 w-full focus:outline-none focus:ring-2" style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}>
          Continue
        </button>
        <button type="button" onClick={() => navigate({ to: "/signup", search: {} })} className="mt-2.5 w-full focus:outline-none focus:ring-2" style={{ height: 46, background: "#FFFFFF", border: "1px solid #CBD5F2", borderRadius: 8, color: "#17191F", fontWeight: 500, fontSize: 14 }}>
          Cancel
        </button>
      </div>
    </AuthShell>
  );
}
