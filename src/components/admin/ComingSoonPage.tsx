/**
 * ComingSoonPage - branded placeholder for admin surfaces that are
 * planned but not yet built. Uses the existing admin layout chrome
 * (AdminPageHeader) and design tokens; RBAC- and i18n-ready via the
 * surrounding route + t() shim.
 */

import { useRouterState, Link } from "@tanstack/react-router";
import { Sparkles, ArrowLeft, Bell } from "lucide-react";
import { AdminPageHeader, findAdminNavItem } from "@/components/admin/AdminLayout";
import { t } from "@/lib/i18n";

export function ComingSoonPage({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const item = findAdminNavItem(pathname);
  const resolvedTitle = title ?? (item ? t(item.labelCode, item.label) : "");

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title={resolvedTitle}
        subtitle={t("ADMIN_COMING_SOON_SUBTITLE", "Coming soon")}
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="relative mx-auto max-w-2xl overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/10 to-transparent"
          />
          <div className="relative px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("ADMIN_COMING_SOON_BADGE", "Coming soon")}
            </div>
            <h2 className="mt-3 text-[20px] font-semibold tracking-tight text-foreground">
              {resolvedTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted-foreground">
              {description ??
                t(
                  "ADMIN_COMING_SOON_BODY",
                  "We're putting the finishing touches on this experience. It will be available in an upcoming release.",
                )}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link
                to="/admin/home"
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border bg-background px-3 text-[12.5px] font-medium text-foreground hover:bg-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("ADMIN_COMING_SOON_BACK", "Back to Home")}
              </Link>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-primary/30 bg-primary/10 px-3 text-[12.5px] font-medium text-primary hover:bg-primary/15"
              >
                <Bell className="h-3.5 w-3.5" />
                {t("ADMIN_COMING_SOON_NOTIFY", "Notify me when ready")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
