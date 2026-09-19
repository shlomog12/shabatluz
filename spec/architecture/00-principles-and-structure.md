# Principles and Folder Structure

## Pre-refactor state

All the logic — configuration, CSV loading, time calculation, message
building, cache saving, and event handling — lived in a single
`index.js` file (about 370 lines), with additional global configuration
in `config.js`. Typical symptoms:

- **Parasha data embedded in the DOM**: candle-lighting/havdalah/
  mevorchim/DST were stored as `dataset` attributes on `<option>`
  elements in the dropdown — the DOM served as the data source, not just
  the display.
- **One giant `gen()` function** that read directly from the DOM
  (`val()`, `chk()`, `numVal()`), computed every time, built the message
  string, **and also** wrote back to the DOM (the preview) — several
  different reasons to change, mixed into one function.
- **Every event wired inline in HTML** (`onclick`, `onchange`,
  `oninput`) — about 35 occurrences, with no single place to see what
  the app was actually listening for.
- **No separation between pure logic and browser-dependent code** —
  there was no way to test the calculation rules (e.g. "what happens
  when havdalah is missing") without a real DOM.

## SRP — Single Responsibility Principle

Every module under `src/` is responsible for one thing:

- `domain/scheduleGenerator.js` — **only** pure calculation: parasha +
  form state → array of lines. Doesn't touch the DOM at all.
- `csv/parashaRepository.js` — **only** loading and parsing parasha data.
- `storage/settingsStore.js` — **only** syncing the form ↔ `localStorage`.
- `ui/formBinding.js` — **only** the boundary between the DOM and a
  clean `FormState` object (types already converted, not raw strings).
- `ui/preview.js`, `ui/templatePanel.js` — **only** specific DOM updates
  (preview, settings panel appearance).
- `app.js` — **only** orchestration: connects all the layers, contains
  no calculation or parsing logic itself.

The central change compared to the old code: derived times are **no
longer stored in the DOM**. `app.js` holds a `parashaRecords` array (the
single in-memory source of truth), and each `<option>` in the dropdown
holds only `value`/`textContent` — display only.

## OCP — Open/Closed Principle

Adding a new template row (say, "kiddush") doesn't require touching the
logic code: add a `[row-id, checkbox-id]` pair to `CONFIG.ALL_ROWS`, a
default to `CONFIG.DEFAULTS`, and the matching fields in `index.html` —
`resetTemplateSettings`, `syncAllRowsVisibility`, `readFormState`, and
`saveFormToStorage` already operate generically off of `CONFIG`, with no
extra `if` needed.

## DIP — Dependency Inversion Principle

`domain/scheduleGenerator.js` and `domain/minchaSuggestion.js` receive
data as parameters (`ParashaRecord`, `FormState`) and return data — they
**don't know** what `document`, `fetch`, or `localStorage` are. The UI
layer (`app.js`) depends on the domain layer, not the other way around.
Practical benefit: every calculation rule is tested under `tests/` with
no browser/DOM at all (see `tests/scheduleGenerator.test.mjs`).

## ISP — Interface Segregation Principle

There's no single "god module" that knows everything. `ui/preview.js`
knows nothing about `localStorage`; `storage/settingsStore.js` knows
nothing about what a WhatsApp message looks like. Every consumer imports
only what it actually needs.

## What **doesn't** change: "no server"

None of the above requires a server, database, or build tool. The
structure uses native ES modules (`<script type="module">`) loaded
directly by the browser — deployment stays: copy the folder to any
static host.

## Folder structure

```
shabatluz/
├── index.html              Entry point; loads src/app.js as a module
├── style.css
├── shabbat_times.csv        Parasha data source (year-dependent)
├── site.webmanifest, favicon*, apple-touch-icon*, android-chrome-*
├── src/
│   ├── app.js                 Logic entry point: wires all the layers together
│   ├── config.js               CONFIG: keys, defaults, list of template rows
│   ├── utils/
│   │   ├── time.js              toM / frM / r5 - pure time conversions
│   │   └── format.js             escapeHtml / toWhatsAppHtml - text -> safe HTML
│   ├── csv/
│   │   ├── csvParser.js          General CSV parser (splitCSVLine, parseCSV)
│   │   └── parashaRepository.js  Loads the parasha file -> ParashaRecord[]
│   ├── domain/
│   │   ├── scheduleGenerator.js   Schedule message calculation (pure, no DOM)
│   │   └── minchaSuggestion.js     Weekday mincha suggestion (pure, no DOM)
│   ├── storage/
│   │   └── settingsStore.js        Save/restore/clear localStorage
│   └── ui/
│       ├── formBinding.js           DOM -> FormState (types converted)
│       ├── templatePanel.js          Open/close, row sync, reset
│       └── preview.js                 Preview display, copy button
├── tests/                    Pure unit tests (Node's built-in test runner, no dependency)
│   ├── time.test.mjs
│   ├── format.test.mjs
│   ├── csvParser.test.mjs
│   ├── scheduleGenerator.test.mjs
│   └── minchaSuggestion.test.mjs
└── spec/                     These documents
```

Running the tests: `node --test tests/*.test.mjs` (Node 18+, no `npm install`).
