import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { BrandingPage, Section } from "@/components/admin/branding/BrandingShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  diffChanges,
  formatRatio,
  isValidHex,
  themeContrastChecks,
  updateDraft,
  useBranding,
  saveArea,
  type ThemeConfig,
} from "@/lib/branding-store";

export const Route = createFileRoute("/admin/branding/theme")({
  head: () => ({
    meta: [
      { title: "Theme - Branding - Account Administration" },
      { name: "description", content: "Configure approved presentation tokens for this account." },
      { property: "og:title", content: "Theme - Branding - Account Administration" },
      { property: "og:description", content: "Configure approved presentation tokens for this account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ThemePage,
});

const LABELS: Record<string, string> = {
  primary_colour: "Primary colour",
  secondary_colour: "Secondary colour",
  background_style: "Background",
  button_style: "Button style",
};

function ThemePage() {
  const state = useBranding();
  const theme = state.draft.theme;
  const [error, setError] = useState<string | null>(null);
  const checks = useMemo(() => themeContrastChecks(theme), [theme]);
  const blocked = checks.some((check) => check.blocking && !check.passes);
  const validColours = isValidHex(theme.primary_colour) && isValidHex(theme.secondary_colour);

  const patch = (next: Partial<ThemeConfig>) => {
    updateDraft((draft) => ({ ...draft, theme: { ...draft.theme, ...next } }));
    setError(null);
  };

  function save() {
    if (!validColours) {
      setError("Enter valid 3 or 6 digit hexadecimal colours, such as #2563EB.");
      return;
    }
    if (blocked) {
      setError("Fix the failing contrast pair before saving a publishable theme.");
      return;
    }
    const changes = diffChanges(state.published.theme, theme, LABELS);
    saveArea("THEME", changes, "Saved theme changes");
  }

  return (
    <BrandingPage
      title="Theme"
      description="Configure the visual theme used across citizen-facing and authenticated complaint management experiences."
      actions={<Button size="sm" onClick={save} disabled={blocked || !validColours}>Save draft</Button>}
    >
      <div className="grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Section title="Approved theme tokens" description="Only presentation tokens can be changed here. Layout, spacing and component behaviour remain fixed.">
          <div className="grid gap-4 sm:grid-cols-2">
            <ColourField label="Primary colour" helper="Used for primary actions, links and highlighted controls." value={theme.primary_colour} onChange={(v) => patch({ primary_colour: v })} />
            <ColourField label="Secondary colour" helper="Used for supporting interface elements where applicable." value={theme.secondary_colour} onChange={(v) => patch({ secondary_colour: v })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Background</Label>
              <Select value={theme.background_style} onValueChange={(v) => patch({ background_style: v as ThemeConfig["background_style"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="LIGHT">Light</SelectItem><SelectItem value="NEUTRAL">Neutral</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Button style</Label>
              <Select value={theme.button_style} onValueChange={(v) => patch({ button_style: v as ThemeConfig["button_style"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="STANDARD">Standard</SelectItem><SelectItem value="ROUNDED">Rounded</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          {error && <p role="alert" className="text-[12px] text-destructive">{error}</p>}
        </Section>

        <div className="space-y-5">
          <Section title="Accessibility check" description="Primary controls cannot be published when their text fails WCAG AA contrast.">
            <div className="space-y-3">
              {checks.map((check) => (
                <div key={check.label} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    {check.passes ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />}
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-medium text-foreground">{check.label}</p>
                      <p className="text-[12px] text-muted-foreground">{formatRatio(check.ratio)} contrast</p>
                      {!check.passes && <p className="mt-1 text-[12px] text-destructive">Recommended correction: {check.suggestion}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <ThemePreview theme={theme} />
        </div>
      </div>
    </BrandingPage>
  );
}

function ColourField({ label, helper, value, onChange }: { label: string; helper: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`colour-${label}`}>{label}</Label>
      <div className="flex gap-2">
        <input aria-label={`${label} picker`} type="color" value={isValidHex(value) ? value : "#2563EB"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded border border-input bg-background p-1" />
        <Input id={`colour-${label}`} value={value} maxLength={7} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-describedby={`help-${label}`} />
      </div>
      <p id={`help-${label}`} className="text-[12px] text-muted-foreground">{helper}</p>
    </div>
  );
}

function ThemePreview({ theme }: { theme: ThemeConfig }) {
  const surface = theme.background_style === "LIGHT" ? "#FFFFFF" : "#F4F6F9";
  return (
    <Section title="Live preview" description="Preview approved tokens before saving or publishing.">
      <div className="overflow-hidden rounded border border-border" style={{ backgroundColor: surface }}>
        <div className="border-b border-border px-3 py-2 text-[12px] font-semibold" style={{ color: theme.secondary_colour }}>Complaint Management</div>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded px-3 py-1.5 text-[12px] font-medium" style={{ backgroundColor: theme.primary_colour, color: "#FFFFFF" }}>Primary button</span>
            <span className="rounded border px-3 py-1.5 text-[12px] font-medium" style={{ borderColor: theme.secondary_colour, color: theme.secondary_colour }}>Secondary</span>
          </div>
          <a href="/admin/branding/theme" className="text-[12.5px] underline" style={{ color: theme.primary_colour }}>Link to complaint details</a>
          <div className="rounded border border-border bg-background px-3 py-2 text-[12px] text-muted-foreground">Complaint status: In progress</div>
          <Input readOnly placeholder="Form field" />
        </div>
      </div>
      <p className="text-center text-[11px] text-muted-foreground">Powered by DIGIT</p>
    </Section>
  );
}
