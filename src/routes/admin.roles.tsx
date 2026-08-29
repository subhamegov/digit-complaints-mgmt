import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Minus, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ADMIN_ROLES, type AdminRoleKey } from "@/lib/admin-roles";

export const Route = createFileRoute("/admin/roles")({
  head: () => ({
    meta: [{ title: "Roles & Permissions - Account Administrator" }],
  }),
  component: RolesPage,
});

type Permission = {
  key: string;
  label: string;
  group: string;
  roles: AdminRoleKey[];
};

const PERMISSIONS: Permission[] = [
  // Users & access
  { group: "Users & Access", key: "USERS_VIEW", label: "View users", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN", "ROLE_SUPERVISOR"] },
  { group: "Users & Access", key: "USERS_MANAGE", label: "Create, edit & archive users", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN"] },
  { group: "Users & Access", key: "ROLES_MANAGE", label: "Manage roles & permissions", roles: ["ROLE_STATE_ADMIN"] },
  // Complaints
  { group: "Complaints", key: "COMPLAINTS_VIEW_ALL", label: "View all complaints", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN", "ROLE_SUPERVISOR"] },
  { group: "Complaints", key: "COMPLAINTS_CREATE", label: "Register new complaints", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN", "ROLE_SUPERVISOR", "ROLE_COMPLAINT_OFFICER", "ROLE_CALL_CENTRE_AGENT"] },
  { group: "Complaints", key: "COMPLAINTS_ASSIGN", label: "Assign & reassign complaints", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN", "ROLE_SUPERVISOR"] },
  { group: "Complaints", key: "COMPLAINTS_RESOLVE", label: "Resolve & close complaints", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN", "ROLE_SUPERVISOR", "ROLE_COMPLAINT_OFFICER"] },
  { group: "Complaints", key: "COMPLAINTS_ESCALATE", label: "Approve escalations", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN", "ROLE_SUPERVISOR"] },
  // Configuration
  { group: "Configuration", key: "WORKFLOW_MANAGE", label: "Configure workflows", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN"] },
  { group: "Configuration", key: "CATEGORIES_MANAGE", label: "Manage categories & SLAs", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN"] },
  { group: "Configuration", key: "CHANNELS_MANAGE", label: "Configure channels & sources", roles: ["ROLE_STATE_ADMIN"] },
  { group: "Configuration", key: "INTEGRATIONS_MANAGE", label: "Manage integrations", roles: ["ROLE_STATE_ADMIN"] },
  // Monitoring
  { group: "Monitoring", key: "DASHBOARDS_VIEW", label: "View dashboards", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN", "ROLE_SUPERVISOR"] },
  { group: "Monitoring", key: "REPORTS_EXPORT", label: "Export reports", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN", "ROLE_SUPERVISOR"] },
  { group: "Monitoring", key: "AUDIT_VIEW", label: "View audit log", roles: ["ROLE_STATE_ADMIN", "ROLE_DEPT_ADMIN"] },
];

const GROUPS = Array.from(new Set(PERMISSIONS.map((p) => p.group)));

function RolesPage() {
  const [selected, setSelected] = useState<AdminRoleKey | null>(null);

  const summary = useMemo(() => {
    return ADMIN_ROLES.map((r) => ({
      ...r,
      count: PERMISSIONS.filter((p) => p.roles.includes(r.key)).length,
    }));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Roles & Permissions"
        subtitle="Manage the catalog of roles that can be assigned to console users, and review the permissions granted to each role."
      />

      <div className="flex-1 space-y-6 p-4 lg:p-6">
        {/* Role catalog */}
        <section>
          <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Role catalog
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {summary.map((r) => {
              const active = selected === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => setSelected(active ? null : r.key)}
                  className={`text-left rounded border bg-surface p-4 transition-colors ${
                    active
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-semibold text-foreground">
                        {r.label}
                      </div>
                      <div className="mt-0.5 text-[11.5px] uppercase tracking-wider text-muted-foreground">
                        Scope · {r.scope}
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {r.count} perms
                    </Badge>
                  </div>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Permission matrix */}
        <section>
          <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-foreground">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            Permission matrix
            {selected && (
              <span className="ml-2 text-[12px] font-normal text-muted-foreground">
                Highlighting {ADMIN_ROLES.find((r) => r.key === selected)?.label}
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Permission</TableHead>
                  {ADMIN_ROLES.map((r) => (
                    <TableHead
                      key={r.key}
                      className={`text-center text-[12px] ${
                        selected === r.key ? "bg-primary/5 text-foreground" : ""
                      }`}
                    >
                      {r.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {GROUPS.map((group) => (
                  <RoleGroupRows
                    key={group}
                    group={group}
                    selected={selected}
                    rows={PERMISSIONS.filter((p) => p.group === group)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </div>
  );
}

function RoleGroupRows({
  group,
  rows,
  selected,
}: {
  group: string;
  rows: Permission[];
  selected: AdminRoleKey | null;
}) {
  return (
    <>
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell
          colSpan={ADMIN_ROLES.length + 1}
          className="py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
        >
          {group}
        </TableCell>
      </TableRow>
      {rows.map((p) => (
        <TableRow key={p.key}>
          <TableCell className="text-[13px] text-foreground">{p.label}</TableCell>
          {ADMIN_ROLES.map((r) => {
            const has = p.roles.includes(r.key);
            const highlight = selected === r.key;
            return (
              <TableCell
                key={r.key}
                className={`text-center ${highlight ? "bg-primary/5" : ""}`}
              >
                {has ? (
                  <Check className="mx-auto h-4 w-4 text-emerald-600" />
                ) : (
                  <Minus className="mx-auto h-3.5 w-3.5 text-muted-foreground/50" />
                )}
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
