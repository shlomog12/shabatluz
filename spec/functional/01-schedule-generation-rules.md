# Schedule Message Generation Rules

This document records the calculation and assembly rules for the
schedule message, independent of implementation (actual implementation:
`src/domain/scheduleGenerator.js`). All times are computed as
minutes-since-midnight (0–1439) and converted back to an "HH:MM" string
at the end.

## Input

- **Parasha record** (one row of the CSV file): name, candle-lighting
  time (`candle`), havdalah time (`havdalah`, may be missing), whether
  it's Shabbat Mevorchim (`mevorchim`), whether it's DST (`isDst`).
- **Current form state**: every value entered/set by the user — Shabbat
  afternoon mincha time, weekday mincha time, and every field in the
  "edit template" panel (offsets in minutes, fixed times, labels, and
  "show row" checkboxes).

## Friday evening

| Line | Calculation |
|---|---|
| Candle lighting | Directly from the record. Also shows an estimated Tel Aviv time: candle-lighting time **+5 minutes** (an approximation based on estimated geographic distance; not a halachic source) |
| Shir HaShirim | (Kabbalat Shabbat time) minus the "minutes before kabbalat shabbat" offset |
| Mincha & Kabbalat Shabbat | Candle-lighting time + "minutes after candle-lighting" offset, **rounded up** to a multiple of 5 minutes. If it's Shabbat Mevorchim, the label "(קרליבך)" ("Carlebach") is appended |
| Sunset | Candle-lighting time + "minutes after candle-lighting" offset (a separate field, default 30) |

## Shabbat Morning — Season-Dependent

Every line below is set from a **fixed** field (not derived from
candle-lighting time), based on the parasha's `isDst` flag: summer →
`...-s` field, winter → `...-w` field.

| Line | Calculation |
|---|---|
| Chavura (Ein Ayah) | Fixed time (summer/winter) |
| Shacharit | Fixed time (summer/winter) |
| Children's tefillah | Shacharit time **+90 minutes**, fixed |
| Mincha Gedola | Fixed time (summer/winter) |
| Women's shiur | One fixed time (not season-dependent) |

## Afternoon — Relative to Shabbat Afternoon Mincha

Every line below is the Shabbat afternoon mincha time (as entered by the
user) **minus** an offset in minutes:

| Line | Offset |
|---|---|
| Weekly parasha study group | "minutes before mincha" (default 60) |
| Children's oneg shabbat | "minutes before mincha" (default 35). If "with a parent/adult" (sub-row) is checked, that label is appended in parentheses |
| Parent-and-child study | "minutes before mincha" (default 20) |

## Arvit and Havdalah

Based on the parasha's havdalah time. **If havdalah is missing** (e.g. a
Yom Tov falling on Shabbat, with no separate havdalah time) — both lines
(arvit, havdalah) are **omitted entirely** from the message, rather than
showing an incorrect time (00:00).

- **Havdalah ("צאת שבת")**: the havdalah time, unchanged.
- **Arvit**: havdalah time + "change relative to havdalah" (can be
  negative), then rounded per the "round arvit time" setting: no
  rounding / round up to a multiple of 5 / round down to a multiple of 5.

## Weekday Mincha — Auto-Suggestion

The weekday mincha time (`mincha-week`) is **suggested automatically**
whenever a parasha is selected (and can always be manually overridden):

1. Estimated sunset = candle-lighting time **+30 minutes** (a rough
   approximation — not for precise halachic calculation, just a
   convenient default the admin can correct).
2. Suggested mincha time = estimated sunset minus "minutes before
   sunset" (default 20), rounded to the nearest multiple of 5 minutes.

In the "midweek prayers" block of the message itself, the mincha time
shown is whatever is actually in the `mincha-week` field (including any
manual override), not a freshly recomputed value.

## Midweek Prayers (Sun–Thu, Friday)

A separate block, shown only if midweek "shacharit" and/or "arvit" are
checked to display. Fixed times only, except the "mincha" line which
shows the current `mincha-week` value.

## Full Message Structure (fixed order)

1. Header: `*לו"ז שבת <parasha>*`
2. Candle-lighting line (+ Tel Aviv)
3. Shir HaShirim / Kabbalat Shabbat / Sunset (each conditional on its "show" checkbox)
4. Chavura / Shacharit / Children's tefillah
5. Mincha Gedola
6. Women's shiur / Study group / Children's oneg shabbat / Parent-and-child study
7. Shabbat afternoon mincha (always shown, cannot be hidden)
8. Arvit + Havdalah (only if a havdalah time exists)
9. Midweek prayers block (only if midweek shacharit/arvit are checked)
10. "שבת שלום!" ("Shabbat Shalom!")

Every line (except the fixed headers) is conditional on its matching
"show row" checkbox in the "edit template" panel — see
[02-template-editing-and-persistence.md](02-template-editing-and-persistence.md).
