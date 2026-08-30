import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Building2, Droplets, PhoneCall, HardHat, FolderKanban } from "lucide-react";

export const Route = createFileRoute("/admin/templates/")({
  head: () => ({
    meta: [
      { title: "Templates - Account Administration" },
      {
        name: "description",
        content:
          "Planned DIGIT toolkit templates for complaint, service request and case management operations.",
      },
      { property: "og:title", content: "Templates - Account Administration" },
      {
        property: "og:description",
        content:
          "Planned DIGIT toolkit templates for complaint, service request and case management operations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TemplatesPage,
});

type TemplatePlaceholder = {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

/** Informational placeholders only - no routes, actions or navigation. */
const TEMPLATES: TemplatePlaceholder[] = [
  {
    id: "local_government_operations",
    name: "Local Government Operations",
    description:
      "Complaint and service request management for local government services such as roads, streetlights, waste, public spaces and civic services.",
    icon: Building2,
  },
  {
    id: "water_sanitation_operations",
    name: "Water & Sanitation Operations",
    description:
      "Complaint management for water supply, sewerage, sanitation, maintenance and utility service operations.",
    icon: Droplets,
  },
  {
    id: "ivrs_operations",
    name: "IVRS Operations",
    description:
      "Complaint and service request operations designed for call-centre and IVRS-led citizen service channels.",
    icon: PhoneCall,
  },
  {
    id: "project_complaints",
    name: "Project Complaints",
    description:
      "Manage complaints, feedback and issues associated with programmes, infrastructure projects and implementation activities.",
    icon: HardHat,
  },
  {
    id: "case_management",
    name: "Case Management",
    description:
      "Track cases that require structured ownership, follow-up, evidence, decisions and resolution over time.",
    icon: FolderKanban,
  },
];

function TemplatesPage() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Templates"
        subtitle="Templates provide pre-configured starting points for different complaint, service request and case management operations."
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((template) => (
            <article
              key={template.id}
              className="rounded border border-border bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-border bg-muted/30 text-primary">
                  <template.icon className="h-4.5 w-4.5" />
                </div>
                <span className="rounded-sm border border-border bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  Coming soon
                </span>
              </div>
              <h2 className="mt-3 text-[14px] font-semibold text-foreground">
                {template.name}
              </h2>
              <p className="mt-1.5 text-[12.5px] leading-5 text-muted-foreground">
                {template.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
