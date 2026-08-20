import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  MoreHorizontal,
  Pencil,
  Archive,
  Link2,
  Power,
  UserPlus,
  Mail,
  MessageSquare,
  Eye,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Ban,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { ADMIN_ROLE_OPTIONS as ROLE_OPTIONS, getRoleLabel } from "@/lib/admin-roles";
import {
  appendAudit,
  CITIZEN_STATUS_LABEL,
  CURRENT_ADMIN,
  DEPARTMENTS,
  DESIGNATIONS,
  EMPLOYEE_STATUS_LABEL,
  formatTs,
  JURISDICTIONS,
  loadCitizens,
  loadEmployees,
  saveCitizens,
  saveEmployees,
  type AuditAction,
  type AuditChange,
  type Citizen,
  type CitizenStatus,
  type Employee,
  type EmployeeStatus,
} from "@/lib/user-admin-store";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Account Administration" },
      {
        name: "description",
        content:
          "Manage employee access and support citizen sign-in, with a full audit trail of every administrative action.",
      },
    ],
  }),
  component: UsersPage,
});

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

const EMP_TONE: Record<EmployeeStatus, string> = {
  INVITED: "bg-sky-50 text-sky-700 border-sky-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-amber-50 text-amber-700 border-amber-200",
  ARCHIVED: "bg-muted text-muted-foreground border-border",
};

const CTZ_TONE: Record<CitizenStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  UNVERIFIED: "bg-amber-50 text-amber-700 border-amber-200",
  BLOCKED: "bg-rose-50 text-rose-700 border-rose-200",
  LOCKED: "bg-muted text-muted-foreground border-border",
};

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function UsersPage() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Users"
        subtitle="Employee access administration and citizen authentication support. Every action is recorded in the audit log."
      />
      <div className="flex-1 p-4 lg:p-6">
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="citizens">Citizens</TabsTrigger>
          </TabsList>
          <TabsContent value="employees" className="m-0">
            <EmployeesTab />
          </TabsContent>
          <TabsContent value="citizens" className="m-0">
            <CitizensTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Employees                                                           */
/* ------------------------------------------------------------------ */

type EmployeeForm = {
  name: string;
  email: string;
  mobile: string;
  department: string;
  designation: string;
  roleKey: string;
  jurisdiction: string;
};

const emptyEmployee: EmployeeForm = {
  name: "",
  email: "",
  mobile: "",
  department: DEPARTMENTS[0],
  designation: DESIGNATIONS[0],
  roleKey: ROLE_OPTIONS[0].key,
  jurisdiction: "",
};

function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>(() => loadEmployees());
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyEmployee);
  const [viewing, setViewing] = useState<Employee | null>(null);

  const persist = (next: Employee[]) => {
    setEmployees(next);
    saveEmployees(next);
  };

  /** Mutations always pair a state write with an audit record. */
  const auditedUpdate = (
    target: Employee,
    patch: Partial<Employee>,
    action: AuditAction,
    changes: AuditChange[] | undefined,
    message: string,
    context?: Record<string, string>,
  ) => {
    // `lastLoggedIn` is authentication-owned and may never be patched here.
    const { lastLoggedIn: _ignored, ...safePatch } = patch;
    persist(employees.map((e) => (e.id === target.id ? { ...e, ...safePatch } : e)));
    appendAudit({
      userType: "EMPLOYEE",
      targetLabel: target.name,
      targetIdentifier: target.email || target.mobile,
      targetId: target.id,
      action,
      performedBy: CURRENT_ADMIN,
      result: "SUCCESS",
      lastLoggedIn: target.lastLoggedIn,
      changes,
      context: { source: "Account Administration › Users › Employees", ...context },
    });
    toast.success(message);
  };

  const nonMutating = (
    target: Employee,
    action: AuditAction,
    message: string,
    context?: Record<string, string>,
  ) => {
    appendAudit({
      userType: "EMPLOYEE",
      targetLabel: target.name,
      targetIdentifier: target.email || target.mobile,
      targetId: target.id,
      action,
      performedBy: CURRENT_ADMIN,
      result: "SUCCESS",
      lastLoggedIn: target.lastLoggedIn,
      context: { source: "Account Administration › Users › Employees", ...context },
    });
    toast.success(message);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return employees.filter((e) => {
      if (q && !`${e.name} ${e.email} ${e.mobile} ${e.id}`.toLowerCase().includes(q)) return false;
      if (roleFilter !== "ALL" && e.roleKey !== roleFilter) return false;
      if (statusFilter !== "ALL" && e.status !== statusFilter) return false;
      return true;
    });
  }, [employees, query, roleFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyEmployee);
    setDialogOpen(true);
  };

  const openEdit = (e: Employee) => {
    setEditing(e);
    setForm({
      name: e.name,
      email: e.email,
      mobile: e.mobile,
      department: e.department,
      designation: e.designation,
      roleKey: e.roleKey,
      jurisdiction: e.jurisdiction,
    });
    setDialogOpen(true);
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const mobile = form.mobile.trim();
    if (!name || name.length > 120) {
      toast.error("Enter a valid full name (max 120 characters).");
      return;
    }
    if (!email && !mobile) {
      toast.error("Provide at least one of email or mobile number.");
      return;
    }
    if (email && (!/^\S+@\S+\.\S+$/.test(email) || email.length > 255)) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (mobile && !/^[+\d][\d\s-]{5,19}$/.test(mobile)) {
      toast.error("Enter a valid mobile number.");
      return;
    }

    if (editing) {
      const changes: AuditChange[] = [];
      const track = (field: string, prev: string, next: string) => {
        if (prev !== next) changes.push({ field, previous: prev || "—", next: next || "—" });
      };
      track("Full name", editing.name, name);
      track("Email", editing.email, email);
      track("Mobile number", editing.mobile, mobile);
      track("Department", editing.department, form.department);
      track("Designation", editing.designation, form.designation);
      track("Role", getRoleLabel(editing.roleKey), getRoleLabel(form.roleKey));
      track("Jurisdiction", editing.jurisdiction, form.jurisdiction);

      if (!changes.length) {
        setDialogOpen(false);
        toast.info("No changes to save.");
        return;
      }

      const action: AuditAction =
        changes.length === 1
          ? changes[0].field === "Role"
            ? "ROLE_CHANGE"
            : changes[0].field === "Department"
              ? "DEPARTMENT_CHANGE"
              : changes[0].field === "Designation"
                ? "DESIGNATION_CHANGE"
                : changes[0].field === "Jurisdiction"
                  ? "JURISDICTION_CHANGE"
                  : "UPDATE"
          : "UPDATE";

      auditedUpdate(
        editing,
        {
          name,
          email,
          mobile,
          department: form.department,
          designation: form.designation,
          roleKey: form.roleKey,
          jurisdiction: form.jurisdiction,
        },
        action,
        changes,
        "Employee updated.",
      );
    } else {
      const created: Employee = {
        id: `EMP-${Math.floor(Math.random() * 9000 + 1000)}`,
        name,
        email,
        mobile,
        department: form.department,
        designation: form.designation,
        roleKey: form.roleKey,
        jurisdiction: form.jurisdiction,
        status: "INVITED",
        lastLoggedIn: null,
      };
      persist([created, ...employees]);
      appendAudit({
        userType: "EMPLOYEE",
        targetLabel: created.name,
        targetIdentifier: created.email || created.mobile,
        targetId: created.id,
        action: "CREATE",
        performedBy: CURRENT_ADMIN,
        result: "SUCCESS",
        lastLoggedIn: null,
        changes: [
          { field: "Department", previous: "—", next: created.department },
          { field: "Designation", previous: "—", next: created.designation },
          { field: "Role", previous: "—", next: getRoleLabel(created.roleKey) },
          { field: "Jurisdiction", previous: "—", next: created.jurisdiction || "—" },
          { field: "Status", previous: "—", next: "Invited" },
        ],
        context: { source: "Account Administration › Users › Employees" },
      });
      toast.success("Employee created and marked as Invited.");
    }
    setDialogOpen(false);
  };

  const counts = {
    total: employees.length,
    invited: employees.filter((e) => e.status === "INVITED").length,
    active: employees.filter((e) => e.status === "ACTIVE").length,
    archived: employees.filter((e) => e.status === "ARCHIVED").length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={counts.total} />
          <StatCard label="Invited" value={counts.invited} tone="sky" />
          <StatCard label="Active" value={counts.active} tone="emerald" />
          <StatCard label="Archived" value={counts.archived} tone="amber" />

        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <UserPlus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      <div className="rounded border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, mobile or ID"
              className="h-8 pl-8 text-[13px]"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-8 w-[200px] text-[13px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[150px] text-[13px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {(Object.keys(EMPLOYEE_STATUS_LABEL) as EmployeeStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {EMPLOYEE_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last logged in</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-[13px] text-muted-foreground">
                  No employees match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{e.name}</div>
                    <div className="text-[12px] text-muted-foreground">
                      {e.email || e.mobile}
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px]">{e.department}</TableCell>
                  <TableCell className="text-[13px]">{e.designation}</TableCell>
                  <TableCell className="text-[13px]">{getRoleLabel(e.roleKey)}</TableCell>
                  <TableCell className="text-[13px] text-muted-foreground">
                    {e.jurisdiction || "Not scoped"}
                  </TableCell>
                  <TableCell>
                    <Pill label={EMPLOYEE_STATUS_LABEL[e.status]} className={EMP_TONE[e.status]} />
                  </TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">
                    {formatTs(e.lastLoggedIn)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${e.name}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setViewing(e)}>
                          <Eye className="mr-2 h-3.5 w-3.5" /> View employee
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(e)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" /> Edit employee
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Access delivery
                        </DropdownMenuLabel>
                        {e.mobile && (
                          <DropdownMenuItem
                            onClick={() =>
                              nonMutating(
                                e,
                                e.status === "INVITED" ? "INVITATION_RESENT" : "SMS_SENT",
                                `SMS invite sent to ${e.name}.`,
                                { invitationChannel: "SMS" },
                              )
                            }
                          >
                            <MessageSquare className="mr-2 h-3.5 w-3.5" /> Send SMS invite
                          </DropdownMenuItem>
                        )}
                        {e.email && (
                          <DropdownMenuItem
                            onClick={() =>
                              nonMutating(
                                e,
                                e.status === "INVITED" ? "INVITATION_RESENT" : "EMAIL_SENT",
                                `Email invite sent to ${e.name}.`,
                                { invitationChannel: "Email" },
                              )
                            }
                          >
                            <Mail className="mr-2 h-3.5 w-3.5" /> Send email invite
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            nonMutating(e, "ACCESS_LINK_GENERATED", "Short-lived access link copied to clipboard.", {
                              accessDuration: "30 minutes",
                            });
                            void navigator.clipboard
                              ?.writeText(`https://console.example/access/${e.id}`)
                              .catch(() => undefined);
                          }}
                        >
                          <Link2 className="mr-2 h-3.5 w-3.5" /> Generate access link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            nonMutating(e, "MAGIC_LINK_GENERATED", "Magic link generated and delivered.", {
                              accessDuration: "15 minutes",
                              authenticationMethod: "Magic link",
                            })
                          }
                        >
                          <Sparkles className="mr-2 h-3.5 w-3.5" /> Generate magic link
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        {e.status !== "ACTIVE" && e.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              auditedUpdate(
                                e,
                                { status: "ACTIVE" },
                                "ACTIVATE",
                                [{ field: "Status", previous: EMPLOYEE_STATUS_LABEL[e.status], next: "Active" }],
                                "Employee reactivated.",
                              )
                            }
                          >
                            <Power className="mr-2 h-3.5 w-3.5" /> Reactivate
                          </DropdownMenuItem>
                        )}
                        {e.status === "ARCHIVED" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              auditedUpdate(
                                e,
                                { status: "ACTIVE" },
                                "RESTORE",
                                [{ field: "Status", previous: "Archived", next: "Active" }],
                                "Employee restored.",
                              )
                            }
                          >
                            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Restore
                          </DropdownMenuItem>

                        ) : (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              auditedUpdate(
                                e,
                                { status: "ARCHIVED" },
                                "ARCHIVE",
                                [{ field: "Status", previous: EMPLOYEE_STATUS_LABEL[e.status], next: "Archived" }],
                                "Employee archived.",
                              )
                            }
                          >
                            <Archive className="mr-2 h-3.5 w-3.5" /> Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit employee" : "Add employee"}</DialogTitle>
            <DialogDescription>
              Department, designation and role are required. Jurisdiction is optional and limits
              where those permissions apply. Provide at least one of email or mobile number so
              access can be delivered.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-name">Full name</Label>
              <Input
                id="emp-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={120}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="emp-email">Email</Label>
                <Input
                  id="emp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  maxLength={255}
                  placeholder="name@gov.example"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-mobile">Mobile number</Label>
                <Input
                  id="emp-mobile"
                  value={form.mobile}
                  onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                  maxLength={20}
                  placeholder="+91 98110 00000"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Designation</Label>
                <Select value={form.designation} onValueChange={(v) => setForm({ ...form, designation: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGNATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select value={form.roleKey} onValueChange={(v) => setForm({ ...form, roleKey: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.key} value={r.key}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Jurisdiction (optional)</Label>
                <Select
                  value={form.jurisdiction || "NONE"}
                  onValueChange={(v) => setForm({ ...form, jurisdiction: v === "NONE" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Not scoped</SelectItem>
                    {JURISDICTIONS.filter(Boolean).map((j) => (
                      <SelectItem key={j} value={j}>
                        {j}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="rounded-sm border border-border bg-surface-2 px-2.5 py-2 text-[12px] text-muted-foreground">
              Passwords are never shown to administrators. New employees receive an activation or
              magic link through the channel you choose.
            </p>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? "Save changes" : "Add employee"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
            <DialogDescription>Employee record — read only</DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="space-y-2 text-[13px]">
              <Row label="Employee ID" value={viewing.id} />
              <Row label="Email" value={viewing.email || "—"} />
              <Row label="Mobile number" value={viewing.mobile || "—"} />
              <Row label="Department" value={viewing.department} />
              <Row label="Designation" value={viewing.designation} />
              <Row label="Role" value={getRoleLabel(viewing.roleKey)} />
              <Row label="Jurisdiction" value={viewing.jurisdiction || "Not scoped"} />
              <Row label="Status" value={EMPLOYEE_STATUS_LABEL[viewing.status]} />
              <Row label="Last logged in" value={formatTs(viewing.lastLoggedIn)} />
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Citizens                                                            */
/* ------------------------------------------------------------------ */

const BLOCK_REASONS = [
  "Suspected account compromise",
  "Repeated authentication abuse",
  "Fraud or abuse investigation",
  "Citizen-requested block",
  "Other",
];

const BLOCK_DURATIONS = ["24 hours", "7 days", "Custom expiry", "Until manually unblocked"];

function CitizensTab() {
  const [citizens, setCitizens] = useState<Citizen[]>(() => loadCitizens());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [blockTarget, setBlockTarget] = useState<Citizen | null>(null);
  const [unblockTarget, setUnblockTarget] = useState<Citizen | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<Citizen | null>(null);

  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState("");
  const [customExpiry, setCustomExpiry] = useState("");
  const [justification, setJustification] = useState("");
  const [unblockReason, setUnblockReason] = useState("");

  const persist = (next: Citizen[]) => {
    setCitizens(next);
    saveCitizens(next);
  };

  const audit = (
    c: Citizen,
    action: AuditAction,
    message: string,
    changes?: AuditChange[],
    context?: Record<string, string>,
  ) => {
    appendAudit({
      userType: "CITIZEN",
      // Citizen names are never surfaced to administrators or the audit trail.
      targetLabel: c.id,
      targetIdentifier: c.maskedIdentifier,
      targetId: c.id,
      action,
      performedBy: CURRENT_ADMIN,
      result: "SUCCESS",
      lastLoggedIn: c.lastLoggedIn,
      changes,
      context: { source: "Account Administration › Users › Citizens", ...context },
    });
    toast.success(message);
  };

  const openBlock = (c: Citizen) => {
    setReason("");
    setDuration("");
    setCustomExpiry("");
    setJustification("");
    setBlockTarget(c);
  };

  const justificationRequired = duration === "Until manually unblocked" || reason === "Other";
  const blockValid =
    !!reason &&
    !!duration &&
    (duration !== "Custom expiry" || !!customExpiry) &&
    (!justificationRequired || justification.trim().length > 0);

  const expiryFor = (): string | null => {
    if (duration === "24 hours") return new Date(Date.now() + 24 * 3600e3).toISOString();
    if (duration === "7 days") return new Date(Date.now() + 7 * 24 * 3600e3).toISOString();
    if (duration === "Custom expiry" && customExpiry) return new Date(customExpiry).toISOString();
    return null;
  };

  const confirmBlock = () => {
    const c = blockTarget;
    if (!c || !blockValid) return;
    const expiresAt = expiryFor();
    const sessionRevocation = "All active sessions revoked";
    const block = {
      blockedAt: new Date().toISOString(),
      blockedBy: CURRENT_ADMIN,
      reason,
      justification: justification.trim() || undefined,
      duration,
      expiresAt,
      previousStatus: c.status,
      sessionRevocation,
    };
    // Authentication state only — complaints, profile and identifiers untouched.
    persist(citizens.map((x) => (x.id === c.id ? { ...x, status: "BLOCKED" as CitizenStatus, block } : x)));
    audit(
      c,
      "CITIZEN_SIGN_IN_BLOCKED",
      "Citizen sign-in has been blocked.",
      [{ field: "Account status", previous: CITIZEN_STATUS_LABEL[c.status], next: "Blocked" }],
      {
        reason,
        ...(block.justification ? { justification: block.justification } : {}),
        accessDuration: duration,
        expiry: expiresAt ? formatTs(expiresAt) : "No expiry — manual unblock required",
        sessionRevocation,
      },
    );
    setBlockTarget(null);
  };

  const confirmUnblock = () => {
    const c = unblockTarget;
    if (!c || !unblockReason.trim()) return;
    persist(
      citizens.map((x) =>
        x.id === c.id ? { ...x, status: "ACTIVE" as CitizenStatus, block: undefined } : x,
      ),
    );
    audit(
      c,
      "CITIZEN_SIGN_IN_UNBLOCKED",
      "Citizen sign-in has been unblocked.",
      [{ field: "Account status", previous: "Blocked", next: "Active" }],
      { reason: unblockReason.trim() },
    );
    setUnblockTarget(null);
    setUnblockReason("");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return citizens.filter((c) => {
      if (q && !`${c.id} ${c.maskedIdentifier}`.toLowerCase().includes(q)) return false;
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      return true;
    });
  }, [citizens, query, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded border border-border bg-surface-2 px-3 py-2.5 text-[12.5px] text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Citizen accounts are protected identities. Names, full identifiers, addresses, profiles and
          complaint history are not available here — only the minimum needed for authentication
          support. Every support action is audited.
        </p>
      </div>

      <div className="rounded border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by citizen ID or masked identifier"
              className="h-8 pl-8 text-[13px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[160px] text-[13px]">
              <SelectValue placeholder="Account status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {(Object.keys(CITIZEN_STATUS_LABEL) as CitizenStatus[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {CITIZEN_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Citizen ID</TableHead>
              <TableHead>Login identifier</TableHead>
              <TableHead>Account status</TableHead>
              <TableHead>Last logged in</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-[13px] text-muted-foreground">
                  No citizen accounts match the current filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-[12.5px]">{c.id}</TableCell>
                  <TableCell className="text-[13px]">
                    <span className="font-mono">{c.maskedIdentifier}</span>
                    <span className="ml-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                      {c.identifierType === "PHONE" ? "Phone" : "Email"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Pill label={CITIZEN_STATUS_LABEL[c.status]} className={CTZ_TONE[c.status]} />
                  </TableCell>
                  <TableCell className="text-[12.5px] text-muted-foreground">
                    {formatTs(c.lastLoggedIn)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Support actions for ${c.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-60">
                        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Authentication support
                        </DropdownMenuLabel>
                        {c.identifierType === "PHONE" && (
                          <DropdownMenuItem
                            onClick={() =>
                              audit(c, "AUTHENTICATION_SUPPORT_ACTION", "Sign-in SMS sent.", undefined, {
                                invitationChannel: "SMS",
                                authenticationMethod: "OTP over SMS",
                              })
                            }
                          >
                            <MessageSquare className="mr-2 h-3.5 w-3.5" /> Send sign-in SMS
                          </DropdownMenuItem>
                        )}
                        {c.identifierType === "EMAIL" && (
                          <DropdownMenuItem
                            onClick={() =>
                              audit(c, "AUTHENTICATION_SUPPORT_ACTION", "Sign-in email sent.", undefined, {
                                invitationChannel: "Email",
                                authenticationMethod: "Email link",
                              })
                            }
                          >
                            <Mail className="mr-2 h-3.5 w-3.5" /> Send sign-in email
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() =>
                            audit(c, "ACCESS_LINK_GENERATED", "Temporary access link generated.", undefined, {
                              accessDuration: "10 minutes",
                            })
                          }
                        >
                          <Link2 className="mr-2 h-3.5 w-3.5" /> Generate temporary access link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            audit(c, "INVITATION_RESENT", "Verification resent.", undefined, {
                              invitationChannel: c.identifierType === "PHONE" ? "SMS" : "Email",
                            })
                          }
                        >
                          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Resend verification
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground">
                          Account security
                        </DropdownMenuLabel>
                        {c.status === "BLOCKED" ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setUnblockReason("");
                                setUnblockTarget(c);
                              }}
                            >
                              <Power className="mr-2 h-3.5 w-3.5" /> Unblock sign-in
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDetailsTarget(c)}>
                              <Eye className="mr-2 h-3.5 w-3.5" /> View block details
                            </DropdownMenuItem>
                          </>
                        ) : c.status === "ACTIVE" || c.status === "UNVERIFIED" ? (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => openBlock(c)}
                          >
                            <Ban className="mr-2 h-3.5 w-3.5" /> Block sign-in
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem disabled>
                            <Ban className="mr-2 h-3.5 w-3.5" /> No security action available
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Block sign-in */}
      <Dialog open={!!blockTarget} onOpenChange={(o) => !o && setBlockTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Block citizen sign-in</DialogTitle>
            <DialogDescription>
              Blocking sign-in prevents this citizen from authenticating into their account. Their
              complaints, profile records and historical data will remain unchanged.
            </DialogDescription>
          </DialogHeader>
          {blockTarget && (
            <div className="space-y-3">
              <dl className="space-y-1.5 rounded border border-border bg-surface-2 px-3 py-2.5 text-[13px]">
                <Row label="Citizen ID" value={blockTarget.id} />
                <Row label="Login identifier" value={blockTarget.maskedIdentifier} />
                <Row label="Current status" value={CITIZEN_STATUS_LABEL[blockTarget.status]} />
                <Row label="Last logged in" value={formatTs(blockTarget.lastLoggedIn)} />
              </dl>

              <div className="space-y-1.5">
                <Label className="text-[12px]">Reason *</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCK_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[12px]">Block duration *</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="h-8 text-[13px]">
                    <SelectValue placeholder="Select a duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOCK_DURATIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {duration === "Custom expiry" && (
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Expiry date and time *</Label>
                  <Input
                    type="datetime-local"
                    value={customExpiry}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                    className="h-8 text-[13px]"
                  />
                </div>
              )}

              {justificationRequired && (
                <div className="space-y-1.5">
                  <Label className="text-[12px]">Justification *</Label>
                  <Textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    rows={3}
                    className="text-[13px]"
                    placeholder="Record why an indefinite or non-standard block is required"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBlockTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" disabled={!blockValid} onClick={confirmBlock}>
              Block sign-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unblock sign-in */}
      <Dialog
        open={!!unblockTarget}
        onOpenChange={(o) => {
          if (!o) {
            setUnblockTarget(null);
            setUnblockReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Unblock citizen sign-in</DialogTitle>
            <DialogDescription>
              This will restore the citizen&apos;s ability to authenticate using their existing login
              identifier.
            </DialogDescription>
          </DialogHeader>
          {unblockTarget && (
            <div className="space-y-3">
              <dl className="space-y-1.5 rounded border border-border bg-surface-2 px-3 py-2.5 text-[13px]">
                <Row label="Citizen ID" value={unblockTarget.id} />
                <Row label="Login identifier" value={unblockTarget.maskedIdentifier} />
              </dl>
              <div className="space-y-1.5">
                <Label className="text-[12px]">Reason for unblocking *</Label>
                <Textarea
                  value={unblockReason}
                  onChange={(e) => setUnblockReason(e.target.value)}
                  rows={3}
                  className="text-[13px]"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUnblockTarget(null);
                setUnblockReason("");
              }}
            >
              Cancel
            </Button>
            <Button size="sm" disabled={!unblockReason.trim()} onClick={confirmUnblock}>
              Unblock sign-in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block details */}
      <Sheet open={!!detailsTarget} onOpenChange={(o) => !o && setDetailsTarget(null)}>
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          <SheetHeader>
            <SheetTitle>Block details</SheetTitle>
            <SheetDescription>
              Authentication block record. Citizen names and full identifiers are never shown.
            </SheetDescription>
          </SheetHeader>
          {detailsTarget && (
            <dl className="mt-4 space-y-1.5 text-[13px]">
              <Row label="Citizen ID" value={detailsTarget.id} />
              <Row label="Login identifier" value={detailsTarget.maskedIdentifier} />
              <Row label="Status" value={CITIZEN_STATUS_LABEL[detailsTarget.status]} />
              <Row label="Blocked on" value={formatTs(detailsTarget.block?.blockedAt ?? null)} />
              <Row label="Blocked by" value={detailsTarget.block?.blockedBy ?? "—"} />
              <Row label="Reason" value={detailsTarget.block?.reason ?? "—"} />
              <Row label="Duration" value={detailsTarget.block?.duration ?? "—"} />
              <Row
                label="Expiry"
                value={
                  detailsTarget.block?.expiresAt
                    ? formatTs(detailsTarget.block.expiresAt)
                    : "No expiry — manual unblock required"
                }
              />
              <Row label="Sessions" value={detailsTarget.block?.sessionRevocation ?? "—"} />
              <Row label="Last logged in" value={formatTs(detailsTarget.lastLoggedIn)} />
              {detailsTarget.block?.justification && (
                <div className="pt-2">
                  <dt className="text-[12px] text-muted-foreground">Justification</dt>
                  <dd className="mt-1 rounded border border-border bg-surface-2 px-2.5 py-2 text-[12.5px]">
                    {detailsTarget.block.justification}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-1.5 last:border-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "emerald" | "amber" | "muted" | "sky";
}) {
  const toneCls: Record<string, string> = {
    default: "text-foreground",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    muted: "text-muted-foreground",
    sky: "text-sky-700",
  };
  return (
    <div className="rounded border border-border bg-surface px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-[20px] font-semibold ${toneCls[tone]}`}>{value}</div>
    </div>
  );
}
