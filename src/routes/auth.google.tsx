import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import type { LanguageCode } from "@/lib/accounts";
import { setPrototypeIdentity } from "@/lib/prototype-identity";

export const Route = createFileRoute("/auth/google")({
  head: () => ({
    meta: [
      { title: "Continue with Google — DIGIT Complaint Management" },
      { name: "description", content: "Prototype Google sign-in step for DIGIT Complaint Management signup." },
      { property: "og:title", content: "Continue with Google — DIGIT Complaint Management" },
      { property: "og:description", content: "Prototype Google sign-in step for DIGIT Complaint Management signup." },
    ],
  }),
  component: GoogleAuthPage,
});

const MOCK_ACCOUNTS = [
  { email: "manjit.singh@example.gov", firstName: "Manjit", lastName: "Singh" },
  { email: "anita.rao@example.gov", firstName: "Anita", lastName: "Rao" },
];

function GoogleAuthPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [selected, setSelected] = useState(MOCK_ACCOUNTS[0].email);

  const proceed = () => {
    const acct = MOCK_ACCOUNTS.find((a) => a.email === selected)!;
    setPrototypeIdentity({ ...acct, method: "google" });
    navigate({ to: "/signup" });
  };

  return (
    <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
      <div
        className="w-full"
        style={{
          maxWidth: 460,
          background: "rgba(255,255,255,0.94)",
          border: "1px solid #DCE4FF",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
        }}
      >
        <div
          className="inline-flex items-center rounded-full px-2.5 py-1"
          style={{ background: "#EEF2FF", color: "#2D4FC4", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}
        >
          PROTOTYPE SIMULATION
        </div>
        <h1 style={{ marginTop: 12, color: "#17191F", fontSize: 26, fontWeight: 600 }}>Continue with Google</h1>
        <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14 }}>Choose a Google account to continue.</p>

        <div className="mt-5 space-y-2.5">
          {MOCK_ACCOUNTS.map((a) => {
            const active = selected === a.email;
            return (
              <button
                key={a.email}
                type="button"
                onClick={() => setSelected(a.email)}
                className="flex w-full items-center gap-3 text-left transition-colors"
                style={{
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: `1px solid ${active ? "#2D4FC4" : "#DCE4FF"}`,
                  background: active ? "#F5F7FF" : "#FFFFFF",
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "#2D4FC4", color: "#FFFFFF", fontSize: 13, fontWeight: 600 }}
                >
                  {a.firstName[0]}
                  {a.lastName[0]}
                </span>
                <span className="min-w-0">
                  <span className="block truncate" style={{ color: "#17191F", fontSize: 14, fontWeight: 600 }}>
                    {a.firstName} {a.lastName}
                  </span>
                  <span className="block truncate" style={{ color: "#6F7684", fontSize: 13 }}>
                    {a.email}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={proceed}
          className="mt-6 w-full focus:outline-none focus:ring-2"
          style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
        >
          Continue
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/signup" })}
          className="mt-2.5 w-full hover:bg-[#F5F7FF] focus:outline-none focus:ring-2"
          style={{
            height: 46,
            background: "#FFFFFF",
            border: "1px solid #CBD5F2",
            borderRadius: 8,
            color: "#17191F",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          Cancel
        </button>
      </div>
    </AuthShell>
  );
}
