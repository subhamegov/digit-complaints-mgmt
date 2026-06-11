## Scope (Test User only)

Only the Test User role sees these changes (`role === "TEST_USER"`). All other roles keep the current dashboard untouched. No restructuring, no section headings — the dashboard keeps its current widget layout and ordering. Reuse existing components and tokens (StatCard, Panel, DataTable, Tabs, recharts, current chart colors).

## 1. One coherent seed dataset

New file `src/lib/test-user-seed.ts`:

- ~60 deterministic complaints (seeded RNG so numbers are stable).
- Distributed across:
  - Wards: **Heritage City, Financial District, Town Square, East Village**
  - Departments + complaint types: existing `COMPLAINT_TYPES` catalog.
  - Officers: **Ramesh, Gurmeet, Mohan, Surinder, Baljeet, Pritam** (reuse existing IDs).
  - Channels: Mobile App, Web, Call, Counter, WhatsApp.
  - Workflow stages: Pending Assignment → Assigned → Pending Resolution → Resolved/Closed, plus Reopened and Rejected.
  - SLA states: within, nearing, breached-open, resolved-within, resolved-late.
  - Ages: spread <1d / 1–3d / 3–7d / >7d (drives the new age widget).
- Each row carries per-stage dwell hours, reassignment count, and a 1–5 CSAT on resolved rows — so satisfaction, per-stage timings, and churn all reconcile from the same rows.

`DashboardPage` swaps `COMPLAINTS` → `TEST_USER_COMPLAINTS` only when `canCustomize`. Geography filter options become the four new ward names for Test User.

## 2. Widget changes (in place; same layout, same order)

Stat cards (KPI_REGISTRY) — modify/add, no reordering of existing tiles:

- **On-time resolution rate** (new, replaces the existing `resolution-rate` 13.3% card in the same slot). Formula: `resolvedWithinSLA / (resolvedWithinSLA + openPastSLA)`. Sub-stats inside the card (uses `delta` line, two short stats): "Breached open: N · At-risk 24–48h: N". Normal card size.
- **Median resolution time** (new card).
- **Escalation rate %** (new card) = escalated / total.
- **Reopen rate %** — update existing reopen card's formula to `reopened / resolved`.
- **Citizen satisfaction** (new card) — mean CSAT across resolved-with-CSAT rows.
- **Complaints resolved per day** (new card) = resolved / days in selected period (defaults to 7).
- **Oldest open age** (new card) — age of the oldest currently-open complaint, `Xd Yh`.
- Keep: total, open, resolved, avg first response, trending top 5.

Panels — modify in place, do not duplicate:

- **Resolution rate by complaint type** (`resolution-by-type`): add **On-time %** column.
- **By locality / wards**: add **On-time %** column alongside the existing logged count + bar.
- **Open complaints by employee** (`open-by-employee`): add **Reassignment churn** column.
- **Average time per workflow stage** (new panel `stage-timings`): one row per PGR state (Pending Assignment, Assigned, Pending Resolution, Resolved) with avg dwell, median dwell, sample count; bottleneck row highlighted.
- **Complaint type & subtype by status** (new panel `type-status-crosstab`): type/subtype rows × status columns + total.
- **Complaints by age** (new panel `by-age`): bar chart with <1d / 1–3d / 3–7d / >7d buckets.
- **SLA at risk** (`sla` panel) for Test User: default sort by time-to-breach ascending.

Kept as-is (driven by the new dataset, so numbers reconcile): by-type, by-subtype, by-channel, by-geography, by-status, by-sla, time-of-day, day-of-week, complaints logged over time, trending locations, complaint map.

## 3. Data integrity rules

- Every widget — including citizen satisfaction and per-stage timings — reads from the same `TEST_USER_COMPLAINTS` array, so totals reconcile across the dashboard.
- No empty states, no "—" cells, no zero-only breakdowns: seed guarantees ≥1 row per ward, department, channel, status, age bucket, and stage.

## Files touched

- `src/lib/test-user-seed.ts` (new)
- `src/routes/dashboard.tsx` (Test-User-gated data swap, formula updates, in-place column additions, three new panels registered into the existing default list at sensible positions without removing or reordering other tiles)

No changes to navigation, other routes, or design tokens.
