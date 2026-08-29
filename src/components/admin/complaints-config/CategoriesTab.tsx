import { useMemo, useState } from "react";
import {
  useComplaintsConfig,
  categoryActions,
  labelFor,
  type Category,
  type LocaleCode,
} from "@/lib/complaints-config-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LocalizedInput } from "./LocalizedInput";
import { ChevronRight, ChevronDown, ArrowUp, ArrowDown, Trash2, Plus, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function CategoriesTab({ locale, search }: { locale: LocaleCode; search: string }) {
  const cfg = useComplaintsConfig();
  const [selected, setSelected] = useState<string | null>(cfg.categories[0]?.id ?? null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(cfg.categories.filter((c) => c.parentId === null).map((c) => c.id)),
  );

  const roots = useMemo(
    () => cfg.categories.filter((c) => c.parentId === null).sort((a, b) => a.order - b.order),
    [cfg.categories],
  );
  const childrenOf = (pid: string) =>
    cfg.categories.filter((c) => c.parentId === pid).sort((a, b) => a.order - b.order);

  const matches = (c: Category) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      Object.values(c.label).some((v) => v?.toLowerCase().includes(q))
    );
  };

  const node = selected ? cfg.categories.find((c) => c.id === selected) ?? null : null;

  const handleAdd = (parentId: string | null) => {
    const code = `NEW_${Math.floor(Math.random() * 9000 + 1000)}`;
    const parent = parentId ? cfg.categories.find((c) => c.id === parentId) : null;
    categoryActions.create({
      code,
      parentId,
      label: { en: "New category" },
      description: { en: "" },
      defaultPriorityId: parent?.defaultPriorityId ?? cfg.priorities.find((p) => p.isDefault)?.id ?? null,
      defaultSlaHours: parent?.defaultSlaHours ?? 48,
      department: parent?.department ?? "",
      active: true,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      {/* Tree */}
      <div className="rounded border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-[12px] font-medium text-muted-foreground">Taxonomy</span>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-[12px]" onClick={() => handleAdd(null)}>
            <Plus className="h-3.5 w-3.5" /> Category
          </Button>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-1 text-[13px]">
          {roots.filter(matches).map((root) => (
            <TreeNode
              key={root.id}
              cat={root}
              depth={0}
              expanded={expanded}
              setExpanded={setExpanded}
              selected={selected}
              setSelected={setSelected}
              childrenOf={childrenOf}
              locale={locale}
              matches={matches}
            />
          ))}
        </ul>
      </div>

      {/* Detail */}
      <div className="rounded border border-border bg-surface p-4">
        {!node ? (
          <p className="text-[13px] text-muted-foreground">Select a category to edit.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold">{labelFor(node.label, locale, node.code)}</h3>
                <Badge variant={node.active ? "default" : "secondary"}>
                  {node.active ? "Active" : "Inactive"}
                </Badge>
                {node.parentId && <Badge variant="outline">Subcategory</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7" onClick={() => categoryActions.move(node.id, -1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => categoryActions.move(node.id, 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7" onClick={() => handleAdd(node.id)}>
                  <Plus className="h-3.5 w-3.5" /> Subcategory
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="h-7 text-destructive hover:text-destructive"
                  onClick={() => { if (confirm("Delete this category and its subcategories?")) { categoryActions.remove(node.id); setSelected(null); } }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Code">
                <Input
                  value={node.code}
                  className="h-8 font-mono text-[12.5px]"
                  onChange={(e) => categoryActions.update(node.id, { code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })}
                />
              </Field>
              <Field label="Department">
                <Input
                  value={node.department}
                  className="h-8 text-[13px]"
                  onChange={(e) => categoryActions.update(node.id, { department: e.target.value })}
                />
              </Field>
              <Field label="Label">
                <LocalizedInput
                  value={node.label}
                  locale={locale}
                  onChange={(v) => categoryActions.update(node.id, { label: v })}
                  title="Translate label"
                />
              </Field>
              <Field label="Description">
                <LocalizedInput
                  value={node.description}
                  locale={locale}
                  multiline
                  onChange={(v) => categoryActions.update(node.id, { description: v })}
                  title="Translate description"
                />
              </Field>
              <Field label="Default priority">
                <Select
                  value={node.defaultPriorityId ?? "__none"}
                  onValueChange={(v) => categoryActions.update(node.id, { defaultPriorityId: v === "__none" ? null : v })}
                >
                  <SelectTrigger className="h-8 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">- None -</SelectItem>
                    {cfg.priorities.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{labelFor(p.label, locale, p.code)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Default SLA (hours)">
                <Input
                  type="number"
                  min={0}
                  className="h-8 text-[13px]"
                  value={node.defaultSlaHours}
                  onChange={(e) => categoryActions.update(node.id, { defaultSlaHours: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Active">
                <div className="flex h-8 items-center">
                  <Switch
                    checked={node.active}
                    onCheckedChange={(v) => categoryActions.update(node.id, { active: v })}
                  />
                </div>
              </Field>
            </div>

            <div className="pt-2">
              <Link
                to="/admin/workflow-config"
                className="inline-flex items-center gap-1 text-[12.5px] text-primary hover:underline"
              >
                Edit workflow for this category <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11.5px] uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function TreeNode({
  cat, depth, expanded, setExpanded, selected, setSelected, childrenOf, locale, matches,
}: {
  cat: Category;
  depth: number;
  expanded: Set<string>;
  setExpanded: (s: Set<string>) => void;
  selected: string | null;
  setSelected: (id: string) => void;
  childrenOf: (pid: string) => Category[];
  locale: LocaleCode;
  matches: (c: Category) => boolean;
}) {
  const kids = childrenOf(cat.id);
  const isOpen = expanded.has(cat.id);
  return (
    <li>
      <div
        className={cn(
          "flex cursor-pointer items-center gap-1 px-2 py-1.5 hover:bg-accent",
          selected === cat.id && "bg-accent",
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
        onClick={() => setSelected(cat.id)}
      >
        {kids.length > 0 ? (
          <button
            className="text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              const next = new Set(expanded);
              if (next.has(cat.id)) next.delete(cat.id); else next.add(cat.id);
              setExpanded(next);
            }}
          >
            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="inline-block w-3.5" />
        )}
        <span className={cn("truncate", !cat.active && "text-muted-foreground line-through")}>
          {labelFor(cat.label, locale, cat.code)}
        </span>
        <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">{cat.code}</span>
      </div>
      {isOpen && kids.length > 0 && (
        <ul>
          {kids.filter(matches).map((child) => (
            <TreeNode
              key={child.id}
              cat={child}
              depth={depth + 1}
              expanded={expanded}
              setExpanded={setExpanded}
              selected={selected}
              setSelected={setSelected}
              childrenOf={childrenOf}
              locale={locale}
              matches={matches}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
