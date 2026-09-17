import digitLogo from "@/assets/digit-logo.png.asset.json";

/**
 * Subtle "Powered by <DIGIT logo>" attribution used across the
 * authentication and account-setup surfaces.
 */
export function PoweredByDigit({ className = "", logoHeight = 18 }: { className?: string; logoHeight?: number }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span style={{ color: "#A6ABBA", fontSize: 11, letterSpacing: "0.04em" }}>Powered by</span>
      <img src={digitLogo.url} alt="DIGIT" style={{ height: logoHeight, width: "auto", opacity: 0.75 }} loading="lazy" />
    </div>
  );
}
