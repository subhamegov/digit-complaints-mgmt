import {
  useComplaintsConfig,
  priorityActions,
  type LocaleCode,
} from "@/lib/complaints-config-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { LocalizedInput } from "./LocalizedInput";

export function PrioritiesTab({ locale, search }: { locale: LocaleCode; search: string }) {
  const cfg = useComplaintsConfig();
  const rows = [...cfg.priorities]
    .filter((p) => !search || p.code.toLowerCase().includes(search.toLowerCase()) || Object.values(p.label).some((v) => v?.toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => a.order - b.order);

  return (
    <div className="rounded border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[12px] font-medium text-muted-foreground">{rows.length} priorities</span>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-[12px]"
          onClick={() => priorityActions.create({
            code: `NEW_${Math.floor(Math.random() * 9000 + 1000)}`,
            label: { en: "New priority" }, color: "#64748b", weight: 1, isDefault: false,
          })}
        >
          <Plus className="h-3.5 w-3.5" /> Priority
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Order</TableHead>
            <TableHead className="w-40">Code</TableHead>
            <TableHead>Label</TableHead>
            <TableHead className="w-24">Color</TableHead>
            <TableHead className="w-20">Weight</TableHead>
            <TableHead className="w-20">Default</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Input type="number" className="h-8 w-14 text-[13px]" value={p.order}
                  onChange={(e) => priorityActions.update(p.id, { order: Number(e.target.value) || 0 })} />
              </TableCell>
              <TableCell>
                <Input className="h-8 font-mono text-[12.5px]" value={p.code}
                  onChange={(e) => priorityActions.update(p.id, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
              </TableCell>
              <TableCell>
                <LocalizedInput value={p.label} locale={locale}
                  onChange={(v) => priorityActions.update(p.id, { label: v })} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <input type="color" className="h-7 w-9 cursor-pointer rounded border border-border bg-background"
                    value={p.color}
                    onChange={(e) => priorityActions.update(p.id, { color: e.target.value })} />
                  <span className="font-mono text-[11px] text-muted-foreground">{p.color}</span>
                </div>
              </TableCell>
              <TableCell>
                <Input type="number" className="h-8 w-16 text-[13px]" value={p.weight}
                  onChange={(e) => priorityActions.update(p.id, { weight: Number(e.target.value) || 0 })} />
              </TableCell>
              <TableCell>
                <Switch checked={p.isDefault}
                  onCheckedChange={(v) => priorityActions.update(p.id, { isDefault: v })} />
              </TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Delete this priority?")) priorityActions.remove(p.id); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
