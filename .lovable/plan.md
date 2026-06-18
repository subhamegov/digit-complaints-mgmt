## Goal

Replace the placeholder at `/admin/complaints-config` with a functional configuration workspace covering the five areas implied by the page subtitle. All data stays in-memory (mock) for v1, and every user-facing label is editable per locale inline.

## Layout

```text
Complaints
─────────────────────────────────────────────────────
[Locale: EN ▾]  [Search…]              [+ New]  [Export]
─────────────────────────────────────────────────────
Tabs: Categories │ Priorities │ Statuses │ Resolution codes │ Custom attributes
─────────────────────────────────────────────────────
<active tab content>
```

- Header: locale switcher (EN / HI / KN — matches existing localization options), global search, primary action button (contextual to active tab), and Export (JSON download of the current config).
- Tabs preserve query-string state (`?tab=categories`).
- Right-side drawer for create/edit forms (consistent with other admin screens in the project).
- Empty states with a "Seed sample data" affordance.

## Tab content

### 1. Categories & Subcategories
- Two-pane layout: left = category tree (drag-to-reorder, expand/collapse, enable/disable toggle); right = detail panel for the selected node.
- Detail panel fields: code (slug, immutable after create), label (per-locale), description (per-locale), default priority, default SLA hours, owning department, active flag.
- Subcategories inherit defaults from parent unless overridden.
- Inline link: "Edit workflow for this category →" deep-links to `admin.workflow-config`.

### 2. Priorities
- Sortable table: order, code, label (per-locale), color swatch, weight (numeric), default flag.
- One row can be marked default; toggling another clears the prior default.

### 3. Statuses
- Sortable table: code, label (per-locale), category (Open / In progress / Resolved / Closed / Rejected), color, terminal flag.
- Read-only banner: "Lifecycle transitions are defined in Workflow Config" with a link.

### 4. Resolution codes
- Table: code, label (per-locale), description (per-locale), applicable statuses (multi-select), applicable categories (multi-select, optional — empty = all), active flag.

### 5. Custom attributes
- Table: code, label (per-locale), type (text / number / select / multiselect / date / boolean / file), required, visibility (channels: web/mobile/CSR; roles: citizen/agent/supervisor), validation (min/max/length/regex depending on type), options editor for select types (each option label per-locale), applies-to-categories (multi-select, empty = all).

## Multilingual editing

- Locale switcher in the header sets the "active editing locale" — all label inputs in the page show that locale's value.
- Every label field has a small `EN · HI · KN` indicator chip showing which locales have a value; missing locales render as a warning dot.
- A "Translate all" link on each row opens a small modal with one input per configured locale.

## Data layer (in-memory)

- New module `src/lib/complaints-config-store.ts`:
  - Types: `Category`, `Priority`, `Status`, `ResolutionCode`, `CustomAttribute`, `LocalizedString = Record<LocaleCode, string>`.
  - Seed data covering ~6 categories, ~15 subcategories, 4 priorities, 6 statuses, 8 resolution codes, 4 custom attributes — aligned with the seed data already used elsewhere (e.g. `test-user-seed.ts`, dashboard).
  - Zustand store (project already uses it) exposing CRUD actions and selectors; persisted to `sessionStorage` so edits survive route changes within a session but reset on reload — matches the "demo" intent.
- Validation via `zod` schemas per entity (code regex, label non-empty for the default locale, numeric ranges).

## Files

- Edit: `src/routes/admin.complaints-config.tsx` — replace `BlankAdminPage` with the new screen, wired through the existing `AdminLayout`.
- New: `src/components/admin/complaints-config/` — `index.tsx` (shell + tabs), `CategoriesTab.tsx`, `PrioritiesTab.tsx`, `StatusesTab.tsx`, `ResolutionCodesTab.tsx`, `CustomAttributesTab.tsx`, `LocalizedInput.tsx`, `EntityDrawer.tsx`.
- New: `src/lib/complaints-config-store.ts` — types, seed, zustand store, zod schemas.

## Out of scope (v1)

- Server persistence / Lovable Cloud wiring.
- Wiring custom attributes into the actual complaint intake form.
- Bulk import (CSV) — Export only.
- Audit log of config changes.
