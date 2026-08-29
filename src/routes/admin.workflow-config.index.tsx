import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { useState } from "react";
import {
  Lock,
  Eye,
  Gauge,
  ShieldCheck,
  Copy,
  Pencil,
  Trash2,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export const Route = createFileRoute("/admin/workflow-config/")({
  head: () => ({
    meta: [{ title: "Workflows - Account Administrator" }],
  }),
  component: WorkflowConfigIndex,
});

type WfType = "Reference" | "Custom";
type WfStatus = "Active" | "Draft" | "Archived";

type Workflow = {
  code: string;
  name: string;
  type: WfType;
  states: number;
  transitions: number;
  usedBy: number;
  status: WfStatus;
  updatedAt: string;
  updatedBy: string;
  locked?: boolean;
};

const WORKFLOWS: Workflow[] = [
  {
    code: "PGR.STANDARD.V2",
    name: "DIGIT PGR Standard Workflow v2",
    type: "Reference",
    states: 7,
    transitions: 7,
    usedBy: 42,
    status: "Active",
    updatedAt: "2024-01-15",
    updatedBy: "DIGIT Platform",
    locked: true,
  },
  {
    code: "PGR.SANITATION.FT",
    name: "Sanitation Fast-Track",
    type: "Custom",
    states: 6,
    transitions: 6,
    usedBy: 8,
    status: "Active",
    updatedAt: "2026-04-22",
    updatedBy: "Vikram Mehta",
  },
  {
    code: "PGR.WATER.2TIER",
    name: "Water Supply – 2-Tier Escalation",
    type: "Custom",
    states: 8,
    transitions: 9,
    usedBy: 5,
    status: "Active",
    updatedAt: "2026-05-30",
    updatedBy: "Vikram Mehta",
  },
  {
    code: "PGR.LIGHTING.PILOT",
    name: "Street Lighting (pilot)",
    type: "Custom",
    states: 7,
    transitions: 7,
    usedBy: 0,
    status: "Draft",
    updatedAt: "2026-06-08",
    updatedBy: "Harpreet Kaur",
  },
];

function StatusPill({ status }: { status: WfStatus }) {
  const map: Record<WfStatus, string> = {
    Active: "bg-status-resolved-bg text-status-resolved",
    Draft: "bg-status-progress-bg text-status-progress",
    Archived: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
        map[status],
      )}
    >
      {status}
    </span>
  );
}

function WorkflowConfigIndex() {
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);

  const onDuplicate = (w: Workflow) => {
    toast.success(`Cloned "${w.name}" → draft`);
  };
  const onEdit = (w: Workflow) => {
    toast.message(`Editing ${w.name}`);
  };
  const onConfirmDelete = () => {
    if (deleteTarget) {
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Workflows"
        subtitle="Workflow definitions installed for this account. The DIGIT reference workflow is locked and cannot be edited or deleted."
        actions={
          <button
            onClick={() => toast.message("New workflow - clone a base to start")}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-primary px-3 text-[12.5px] font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            New workflow
          </button>
        }
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="overflow-hidden rounded border border-border bg-surface">
          <table className="w-full text-[13px]">
            <thead className="bg-surface-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Code</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-right font-medium">States</th>
                <th className="px-4 py-2 text-right font-medium">Transitions</th>
                <th className="px-4 py-2 text-left font-medium">Used by</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Updated</th>
                <th className="px-4 py-2 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {WORKFLOWS.map((w) => (
                <tr key={w.code} className="hover:bg-muted/40">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/workflow-config/visualization"
                        className="font-medium text-foreground hover:underline"
                      >
                        {w.name}
                      </Link>
                      {w.locked && (
                        <span
                          title="System workflow - clone to customize"
                          className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
                        >
                          <Lock className="h-3 w-3" />
                          System
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11.5px] text-muted-foreground">
                    {w.code}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider",
                        w.type === "Reference"
                          ? "border-status-assigned/30 text-status-assigned"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {w.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{w.states}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {w.transitions}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {w.usedBy} {w.usedBy === 1 ? "category" : "categories"}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusPill status={w.status} />
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    <div className="tabular-nums">{w.updatedAt}</div>
                    <div className="text-[11px] opacity-80">{w.updatedBy}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-surface text-muted-foreground hover:bg-muted">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuItem
                            onClick={() =>
                              router.navigate({
                                to: "/admin/workflow-config/visualization",
                              })
                            }
                          >
                            <Eye className="mr-2 h-3.5 w-3.5" />
                            Visualize
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.navigate({
                                to: "/admin/workflow-config/sla-maps",
                              })
                            }
                          >
                            <Gauge className="mr-2 h-3.5 w-3.5" />
                            SLA Maps
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.navigate({
                                to: "/admin/workflow-config/role-hierarchy",
                              })
                            }
                          >
                            <ShieldCheck className="mr-2 h-3.5 w-3.5" />
                            Role Hierarchy
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={w.locked}
                            onClick={() => !w.locked && onEdit(w)}
                            title={
                              w.locked
                                ? "System workflow - clone to customize"
                                : undefined
                            }
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDuplicate(w)}>
                            <Copy className="mr-2 h-3.5 w-3.5" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={w.locked}
                            onClick={() => !w.locked && setDeleteTarget(w)}
                            title={
                              w.locked
                                ? "System workflow - clone to customize"
                                : undefined
                            }
                            className={cn(
                              !w.locked && "text-status-breach focus:text-status-breach",
                            )}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11.5px] text-muted-foreground">
          The <span className="font-medium text-foreground">DIGIT PGR Standard Workflow v2</span>{" "}
          (<span className="font-mono">PGR.STANDARD.V2</span>) is the reference state
          machine bundled with the DIGIT Complaint Management System. Every account
          inherits it; it cannot be edited or deleted. Clone it to create a custom
          variant for your account.
        </p>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name}
              </span>
              . Complaint categories currently bound to it will need to be
              reassigned to another workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
