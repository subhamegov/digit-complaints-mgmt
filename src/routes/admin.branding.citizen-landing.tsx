import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { ArrowDown, ArrowUp, Check } from "lucide-react";
import { BrandingPage, Section, PoweredByDigit } from "@/components/admin/branding/BrandingShell";
import { ImageUploadField } from "@/components/admin/branding/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { diffChanges, INFORMATION_BLOCKS, saveArea, updateDraft, useBranding, type InformationBlockId } from "@/lib/branding-store";
import { labelFor, useComplaintsConfig } from "@/lib/complaints-config-store";

export const Route = createFileRoute("/admin/branding/citizen-landing")({
  head: () => ({
    meta: [
      { title: "Citizen Landing Page - Branding" },
      { name: "description", content: "Configure the account's citizen-facing complaint landing experience." },
      { property: "og:title", content: "Citizen Landing Page - Branding" },
      { property: "og:description", content: "Configure the account's citizen-facing complaint landing experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CitizenLandingPage,
});

const LABELS: Record<string, string> = {
  "hero.heading": "Hero heading",
  "hero.supporting_text": "Hero supporting text",
  "hero.image": "Hero image",
  "primary_actions.file_complaint_label": "Report action label",
  "primary_actions.track_complaint_label": "Track action label",
  enabled_information_blocks: "Enabled information blocks",
  information_block_order: "Information block order",
  featured_complaint_types: "Featured complaint categories",
};

function CitizenLandingPage() {
  const state = useBranding();
  const initial = useRef(state.draft.citizen_landing);
  const landing = state.draft.citizen_landing;
  const config = useComplaintsConfig();
  const patch = (next: Partial<typeof landing>) => updateDraft((draft) => ({ ...draft, citizen_landing: { ...draft.citizen_landing, ...next } }));
  const save = () => saveArea("CITIZEN_LANDING", diffChanges(initial.current, landing, LABELS), "Saved citizen landing page changes");

  const toggleBlock = (id: InformationBlockId) => {
    const enabled = landing.enabled_information_blocks.includes(id)
      ? landing.enabled_information_blocks.filter((item) => item !== id)
      : [...landing.enabled_information_blocks, id];
    patch({ enabled_information_blocks: enabled });
  };
  const moveBlock = (id: InformationBlockId, direction: -1 | 1) => {
    const list = [...landing.information_block_order];
    const at = list.indexOf(id);
    const next = at + direction;
    if (at < 0 || next < 0 || next >= list.length) return;
    [list[at], list[next]] = [list[next], list[at]];
    patch({ information_block_order: list });
  };
  const activeCategories = config.categories.filter((category) => category.active);

  return <BrandingPage title="Citizen Landing Page" description="Configure the first page citizens see when accessing the complaint management service." actions={<Button size="sm" onClick={save}>Save draft</Button>}><div className="grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5"><Section title="Hero" description="Keep the first task clear: reporting an issue or tracking a complaint."><div className="space-y-4"><TextField id="hero-heading" label="Heading" value={landing.hero.heading} maxLength={100} onChange={(v) => patch({ hero: { ...landing.hero, heading: v } })} /><TextAreaField id="hero-support" label="Supporting text" value={landing.hero.supporting_text} maxLength={280} onChange={(v) => patch({ hero: { ...landing.hero, supporting_text: v } })} /><ImageUploadField label="Hero image" recommendation="Optional. Recommended: 1200 x 700 px. PNG, JPG or safe SVG up to 1 MB." value={landing.hero.image} onChange={(v) => patch({ hero: { ...landing.hero, image: v } })} /></div></Section><Section title="Primary actions" description="These required destinations remain fixed and cannot be hidden or redirected."><div className="grid gap-4 sm:grid-cols-2"><TextField id="file-label" label="Report an issue label" value={landing.primary_actions.file_complaint_label} maxLength={60} onChange={(v) => patch({ primary_actions: { ...landing.primary_actions, file_complaint_label: v } })} /><TextField id="track-label" label="Track a complaint label" value={landing.primary_actions.track_complaint_label} maxLength={60} onChange={(v) => patch({ primary_actions: { ...landing.primary_actions, track_complaint_label: v } })} /></div><div className="flex flex-wrap gap-2 text-[12px]"><span className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1"><Check className="h-3.5 w-3.5 text-emerald-600" /> Filing flow retained</span><span className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1"><Check className="h-3.5 w-3.5 text-emerald-600" /> Tracking flow retained</span></div></Section><Section title="Information" description="Enable and order focused information blocks. Arbitrary HTML is not supported."><div className="space-y-2">{landing.information_block_order.map((id) => { const item = INFORMATION_BLOCKS.find((block) => block.id === id); if (!item) return null; return <div key={id} className="flex items-center gap-2 rounded border border-border bg-background px-3 py-2"><Checkbox checked={landing.enabled_information_blocks.includes(id)} onCheckedChange={() => toggleBlock(id)} aria-label={`Enable ${item.label}`} /><span className="min-w-0 flex-1 text-[12.5px]">{item.label}</span><Button type="button" variant="ghost" size="icon" aria-label={`Move ${item.label} up`} disabled={landing.information_block_order.indexOf(id) === 0} onClick={() => moveBlock(id, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Move ${item.label} down`} disabled={landing.information_block_order.indexOf(id) === landing.information_block_order.length - 1} onClick={() => moveBlock(id, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button></div>; })}</div></Section><Section title="Popular complaint categories" description="Choose from active complaint types already configured in Complaints. This screen cannot create categories."><div className="grid gap-2 sm:grid-cols-2">{activeCategories.map((category) => { const checked = landing.featured_complaint_types.includes(category.id); return <label key={category.id} className="flex cursor-pointer items-center gap-2 rounded border border-border bg-background px-3 py-2 text-[12.5px]"><Checkbox checked={checked} onCheckedChange={(value) => patch({ featured_complaint_types: value === true ? [...landing.featured_complaint_types, category.id] : landing.featured_complaint_types.filter((id) => id !== category.id) })} /><span>{labelFor(category.label, "en", category.code)}</span></label>; })}</div>{activeCategories.length === 0 && <p className="text-[12px] text-muted-foreground">No active complaint types are available yet. Configure them under Complaints first.</p>}<p className="text-[12px] text-muted-foreground">Languages come from Account &gt; Localisation and are not configured here.</p></Section></div><CitizenPreview landing={landing} /></div></BrandingPage>;
}

function TextField({ id, label, value, maxLength, onChange }: { id: string; label: string; value: string; maxLength: number; onChange: (v: string) => void }) { return <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor={id}>{label}</Label><span className="text-[11px] text-muted-foreground">{value.length}/{maxLength}</span></div><Input id={id} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} /></div>; }
function TextAreaField({ id, label, value, maxLength, onChange }: { id: string; label: string; value: string; maxLength: number; onChange: (v: string) => void }) { return <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor={id}>{label}</Label><span className="text-[11px] text-muted-foreground">{value.length}/{maxLength}</span></div><Textarea id={id} rows={3} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} /></div>; }
function CitizenPreview({ landing }: { landing: ReturnType<typeof useBranding>["draft"]["citizen_landing"] }) { return <Section title="Live preview" description="Mobile-first preview of the signed-out citizen landing experience."><div className="mx-auto max-w-[330px] overflow-hidden rounded border border-border bg-background"><div className="border-b border-border px-4 py-3 text-[12px] font-semibold text-foreground">Complaint Management</div><div className="space-y-4 p-4"><div>{landing.hero.image && <img src={landing.hero.image.url} alt={landing.hero.image.decorative ? "" : landing.hero.image.alt || "Citizen landing hero"} className="mb-3 h-28 w-full object-cover" />}<h3 className="text-[18px] font-semibold text-foreground">{landing.hero.heading}</h3><p className="mt-1 text-[12.5px] text-muted-foreground">{landing.hero.supporting_text}</p></div><div className="grid gap-2"><span className="rounded bg-primary px-3 py-2 text-center text-[12px] font-medium text-primary-foreground">{landing.primary_actions.file_complaint_label}</span><span className="rounded border border-primary px-3 py-2 text-center text-[12px] font-medium text-primary">{landing.primary_actions.track_complaint_label}</span></div><div className="space-y-2 border-t border-border pt-3">{landing.information_block_order.filter((id) => landing.enabled_information_blocks.includes(id)).map((id) => <div key={id} className="text-[12px] text-muted-foreground">{INFORMATION_BLOCKS.find((item) => item.id === id)?.label}</div>)}</div></div></div><PoweredByDigit /></Section>; }
