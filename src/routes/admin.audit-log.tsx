import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, ChevronRight, ShieldCheck } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AUDIT_ACTION_LABEL,
  formatTs,
  loadAudit,
  type AuditAction,
  type AuditEvent,
} from "@/lib/user-admin-store";

export const Route = createFileRoute("/admin/audit-log")({
  head: () => ({
    meta: [
      { title: "Audit Log - Account Administration" },
      {
        name: "description",
        content:
          "Complete, privacy-safe record of every administrative action performed against employee and citizen users.",
      },
    ],
  }),
  component: AuditLogPage,
});

const USER_TYPE_LABEL: Record<string, string> = {
  EMPLOYEE: "Employee",
  CITIZEN: "Citizen",
  CONFIGURATION: "Configuration",
};

function AuditLogPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [userType, setUserType] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [performedBy, setPerformedBy] = useState("ALL");
  const [result, setResult] = useState("ALL");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AuditEvent | null>(null);

  useEffect(() => {
    const sync = () => setEvents(loadAudit());
    sync();
    window.addEventListener("pgr:user-audit", sync);
    return () => window.removeEventListener("pgr:user-audit", sync);
  }, []);

  const actors = useMemo(
    () => Array.from(new Set(events.map((e) => e.performedBy))).sort(),
    [events],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (userType !== "ALL" && e.userType !== userType) return false;
      if (action !== "ALL" && e.action !== action) return false;
      if (performedBy !== "ALL" && e.performedBy !== performedBy) return false;
      if (result !== "ALL" && e.result !== result) return false;
      if (q && !`${e.targetLabel} ${e.targetIdentifier} ${e.targetId} ${e.eventId}`.toLowerCase().includes(q))
        return false;
      if (from && new Date(e.at) < new Date(`${from}T00:00:00`)) return false;
      if (to && new Date(e.at) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [events, userType, action, performedBy, result, query, from, to]);

  const usedActions = useMemo(
    () => Array.from(new Set(events.map((e) => e.action))).sort() as AuditAction[],
    [events],
  );

  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="Audit Log"
        subtitle="Every user-related administrative action is recorded. No user mutation can succeed without an audit event."
      />

      <div className="flex-1 space-y-4 p-4 lg:p-6">
        <div className="flex items-start gap-2 rounded border border-border bg-surface-2 px-3 py-2.5 text-[12.5px] text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            Citizen entries use system references and masked identifiers only. Passwords, magic-link
            tokens, activation tokens and authentication secrets are never recorded.
          </p>
        </div>

        <div className="rounded border border-border bg-surface">
          <div className="grid gap-2 border-b border-border px-3 py-2.5 sm:flex sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 sm:min-w-[220px] sm:flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search user reference or event ID"
                className="h-8 pl-8 text-[13px]"
              />
            </div>
            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger className="h-8 w-full text-[13px] sm:w-[140px]" aria-label="User type">
                <SelectValue placeholder="User type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All user types</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="CITIZEN">Citizen</SelectItem>
                <SelectItem value="CONFIGURATION">Configuration</SelectItem>
              </SelectContent>
            </Select>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-8 w-full text-[13px] sm:w-[210px]" aria-label="Action">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All actions</SelectItem>
                {usedActions.map((a) => (
                  <SelectItem key={a} value={a}>
                    {AUDIT_ACTION_LABEL[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={performedBy} onValueChange={setPerformedBy}>
              <SelectTrigger className="h-8 w-full text-[13px] sm:w-[200px]" aria-label="Performed by">
                <SelectValue placeholder="Performed by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Anyone</SelectItem>
                {actors.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={result} onValueChange={setResult}>
              <SelectTrigger className="h-8 w-full text-[13px] sm:w-[130px]" aria-label="Result">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Any result</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 w-full text-[13px] sm:w-[150px]"
              aria-label="From date"
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 w-full text-[13px] sm:w-[150px]"
              aria-label="To date"
            />
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date &amp; time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>User type</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Changed by</TableHead>
                  <TableHead>Last logged in</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-[13px] text-muted-foreground">
                      No audit events match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((e) => (
                    <TableRow key={e.eventId}>
                      <TableCell className="whitespace-nowrap text-[12.5px]">{formatTs(e.at)}</TableCell>
                      <TableCell>
                        <div className={e.userType === "CITIZEN" ? "font-mono text-[12.5px] text-foreground" : "font-medium text-foreground"}>{e.targetLabel}</div>
                        <div className={e.userType === "CITIZEN" ? "font-mono text-[12px] text-muted-foreground" : "text-[12px] text-muted-foreground"}>{e.targetIdentifier}</div>
                      </TableCell>
                      <TableCell className="text-[13px]">{USER_TYPE_LABEL[e.userType]}</TableCell>
                      <TableCell className="text-[13px]">{AUDIT_ACTION_LABEL[e.action]}</TableCell>
                      <TableCell className="text-[12.5px]">{e.performedBy}</TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">{formatTs(e.lastLoggedIn)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={e.result === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-destructive/10 text-destructive border-destructive/30"}>
                          {e.result === "SUCCESS" ? "Success" : "Failed"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-[12px]" onClick={() => setSelected(e)}>
                          Details <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="divide-y divide-border md:hidden">
            {filtered.length === 0 ? (
              <p className="px-3 py-10 text-center text-[13px] text-muted-foreground">No audit events match the current filters.</p>
            ) : (
              filtered.map((e) => (
                <article key={e.eventId} className="space-y-3 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] text-muted-foreground">{formatTs(e.at)}</p>
                      <p className="mt-1 truncate text-[13px] font-medium text-foreground">{e.targetLabel}</p>
                      <p className="truncate text-[11.5px] text-muted-foreground">{e.targetIdentifier}</p>
                    </div>
                    <Badge variant="outline" className={e.result === "SUCCESS" ? "shrink-0 bg-emerald-50 text-emerald-700 border-emerald-200" : "shrink-0 bg-destructive/10 text-destructive border-destructive/30"}>
                      {e.result === "SUCCESS" ? "Success" : "Failed"}
                    </Badge>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
                    <div><dt className="text-muted-foreground">User type</dt><dd className="mt-0.5 font-medium text-foreground">{USER_TYPE_LABEL[e.userType]}</dd></div>
                    <div><dt className="text-muted-foreground">Changed by</dt><dd className="mt-0.5 truncate font-medium text-foreground">{e.performedBy}</dd></div>
                    <div className="col-span-2"><dt className="text-muted-foreground">Action</dt><dd className="mt-0.5 text-foreground">{AUDIT_ACTION_LABEL[e.action]}</dd></div>
                  </dl>
                  <Button variant="outline" size="sm" className="h-8 w-full justify-center gap-1 text-[12px]" onClick={() => setSelected(e)}>
                    View details <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </article>
              ))
            )}
          </div>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{AUDIT_ACTION_LABEL[selected.action]}</SheetTitle>
                <SheetDescription className="font-mono text-[12px]">
                  {selected.eventId}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-5">
                <section>
                  <SectionTitle>Event</SectionTitle>
                  <dl className="space-y-1.5">
                    <Field label="Date & time" value={formatTs(selected.at)} />
                    <Field
                      label="User type"
                      value={USER_TYPE_LABEL[selected.userType]}
                    />
                    <Field label="User reference" value={selected.targetLabel} mono={selected.userType === "CITIZEN"} />
                    <Field label="Identifier" value={selected.targetIdentifier} mono={selected.userType === "CITIZEN"} />
                    <Field label="Performed by" value={selected.performedBy} />
                    <Field label="Result" value={selected.result === "SUCCESS" ? "Success" : "Failed"} />
                    <Field label="Last logged in" value={formatTs(selected.lastLoggedIn)} />
                  </dl>
                </section>

                {selected.changes && selected.changes.length > 0 && (
                  <section>
                    <SectionTitle>Change details</SectionTitle>
                    <div className="overflow-hidden rounded border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Field</TableHead>
                            <TableHead>Previous</TableHead>
                            <TableHead>New</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selected.changes.map((c) => (
                            <TableRow key={c.field}>
                              <TableCell className="text-[12.5px] font-medium">{c.field}</TableCell>
                              <TableCell className="text-[12.5px] text-muted-foreground line-through">
                                {c.previous}
                              </TableCell>
                              <TableCell className="text-[12.5px] text-foreground">{c.next}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </section>
                )}

                {selected.context && Object.values(selected.context).some(Boolean) && (
                  <section>
                    <SectionTitle>Context</SectionTitle>
                    <dl className="space-y-1.5">
                      {selected.context.reason && <Field label="Reason" value={selected.context.reason} />}
                      {selected.context.authenticationMethod && (
                        <Field label="Authentication method" value={selected.context.authenticationMethod} />
                      )}
                      {selected.context.invitationChannel && (
                        <Field label="Invitation channel" value={selected.context.invitationChannel} />
                      )}
                      {selected.context.source && <Field label="Source" value={selected.context.source} />}
                      {selected.context.sessionReference && (
                        <Field label="Session reference" value={selected.context.sessionReference} mono />
                      )}
                      {selected.context.ipAddress && (
                        <Field label="IP address" value={selected.context.ipAddress} mono />
                      )}
                      {selected.context.device && <Field label="Device / client" value={selected.context.device} />}
                      {selected.context.accessDuration && (
                        <Field label="Access duration" value={selected.context.accessDuration} />
                      )}
                    </dl>
                  </section>
                )}

                <p className="rounded-sm border border-border bg-surface-2 px-2.5 py-2 text-[12px] text-muted-foreground">
                  Tokens, links and secrets associated with this event are intentionally excluded from
                  the record.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-1.5 last:border-0">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={`text-right text-[13px] font-medium text-foreground ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
