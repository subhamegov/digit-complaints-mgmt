# Align landing page with sidebar's blue theme

The sidebar uses navy `#0B1F3A`, active blue `#2563EB`, muted text `#CBD5E1`/`#93A4BC`, on Inter. The landing page currently uses a dark teal-green chrome and teal primary. I'll re-tone the landing to match exactly, without touching sidebar or other admin/PGR chrome.

## Changes to `src/styles.css`

Update the semantic tokens that the landing page consumes so `bg-chrome`, `bg-primary`, and related surfaces render as the sidebar's navy/blue palette:

- `--chrome` → navy `#0B1F3A` (oklch equivalent), `--chrome-foreground` → white, `--chrome-muted` → `#93A4BC`.
- `--primary` → blue `#2563EB`, `--primary-foreground` → white, `--ring` → `#2563EB`.
- Keep font stack (`Inter`) as-is — already matches.

Because `bg-chrome`/`bg-primary` are also used inside the app shell top bars and buttons, this retheme is intentionally global: it unifies the whole product around one blue palette (the sidebar palette). Status/chart tokens stay unchanged.

## Changes to `src/routes/index.tsx`

- The nav logo tile currently uses `bg-primary` (teal) — after the token swap it becomes the blue `#2563EB`, matching the sign-in button and CTA.
- No structural changes; only verifying the hero, CTA, feature cards, and footer read cleanly on the new navy background.

## Out of scope

- Sidebar components (`Shell.tsx`, `AdminLayout.tsx`) — already on the target palette, no edits.
- Login page — already blue.
- Dashboards, charts, status badges — untouched.
