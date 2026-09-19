# Overview

## What this app is

A static tool (no server, no build step) for the person responsible for
prayer/event scheduling in the Giv'at HaRoe community. Its sole purpose:
save the recurring weekly typing of the WhatsApp Shabbat schedule message
— the admin picks a parasha and enters a mincha time, and the app
generates a ready-to-copy message, formatted with WhatsApp's emphasis
syntax (`*bold*`, `_italic_`).

## Target audience

A single user, or a small number of admins — not a broad audience. The
app requires no login/authorization — anyone with the link can edit the
template and generate messages. This is a deliberate constraint (see
[02](02-template-editing-and-persistence.md)), not a security hole:
there's no sensitive data, and no server-side to attack.

## Basic usage flow

1. Open the site. The parasha list loads automatically from a CSV file.
2. Select a parasha from the list.
3. The weekday mincha time is suggested automatically (based on the
   parasha's candle-lighting time); the Shabbat afternoon mincha time is
   entered manually (or restored from last time).
4. The message regenerates automatically on every change, shown in a
   WhatsApp-bubble-style preview.
5. Click "copy to WhatsApp" and paste into the group.

One-off changes (e.g. moving this week's women's shiur to a different
time) are made through the "edit template" panel, collapsed by default —
see [02](02-template-editing-and-persistence.md).

## Constraints and deliberate choices

- **No server, no build step**: static HTML/CSS/JS only, loaded directly
  by the browser (native ES modules, `<script type="module">`). The
  folder can be deployed as-is to any static hosting service.
- **No database**: the only data source is `shabbat_times.csv`, loaded
  once per page load. User preferences (the template) are saved only in
  the browser's `localStorage` — not synced across devices.
- **Year-dependent**: the CSV file contains times specific to a given
  Hebrew year, and needs to be updated every year (see
  [02](02-template-editing-and-persistence.md)).

## Deployment

Pure static site — the whole project folder is deployed as-is to any
static hosting service (Netlify, GitHub Pages, etc.). No environment
variables, no secrets.
