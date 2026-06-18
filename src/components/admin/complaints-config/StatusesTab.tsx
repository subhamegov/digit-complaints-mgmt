import {
  useComplaintsConfig,
  statusActions,
  type LocaleCode,
  type StatusCategory,
} from "@/lib/complaints-config-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Info } from "lucide-react";
import { LocalizedInput } from "./LocalizedInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "@tanstack/react-router";

const CATS: { value: StatusCategory; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
  { value: "REJECTED", label: "Rejected" },
];

export function StatusesTab({ locale, search }: { locale: LocaleCode; search: string }) {
  const cfg = useComplaintsConfig();
  const rows = cfg.statuses.filter((s) =>
    !search ||
    s.code.toLowerCase().includes(search.toLowerCase()) ||
    Object.values(s.label).some((v) => v?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded border border-border bg-muted/40 px-3 py-2 text-[12.5px] text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          This page manages the status catalog (labels, colors, lifecycle categories).
          Allowed transitions are defined in{" "}
          <Link to="/admin/workflow-config" className="text-primary hover:underline">Workflow Configuration</Link>.
        </span>
      </div>

      <div className="rounded border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[12px] font-medium text-muted-foreground">{rows.length} statuses</span>
          <Button size="sm" variant="outline" className="h-7 gap-1 text-[12px]"
            onClick={() => statusActions.create({
              code: `NEW_${Math.floor(Math.random() * 9000 + 1000)}`,
              label: { en: "New status" }, category: "OPEN", color: "#64748b", terminal: false,
            })}
          >
            <Plus className="h-3.5 w-3.5" /> Status
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Code</TableHead>
              <TableHead>Label</TableHead>
              <TableHead className="w-40">Category</TableHead>
              <TableHead className="w-24">Color</TableHead>
              <TableHead className="w-20">Terminal</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Input className="h-8 font-mono text-[12.5px]" value={s.code}
                    onChange={(e) => statusActions.update(s.id, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
                </TableCell>
                <TableCell>
                  <LocalizedInput value={s.label} locale={locale}
                    onChange={(v) => statusActions.update(s.id, { label: v })} />
                </TableCell>
                <TableCell>
                  <Select value={s.category}
                    onValueChange={(v) => statusActions.update(s.id, { category: v as StatusCategory })}>
                    <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <input type="color" className="h-7 w-9 cursor-pointer rounded border border-border bg-background"
                      value={s.color}
                      onChange={(e) => statusActions.update(s.id, { color: e.target.value })} />
                    <span className="font-mono text-[11px] text-muted-foreground">{s.color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Switch checked={s.terminal}
                    onCheckedChange={(v) => statusActions.update(s.id, { terminal: v })} />
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => { if (confirm("Delete this status?")) statusActions.remove(s.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
