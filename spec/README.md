# Spec — Shabbat Schedule Generator (shabatluz)

Full documentation of the app: **what** it does (functional spec) and
**how** the code is built (architecture spec). These documents describe
the actual state of the code (`src/`) — the architecture documented here
is **already fully implemented**, not a future plan.

## Structure

### [`functional/`](functional/) — what the app does
A complete behavior spec, independent of the actual implementation.

| File | Content |
|---|---|
| [00-overview.md](functional/00-overview.md) | App purpose, target audience, constraints, deployment |
| [01-schedule-generation-rules.md](functional/01-schedule-generation-rules.md) | Calculation rules for every line in the schedule message |
| [02-template-editing-and-persistence.md](functional/02-template-editing-and-persistence.md) | The "edit template" panel, save/reset, parasha data source |

### [`architecture/`](architecture/) — how the code is built
The actual ES-module structure, no server/build step, following SOLID principles.

| File | Content |
|---|---|
| [00-principles-and-structure.md](architecture/00-principles-and-structure.md) | SOLID principles as they apply to this code, and the folder structure |
| [01-module-responsibilities.md](architecture/01-module-responsibilities.md) | Each module's responsibility, public API, and dependencies |
| [02-data-flow.md](architecture/02-data-flow.md) | Data flow from the CSV to the displayed WhatsApp message |

## How to read this

- The functional spec is the **source of truth** for behavior — if the
  code and this document contradict each other, one of them needs to be
  updated (figure out which one is correct).
- The architecture spec documents **deliberate choices**, each with the
  rationale behind it, so it can be knowingly challenged later.
- The app's UI, generated messages, and data (`shabbat_times.csv`,
  default labels in `src/config.js`) are all in Hebrew — that's the
  audience the app serves. The code, comments, and these spec docs are in
  English, matching the convention used in the sibling `calanderApp`
  project.
