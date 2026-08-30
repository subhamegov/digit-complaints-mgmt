import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { BrandingPage, Section, PoweredByDigit } from "@/components/admin/branding/BrandingShell";
import { ImageUploadField } from "@/components/admin/branding/ImageUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { diffChanges, saveArea, updateDraft, useBranding } from "@/lib/branding-store";

export const Route = createFileRoute("/admin/branding/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign-in Personalisation - Branding" },
      { name: "description", content: "Configure employee and citizen sign-in presentation for this account." },
      { property: "og:title", content: "Sign-in Personalisation - Branding" },
      { property: "og:description", content: "Configure employee and citizen sign-in presentation for this account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignInPage,
});

const LABELS: Record<string, string> = {
  "employee.title": "Employee page title",
  "employee.supporting_text": "Employee supporting text",
  "employee.background_image": "Employee background image",
  "employee.illustration": "Employee sign-in illustration",
  "citizen.title": "Citizen page title",
  "citizen.supporting_text": "Citizen supporting text",
};

function SignInPage() {
  const state = useBranding();
  const [mode, setMode] = useRef<"employee" | "citizen">("employee");
  const initial = useRef(state.draft.sign_in);
  const signIn = state.draft.sign_in;

  const updateEmployee = (patch: Partial<typeof signIn.employee>) => updateDraft((draft) => ({ ...draft, sign_in: { ...draft.sign_in, employee: { ...draft.sign_in.employee, ...patch } } }));
  const updateCitizen = (patch: Partial<typeof signIn.citizen>) => updateDraft((draft) => ({ ...draft, sign_in: { ...draft.sign_in, citizen: { ...draft.sign_in.citizen, ...patch } } }));
  const save = () => saveArea("SIGN_IN", diffChanges(initial.current, signIn, LABELS), "Saved sign-in personalisation");

  return (
    <BrandingPage title="Sign-in Personalisation" description="Configure the content and branding users see before authenticating." actions={<Button size="sm" onClick={save}>Save draft</Button>}>
      <div className="grid max-w-6xl gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Section title="Sign-in experiences" description="Employee and citizen content is configured independently. Authentication methods and routing are unchanged here.">
          <Tabs defaultValue="employee">
            <TabsList className="w-full justify-start rounded border border-border bg-background">
              <TabsTrigger value="employee">Employee sign-in</TabsTrigger>
              <TabsTrigger value="citizen">Citizen sign-in</TabsTrigger>
            </TabsList>
            <TabsContent value="employee" className="space-y-4">
              <TextField id="employee-title" label="Page title" value={signIn.employee.title} maxLength={80} onChange={(v) => updateEmployee({ title: v })} />
              <TextAreaField id="employee-support" label="Supporting text" value={signIn.employee.supporting_text} maxLength={240} onChange={(v) => updateEmployee({ supporting_text: v })} />
              <ImageUploadField label="Background image" description="Optional image for the employee sign-in surface." recommendation="Recommended: 1600 x 900 px. PNG, JPG or safe SVG up to 1 MB." value={signIn.employee.background_image} onChange={(v) => updateEmployee({ background_image: v })} />
              <ImageUploadField label="Sign-in illustration" description="Optional welcome image." recommendation="Recommended: 800 x 800 px. PNG, JPG or safe SVG up to 1 MB." value={signIn.employee.illustration} onChange={(v) => updateEmployee({ illustration: v })} />
            </TabsContent>
            <TabsContent value="citizen" className="space-y-4">
              <TextField id="citizen-title" label="Page title" value={signIn.citizen.title} maxLength={80} onChange={(v) => updateCitizen({ title: v })} />
              <TextAreaField id="citizen-support" label="Supporting text" value={signIn.citizen.supporting_text} maxLength={240} onChange={(v) => updateCitizen({ supporting_text: v })} />
              <div className="rounded border border-border bg-background px-3 py-2 text-[12px] text-muted-foreground">Citizen sign-in stays intentionally simpler and does not expose employee terminology or authentication controls.</div>
            </TabsContent>
          </Tabs>
        </Section>
        <SignInPreview signIn={signIn} />
      </div>
    </BrandingPage>
  );
}

function TextField({ id, label, value, maxLength, onChange }: { id: string; label: string; value: string; maxLength: number; onChange: (v: string) => void }) {
  return <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor={id}>{label}</Label><span className="text-[11px] text-muted-foreground">{value.length}/{maxLength}</span></div><Input id={id} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} /></div>;
}

function TextAreaField({ id, label, value, maxLength, onChange }: { id: string; label: string; value: string; maxLength: number; onChange: (v: string) => void }) {
  return <div className="space-y-1.5"><div className="flex items-center justify-between"><Label htmlFor={id}>{label}</Label><span className="text-[11px] text-muted-foreground">{value.length}/{maxLength}</span></div><Textarea id={id} value={value} maxLength={maxLength} rows={3} onChange={(e) => onChange(e.target.value)} /></div>;
}

function SignInPreview({ signIn }: { signIn: ReturnType<typeof useBranding>["draft"]["sign_in"] }) {
  return <Section title="Preview" description="Check both supported audiences before publishing."><Tabs defaultValue="employee"><div className="mb-3 flex items-center justify-between gap-2"><TabsList className="rounded border border-border bg-background"><TabsTrigger value="employee">Employee</TabsTrigger><TabsTrigger value="citizen">Citizen</TabsTrigger></TabsList><span className="text-[11px] text-muted-foreground">Desktop preview</span></div><TabsContent value="employee"><PreviewSurface title={signIn.employee.title} supporting={signIn.employee.supporting_text} image={signIn.employee.illustration} /><p className="mt-2 text-center text-[11px] text-muted-foreground">Google SSO, email, OTP and other configured authentication methods remain unchanged.</p></TabsContent><TabsContent value="citizen"><PreviewSurface title={signIn.citizen.title} supporting={signIn.citizen.supporting_text} /></TabsContent></Tabs><PoweredByDigit /></Section>;
}

function PreviewSurface({ title, supporting, image }: { title: string; supporting: string; image?: { url: string; alt: string; decorative: boolean } | null }) {
  return <div className="overflow-hidden rounded border border-border bg-background"><div className="flex min-h-[210px] items-center gap-4 p-5">{image && <img src={image.url} alt={image.decorative ? "" : image.alt || "Sign-in illustration"} className="h-24 w-24 shrink-0 object-contain" />}<div><p className="text-[15px] font-semibold text-foreground">{title}</p><p className="mt-1 text-[12.5px] text-muted-foreground">{supporting}</p><div className="mt-4 h-8 w-28 rounded bg-primary" /></div></div></div>;
}
