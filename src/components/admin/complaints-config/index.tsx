import { useMemo, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, RotateCcw, Search } from "lucide-react";
import {
  LOCALES, LOCALE_LABEL,
  useComplaintsConfig, resetComplaintsConfig,
  type LocaleCode,
} from "@/lib/complaints-config-store";
import { CategoriesTab } from "./CategoriesTab";
import { PrioritiesTab } from "./PrioritiesTab";
import { StatusesTab } from "./StatusesTab";
import { ResolutionCodesTab } from "./ResolutionCodesTab";
import { CustomAttributesTab } from "./CustomAttributesTab";

const TABS = [
  { value: "categories",   label: "Categories" },
  { value: "priorities",   label: "Priorities" },
  { value: "statuses",     label: "Statuses" },
  { value: "resolutions",  label: "Resolution codes" },
  { value: "attributes",   label: "Custom attributes" },
] as const;
type TabValue = (typeof TABS)[number]["value"];

export function ComplaintsConfigScreen() {
  const cfg = useComplaintsConfig();
  const search = useSearch({ strict: false }) as { tab?: string };
  const navigate = useNavigate();
  const tab = (TABS.find((t) => t.value === search.tab)?.value ?? "categories") as TabValue;

  const [locale, setLocale] = useState<LocaleCode>("en");
  const [query, setQuery] = useState("");

  const setTab = (v: TabValue) => {
    navigate({ to: "/admin/complaints-config", search: { tab: v } as never, replace: true });
  };

  const counts = useMemo(() => ({
    categories: cfg.categories.length,
    priorities: cfg.priorities.length,
    statuses: cfg.statuses.length,
    resolutions: cfg.resolutionCodes.length,
    attributes: cfg.customAttributes.length,
  }), [cfg]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(cfg, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaints-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Complaints"
        subtitle="Manage categories, subcategories, priorities, statuses, resolution codes, and custom attributes. All labels editable per locale."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="h-8 w-48 pl-7 text-[13px]"
              />
            </div>
            <Select value={locale} onValueChange={(v) => setLocale(v as LocaleCode)}>
              <SelectTrigger className="h-8 w-32 text-[13px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCALES.map((lc) => (
                  <SelectItem key={lc} value={lc}>{LOCALE_LABEL[lc]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1"
              onClick={() => { if (confirm("Reset all configuration to seed data?")) resetComplaintsConfig(); }}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="space-y-4">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="text-[13px]">
                {t.label}
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  {counts[t.value]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="categories" className="mt-0">
            <CategoriesTab locale={locale} search={query} />
          </TabsContent>
          <TabsContent value="priorities" className="mt-0">
            <PrioritiesTab locale={locale} search={query} />
          </TabsContent>
          <TabsContent value="statuses" className="mt-0">
            <StatusesTab locale={locale} search={query} />
          </TabsContent>
          <TabsContent value="resolutions" className="mt-0">
            <ResolutionCodesTab locale={locale} search={query} />
          </TabsContent>
          <TabsContent value="attributes" className="mt-0">
            <CustomAttributesTab locale={locale} search={query} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
