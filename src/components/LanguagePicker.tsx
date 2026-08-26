import { Globe } from "lucide-react";
import { LANGUAGES, type LanguageCode } from "@/lib/accounts";

/**
 * Reusable, lightweight language selector.
 * Only languages listed in LANGUAGES are shown; add entries there to extend.
 */
export function LanguagePicker({
  value,
  onChange,
  className,
}: {
  value: LanguageCode;
  onChange: (code: LanguageCode) => void;
  className?: string;
}) {
  return (
    <label className={`inline-flex items-center gap-1.5 ${className ?? ""}`} style={{ color: "#5E6675" }}>
      <Globe className="h-3.5 w-3.5" aria-hidden="true" />
      <select
        aria-label="Select language"
        value={value}
        onChange={(e) => onChange(e.target.value as LanguageCode)}
        className="cursor-pointer bg-transparent outline-none focus:ring-2 focus:ring-[#355BE0]/30 rounded-sm"
        style={{ color: "#17191F", fontSize: 13, padding: "2px 4px" }}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
