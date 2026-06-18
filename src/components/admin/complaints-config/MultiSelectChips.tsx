import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, X } from "lucide-react";

export function MultiSelectChips({
  options,
  values,
  onChange,
  placeholder = "Select…",
}: {
  options: { value: string; label: string }[];
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.filter((o) => values.includes(o.value));
  const toggle = (val: string) => {
    onChange(values.includes(val) ? values.filter((v) => v !== val) : [...values, val]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-8 w-full justify-between text-left text-[12.5px] font-normal">
          <div className="flex flex-1 flex-wrap items-center gap-1 overflow-hidden">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.slice(0, 3).map((s) => (
                <Badge key={s.value} variant="secondary" className="gap-1 px-1.5 py-0 text-[11px]">
                  {s.label}
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.value); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))
            )}
            {selected.length > 3 && (
              <span className="text-[11px] text-muted-foreground">+{selected.length - 3}</span>
            )}
          </div>
          <ChevronDown className="h-3.5 w-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="start">
        <ul className="max-h-60 overflow-y-auto">
          {options.map((o) => (
            <li key={o.value}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] hover:bg-accent"
              onClick={() => toggle(o.value)}>
              <Checkbox checked={values.includes(o.value)} onCheckedChange={() => toggle(o.value)} />
              <span className="flex-1 truncate">{o.label}</span>
            </li>
          ))}
          {options.length === 0 && (
            <li className="px-2 py-1.5 text-[12px] text-muted-foreground">No options</li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
