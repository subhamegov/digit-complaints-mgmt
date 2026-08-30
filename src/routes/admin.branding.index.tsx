import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Image, LayoutTemplate, MonitorSmartphone, Palette } from "lucide-react";
import { BrandingPage, Section } from "@/components/admin/branding/BrandingShell";

export const Route = createFileRoute("/admin/branding/")({
  head: () => ({
    meta: [
      { title: "Branding - Account Administration" },
      {
        name: "description",
        content: "Manage account-scoped branding for employees and citizens.",
      },
      { property: "og:title", content: "Branding - Account Administration" },
      {
        property: "og:description",
        content: "Manage account-scoped branding for employees and citizens.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BrandingOverview,
});

const CARDS = [
  {
    to: "/admin/branding/theme",
    title: "Theme",
    description: "Set the colours and visual style used across your complaint management service.",
    action: "Configure theme",
    icon: Palette,
  },
  {
    to: "/admin/branding/sign-in",
    title: "Sign-in Personalisation",
    description: "Customise what employees and citizens see before they sign in.",
    action: "Configure sign-in",
    icon: MonitorSmartphone,
  },
  {
    to: "/admin/branding/logo",
    title: "Logo",
    description: "Manage organisation logos and brand marks while keeping DIGIT attribution in place.",
    action: "Manage logos",
    icon: Image,
  },
  {
    to: "/admin/branding/citizen-landing",
    title: "Citizen Landing Page",
    description: "Configure the public landing experience before a citizen files or tracks a complaint.",
    action: "Configure landing page",
    icon: LayoutTemplate,
  },
] as const;

function BrandingOverview() {
  return (
    <BrandingPage
      title="Branding"
      description="Personalise how your complaint management service appears to citizens and employees. Changes apply to this account only."
    >
      <div className="max-w-5xl space-y-5">
        <Section
          title="Account branding"
          description="Branding is account-wide and does not change with the locality selected in Working Context."
        >
          <div className="grid gap-3 md:grid-cols-2">
            {CARDS.map(({ to, title, description, action, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group flex min-h-[142px] flex-col justify-between rounded border border-border bg-background p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border bg-surface text-primary">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
                    <p className="mt-1 text-[12.5px] leading-5 text-muted-foreground">{description}</p>
                  </div>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-primary">
                  {action}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <div className="rounded border border-border bg-background px-4 py-3 text-[12.5px] text-muted-foreground">
          Draft changes stay private until they are published. Required DIGIT attribution remains visible on branded experiences.
        </div>
      </div>
    </BrandingPage>
  );
}
