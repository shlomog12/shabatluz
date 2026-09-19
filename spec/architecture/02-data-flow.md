# Data Flow

## Initialization (page load)

```
index.html
  → <script type="module" src="src/app.js">
    → app.js: bindEvents()          (wires every listener, before any data exists)
    → app.js: loadParashaRecords(CONFIG.CSV_FILE_PATH)
        → parashaRepository.js: fetch(csvPath)
        → csvParser.js: parseCSV(text)
        → filter/normalize → ParashaRecord[]
    → app.js: parashaRecords = [...]           (the single source of truth, in memory)
    → app.js: populateParashaSelect()           (builds <option> elements, display only)
    → settingsStore.js: loadFormFromStorage()   (restores prior choices, if any)
    → templatePanel.js: syncAllRowsVisibility()
    → (if a parasha ended up selected after restore) → generateSchedule()
```

If `fetch` fails: `app.js` catches the error and shows `#load-error` —
the rest of init (`bindEvents`) already happened, so the form still
responds if the user enters data manually.

## The regular update cycle (parasha selection / field change)

This is the cycle that repeats on every interaction — the app's core:

```
DOM event (change/input)
  → app.js: generateAndPersist()
    → app.js: getSelectedParasha()
        → parashaRecords.find(p => p.name === selectEl.value)
    → formBinding.js: readFormState()
        → reads every relevant field from the DOM per CONFIG, converts types
        → returns a clean FormState (not raw strings)
    → domain/scheduleGenerator.js: buildSchedule(parasha, form)
        → pure function, no side effects
        → returns { lines, raw }
    → utils/format.js: toWhatsAppHtml(raw)
        → HTML escaping + *bold*/_italic_/newline conversion
    → ui/preview.js: showSchedulePreview(html)
        → writes to #bubble, #btime, adds the 'visible' class to #pw
    → storage/settingsStore.js: saveFormToStorage()
        → scans every form field in the DOM, saves to localStorage
```

**Key point**: `buildSchedule` (the domain layer) doesn't know it was
called from an event listener, and writes nothing to the DOM. `app.js` is
what mediates between DOM input ↔ pure logic ↔ DOM output. Step three
(calculation) alone can run identically in Node, with no browser — that's
exactly how `tests/scheduleGenerator.test.mjs` works.

## "Copy to WhatsApp" button

```
Click on #cbtn
  → ui/preview.js: copyToClipboard(getRawText())
      getRawText() is a callback supplied by app.js, always returning
      the latest lastGeneratedMessage (not a value frozen at wiring time)
    → navigator.clipboard.writeText(raw)
    → temporary visual feedback on the button (2 seconds)
```

## Reset / clear

- **"↺ Reset labels"**: `app.js: handleResetTemplate()` →
  `templatePanel.js: resetTemplateSettings()` (writes default values to
  the DOM per `CONFIG.DEFAULTS`/`CONFIG.UNCHECKED_BY_DEFAULT`) → back to
  `app.js`, which re-runs the regular update cycle (mincha suggestion +
  generateAndPersist).
- **"Clear cache"**: `app.js: handleClearCache()` → `confirm()` → if
  confirmed: `settingsStore.js: clearStoredSettings()` →
  `location.reload()` (a full re-init, not just a DOM update).
