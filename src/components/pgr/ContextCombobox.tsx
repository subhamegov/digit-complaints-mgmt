import { useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Scale-safe replacement for native <select> in the sidebar working context.
 * - Search filter appears automatically once the list grows past `searchThreshold`
 * - List is virtually capped by a scroll viewport, so 5 or 5,000 options render the same
 * - Popover is portalled and width-constrained, so it never spills out of the sidebar
 */
export function ContextCombobox({
  icon: Icon,
  label,
  value,
  options,
  onChange,
  searchThreshold = 7,
  placeholder = "Select…",
  disabled = false,
  helperText,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  options: ComboOption[];
  onChange: (value: string) => void;
  searchThreshold?: number;
  placeholder?: string;
  disabled?: boolean;
  helperText?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const showSearch = options.length > searchThreshold;

  return (
    <Popover open={disabled ? false : open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={disabled ? false : open}
          aria-label={label}
          aria-disabled={disabled}
          disabled={disabled}
          title={helperText}
          className={cn(
            "flex w-full items-center gap-2 rounded-sm border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left transition-colors",
            disabled ? "cursor-default text-chrome-foreground" : "hover:bg-white/[0.07]",
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0 text-chrome-muted" />
          <span className="min-w-0 flex-1 truncate text-[12px] text-chrome-foreground">
            {selected?.label ?? placeholder}
          </span>
          {disabled ? (
            <Lock className="h-3 w-3 shrink-0 text-chrome-muted" aria-label="Locked" />
          ) : (
            <ChevronDown className="h-3 w-3 shrink-0 text-chrome-muted" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-popover-trigger-width)] min-w-[220px] p-0"
      >
        <Command>
          {showSearch && <CommandInput placeholder={`Search ${label.toLowerCase()}…`} className="h-9" />}
          <CommandList className="max-h-[280px]">
            <CommandEmpty>No match found.</CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem
                  key={o.value}
                  value={`${o.label} ${o.hint ?? ""}`}
                  onSelect={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className="text-[13px]"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5 shrink-0",
                      o.value === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {o.hint && (
                    <span className="ml-2 shrink-0 text-[11px] text-muted-foreground">{o.hint}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
