# לו"ז שבת – גבעת הרואה (shabatluz)

A static tool (no server/build step) that generates a weekly Shabbat
schedule message, ready to paste into WhatsApp, based on candle-lighting/
havdalah times from a CSV file. Built for the Giv'at HaRoe community — the
app's UI and generated messages are in Hebrew.

## Usage

1. Select a parasha from the list (the list and times are loaded from `shabbat_times.csv`).
2. Set the Shabbat afternoon mincha time and the weekday mincha time.
3. Optionally open "עריכת טמפלט" (edit template) to change row labels, show/hide rows, and adjust offsets/fixed times per season (summer/winter).
4. The message is generated automatically and shown in a WhatsApp-style preview; the "copy to WhatsApp" button copies it to the clipboard.
5. All settings are saved automatically to the browser's localStorage and reloaded next time.

## Project structure

| File/folder | Role |
|---|---|
| `index.html` | Page structure; loads `src/app.js` as an ES module |
| `style.css` | Styling (gold/cream color theme) |
| `shabbat_times.csv` | Candle-lighting/havdalah times per parasha (columns: `parasha,candle,havdalah,mevorchim,is_dst`) |
| `src/` | All logic, split into modules by responsibility (pure calculation / CSV / storage / DOM) — see [spec/architecture](spec/architecture/) |
| `tests/` | Pure unit tests (Node's built-in test runner, no external dependency) |
| `spec/` | Full documentation: what the app does and how the code is built |

To run the tests: `node --test tests/*.test.mjs` (Node 18+, no `npm install` needed).

## Spec docs

Full functional and architecture documentation lives under [`spec/`](spec/) — start at [spec/README.md](spec/README.md).

## Updating the yearly times

`shabbat_times.csv` is year-dependent data. It needs to be updated every Hebrew year according to the calendar and Giv'at HaRoe's actual candle-lighting/havdalah times (the `is_dst` column marks whether the Shabbat falls in DST, `mevorchim` whether it's Shabbat Mevorchim). Full details: [spec/functional/02-template-editing-and-persistence.md](spec/functional/02-template-editing-and-persistence.md).

## Deployment

Pure static site, native ES modules — the whole project folder can be deployed as-is to any static hosting service (Netlify, GitHub Pages, etc.).
