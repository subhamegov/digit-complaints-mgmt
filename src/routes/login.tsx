import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ROLE_LABEL, useRbac, type Role } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { ShieldCheck } from "lucide-react";
import eGovLogoAsset from "@/assets/eGov-Foundation.png.asset.json";
import loginBg from "@/assets/login-crowd.jpg";

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

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(role);
    navigate({ to: role === "PLATFORM_ADMIN" ? "/platform" : "/dashboard" });
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#F5F7FF" }}>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[45fr_55fr] xl:grid-cols-2">
        {/* Identity / media column */}
        <div
          className="relative hidden min-h-[320px] flex-col justify-between overflow-hidden lg:flex"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(12,24,74,0.42) 0%, rgba(12,24,74,0.42) 60%, rgba(8,16,52,0.72) 100%), url(${loginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Brand block top-left */}
          <div style={{ position: "absolute", top: 28, left: 28, right: 28 }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open DIGIT Complaint Management landing page in a new tab"
              className="inline-flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)", maxWidth: 140 }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-sm font-bold"
                style={{ background: "#FFFFFF", color: "#0C184A", fontSize: 12 }}
              >
                e
              </div>
              <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 600, letterSpacing: "0.02em" }}>
                eGov
              </span>
            </a>

            <div style={{ marginTop: 18 }}>
              <div style={{ color: "#FFFFFF", fontSize: 28, fontWeight: 600, lineHeight: 1.15 }}>
                DIGIT Complaint Management
              </div>
              <div
                style={{
                  marginTop: 8,
                  color: "rgba(255,255,255,0.76)",
                  fontSize: 14,
                  fontWeight: 400,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Digital Infrastructure for Public Services
              </div>
            </div>
          </div>

          {/* Narrative bottom-left */}
          <div />
          <div style={{ padding: "0 28px 28px 28px", maxWidth: 360 + 56 }}>
            <h1
              style={{
                color: "#FFFFFF",
                fontSize: "clamp(34px,4vw,48px)",
                fontWeight: 600,
                lineHeight: 1.1,
                maxWidth: 360,
              }}
            >
              Manage complaints from intake to closure.
            </h1>
            <p
              style={{
                marginTop: 16,
                color: "rgba(255,255,255,0.86)",
                fontSize: 16,
                lineHeight: 1.6,
                maxWidth: 360,
              }}
            >
              Sign in to receive complaints, assign them to the right team, track service timelines, record actions and evidence, and monitor resolution across departments and localities.
            </p>
            <div style={{ marginTop: 24, color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
              © 2026 eGovernments Foundation · DIGIT 2.9
            </div>
          </div>
        </div>

        {/* Form column */}
        <div
          className="flex items-center justify-center px-5 py-10 sm:p-10"
          style={{ background: "#F5F7FF", color: "#17191F" }}
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
                  <option value="acc.makueni.cg">Makueni County Government, Kenya</option>
                  <option value="acc.bomet.cg">Bomet County Government, Kenya</option>
                  <option value="acc.ethekwini.mm">eThekwini Metropolitan Municipality, South Africa</option>
                  <option value="acc.diredawa.ca">Dire Dawa City Administration, Ethiopia</option>
                  <option value="acc.enugu.sg">Enugu State Government, Nigeria</option>
                  <option value="acc.maputo.mc">Maputo Municipal Council, Mozambique</option>
                  <option value="acc.banyuwangi.rg">Banyuwangi Regency Government, Indonesia</option>
                  <option value="acc.amritsar.mc">Amritsar Municipal Corporation, India</option>
                </select>
              </Field>

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
