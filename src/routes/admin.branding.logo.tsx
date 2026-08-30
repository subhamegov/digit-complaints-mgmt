import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { BrandingPage, Section, PoweredByDigit } from "@/components/admin/branding/BrandingShell";
import { ImageUploadField } from "@/components/admin/branding/ImageUploadField";
import { Button } from "@/components/ui/button";
import { diffChanges, saveArea, updateDraft, useBranding } from "@/lib/branding-store";

export const Route = createFileRoute("/admin/branding/logo")({
  head: () => ({
    meta: [
      { title: "Logo - Branding - Account Administration" },
      { name: "description", content: "Manage organisation logos and brand marks for this account." },
      { property: "og:title", content: "Logo - Branding - Account Administration" },
      { property: "og:description", content: "Manage organisation logos and brand marks for this account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LogoPage,
});

const LABELS: Record<string, string> = {
  primary_logo: "Organisation logo",
  compact_logo: "Compact logo",
  favicon: "Browser icon",
};

function LogoPage() {
  const state = useBranding();
  const initial = useRef(state.draft.logos);
  const logos = state.draft.logos;
  const patch = (key: keyof typeof logos, value: (typeof logos)[keyof typeof logos]) => updateDraft((draft) => ({ ...draft, logos: { ...draft.logos, [key]: value } }));
  const save = () => saveArea("LOGO", diffChanges(initial.current, logos, LABELS), "Saved logo changes");

  return <BrandingPage title="Logo" description="Upload the organisation branding used across complaint management experiences." actions={<Button size="sm" onClick={save}>Save draft</Button>}><div className="grid max-w-5xl gap-5 xl:grid-cols-[minmax(0,1fr)_280px]"><Section title="Organisation marks" description="No logo is required. If none is configured, standard DIGIT Complaint Management branding is used."><div className="space-y-5"><ImageUploadField label="Organisation logo" description="Used in application headers and major branded surfaces." recommendation="Recommended: 1200 x 320 px. PNG, JPG or safe SVG up to 1 MB." value={logos.primary_logo} onChange={(v) => patch("primary_logo", v)} /><ImageUploadField label="Compact logo" description="Used when horizontal space is limited." recommendation="Recommended: 256 x 256 px. PNG, JPG or safe SVG up to 1 MB." value={logos.compact_logo} onChange={(v) => patch("compact_logo", v)} /><ImageUploadField label="Browser icon" description="Used in supported browser tabs." recommendation="Recommended: 48 x 48 px. PNG, JPG or safe SVG up to 1 MB." value={logos.favicon} onChange={(v) => patch("favicon", v)} allowDecorative={false} /></div></Section><Section title="Presentation rules" description="Organisation branding never replaces mandatory product attribution."><div className="rounded border border-border bg-background p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded border border-border bg-surface text-[11px] font-semibold text-primary">DIGIT</div><div><p className="text-[13px] font-medium text-foreground">Powered by DIGIT</p><p className="text-[12px] text-muted-foreground">This attribution remains visible wherever required.</p></div></div><PoweredByDigit /></div></Section></div></BrandingPage>;
}
