import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { ChevronRight, Users } from "lucide-react";
import { ADMIN_ROLES, type AdminRoleKey } from "@/lib/admin-roles";

export const Route = createFileRoute("/admin/workflow-config/role-hierarchy")({
  head: () => ({
    meta: [{ title: "Role Hierarchy - Account Administrator" }],
  }),
  component: RoleHierarchyPage,
});

type Node = { key: AdminRoleKey; children?: Node[] };

const HIERARCHY: Node = {
  key: "ROLE_STATE_ADMIN",
  children: [
    {
      key: "ROLE_DEPT_ADMIN",
      children: [
        {
          key: "ROLE_SUPERVISOR",
          children: [
            { key: "ROLE_COMPLAINT_OFFICER" },
            { key: "ROLE_CALL_CENTRE_AGENT" },
          ],
        },
      ],
    },
  ],
};

function RoleNode({ node, depth = 0 }: { node: Node; depth?: number }) {
  const def = ADMIN_ROLES.find((r) => r.key === node.key)!;
  return (
    <div>
      <div
        className="flex items-start gap-2 rounded border border-border bg-background px-3 py-2"
        style={{ marginLeft: depth * 24 }}
      >
        <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-foreground">{def.label}</div>
          <div className="text-[11.5px] text-muted-foreground">
            Scope · {def.scope}
          </div>
        </div>
      </div>
      {node.children?.length ? (
        <div className="mt-2 space-y-2 border-l border-dashed border-border" style={{ marginLeft: depth * 24 + 12 }}>
          {node.children.map((c) => (
            <div key={c.key} className="flex items-start gap-1.5 pl-2">
              <ChevronRight className="mt-3 h-3 w-3 text-muted-foreground" />
              <div className="flex-1">
                <RoleNode node={c} depth={0} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RoleHierarchyPage() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Role Hierarchy"
        subtitle="Reporting and escalation chain across console roles. Escalations follow the hierarchy upwards from the assigned role."
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="rounded border border-border bg-surface p-4">
          <RoleNode node={HIERARCHY} />
        </div>
      </div>
    </div>
  );
}
