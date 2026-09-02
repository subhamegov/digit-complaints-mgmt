import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import type { LanguageCode } from "@/lib/accounts";

export const Route = createFileRoute("/signup/initiating")({
  head: () => ({
    meta: [
      { title: "Initiating Account Creation - DIGIT Complaint Management" },
      {
        name: "description",
        content: "Your DIGIT Complaint Management account creation request is being initiated.",
      },
      { property: "og:title", content: "Initiating Account Creation - DIGIT Complaint Management" },
      {
        property: "og:description",
        content: "Your account creation request is being prepared with the details you provided.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InitiatingAccountCreation,
});

function InitiatingAccountCreation() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<LanguageCode>("en");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate({ to: "/signup", search: {} });
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <AuthShell language={language} onLanguageChange={setLanguage} cardMaxWidth={460}>
      <div className="w-full" style={{ background: "rgba(255,255,255,0.94)", border: "1px solid #DCE4FF", borderRadius: 16, padding: 32, boxShadow: "0 12px 36px rgba(32,55,140,0.08)" }}>
        <div className="mb-5 flex items-center gap-2">
          {[
            { label: "ACCOUNT", active: false },
            { label: "PREFERENCES", active: true },
            { label: "REVIEW", active: false },
          ].map(({ label, active }) => (
            <div key={label} className="flex flex-1 flex-col gap-1.5">
              <span style={{ height: 3, borderRadius: 999, background: active ? "#2D4FC4" : "#DCE4FF", display: "block" }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", color: active ? "#2D4FC4" : "#8A90A2" }}>{label}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center text-center" role="status" aria-live="polite" aria-label="Initiating account creation">
          <LoaderCircle className="h-10 w-10 animate-spin text-[#2D4FC4] motion-reduce:animate-none" aria-hidden="true" />
          <h1 className="mt-5" style={{ color: "#17191F", fontSize: 28, fontWeight: 600, lineHeight: 1.15 }}>Initiating account creation</h1>
          <p className="mt-2" style={{ color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
            We're preparing your account request with the details you've provided.
          </p>
          <p className="mt-2" style={{ color: "#8A90A2", fontSize: 12.5 }}>This will only take a moment.</p>
        </div>
      </div>
    </AuthShell>
  );
}
