import eGovLogoAsset from "@/assets/eGov-Foundation.png.asset.json";
import loginBg from "@/assets/login-crowd.jpg";
import { LanguagePicker } from "@/components/LanguagePicker";
import type { LanguageCode } from "@/lib/accounts";

/**
 * Shared authentication shell used by /login and /signup.
 * Left: brand / narrative media column. Right: the auth card slot.
 */
export function AuthShell({
  headline,
  narrative,
  language,
  onLanguageChange,
  cardMaxWidth = 400,
  children,
}: {
  headline: string;
  narrative: string;
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
  cardMaxWidth?: number;
  children: React.ReactNode;
}) {
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
          <div style={{ position: "absolute", top: 28, left: 28, right: 28 }}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open DIGIT Complaint Management landing page in a new tab"
              className="inline-block rounded-md px-2.5 py-1.5 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)" }}
            >
              <img src={eGovLogoAsset.url} alt="eGov Foundation" style={{ height: 36, width: "auto", display: "block" }} />
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
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Digital Infrastructure for Public Services
              </div>
            </div>
          </div>

          <div />
          <div style={{ padding: "0 28px 28px 28px", maxWidth: 416 }}>
            <h1
              style={{
                color: "#FFFFFF",
                fontSize: "clamp(34px,4vw,48px)",
                fontWeight: 600,
                lineHeight: 1.1,
                maxWidth: 360,
              }}
            >
              {headline}
            </h1>
            <p style={{ marginTop: 16, color: "rgba(255,255,255,0.86)", fontSize: 16, lineHeight: 1.6, maxWidth: 360 }}>
              {narrative}
            </p>
            <div style={{ marginTop: 24, color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
              © 2026 eGovernments Foundation · DIGIT 2.9
            </div>
          </div>
        </div>

        {/* Card column */}
        <div
          className="flex flex-col items-center justify-center px-5 py-10 sm:p-10"
          style={{ background: "#F5F7FF", color: "#17191F" }}
        >
          <div className="mb-3 flex w-full justify-end" style={{ maxWidth: cardMaxWidth }}>
            <LanguagePicker value={language} onChange={onLanguageChange} />
          </div>
          {children}
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

export const authInputCls = "login-input w-full outline-none";

export const authInputStyle: React.CSSProperties = {
  height: 44,
  background: "#FFFFFF",
  border: "1px solid #CBD5F2",
  borderRadius: 8,
  color: "#17191F",
  fontSize: 14,
  padding: "0 12px",
};

export function AuthField({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block"
        style={{ color: "#5E6675", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
