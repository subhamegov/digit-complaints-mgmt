import { createFileRoute } from "@tanstack/react-router";
import { AdminPageHeader } from "@/components/admin/AdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/workflow-config/sla-maps")({
  head: () => ({
    meta: [{ title: "SLA Maps — Account Administrator" }],
  }),
  component: SlaMapsPage,
});

const SLAS = [
  { category: "Sanitation", priority: "Critical", ack: "1h",  resolve: "8h",  escalate: "4h" },
  { category: "Sanitation", priority: "High",     ack: "2h",  resolve: "24h", escalate: "12h" },
  { category: "Water",      priority: "Critical", ack: "1h",  resolve: "6h",  escalate: "3h" },
  { category: "Water",      priority: "Normal",   ack: "4h",  resolve: "48h", escalate: "24h" },
  { category: "Roads",      priority: "High",     ack: "4h",  resolve: "72h", escalate: "36h" },
  { category: "Roads",      priority: "Normal",   ack: "8h",  resolve: "120h", escalate: "60h" },
  { category: "Electricity", priority: "Critical", ack: "30m", resolve: "4h",  escalate: "2h" },
  { category: "Electricity", priority: "Normal",   ack: "2h",  resolve: "24h", escalate: "12h" },
];

const toneFor = (p: string) =>
  p === "Critical"
    ? "bg-red-50 text-red-700 border-red-200"
    : p === "High"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

function SlaMapsPage() {
  return (
    <div className="flex h-full flex-col">
      <AdminPageHeader
        title="SLA Maps"
        subtitle="Acknowledgement, resolution, and escalation targets per category and priority."
      />
      <div className="flex-1 p-4 lg:p-6">
        <div className="overflow-hidden rounded border border-border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Acknowledge</TableHead>
                <TableHead className="text-right">Resolve</TableHead>
                <TableHead className="text-right">Escalate after</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SLAS.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="text-[13px] font-medium text-foreground">
                    {s.category}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={toneFor(s.priority)}>
                      {s.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">{s.ack}</TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">{s.resolve}</TableCell>
                  <TableCell className="text-right text-[13px] tabular-nums">{s.escalate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
