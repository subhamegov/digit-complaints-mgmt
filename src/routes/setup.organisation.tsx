import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/setup/organisation")({
  head: () => ({
    meta: [
      { title: "Organisation Setup — DIGIT Complaint Management" },
      { name: "description", content: "Continue setting up your DIGIT Complaint Management account and organisation details." },
      { property: "og:title", content: "Organisation Setup — DIGIT Complaint Management" },
      { property: "og:description", content: "Continue setting up your DIGIT Complaint Management account." },
    ],
  }),
  component: OrgSetupPage,
});

function OrgSetupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6" style={{ background: "#F5F7FF" }}>
      <div
        className="w-full text-center"
        style={{
          maxWidth: 460,
          background: "#FFFFFF",
          border: "1px solid #DCE4FF",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
        }}
      >
        <CheckCircle2 className="mx-auto h-8 w-8" style={{ color: "#12703A" }} />
        <h1 style={{ marginTop: 12, color: "#17191F", fontSize: 24, fontWeight: 600 }}>Organisation setup</h1>
        <p style={{ marginTop: 8, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
          Your identity is verified and your account name is captured. The remaining organisation setup steps are part of a later prototype
          stage.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex w-full items-center justify-center"
          style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
        >
          Go to sign in
        </Link>
      </div>
    </main>
  );
}
