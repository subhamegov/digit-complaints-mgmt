import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import eGovLogoAsset from "@/assets/eGov-Foundation.png.asset.json";
import { ACCOUNTS } from "@/lib/accounts";

export const Route = createFileRoute("/$org/login")({
  head: () => ({
    meta: [
      { title: "Organisation Sign In — DIGIT Complaint Management" },
      { name: "description", content: "Sign in through your organisation's dedicated sign-in page." },
      { property: "og:title", content: "Organisation Sign In — DIGIT Complaint Management" },
      { property: "og:description", content: "Sign in through your organisation's dedicated sign-in page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrgLoginPage,
});

function OrgLoginPage() {
  const { org } = useParams({ from: "/$org/login" });
  const navigate = useNavigate();
  const account = ACCOUNTS.find((a) => a.customLoginUrl === `/${org}/login`);

  return (
    <div className="flex min-h-screen w-full items-center justify-center px-5 py-10" style={{ background: "#F5F7FF" }}>
      <div
        className="w-full"
        style={{
          maxWidth: 420,
          background: "rgba(255,255,255,0.9)",
          border: "1px solid #DCE4FF",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
        }}
      >
        <img src={eGovLogoAsset.url} alt="eGov Foundation" style={{ height: 32, width: "auto" }} />
        <div
          style={{ marginTop: 24, color: "#4E64B5", fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          Organisation sign-in
        </div>
        <h1 style={{ marginTop: 8, color: "#17191F", fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
          {account?.label ?? "Organisation"}
        </h1>
        <p style={{ marginTop: 12, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
          This organisation uses its own sign-in page. Your account selection has been carried over — continue with the
          sign-in method configured by your administrator.
        </p>

        <div
          className="mt-6 flex items-center gap-2 rounded-md px-3 py-2.5"
          style={{ background: "#EEF3FF", border: "1px solid #DCE4FF", color: "#2D4FC4", fontSize: 13 }}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>Prototype placeholder — no authentication is performed here.</span>
        </div>

        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="mt-6 flex w-full items-center justify-center gap-2 transition-colors"
          style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to central sign-in
        </button>
      </div>
    </div>
  );
}
