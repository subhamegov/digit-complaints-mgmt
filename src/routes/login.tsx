import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ROLE_LABEL, useRbac, type Role } from "@/lib/rbac";
import { t } from "@/lib/i18n";
import { ShieldCheck } from "lucide-react";
import loginBg from "@/assets/login-crowd.jpg";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — DIGIT PGR" }] }),
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
    <div className="min-h-screen w-full bg-chrome text-chrome-foreground">
      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* Identity column */}
        <div
          className="relative flex flex-col justify-between px-10 py-8"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(10,15,20,0.72) 0%, rgba(10,15,20,0.55) 50%, rgba(10,15,20,0.82) 100%), url(${loginBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 self-start rounded-sm transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Open DIGIT Platform landing page in a new tab"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary font-bold text-primary-foreground">P</div>
            <div className="leading-tight">
              <div className="text-[14px] font-semibold">DIGIT Platform</div>
              <div className="text-[11px] uppercase tracking-wider text-chrome-muted">SaaS for Public Services</div>
            </div>
          </a>

          <div>
            <h1 className="text-[26px] font-semibold leading-tight">Public Grievance Redressal</h1>
            <p className="mt-3 max-w-md text-[13px] leading-relaxed text-chrome-muted">
              Operations console for public-service staff to receive, route, resolve, and monitor citizen complaints across departments and localities, on any account on the platform.
            </p>
          </div>

          <div className="text-[11px] text-chrome-muted">© 2026 eGovernments Foundation · DIGIT 2.9</div>
        </div>

        {/* Form column */}
        <div className="flex items-center justify-center bg-surface p-8 text-foreground">
          <form onSubmit={submit} className="w-full max-w-sm space-y-5">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Secure Sign In</div>
              <h2 className="mt-1 text-[20px] font-semibold">Access your account</h2>
            </div>

            <Field label="User ID">
              <input value={userId} onChange={(e) => setUserId(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
            </Field>
            <Field label={t("COMMON_TENANT")}>
              <select value={tenant} onChange={(e) => setTenant(e.target.value)} className={inputCls}>
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

            <Field label={
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-primary" />
                Sign in as (prototype role)
              </span>
            }>
              <select value={role} onChange={(e) => setLocalRole(e.target.value as Role)} className={inputCls}>
                {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                  <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                ))}
              </select>
            </Field>

            <button type="submit" className="h-9 w-full rounded-sm bg-primary text-[13px] font-medium text-primary-foreground hover:opacity-90">
              {t("COMMON_SIGN_IN")}
            </button>

            <div className="border-t border-border pt-3 text-center text-[11px] text-muted-foreground">
              Use the role selector to demo CSR, GRO, Field Employee, Department Head, and Admin views.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputCls = "h-9 w-full rounded-sm border border-border bg-background px-2.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15";

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
