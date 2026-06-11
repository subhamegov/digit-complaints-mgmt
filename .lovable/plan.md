## Goal

Replace the current 3-tile landing on `/admin/workflow-config` with a **Workflows list** that surfaces all configured complaint workflows for the account, clearly marks the system-locked reference workflow, and keeps the three existing tools (Visualization, SLA Maps, Role Hierarchy) reachable as actions on each workflow row.

## What the user will see

A single page at `/admin/workflow-config` with:

1. **Header**: "Workflows" + subtitle "Workflow definitions installed for this account. The DIGIT reference workflow is locked and cannot be edited or deleted."
2. **Primary action (top-right)**: `+ New workflow` (clones from a base).
3. **Workflows table** with columns:
   - **Name** (with a small "System" / lock badge on the reference workflow)
   - **Code** (e.g. `PGR.STANDARD.V2`)
   - **Type** (Reference / Custom)
   - **States** (count, e.g. "7 states")
   - **Transitions** (count)
   - **Used by** (count of complaint categories bound to it)
   - **Status** (Active / Draft / Archived)
   - **Updated** (date + author)
   - **Actions**: Visualize · SLA Maps · Role Hierarchy · Edit · Duplicate · Delete
     - For the locked reference row: Edit and Delete are disabled with a tooltip "System workflow — clone to customize". Duplicate, Visualize, SLA Maps, Role Hierarchy remain enabled.

## The locked reference workflow

Per the DIGIT PGR reference implementation, the standard banked workflow is **`PGR` business service** (a.k.a. **"DIGIT PGR Standard Workflow v2"**, code `PGR.STANDARD.V2`). This is the canonical state machine used by the DIGIT Public Grievance Redressal module and is bundled with the platform — every account inherits it and it cannot be deleted or structurally edited; account admins clone it to create custom variants.

States: `OPEN → ASSIGNED → IN_PROGRESS → RESOLVED → (CLOSED | REOPENED) | REJECTED` — already defined in `src/routes/config.workflow.tsx` and reused for the visualizer.

## Seed rows for the list (mock data, account-scoped)

| Name | Code | Type | States | Transitions | Used by | Status | Updated |
|---|---|---|---|---|---|---|---|
| DIGIT PGR Standard Workflow v2 *(locked)* | `PGR.STANDARD.V2` | Reference | 7 | 7 | 42 categories | Active | 2024-01-15 · DIGIT Platform |
| Sanitation Fast-Track | `PGR.SANITATION.FT` | Custom | 6 | 6 | 8 categories | Active | 2026-04-22 · Vikram Mehta |
| Water Supply – 2-Tier Escalation | `PGR.WATER.2TIER` | Custom | 8 | 9 | 5 categories | Active | 2026-05-30 · Vikram Mehta |
| Street Lighting (pilot) | `PGR.LIGHTING.PILOT` | Custom | 7 | 7 | 0 categories | Draft | 2026-06-08 · Harpreet Kaur |

## Behavioural details

- Clicking a row name opens the existing `/admin/workflow-config/visualization` page (passing the workflow code via search param so the visualizer can show that workflow; current visualizer already shows the standard one, so for now all rows route there).
- "Duplicate" on the locked row toasts "Cloned 'DIGIT PGR Standard Workflow v2' → draft" (no real persistence; mock UX).
- "Delete" on the locked row is disabled; tooltip explains why. On other rows it opens an alert-dialog confirm.
- Row badge for the locked workflow: small `Lock` icon + "System" pill, plus a "Reference" type tag.

## Technical changes

- **Edit** `src/routes/admin.workflow-config.index.tsx`:
  - Remove the 3-tile grid; replace with a `Panel` containing the workflows table (use existing `Panel` / table patterns from `src/components/pgr/primitives.tsx` and `src/routes/config.workflow.tsx` for visual consistency).
  - Add an in-file `WORKFLOWS` constant with the four rows above.
  - Per-row action menu via existing `DropdownMenu` (shadcn). Use `Lock`, `Eye`, `Gauge`, `ShieldCheck`, `Copy`, `Pencil`, `Trash2` icons from `lucide-react`.
  - Disabled state on Edit/Delete for `type === "Reference"` with `title` tooltip.
- **No route additions** — Visualization, SLA Maps, Role Hierarchy stay at their current child routes and are reached from row actions.
- No other files changed.

## Out of scope

- Real persistence / CRUD backend (mock only).
- Per-workflow visualizer variants (the visualizer keeps showing the standard machine for now; wiring per-workflow data can be a follow-up).
