import {
  useComplaintsConfig,
  resolutionActions,
  labelFor,
  type LocaleCode,
} from "@/lib/complaints-config-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { LocalizedInput } from "./LocalizedInput";
import { MultiSelectChips } from "./MultiSelectChips";

export function ResolutionCodesTab({ locale, search }: { locale: LocaleCode; search: string }) {
  const cfg = useComplaintsConfig();
  const rows = cfg.resolutionCodes.filter((r) =>
    !search ||
    r.code.toLowerCase().includes(search.toLowerCase()) ||
    Object.values(r.label).some((v) => v?.toLowerCase().includes(search.toLowerCase())),
  );

  const statusOpts = cfg.statuses.map((s) => ({ value: s.id, label: labelFor(s.label, locale, s.code) }));
  const categoryOpts = cfg.categories
    .filter((c) => c.parentId === null)
    .map((c) => ({ value: c.id, label: labelFor(c.label, locale, c.code) }));

  return (
    <div className="rounded border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[12px] font-medium text-muted-foreground">{rows.length} resolution codes</span>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-[12px]"
          onClick={() => resolutionActions.create({
            code: `NEW_${Math.floor(Math.random() * 9000 + 1000)}`,
            label: { en: "New resolution" }, description: { en: "" },
            applicableStatusIds: [], applicableCategoryIds: [], active: true,
          })}>
          <Plus className="h-3.5 w-3.5" /> Resolution code
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Code</TableHead>
            <TableHead className="w-[22%]">Label</TableHead>
            <TableHead className="w-[24%]">Description</TableHead>
            <TableHead>Applies to statuses</TableHead>
            <TableHead>Applies to categories</TableHead>
            <TableHead className="w-16">Active</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <Input className="h-8 font-mono text-[12.5px]" value={r.code}
                  onChange={(e) => resolutionActions.update(r.id, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
              </TableCell>
              <TableCell>
                <LocalizedInput value={r.label} locale={locale}
                  onChange={(v) => resolutionActions.update(r.id, { label: v })} />
              </TableCell>
              <TableCell>
                <LocalizedInput value={r.description} locale={locale} multiline
                  onChange={(v) => resolutionActions.update(r.id, { description: v })} />
              </TableCell>
              <TableCell>
                <MultiSelectChips options={statusOpts} values={r.applicableStatusIds}
                  onChange={(v) => resolutionActions.update(r.id, { applicableStatusIds: v })} placeholder="Any" />
              </TableCell>
              <TableCell>
                <MultiSelectChips options={categoryOpts} values={r.applicableCategoryIds}
                  onChange={(v) => resolutionActions.update(r.id, { applicableCategoryIds: v })} placeholder="All" />
              </TableCell>
              <TableCell>
                <Switch checked={r.active}
                  onCheckedChange={(v) => resolutionActions.update(r.id, { active: v })} />
              </TableCell>
              <TableCell>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Delete this resolution code?")) resolutionActions.remove(r.id); }}>
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
