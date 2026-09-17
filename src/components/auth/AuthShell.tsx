import { useEffect, useRef, useState } from "react";
import eGovLogoAsset from "@/assets/egov-foundation-white.png.asset.json";
import loginVideoAsset from "@/assets/login-bg.mp4.asset.json";
import loginPosterAsset from "@/assets/login-poster.jpg.asset.json";
import { LanguagePicker } from "@/components/LanguagePicker";
import type { LanguageCode } from "@/lib/accounts";

/** Shared dark treatment so poster, video and gradient fallback read identically. */
const OVERLAY_BASE = "rgba(8, 20, 48, 0.30)";
const OVERLAY_DIRECTIONAL =
  "linear-gradient(90deg, rgba(5,18,45,0.58) 0%, rgba(8,25,60,0.34) 35%, rgba(8,25,60,0.18) 70%, rgba(8,25,60,0.12) 100%)";
const OVERLAY_VERTICAL =
  "linear-gradient(180deg, rgba(8,20,48,0.10) 0%, rgba(8,20,48,0.10) 55%, rgba(6,14,40,0.55) 100%)";

/** Fallback used before the poster paints and if the poster itself fails. */
const GRADIENT_FALLBACK =
  "radial-gradient(120% 90% at 15% 10%, rgba(45,79,196,0.55) 0%, rgba(45,79,196,0) 60%)," +
  "radial-gradient(100% 80% at 85% 90%, rgba(53,91,224,0.45) 0%, rgba(53,91,224,0) 55%)," +
  "linear-gradient(160deg, #0B1F3A 0%, #10275A 45%, #1B3A8A 100%)";

/**
 * Decorative background: gradient base, poster image, then an async video that
 * cross-fades in. Authentication never waits on any of these layers.
 */
function AuthBackdrop() {
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [allowVideo, setAllowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const slow = conn?.saveData === true || /(^|-)2g$/.test(conn?.effectiveType ?? "");
    const smallScreen = window.matchMedia?.("(max-width: 1023px)").matches;
    if (reducedMotion || slow || smallScreen) return;
    // Defer the download so the authentication card renders first.
    const id = window.setTimeout(() => setAllowVideo(true), 300);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: GRADIENT_FALLBACK }} />
      {!posterFailed && (
        <img
          src={loginPosterAsset.url}
          alt=""
          onError={() => setPosterFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {allowVideo && (
        <video
          ref={videoRef}
          src={loginVideoAsset.url}
          poster={loginPosterAsset.url}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoReady(false)}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ opacity: videoReady ? 1 : 0, transition: "opacity 400ms ease" }}
        />
      )}
      <div className="absolute inset-0" style={{ background: OVERLAY_BASE }} />
      <div className="absolute inset-0" style={{ background: OVERLAY_DIRECTIONAL }} />
      <div className="absolute inset-0" style={{ background: OVERLAY_VERTICAL }} />
      {/* Very slow, very faint drift so the scene stays alive even in still frames. */}
      <div
        className="auth-backdrop-drift absolute"
        style={{
          inset: "-25%",
          background:
            "radial-gradient(45% 45% at 30% 35%, rgba(53,91,224,0.22) 0%, rgba(53,91,224,0) 70%)," +
            "radial-gradient(40% 40% at 70% 70%, rgba(94,140,255,0.16) 0%, rgba(94,140,255,0) 70%)",
        }}
      />
      <style>{`
        @keyframes authBackdropDrift {
          0%   { transform: translate3d(0,0,0) scale(1); }
          50%  { transform: translate3d(2.5%, -2%, 0) scale(1.05); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        .auth-backdrop-drift { animation: authBackdropDrift 46s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) {
          .auth-backdrop-drift { animation: none; }
        }
      `}</style>
    </div>
  );
}

/**
 * Shared authentication shell used by /login and /signup.
 * Left: brand / narrative media column. Right: the auth card slot.
 */
/** Shared product messaging - identical on /login and /signup. */
const AUTH_HEADLINE = "Manage complaints from intake to closure.";
const AUTH_NARRATIVE =
  "Sign in to receive complaints, assign them to the right team, track service timelines, record actions and evidence, and monitor resolution across departments and localities.";

/** Rotating strap-lines shown beneath the narrative on /login and /signup. */
const AUTH_ROTATING: { title: string; quote: string }[] = [
  {
    title: "Governance that learns",
    quote:
      "Connecting citizen voices to responsive institutions and efficient services through an experience that feels natural.",
  },
  {
    title: "Service you can track",
    quote:
      "Every complaint carries a clear owner, a service timeline, and a record of what was done - visible end to end.",
  },
  {
    title: "Trust, built daily",
    quote:
      "Turning everyday civic signals into faster resolution and steady confidence in public institutions.",
  },
];

function RotatingNarrative() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeOut = window.setTimeout(() => setVisible(false), 5200);
    const advance = window.setTimeout(() => {
      setIndex((i) => (i + 1) % AUTH_ROTATING.length);
      setVisible(true);
    }, 6000);
    return () => {
      window.clearTimeout(fadeOut);
      window.clearTimeout(advance);
    };
  }, [index]);

  const item = AUTH_ROTATING[index]!;
  return (
    <div
      aria-live="polite"
      style={{
        marginTop: 20,
        minHeight: 116,
        maxWidth: 360,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 800ms ease, transform 800ms ease",
      }}
    >
      <div style={{ color: "#FFFFFF", fontSize: 15, fontWeight: 600 }}>{item.title}</div>
      <p style={{ marginTop: 6, color: "rgba(255,255,255,0.78)", fontSize: 15, lineHeight: 1.6, fontStyle: "italic" }}>
        “{item.quote}”
      </p>
    </div>
  );
}

export function AuthShell({
  language,
  onLanguageChange,
  cardMaxWidth = 400,
  children,
}: {
  language: LanguageCode;
  onLanguageChange: (code: LanguageCode) => void;
  cardMaxWidth?: number;
  children: React.ReactNode;
}) {
  const headline = AUTH_HEADLINE;
  const narrative = AUTH_NARRATIVE;
  return (
    <div className="min-h-screen w-full" style={{ background: "#F5F7FF" }}>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[45fr_55fr] xl:grid-cols-2">
        {/* Identity / media column */}
        <div className="relative hidden min-h-[320px] flex-col justify-between overflow-hidden lg:flex">
          <AuthBackdrop />
          {/* Brand mark belongs to the shell, not the auth form: fixed within the visual column. */}
          <div className="auth-brand-mark absolute z-[2]">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open DIGIT Complaint Management landing page in a new tab"
              className="inline-block transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <img
                src={eGovLogoAsset.url}
                alt="eGov Foundation"
                className="auth-brand-logo"
                style={{ height: "auto", display: "block", filter: "drop-shadow(0 2px 10px rgba(4,12,34,0.35))" }}
              />
            </a>
          </div>

          <div style={{ position: "absolute", top: 110, left: 40, right: 28, zIndex: 1 }}>
            <div>
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
          <div style={{ padding: "0 28px 28px 28px", maxWidth: 416, position: "relative", zIndex: 1 }}>
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
            <RotatingNarrative />
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

/** Chevron drawn as an inline SVG so every dropdown aligns identically. */
const CHEVRON =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235E6675' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")";

/** Shared dropdown styling: same height, text inset and trailing chevron as text inputs. */
export const authSelectStyle: React.CSSProperties = {
  ...authInputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  padding: "0 38px 0 12px",
  textOverflow: "ellipsis",
  backgroundImage: CHEVRON,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  backgroundSize: "16px 16px",
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
