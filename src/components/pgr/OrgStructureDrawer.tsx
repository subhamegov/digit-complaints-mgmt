import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ROLE_LABEL } from "@/lib/rbac";
import type { OrgProfile, OrgUnit } from "@/lib/my-complaints";
import { EMPTY_COPY } from "@/lib/my-complaints";

function UnitNode({ unit, profile, depth }: { unit: OrgUnit; profile: OrgProfile; depth: number }) {
  const isMine = unit.id === profile.unitId;
  return (
    <div className={cn(depth > 0 && "border-l border-border pl-3")}>
      <div className={cn("rounded-sm px-2 py-1.5", isMine && "bg-primary/10 ring-1 ring-primary/30")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium">{unit.name}</span>
          <span className="rounded-sm border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            {unit.kind}
          </span>
          {isMine && (
            <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              Your unit
            </span>
          )}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          Jurisdictions: {unit.jurisdictions.join(", ") || "-"}
        </div>
        {unit.members.length > 0 && (
          <ul className="mt-1 space-y-0.5">
            {unit.members.map((m) => (
              <li key={m.id} className="text-[11px] text-muted-foreground">
                <span className={cn(m.id === profile.officerId && "font-semibold text-foreground")}>{m.name}</span>
                {" · "}{m.designation}
              </li>
            ))}
          </ul>
        )}
      </div>
      {unit.children?.length ? (
        <div className="mt-1 space-y-1 pl-3">
          {unit.children.map((child) => (
            <UnitNode key={child.id} unit={child} profile={profile} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OrgStructureDrawer({
  open,
  onOpenChange,
  profile,
  jurisdictionName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: OrgProfile | null;
  jurisdictionName: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>My organisation structure</SheetTitle>
          <SheetDescription>
            Read-only reference for the complaints included in your organisational scope.
          </SheetDescription>
        </SheetHeader>

        {!profile ? (
          <p className="mt-6 text-[13px] text-muted-foreground">{EMPTY_COPY.noOrg}</p>
        ) : (
          <div className="mt-5 space-y-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
              <div><dt className="text-muted-foreground">Organisation</dt><dd className="font-medium">{profile.organisation}</dd></div>
              <div><dt className="text-muted-foreground">Active jurisdiction</dt><dd className="font-medium">{jurisdictionName}</dd></div>
              <div><dt className="text-muted-foreground">Your role</dt><dd className="font-medium">{ROLE_LABEL[profile.role]}</dd></div>
              <div><dt className="text-muted-foreground">Your unit</dt><dd className="font-medium">{profile.department}</dd></div>
              <div className="col-span-2"><dt className="text-muted-foreground">Reports to</dt><dd className="font-medium">{profile.reportsTo ?? "-"}</dd></div>
            </dl>

            <div className="space-y-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Hierarchy</h3>
              <UnitNode unit={profile.tree} profile={profile} depth={0} />
            </div>

            <p className="rounded-sm border border-border bg-muted/50 px-3 py-2 text-[12px] text-muted-foreground">
              My Organisation’s Complaints includes complaints assigned to the organisational units shown here,
              subject to your access permissions.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
