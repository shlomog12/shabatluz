# זרימת נתונים

## אתחול (טעינת דף)

```
index.html
  → <script type="module" src="src/app.js">
    → app.js: bindEvents()          (מחווט כל המאזינים, לפני שיש נתונים)
    → app.js: loadParashaRecords(CONFIG.CSV_FILE_PATH)
        → parashaRepository.js: fetch(csvPath)
        → csvParser.js: parseCSV(text)
        → מסנן/מנרמל → ParashaRecord[]
    → app.js: parashaRecords = [...]           (מקור האמת היחיד, בזיכרון)
    → app.js: populateParashaSelect()           (בונה <option> תצוגה בלבד)
    → settingsStore.js: loadFormFromStorage()   (משחזר בחירות קודמות, אם קיימות)
    → templatePanel.js: syncAllRowsVisibility()
    → (אם יש פרשה נבחרת אחרי השחזור) → generateSchedule()
```

אם `fetch` נכשל: `app.js` תופס את השגיאה ומציג `#load-error` — שאר
האתחול (`bindEvents`) כבר קרה, כך שהטופס עדיין מגיב אם המשתמש יזין
נתונים ידנית.

## מחזור העדכון הרגיל (בחירת פרשה / שינוי שדה)

זהו מחזור העדכון החוזר בכל אינטראקציה — הלב של האפליקציה:

```
אירוע DOM (change/input)
  → app.js: generateAndPersist()
    → app.js: getSelectedParasha()
        → parashaRecords.find(p => p.name === selectEl.value)
    → formBinding.js: readFormState()
        → קורא כל שדה רלוונטי מה-DOM לפי CONFIG, ממיר טיפוסים
        → מחזיר FormState נקי (לא מחרוזות גולמיות)
    → domain/scheduleGenerator.js: buildSchedule(parasha, form)
        → פונקציה טהורה, ללא תופעות לוואי
        → מחזירה { lines, raw }
    → utils/format.js: toWhatsAppHtml(raw)
        → בריחת HTML + המרת *מודגש*/_נטוי_/ירידות שורה
    → ui/preview.js: showSchedulePreview(html)
        → כותב ל-#bubble, #btime, מוסיף class 'visible' ל-#pw
    → storage/settingsStore.js: saveFormToStorage()
        → סורק את כל שדות הטופס ב-DOM, שומר ל-localStorage
```

**נקודת מפתח**: `buildSchedule` (שכבת הדומיין) לא יודעת שקראו לה
מתוך מאזין אירוע, ולא כותבת דבר ל-DOM. `app.js` הוא שמתווך בין קלט
DOM ↔ לוגיקה טהורה ↔ פלט DOM. כל הצעד השלישי (חישוב) ניתן להרצה
זהה ב-Node, בלי דפדפן — כך בדיוק פועלות הבדיקות ב-`tests/scheduleGenerator.test.mjs`.

## כפתור "העתק לוואטסאפ"

```
לחיצה על #cbtn
  → ui/preview.js: copyToClipboard(getRawText())
      getRawText() הוא callback שסופק ע"י app.js, מחזיר תמיד את
      lastGeneratedMessage העדכני ביותר (לא ערך שהוקפא בזמן החיווט)
    → navigator.clipboard.writeText(raw)
    → משוב חזותי זמני על הכפתור (2 שניות)
```

## איפוס/מחיקה

- **"↺ איפוס טקסטים"**: `app.js: handleResetTemplate()` →
  `templatePanel.js: resetTemplateSettings()` (כותב ערכי ברירת מחדל
  ל-DOM לפי `CONFIG.DEFAULTS`/`CONFIG.UNCHECKED_BY_DEFAULT`) → חוזר
  ל-`app.js` שמריץ מחדש את מחזור העדכון הרגיל (הצעת מנחה + generateAndPersist).
- **"מחיקת קאש"**: `app.js: handleClearCache()` → `confirm()` → אם
  אושר: `settingsStore.js: clearStoredSettings()` → `location.reload()`
  (אתחול מלא מחדש, לא רק עדכון DOM).
