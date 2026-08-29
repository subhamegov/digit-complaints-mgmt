import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { PageHeader, Panel } from "@/components/pgr/primitives";
import { OFFICERS } from "@/lib/mock-data";
import { ROLE_LABEL, Can, type Role } from "@/lib/rbac";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/users")({
  head: () => ({ meta: [{ title: "Users & Roles - DIGIT PGR" }] }),
  component: UsersPage,
});

const USERS = OFFICERS.map((o, i): { id: string; name: string; designation: string; department: string; ward: string; mobile: string; role: Role; active: boolean } => ({
  id: o.id,
  name: o.name,
  designation: o.designation,
  department: o.department,
  ward: o.ward,
  mobile: o.mobile,
  role: ["LME", "LME", "LME", "GRO", "LME", "DEPT_HEAD"][i] as Role,
  active: true,
})).concat([
  { id: "EMP-1201", name: "Manjit Singh", designation: "Grievance Routing Officer", department: "Public Affairs", ward: "ALL", mobile: "98xxxxxx00", role: "GRO", active: true },
  { id: "EMP-1300", name: "Dr. Anita Sharma", designation: "Joint Commissioner", department: "Office of Commissioner", ward: "ALL", mobile: "98xxxxxx01", role: "DEPT_HEAD", active: true },
  { id: "EMP-1400", name: "Vikram Mehta", designation: "Account Administrator", department: "IT", ward: "ALL", mobile: "98xxxxxx02", role: "ACCOUNT_ADMIN", active: true },
  { id: "EMP-1401", name: "Priya Nair", designation: "Platform Administrator", department: "Platform", ward: "ALL", mobile: "98xxxxxx03", role: "PLATFORM_ADMIN", active: true },

  { id: "EMP-1500", name: "Harpreet Kaur", designation: "Citizen Services Rep.", department: "Front Office", ward: "ALL", mobile: "98xxxxxx03", role: "CSR", active: true },
  { id: "EMP-1600", name: "Test User", designation: "Sandbox Tester", department: "QA", ward: "ALL", mobile: "98xxxxxx04", role: "TEST_USER", active: true },
]);


function UsersPage() {
  return (
    <div>
      <PageHeader
        breadcrumbs={[{ label: t("COMMON_USERS") }]}
        title="Users & Role Assignments"
        subtitle="HRMS roster · Role assignments drive RBAC across the platform"
        primaryAction={
          <Can perm="HRMS_USER_MANAGE">
            <button className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-[12px] font-medium text-primary-foreground hover:opacity-90">
              <Plus className="h-3.5 w-3.5" /> Add User
            </button>
          </Can>
        }
      />

      <div className="p-4 lg:p-6">
        <Panel padded={false}>
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Employee ID</th>
                <th className="px-4 py-2 text-left font-medium">{t("COMMON_NAME")}</th>
                <th className="px-4 py-2 text-left font-medium">Designation</th>
                <th className="px-4 py-2 text-left font-medium">{t("CS_DEPARTMENT")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("COMMON_WARD")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("COMMON_MOBILE_NUMBER")}</th>
                <th className="px-4 py-2 text-left font-medium">{t("COMMON_ROLE")}</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {USERS.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2 font-mono text-[12px]">{u.id}</td>
                  <td className="px-4 py-2 font-medium">{u.name}</td>
                  <td className="px-4 py-2">{u.designation}</td>
                  <td className="px-4 py-2">{u.department}</td>
                  <td className="px-4 py-2">{u.ward}</td>
                  <td className="px-4 py-2 tabular-nums text-[12px]">{u.mobile}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium">{ROLE_LABEL[u.role]}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Can perm="HRMS_USER_MANAGE" fallback={<span className="text-[11px] text-muted-foreground italic">Read-only</span>}>
                      <button className="h-7 rounded-sm border border-border bg-surface px-2 text-[11px] hover:bg-muted">{t("COMMON_EDIT")}</button>
                    </Can>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
