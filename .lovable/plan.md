## Goal

Introduce a new role `TEST_USER` ("Test User") cloned from GRO, and restrict the dashboard customization features to it. All other roles see the original static dashboard (no X buttons, no Add KPI button, no reorder handles).

## Changes

### 1. New role — `src/lib/rbac.tsx`
- Add `TEST_USER` to the `Role` union.
- Add `TEST_USER` entry to `ROLE_PERMISSIONS`, cloning GRO's permissions.
- Add `ROLE_LABEL.TEST_USER = "Test User"`.
- Add a demo user name in `roleUser()` (e.g. `"Test User"`).

### 2. Login dropdown — `src/routes/login.tsx`
The dropdown already iterates `Object.keys(ROLE_LABEL)`, so the new role appears automatically. No change needed beyond verifying.

### 3. Users roster — `src/routes/users.tsx`
Add one demo row for the Test User so the role shows up in the HRMS list.

### 4. Dashboard scoping — `src/routes/dashboard.tsx`
Gate all customization on `role === "TEST_USER"`:
- `const canCustomize = role === "TEST_USER"`.
- Render the **Add KPI** popover only when `canCustomize`.
- Pass `onRemove` to `StatCard` only when `canCustomize` (so the X button is not shown for other roles — `StatCard` already hides it when `onRemove` is undefined? if not, the cross will be conditional via prop).
- For non-`TEST_USER` roles, render the original full default KPI list and skip the `visibleKpiIds` state-driven filtering (i.e. always show all defaults, no removability).

### 5. Reordering (new) — Test User only
Add drag-to-reorder on the KPI grid for `TEST_USER`:
- Use native HTML5 drag-and-drop (no new dependency): `draggable`, `onDragStart`, `onDragOver`, `onDrop` on each `StatCard` wrapper.
- Maintain order in the existing `visibleKpiIds` state; reorder updates the array.
- Show a subtle grip cursor (`cursor-move`) on KPI cards only when `canCustomize`.
- Resets on every dashboard open (state already initializes from defaults on mount — preserved).

### Out of scope
- No changes to other pages, permissions, or non-TEST_USER role behavior.
- No backend or persistence — order/visibility reset on remount (matches existing behavior).

## How to demo
Sign out → sign in selecting **Test User** from the role dropdown → land on `/dashboard` → see X buttons on each KPI, the Add KPI button, and drag-to-reorder. Sign in as any other role → dashboard is the original static version.
