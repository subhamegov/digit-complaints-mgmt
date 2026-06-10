import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Archive,
  KeyRound,
  Power,
  PowerOff,
  UserPlus,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ADMIN_ROLE_OPTIONS as ROLE_OPTIONS } from "@/lib/admin-roles";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Account Administrator" }] }),
  component: UsersPage,
});

type UserStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  roleKey: string;
  roleLabel: string;
  department: string;
  status: UserStatus;
  lastActive: string;
};

const DEPARTMENTS = [
  "Public Works",
  "Water & Sanitation",
  "Health Services",
  "Revenue",
  "Citizen Services",
];

const SEED_USERS: AdminUser[] = [
  {
    id: "u-001",
    name: "Amara Okafor",
    email: "amara.okafor@gov.example",
    roleKey: "ROLE_STATE_ADMIN",
    roleLabel: "State Administrator",
    department: "Citizen Services",
    status: "ACTIVE",
    lastActive: "2026-06-09T14:22:00Z",
  },
  {
    id: "u-002",
    name: "Rohan Mehta",
    email: "rohan.mehta@gov.example",
    roleKey: "ROLE_DEPT_ADMIN",
    roleLabel: "Department Administrator",
    department: "Public Works",
    status: "ACTIVE",
    lastActive: "2026-06-10T08:05:00Z",
  },
  {
    id: "u-003",
    name: "Fatima Al-Sayed",
    email: "fatima.alsayed@gov.example",
    roleKey: "ROLE_SUPERVISOR",
    roleLabel: "Supervisor",
    department: "Water & Sanitation",
    status: "ACTIVE",
    lastActive: "2026-06-10T07:41:00Z",
  },
  {
    id: "u-004",
    name: "Daniel Otieno",
    email: "daniel.otieno@gov.example",
    roleKey: "ROLE_COMPLAINT_OFFICER",
    roleLabel: "Complaint Officer",
    department: "Health Services",
    status: "ACTIVE",
    lastActive: "2026-06-09T18:10:00Z",
  },
  {
    id: "u-005",
    name: "Priya Nair",
    email: "priya.nair@gov.example",
    roleKey: "ROLE_COMPLAINT_OFFICER",
    roleLabel: "Complaint Officer",
    department: "Revenue",
    status: "INACTIVE",
    lastActive: "2026-05-22T11:00:00Z",
  },
  {
    id: "u-006",
    name: "Marcus Bezerra",
    email: "marcus.bezerra@gov.example",
    roleKey: "ROLE_CALL_CENTRE_AGENT",
    roleLabel: "Call Centre Agent",
    department: "Citizen Services",
    status: "ACTIVE",
    lastActive: "2026-06-10T09:14:00Z",
  },
  {
    id: "u-007",
    name: "Lin Wei",
    email: "lin.wei@gov.example",
    roleKey: "ROLE_CALL_CENTRE_AGENT",
    roleLabel: "Call Centre Agent",
    department: "Citizen Services",
    status: "ARCHIVED",
    lastActive: "2026-04-03T16:50:00Z",
  },
];

const STORAGE_KEY = "pgr.admin.users";

function loadUsers(): AdminUser[] {
  if (typeof window === "undefined") return SEED_USERS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_USERS;
    const parsed = JSON.parse(raw) as AdminUser[];
    return Array.isArray(parsed) && parsed.length ? parsed : SEED_USERS;
  } catch {
    return SEED_USERS;
  }
}

function saveUsers(users: AdminUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }: { status: UserStatus }) {
  const map: Record<UserStatus, { label: string; className: string }> = {
    ACTIVE: {
      label: "Active",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    INACTIVE: {
      label: "Inactive",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    ARCHIVED: {
      label: "Archived",
      className: "bg-muted text-muted-foreground border-border",
    },
  };
  const s = map[status];
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  );
}

type FormState = {
  name: string;
  email: string;
  roleKey: string;
  department: string;
  status: UserStatus;
};

const emptyForm: FormState = {
  name: "",
  email: "",
  roleKey: ROLE_OPTIONS[0].key,
  department: DEPARTMENTS[0],
  status: "ACTIVE",
};

function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>(() => loadUsers());
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const persist = (next: AdminUser[]) => {
    setUsers(next);
    saveUsers(next);
  };

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = query.trim().toLowerCase();
      if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q)) return false;
      if (roleFilter !== "ALL" && u.roleKey !== roleFilter) return false;
      if (statusFilter !== "ALL" && u.status !== statusFilter) return false;
      return true;
    });
  }, [users, query, roleFilter, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      roleKey: u.roleKey,
      department: u.department,
      status: u.status,
    });
    setDialogOpen(true);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    if (!name || name.length > 120) {
      toast.error("Please enter a valid name (max 120 chars).");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 255) {
      toast.error("Please enter a valid email.");
      return;
    }
    const role = ROLE_OPTIONS.find((r) => r.key === form.roleKey)!;
    if (editing) {
      const next = users.map((u) =>
        u.id === editing.id
          ? {
              ...u,
              name,
              email,
              roleKey: role.key,
              roleLabel: role.label,
              department: form.department,
              status: form.status,
            }
          : u,
      );
      persist(next);
      toast.success("User updated.");
    } else {
      const newUser: AdminUser = {
        id: `u-${Date.now().toString(36)}`,
        name,
        email,
        roleKey: role.key,
        roleLabel: role.label,
        department: form.department,
        status: form.status,
        lastActive: new Date().toISOString(),
      };
      persist([newUser, ...users]);
      toast.success("User created.");
    }
    setDialogOpen(false);
  };

  const setStatus = (id: string, status: UserStatus, msg: string) => {
    persist(users.map((u) => (u.id === id ? { ...u, status } : u)));
    toast.success(msg);
  };

  const resetCredentials = (u: AdminUser) => {
    toast.success(`Reset link sent to ${u.email}.`);
  };

  const total = users.length;
  const active = users.filter((u) => u.status === "ACTIVE").length;
  const inactive = users.filter((u) => u.status === "INACTIVE").length;
  const archived = users.filter((u) => u.status === "ARCHIVED").length;

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Users"
        subtitle="Create, edit, archive, activate, deactivate, and reset credentials for console users."
        actions={
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        }
      />

      <div className="flex-1 space-y-4 p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={total} />
          <StatCard label="Active" value={active} tone="emerald" />
          <StatCard label="Inactive" value={inactive} tone="amber" />
          <StatCard label="Archived" value={archived} tone="muted" />
        </div>

        <div className="rounded border border-border bg-surface">
          <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2.5">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
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
              <SelectTrigger className="h-8 w-[140px] text-[13px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last active</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-[13px] text-muted-foreground"
                  >
                    No users match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-[12px] text-muted-foreground">
                        {u.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-[13px]">{u.roleLabel}</TableCell>
                    <TableCell className="text-[13px]">{u.department}</TableCell>
                    <TableCell>
                      <StatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="text-[12.5px] text-muted-foreground">
                      {formatDate(u.lastActive)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            aria-label="User actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => openEdit(u)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          {u.status !== "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setStatus(u.id, "ACTIVE", "User activated.")
                              }
                            >
                              <Power className="mr-2 h-3.5 w-3.5" /> Activate
                            </DropdownMenuItem>
                          )}
                          {u.status === "ACTIVE" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setStatus(u.id, "INACTIVE", "User deactivated.")
                              }
                            >
                              <PowerOff className="mr-2 h-3.5 w-3.5" /> Deactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => resetCredentials(u)}>
                            <KeyRound className="mr-2 h-3.5 w-3.5" /> Reset
                            credentials
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() =>
                              setStatus(u.id, "ARCHIVED", "User archived.")
                            }
                          >
                            <Archive className="mr-2 h-3.5 w-3.5" /> Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Create user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update profile, role, and status."
                : "Add a new console user. All role labels are localizable."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Full name</Label>
              <Input
                id="u-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                maxLength={120}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">Work email</Label>
              <Input
                id="u-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={form.roleKey}
                  onValueChange={(v) => setForm({ ...form, roleKey: v })}
                >
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
                <Label>Department</Label>
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm({ ...form, department: v })}
                >
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
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as UserStatus })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-1.5">
                <Plus className="h-4 w-4" />
                {editing ? "Save changes" : "Create user"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
  tone?: "default" | "emerald" | "amber" | "muted";
}) {
  const toneCls: Record<string, string> = {
    default: "text-foreground",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
    muted: "text-muted-foreground",
  };
  return (
    <div className="rounded border border-border bg-surface px-3 py-2.5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={`mt-0.5 text-[20px] font-semibold ${toneCls[tone]}`}>
        {value}
      </div>
    </div>
  );
}
