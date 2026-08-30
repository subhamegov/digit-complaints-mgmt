/**
 * Shared chrome for Account Administration > Branding.
 *
 * Provides the secondary navigation (Overview / Theme / Sign-in / Logo /
 * Citizen Landing Page), the draft-vs-published status bar, and the
 * publish confirmation. Branding is presentation only and account-wide:
 * nothing here reads or writes the Working Context locality.
 */

import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  discardDraft,
  hasUnpublishedChanges,
  publishBranding,
  rememberBrandingSection,
  themeContrastChecks,
  useBranding,
} from "@/lib/branding-store";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const BRANDING_TABS = [
  { to: "/admin/branding", label: "Overview", exact: true },
  { to: "/admin/branding/theme", label: "Theme" },
  { to: "/admin/branding/sign-in", label: "Sign-in Personalisation" },
  { to: "/admin/branding/logo", label: "Logo" },
  { to: "/admin/branding/citizen-landing", label: "Citizen Landing Page" },
];

export function BrandingTabs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (pathname !== "/admin/branding") rememberBrandingSection(pathname);
  }, [pathname]);
  return (
    <nav
      aria-label="Branding sections"
      className="flex flex-wrap gap-1 border-b border-border bg-surface px-4 lg:px-6"
    >
      {BRANDING_TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.to
          : pathname === tab.to || pathname.startsWith(tab.to + "/");
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] transition-colors",
              active
                ? "border-primary font-medium text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Draft status + publish controls, shown on every Branding subsection. */
export function BrandingStatusBar() {
  const state = useBranding();
  const dirty = hasUnpublishedChanges(state);
  const [confirm, setConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);
  const blocked = themeContrastChecks(state.draft.theme).some(
    (c) => c.blocking && !c.passes,
  );

  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background px-4 py-2 lg:px-6">
      {dirty ? (
        <Badge className="gap-1 bg-amber-100 text-amber-900 hover:bg-amber-100">
          <AlertTriangle className="h-3 w-3" /> You have unpublished branding changes.
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <CheckCircle2 className="h-3 w-3" /> Published
        </Badge>
      )}
      <span className="text-[12px] text-muted-foreground">
        {mounted
          ? `Last updated ${new Date(state.updated_at).toLocaleString("en-GB")} by ${state.updated_by}`
          : "Last updated -"}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {dirty && (
          <Button variant="ghost" size="sm" onClick={discardDraft}>
            Discard changes
          </Button>
        )}
        <Button size="sm" disabled={!dirty || blocked} onClick={() => setConfirm(true)}>
          Publish
        </Button>
      </div>
      {blocked && (
        <p className="w-full text-[12px] text-destructive">
          Publishing is blocked until the theme passes WCAG AA contrast.
        </p>
      )}
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish branding configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              Published branding applies to this account only and changes presentation
              for citizens and employees. Complaint workflows, SLAs, roles and routing
              are not affected. The publication is recorded in the Audit Log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => publishBranding()}>
              Publish branding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function BrandingPage({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader title={title} subtitle={description} actions={actions} />
      <BrandingTabs />
      <BrandingStatusBar />
      <div className="flex-1 p-4 lg:p-6">{children}</div>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-[14px] font-semibold text-foreground">{title}</h2>
      {description && (
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
      )}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

/** Mandatory attribution, reproduced inside previews. */
export function PoweredByDigit() {
  return (
    <div className="mt-3 text-center text-[11px] text-muted-foreground">
      Powered by DIGIT
    </div>
  );
}
