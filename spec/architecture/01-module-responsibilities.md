# Module Responsibilities

For each module: responsibility, public API (what it exports), and
dependencies (what it imports). Modules under `domain/` and `utils/` have
no dependency on the DOM at all.

## `src/config.js`

**Responsibility**: single configuration constants — cache key, CSV
path, default values, list of template rows, list of numeric fields.
**Exports**: `CONFIG`.
**Dependencies**: none.

## `src/utils/time.js`

**Responsibility**: conversions between "HH:MM" and minutes-since-
midnight, and back (with correct wraparound past midnight), and
rounding to a multiple of 5.
**Exports**: `toM(str)`, `frM(minutes)`, `r5(minutes)`.
**Dependencies**: none.

## `src/utils/format.js`

**Responsibility**: HTML escaping, and converting light Markdown syntax
(WhatsApp-style) to display HTML.
**Exports**: `escapeHtml(str)`, `toWhatsAppHtml(text)`.
**Dependencies**: none.
**Security note**: `toWhatsAppHtml` **always** escapes HTML before
applying the Markdown syntax - so free text entered by the user (label
fields) can't inject tags/script into the preview (`innerHTML`).

## `src/csv/csvParser.js`

**Responsibility**: general-purpose CSV parsing, not tied to a specific
schema. Supports commas inside a quoted field and double quotes (`""`)
as an escaped single quote.
**Exports**: `splitCSVLine(line)`, `parseCSV(text)`.
**Dependencies**: none.

## `src/csv/parashaRepository.js`

**Responsibility**: loading the CSV file (`fetch`) and converting it into
a list of valid `ParashaRecord` entries (rows missing a name/candle time
are filtered out, `mevorchim`/`isDst` flags normalized to boolean).
**Exports**: `loadParashaRecords(csvPath): Promise<ParashaRecord[]>`.
**Dependencies**: `csvParser.js`. Uses the global `fetch` — the only
place in this module that touches "the outside world."

## `src/domain/scheduleGenerator.js`

**Responsibility**: every calculation and assembly rule for the schedule
message (see
[functional/01](../functional/01-schedule-generation-rules.md)). A pure
function: same input → same output, always, with no DOM.
**Exports**: `buildSchedule(parasha, form): {lines, raw}`.
**Dependencies**: `utils/time.js`.

## `src/domain/minchaSuggestion.js`

**Responsibility**: computing the suggested weekday mincha time from the
candle-lighting time. Pure function.
**Exports**: `suggestWeekdayMincha(candleTime, minutesBeforeSunset): string`.
**Dependencies**: `utils/time.js`.

## `src/storage/settingsStore.js`

**Responsibility**: generic save/restore/clear of every form field in
`localStorage`. Doesn't decide **when** to save/clear (a UI decision) -
only **how**.
**Exports**: `saveFormToStorage()`, `loadFormFromStorage(): boolean`,
`clearStoredSettings()`.
**Dependencies**: `config.js` (the cache key). Touches the DOM (scans
`input`/`select` elements on the page) and `localStorage`.

## `src/ui/formBinding.js`

**Responsibility**: the single boundary between the DOM and the clean
`FormState` used by the domain layer - numeric fields already converted
to numbers (0 if empty/invalid), checkboxes already converted to
booleans.
**Exports**: `readFormState(): FormState`.
**Dependencies**: `config.js` (field list and numeric field list).
Touches the DOM.

## `src/ui/templatePanel.js`

**Responsibility**: opening/closing the settings panel, syncing a row's
appearance to its checkbox state, and resetting template fields to their
defaults.
**Exports**: `syncRowVisibility(rowId, checkboxId)`,
`syncAllRowsVisibility()`, `toggleSettingsPanel()`,
`resetTemplateSettings()`.
**Dependencies**: `config.js`. Touches the DOM.

## `src/ui/preview.js`

**Responsibility**: showing pre-built HTML in the preview bubble, and
wiring up the copy button (including temporary visual feedback). Does
**not** build the HTML itself - receives it ready-made from
`utils/format.js` via `app.js`.
**Exports**: `showSchedulePreview(html)`, `wireCopyButton(getRawText)`.
**Dependencies**: none (receives a callback, not directly coupled to the
domain layer). Touches the DOM and `navigator.clipboard`.

## `src/app.js`

**Responsibility**: the single entry point that knows about all the
layers together. Holds the loaded parasha data (`parashaRecords`) as the
source of truth, wires up events, and orchestrates the flow: parasha
selection → read form state → pure calculation → display + save. Contains
no calculation or parsing logic of its own - only calls into the other
layers.
**Dependencies**: every other module.
