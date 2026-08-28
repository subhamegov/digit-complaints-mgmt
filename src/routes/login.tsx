import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ROLE_LABEL, useRbac, type Role } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { ShieldCheck, ArrowUpRight } from "lucide-react";
import { ACCOUNTS, type LanguageCode } from "@/lib/accounts";
import { AuthShell, AuthField, authInputCls, authInputStyle } from "@/components/auth/AuthShell";


export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — DIGIT Complaint Management" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { role: currentRole, setRole } = useRbac();
  const [userId, setUserId] = useState("manjit.singh");
  const [password, setPassword] = useState("••••••••");
  const [role, setLocalRole] = useState<Role>(currentRole);
  const [tenant, setTenant] = useState("acc.makueni.cg");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const selectedAccount = ACCOUNTS.find((a) => a.value === tenant);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(role);
    navigate({
      to: role === "PLATFORM_ADMIN" ? "/platform" : role === "ACCOUNT_ADMIN" ? "/admin/home" : "/dashboard",
    });
  };

  return (
    <AuthShell
      headline="Manage complaints from intake to closure."
      narrative="Sign in to receive complaints, assign them to the right team, track service timelines, record actions and evidence, and monitor resolution across departments and localities."
      language={language}
      onLanguageChange={setLanguage}
    >
      <form
        onSubmit={submit}

            className="w-full"
            style={{
              maxWidth: 400,
              background: "rgba(255,255,255,0.88)",
              border: "1px solid #DCE4FF",
              borderRadius: 16,
              padding: 32,
              boxShadow: "0 12px 36px rgba(32,55,140,0.08)",
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  color: "#4E64B5",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                Secure Sign In
              </div>
              <h2
                style={{
                  marginTop: 8,
                  color: "#17191F",
                  fontSize: 34,
                  fontWeight: 600,
                  lineHeight: 1.15,
                }}
              >
                Access your account
              </h2>
            </div>

            <div className="space-y-4">
              <Field label="User ID">
                <input value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls} style={inputStyle} />
              </Field>
              <Field label="Password">
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} style={inputStyle} />
              </Field>
              <Field label={t("COMMON_TENANT")}>
                <select value={tenant} onChange={(e) => setTenant(e.target.value)} className={inputCls} style={inputStyle}>
                  {ACCOUNTS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </Field>

              {selectedAccount?.hasCustomLogin && selectedAccount.customLoginUrl && (
                <div
                  className="rounded-md px-3 py-3"
                  style={{ background: "#EEF3FF", border: "1px solid #DCE4FF" }}
                >
                  <div className="flex items-center gap-1.5" style={{ color: "#2D4FC4", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Organisation sign-in
                  </div>
                  <p style={{ marginTop: 6, color: "#4A5162", fontSize: 13, lineHeight: 1.5 }}>
                    Your administrator has configured a separate sign-in page for this organisation.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate({ to: "/$org/login", params: { org: selectedAccount.customLoginUrl!.split("/")[1] } })}
                    className="mt-2.5 inline-flex items-center gap-1 rounded-sm focus:outline-none focus:ring-2 focus:ring-[#355BE0]/30"
                    style={{ color: "#2D4FC4", fontSize: 13, fontWeight: 600 }}
                  >
                    Go to organisation sign-in
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}


              <Field
                label={
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3 w-3" style={{ color: "#2D4FC4" }} />
                    Sign in as (prototype role)
                  </span>
                }
              >
                <select value={role} onChange={(e) => setLocalRole(e.target.value as Role)} className={inputCls} style={inputStyle}>
                  {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                  ))}
                </select>
              </Field>
            </div>

            <button
              type="submit"
              className="mt-6 w-full transition-colors focus:outline-none focus:ring-2"
              style={{
                height: 46,
                background: "#2D4FC4",
                color: "#FFFFFF",
                borderRadius: 8,
                fontWeight: 500,
                fontSize: 14,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#2443B0")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2D4FC4")}
            >
              {t("COMMON_SIGN_IN")}
            </button>

            <div
              style={{
                marginTop: 16,
                color: "#6F7684",
                fontSize: 12,
                textAlign: "center",
              }}
            >
              Use the role selector to demo CSR, GRO, Field Employee, Department Head, and Admin views.
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .login-input::placeholder { color: #8A90A2; }
        .login-input:focus {
          border-color: #355BE0 !important;
          box-shadow: 0 0 0 3px rgba(53,91,224,0.16) !important;
        }
      `}</style>
    </div>
  );
}

const inputCls = "login-input w-full outline-none";

const inputStyle: React.CSSProperties = {
  height: 44,
  background: "#FFFFFF",
  border: "1px solid #CBD5F2",
  borderRadius: 8,
  color: "#17191F",
  fontSize: 14,
  padding: "0 12px",
};

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block"
        style={{
          color: "#5E6675",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
