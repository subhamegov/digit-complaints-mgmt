# Complaint Management SaaS

Build a high-fidelity clickable prototype in Lovable.

Role:

Act as a senior product designer, mature product manager, and front-end prototyper familiar with government-grade digital public infrastructure products.

Design Language:

Follow the visual language from the uploaded reference screenshots. Do not invent a new style. Replicate the observed patterns for layout, spacing, typography, navigation, cards, forms, tables, charts, filters, status badges, icons, and page hierarchy.

Product Feel:

The prototype must feel clean, calm, structured, credible, operational, and government-grade. Avoid consumer-app styling, excessive gradients, playful illustrations, unnecessary animations, decorative UI, and visual noise.

Core UX Rules:

1. Prioritize clarity, hierarchy, and scanability.

2. Use dense but readable desktop-first layouts.

3. Use cards, tables, filters, status indicators, and summary panels consistently.

4. Every screen must have a clear primary user action.

5. Every data view must include meaningful filters, status cues, and summary information where relevant.

6. Use realistic government/public-service data. Do not use lorem ipsum.

7. Make status, ownership, next action, and accountability visible.

8. Use charts only where they support operational decisions.

Component Rules:

Build using reusable components with clear boundaries. Name components clearly so they can later support RBAC, localization, workflow-state logic, tenant configuration, audit behaviour, PII masking, and feature flags.

Component-Level RBAC Readiness:

Design every major UI element as permission-aware:

- Navigation items

- Cards

- Buttons

- Filters

- Tabs

- Forms

- Tables

- Table columns

- Charts

- Bulk actions

- Approval controls

- Citizen detail sections

- Configuration panels

Do not hard-code access assumptions. Components should be capable of being shown, hidden, disabled, or made read-only in the future based on role, department, jurisdiction, tenant, workflow state, permission level, data sensitivity, or assignment status.

Localization Readiness:

Every visible label, field name, button, status, tooltip, helper text, validation message, table column, navigation item, and empty-state message must be written as if it will later map to the DIGIT localization service.

Label rules:

1. Keep labels short and unambiguous.

2. Use consistent terminology across screens.

3. Avoid hard-coded sentence fragments.

4. Avoid casual or decorative copy.

5. Prefer reusable action labels: Submit, Save, Cancel, Approve, Reject, Assign, Reassign, Escalate, Download, Upload, View Details, Edit, Search, Filter, Reset, Close, Reopen, Add Comment, Update Status.

Use consistent terms:

- Complaint Status

- Ward

- Assigned Officer

- SLA Status

- Citizen Details

- Mobile Number

- View Details

Future DIGIT localization examples:

- Complaint Status = CS_COMPLAINT_STATUS

- Assign Officer = CS_ACTION_ASSIGN_OFFICER

- Ward = COMMON_WARD

- Mobile Number = COMMON_MOBILE_NUMBER

- View Details = COMMON_VIEW_DETAILS

Output:

Create a working, demo-ready prototype that is visually consistent with the reference screenshots, structured for future engineering handoff, ready for component-level RBAC, and ready for future DIGIT localization integration.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://digit-complaints-mgmt.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c94a8e68-f48f-43f4-8f4f-60fcedd0cd15).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `complaints-prototype` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
