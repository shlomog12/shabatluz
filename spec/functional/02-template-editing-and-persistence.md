# Template Editing, Persistence, and the Parasha Data Source

## The "edit template" panel

Collapsed by default (opened/closed by clicking the matching button).
Contains a row for every possible message component, grouped by part of
Shabbat (Friday evening / morning / afternoon / other settings / midweek
— see [01-schedule-generation-rules.md](01-schedule-generation-rules.md)).

Each row includes some or all of the following:

- **"Show row" checkbox**: whether the row appears in the generated
  message. Turning it off also changes the row's visual appearance in
  the panel (reduced opacity, `disabled` class) as a visual indicator.
- **Editable label** (free-text field): the text shown in the message
  itself — e.g. can be changed from "חבורא בעין איה" to a different
  speaker's name for this week.
- **Time controls**: a fixed time field, or a numeric field (an offset
  in minutes from another time).

Every field change **regenerates the message immediately** (no separate
"confirm" button) and auto-saves to `localStorage`.

## Reset and clear

Two separate buttons at the top of the settings panel, deliberately
different in meaning:

- **"↺ Reset labels"**: restores every field (labels, offsets, fixed
  times, "show" checkboxes) to its default value **in memory only** —
  does not delete the saved cache, and does not reload the page. The
  selection itself (chosen parasha, mincha times) is **not** reset.
- **"Clear cache and reset all"**: asks the user for confirmation
  (`confirm`), then fully deletes the saved cache in `localStorage` and
  reloads the page — a complete return to the default state, including
  the parasha selection.

## Auto-save (`localStorage`)

Every form field (including the selected parasha and mincha times, not
just template fields) is saved under one fixed key
(`givat_haroe_schedule_v1`), as a JSON object mapping field id to its
value. On every page load, if a saved cache exists — it's restored before
the first message is generated, so the admin returns to exactly the
state they left last time (including any customized labels).

**Important for maintenance**: saving is generic (scans every
`input`/`select` element on the page), not an explicit field list —
adding a new form field is saved and restored automatically, with no
change needed to the saving code.

## Parasha data source (`shabbat_times.csv`)

Columns: `parasha,candle,havdalah,mevorchim,is_dst`.

- `parasha` and `candle` are **required** — a row missing either is
  silently skipped and won't appear in the list.
- `havdalah` can be **empty** (e.g. a Yom Tov falling on Shabbat) — see
  how the arvit/havdalah lines are handled in
  [01](01-schedule-generation-rules.md).
- `mevorchim` and `is_dst`: `1`/`true` (case-insensitive) = yes, any
  other value (including empty) = no.

The file is **year-dependent** and needs to be updated every Hebrew year,
based on the calendar and Giv'at HaRoe's actual candle-lighting/havdalah
times. Updating the file alone (no code change) is enough to fully
refresh the parasha list for the following year.

## Loading and error handling

On every page load: the file is fetched and parsed, and the parasha
dropdown is rebuilt entirely from the file's data (there's no "hardcoded"
list backed into the code). If loading fails (missing file, network
error) — a visible error message is shown to the user above the form,
rather than leaving just an empty dropdown with no explanation.
