import { useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LANGUAGES, type LanguageCode } from "@/lib/accounts";

/**
 * Reusable, lightweight language selector.
 * Uses a portalled popover (not a native <select>) so the menu is always
 * aligned to the trigger and styled with the app's palette at any scale.
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
  const [open, setOpen] = useState(false);
  const selected = LANGUAGES.find((l) => l.code === value) ?? LANGUAGES[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-label="Select language"
          className="inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-[#355BE0]/30"
          style={{ borderColor: "#CBD5F2", background: "#FFFFFF", color: "#17191F" }}
        >
          <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: "#5E6675" }} aria-hidden="true" />
          <span className="truncate">{selected?.label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: "#8A90A2" }} aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={6}
        className="w-[180px] rounded-md border p-1"
        style={{ borderColor: "#DCE4FF", background: "#FFFFFF" }}
      >
        <div role="listbox" className="flex flex-col">
          {LANGUAGES.map((l) => {
            const active = l.code === value;
            return (
              <button
                key={l.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(l.code);
                  setOpen(false);
                }}
                className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-[13px] transition-colors hover:bg-[#F0F4FF]"
                style={{ color: "#17191F" }}
              >
                <Check
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "#2D4FC4", opacity: active ? 1 : 0 }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{l.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
