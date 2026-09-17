import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AuthShell, AuthField, authInputCls, authInputStyle } from "@/components/auth/AuthShell";
import { ACCOUNTS, type LanguageCode } from "@/lib/accounts";
import { useRbac } from "@/lib/rbac";

export const Route = createFileRoute("/auth/ethekwini")({
  validateSearch: (search: Record<string, unknown>) => ({
    account: typeof search["account"] === "string" ? (search["account"] as string) : "",
    returnTo: typeof search["returnTo"] === "string" ? (search["returnTo"] as string) : "/dashboard",
  }),
  head: () => ({
    meta: [
      { title: "eThekwini Sign In - DIGIT Complaint Management" },
      { name: "description", content: "Sign in through the eThekwini Metropolitan Municipality sign-in page." },
      { property: "og:title", content: "eThekwini Sign In - DIGIT Complaint Management" },
      { property: "og:description", content: "Sign in through the eThekwini Metropolitan Municipality sign-in page." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EthekwiniSignIn,
});

function EthekwiniSignIn() {
  const navigate = useNavigate();
  const { account, returnTo } = useSearch({ from: "/auth/ethekwini" });
  const { setTenant } = useRbac();
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [userId, setUserId] = useState("manjit.singh@ethekwini.gov.za");
  const [password, setPassword] = useState("••••••••");

  const selected = ACCOUNTS.find((a) => a.value === account);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected) setTenant(selected.value);
    navigate({ to: returnTo || "/dashboard" });
  };

  return (
    <AuthShell language={language} onLanguageChange={setLanguage}>
      <form
        onSubmit={submit}
        className="w-full"
        style={{
          maxWidth: 400,
          background: "rgba(255,255,255,0.92)",
          border: "1px solid #DCE4FF",
          borderRadius: 16,
          padding: 32,
          boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
        }}
      >
        <div
          className="flex items-center gap-1.5"
          style={{ color: "#4E64B5", fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          Organisation sign-in
        </div>
        <h1 style={{ marginTop: 8, color: "#17191F", fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
          {selected?.label ?? "eThekwini Metropolitan Municipality, South Africa"}
        </h1>
        <p style={{ marginTop: 10, color: "#5E6675", fontSize: 14, lineHeight: 1.6 }}>
          Your account selection has been carried over. Sign in with your organisation credentials to continue to your
          workspace.
        </p>

        <div className="mt-6 space-y-4">
          <AuthField label="Organisation user">
            <input value={userId} onChange={(e) => setUserId(e.target.value)} className={authInputCls} style={authInputStyle} />
          </AuthField>
          <AuthField label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={authInputCls}
              style={authInputStyle}
            />
          </AuthField>
        </div>

        <button
          type="submit"
          className="mt-6 w-full focus:outline-none focus:ring-2"
          style={{ height: 46, background: "#2D4FC4", color: "#FFFFFF", borderRadius: 8, fontWeight: 500, fontSize: 14 }}
        >
          Sign in
        </button>

        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="mt-3 w-full hover:underline"
          style={{ color: "#6F7684", fontSize: 13, background: "transparent" }}
        >
          Choose another account
        </button>

        <div style={{ marginTop: 18, color: "#9AA1B1", fontSize: 11, textAlign: "center" }}>Powered by DIGIT</div>
      </form>
    </AuthShell>
  );
}
