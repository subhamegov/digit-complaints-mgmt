## Goal

Treat every box on the TEST_USER dashboard — stat cards (Total, Open, Resolved, Breached) and chart boxes (Complaints Filed vs Resolved, By Locality, By Department, Recent, SLA, etc.) — as a single concept called a **KPI**. One flat grid, one picker, one drag/remove model.

Scope: TEST_USER role only. All other roles keep their current static dashboard untouched.

## Changes (all in `src/routes/dashboard.tsx`)

1. **Collapse the two concepts into one registry**
   - Replace the separate `KPI_*` and `panelDefs` / `PANEL_LABELS` structures with a single `KPI_REGISTRY` keyed by id. Each entry: `{ id, label, description, size: "stat" | "chart-sm" | "chart-lg", render() }`.
   - Stat entries (`total`, `open`, `resolved`, `breached`) take 1 column. Chart entries take 2 or 3 columns via `col-span-*`.

2. **Single flat 3-column grid**
   - Remove the "Overview" wrapper panel and the panel/KPI split.
   - One `visibleKpiIds: string[]` state drives a single `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` grid.
   - Each tile uses the same card primitive with a top-right ✕ remove button and is draggable for reordering. Reorder uses the existing drag handler pattern (one set of handlers, not two).

3. **Unified "Add KPI" picker**
   - One button + popover listing every KPI not currently visible (both stats and charts), each with its `label` + `description` + a small preview thumbnail (reuse the render function at reduced scale, or a static mini preview).
   - Clicking adds the id to `visibleKpiIds` and closes the popover.

4. **Filters bar** — unchanged (date range, ward, complaint type) stays above the grid, TEST_USER only.

5. **Gating** — keep `canCustomize = role === "TEST_USER"`. Non-TEST_USER roles render the original static layout exactly as today.

6. **Cleanup**
   - Delete `DEFAULT_PANEL_IDS`, `ALL_PANEL_IDS`, `PANEL_LABELS`, `panelDefs`, `panelDragId`, `panelPickerOpen`, `addPanel`, `removePanel`, `handlePanelDrop`, and the second "Add panel" button.
   - Default `visibleKpiIds` for TEST_USER = `["total", "open", "resolved", "breached", "trend", "wards"]` (or current default set), all flowing in one grid.

## Out of scope
- No changes to other roles, no backend changes, no new KPI content — just unifying the model and UI for existing boxes.

## Result
One mental model: every box is a KPI. One Add button, one remove ✕, one drag-to-reorder, one flat grid.
