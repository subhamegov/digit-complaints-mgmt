import {
  useComplaintsConfig,
  attributeActions,
  labelFor,
  newRid,
  type LocaleCode,
  type AttrType,
  type Channel,
  type AttrRole,
} from "@/lib/complaints-config-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { LocalizedInput } from "./LocalizedInput";
import { MultiSelectChips } from "./MultiSelectChips";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TYPES: AttrType[] = ["text", "number", "select", "multiselect", "date", "boolean", "file"];
const CHANNELS: Channel[] = ["web", "mobile", "csr"];
const ROLES: AttrRole[] = ["citizen", "agent", "supervisor"];

export function CustomAttributesTab({ locale, search }: { locale: LocaleCode; search: string }) {
  const cfg = useComplaintsConfig();
  const rows = cfg.customAttributes.filter((a) =>
    !search ||
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    Object.values(a.label).some((v) => v?.toLowerCase().includes(search.toLowerCase())),
  );

  const categoryOpts = cfg.categories
    .filter((c) => c.parentId === null)
    .map((c) => ({ value: c.id, label: labelFor(c.label, locale, c.code) }));
  const channelOpts = CHANNELS.map((c) => ({ value: c, label: c.toUpperCase() }));
  const roleOpts = ROLES.map((r) => ({ value: r, label: r[0].toUpperCase() + r.slice(1) }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-muted-foreground">{rows.length} custom attributes</span>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-[12px]"
          onClick={() => attributeActions.create({
            code: `NEW_${Math.floor(Math.random() * 9000 + 1000)}`,
            label: { en: "New attribute" }, type: "text", required: false,
            channels: ["web", "mobile", "csr"], roles: ["citizen", "agent"],
            validation: {}, options: [], applicableCategoryIds: [],
          })}>
          <Plus className="h-3.5 w-3.5" /> Attribute
        </Button>
      </div>

      <div className="space-y-3">
        {rows.map((a) => (
          <div key={a.id} className="rounded border border-border bg-surface p-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Code</TableHead>
                  <TableHead className="w-[22%]">Label</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                  <TableHead className="w-20">Required</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Input className="h-8 font-mono text-[12.5px]" value={a.code}
                      onChange={(e) => attributeActions.update(a.id, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
                  </TableCell>
                  <TableCell>
                    <LocalizedInput value={a.label} locale={locale}
                      onChange={(v) => attributeActions.update(a.id, { label: v })} />
                  </TableCell>
                  <TableCell>
                    <Select value={a.type}
                      onValueChange={(v) => attributeActions.update(a.id, { type: v as AttrType })}>
                      <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Switch checked={a.required}
                      onCheckedChange={(v) => attributeActions.update(a.id, { required: v })} />
                  </TableCell>
                  <TableCell>
                    <MultiSelectChips options={channelOpts} values={a.channels}
                      onChange={(v) => attributeActions.update(a.id, { channels: v as Channel[] })} placeholder="None" />
                  </TableCell>
                  <TableCell>
                    <MultiSelectChips options={roleOpts} values={a.roles}
                      onChange={(v) => attributeActions.update(a.id, { roles: v as AttrRole[] })} placeholder="None" />
                  </TableCell>
                  <TableCell>
                    <MultiSelectChips options={categoryOpts} values={a.applicableCategoryIds}
                      onChange={(v) => attributeActions.update(a.id, { applicableCategoryIds: v })} placeholder="All" />
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => { if (confirm("Delete this attribute?")) attributeActions.remove(a.id); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Validation row */}
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {(a.type === "number" || a.type === "text") && (
                <>
                  <SmallField label={a.type === "text" ? "Min length" : "Min"}>
                    <Input type="number" className="h-8 text-[13px]"
                      value={a.validation.min ?? ""}
                      onChange={(e) => attributeActions.update(a.id, {
                        validation: { ...a.validation, min: e.target.value === "" ? undefined : Number(e.target.value) },
                      })} />
                  </SmallField>
                  <SmallField label={a.type === "text" ? "Max length" : "Max"}>
                    <Input type="number" className="h-8 text-[13px]"
                      value={a.validation.max ?? ""}
                      onChange={(e) => attributeActions.update(a.id, {
                        validation: { ...a.validation, max: e.target.value === "" ? undefined : Number(e.target.value) },
                      })} />
                  </SmallField>
                </>
              )}
              {a.type === "text" && (
                <SmallField label="Regex">
                  <Input className="h-8 font-mono text-[12.5px]"
                    value={a.validation.regex ?? ""} placeholder="e.g. ^[A-Z]+$"
                    onChange={(e) => attributeActions.update(a.id, {
                      validation: { ...a.validation, regex: e.target.value || undefined },
                    })} />
                </SmallField>
              )}
            </div>

            {/* Options editor */}
            {(a.type === "select" || a.type === "multiselect") && (
              <div className="mt-3 rounded border border-border bg-background p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-muted-foreground">Options</span>
                  <Button size="sm" variant="ghost" className="h-7 gap-1 text-[12px]"
                    onClick={() => attributeActions.update(a.id, {
                      options: [...a.options, { id: newRid("opt"), code: `OPT_${a.options.length + 1}`, label: { en: "New option" } }],
                    })}>
                    <Plus className="h-3.5 w-3.5" /> Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {a.options.map((opt, idx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <Input className="h-8 w-40 font-mono text-[12.5px]" value={opt.code}
                        onChange={(e) => {
                          const next = [...a.options];
                          next[idx] = { ...opt, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") };
                          attributeActions.update(a.id, { options: next });
                        }} />
                      <div className="flex-1">
                        <LocalizedInput value={opt.label} locale={locale}
                          onChange={(v) => {
                            const next = [...a.options];
                            next[idx] = { ...opt, label: v };
                            attributeActions.update(a.id, { options: next });
                          }} />
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => attributeActions.update(a.id, { options: a.options.filter((o) => o.id !== opt.id) })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {a.options.length === 0 && (
                    <p className="text-[12px] text-muted-foreground">No options yet — add at least one.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
