import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Languages } from "lucide-react";
import {
  LOCALES,
  LOCALE_LABEL,
  type LocaleCode,
  type LocalizedString,
} from "@/lib/complaints-config-store";
import { cn } from "@/lib/utils";

type Props = {
  value: LocalizedString;
  onChange: (next: LocalizedString) => void;
  locale: LocaleCode;
  multiline?: boolean;
  placeholder?: string;
  title?: string;
};

export function LocalizedInput({
  value,
  onChange,
  locale,
  multiline,
  placeholder,
  title = "Translate",
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<LocalizedString>(value);

  const Field = multiline ? Textarea : Input;

  return (
    <div className="flex items-start gap-1">
      <Field
        value={value[locale] ?? ""}
        onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          onChange({ ...value, [locale]: e.target.value })
        }
        placeholder={placeholder}
        className="h-8 text-[13px]"
      />
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setDraft(value); }}>
        <DialogTrigger asChild>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8 shrink-0" title="Edit all locales">
            <Languages className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {LOCALES.map((lc) => (
              <div key={lc} className="space-y-1">
                <Label className="text-xs">{LOCALE_LABEL[lc]}</Label>
                {multiline ? (
                  <Textarea
                    value={draft[lc] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [lc]: e.target.value })}
                  />
                ) : (
                  <Input
                    value={draft[lc] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [lc]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { onChange(draft); setOpen(false); }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LocaleChips value={value} />
    </div>
  );
}

export function LocaleChips({ value }: { value: LocalizedString }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 px-1 pt-2">
      {LOCALES.map((lc) => {
        const filled = Boolean(value[lc]);
        return (
          <span
            key={lc}
            title={`${LOCALE_LABEL[lc]}${filled ? "" : " — missing"}`}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              filled ? "bg-emerald-500" : "bg-amber-400",
            )}
          />
        );
      })}
    </div>
  );
}
