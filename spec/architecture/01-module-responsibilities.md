# אחריות מודולים

לכל מודול: אחריות, API ציבורי (מה שהוא מייצא), ותלויות (מה שהוא
מייבא). מודולים ב-`domain/` ו-`utils/` אינם תלויים ב-DOM בכלל.

## `src/config.js`

**אחריות**: קבועי קונפיגורציה יחידים — מפתח cache, נתיב CSV, ערכי
ברירת מחדל, רשימת שורות טמפלט, רשימת שדות מספריים.
**מייצא**: `CONFIG`.
**תלויות**: אין.

## `src/utils/time.js`

**אחריות**: המרות בין "HH:MM" למספר דקות מחצות, ובחזרה (עם גלישה
תקינה סביב חצות), ועיגול לכפולת 5.
**מייצא**: `toM(str)`, `frM(minutes)`, `r5(minutes)`.
**תלויות**: אין.

## `src/utils/format.js`

**אחריות**: בריחה מ-HTML, והמרת תחביר Markdown-קל (וואטסאפ) ל-HTML
תצוגה.
**מייצא**: `escapeHtml(str)`, `toWhatsAppHtml(text)`.
**תלויות**: אין.
**הערת אבטחה**: `toWhatsAppHtml` **תמיד** בורח מה-HTML לפני החלת
תחביר ה-Markdown — כך שטקסט חופשי שהוזן ע"י המשתמש (שדות תווית) לא
יכול להזריק תגיות/סקריפט לתצוגה המקדימה (`innerHTML`).

## `src/csv/csvParser.js`

**אחריות**: פענוח CSV כללי, לא תלוי סכימה. תומך בפסיקים בתוך שדה
מצוטט ובגרשיים כפולים (`""`) כגרש בודד.
**מייצא**: `splitCSVLine(line)`, `parseCSV(text)`.
**תלויות**: אין.

## `src/csv/parashaRepository.js`

**אחריות**: טעינת קובץ ה-CSV (`fetch`) והמרתו לרשימת `ParashaRecord`
תקינים (שורות ללא שם/הדלקת נרות מסוננות, דגלי `mevorchim`/`isDst`
מנורמלים ל-boolean).
**מייצא**: `loadParashaRecords(csvPath): Promise<ParashaRecord[]>`.
**תלויות**: `csvParser.js`. משתמש ב-`fetch` הגלובלי (הצד היחיד
במודול הזה שנוגע ב"עולם החוץ").

## `src/domain/scheduleGenerator.js`

**אחריות**: כל כללי החישוב וההרכבה של הודעת הלו"ז (ראו
[functional/01](../functional/01-schedule-generation-rules.md)).
פונקציה טהורה: אותו קלט → אותו פלט, תמיד, ללא DOM.
**מייצא**: `buildSchedule(parasha, form): {lines, raw}`.
**תלויות**: `utils/time.js`.

## `src/domain/minchaSuggestion.js`

**אחריות**: חישוב הצעת שעת מנחה אמצע שבוע מזמן הדלקת נרות. פונקציה
טהורה.
**מייצא**: `suggestWeekdayMincha(candleTime, minutesBeforeSunset): string`.
**תלויות**: `utils/time.js`.

## `src/storage/settingsStore.js`

**אחריות**: שמירה/שחזור/מחיקה גנרית של כל שדות הטופס ב-`localStorage`.
לא מחליט **מתי** לשמור/למחוק (זו החלטת UI) — רק **איך**.
**מייצא**: `saveFormToStorage()`, `loadFormFromStorage(): boolean`,
`clearStoredSettings()`.
**תלויות**: `config.js` (מפתח ה-cache). נוגע ב-DOM (סורק
`input`/`select` בדף) וב-`localStorage`.

## `src/ui/formBinding.js`

**אחריות**: הגבול היחיד בין ה-DOM לבין `FormState` "נקי" שמשמש את
שכבת הדומיין — שדות מספריים כבר מומרים למספר (0 אם ריק/לא תקין),
תיבות סימון כבר מומרות ל-boolean.
**מייצא**: `readFormState(): FormState`.
**תלויות**: `config.js` (רשימת שדות ורשימת שדות מספריים). נוגע ב-DOM.

## `src/ui/templatePanel.js`

**אחריות**: פתיחה/סגירה של פאנל ההגדרות, סנכרון מראה שורה לפי מצב
תיבת הסימון שלה, ואיפוס שדות הטמפלט לברירת המחדל.
**מייצא**: `syncRowVisibility(rowId, checkboxId)`,
`syncAllRowsVisibility()`, `toggleSettingsPanel()`,
`resetTemplateSettings()`.
**תלויות**: `config.js`. נוגע ב-DOM.

## `src/ui/preview.js`

**אחריות**: הצגת HTML מוכן בבועת התצוגה המקדימה, וחיווט כפתור
ההעתקה (כולל משוב חזותי זמני). **לא** בונה את ה-HTML בעצמו — מקבל
אותו מוכן מ-`utils/format.js` דרך `app.js`.
**מייצא**: `showSchedulePreview(html)`, `wireCopyButton(getRawText)`.
**תלויות**: אין (מקבל callback, לא תלוי ישירות בשכבת הדומיין). נוגע
ב-DOM וב-`navigator.clipboard`.

## `src/app.js`

**אחריות**: נקודת הכניסה היחידה שמכירה את כל השכבות יחד. מחזיק את
מקור האמת לנתוני הפרשות שנטענו (`parashaRecords`), מחווט אירועים,
ומתזמר את הזרימה: בחירת פרשה → קריאת מצב טופס → חישוב טהור → הצגה +
שמירה. אינו מכיל לוגיקת חישוב או פענוח בעצמו — רק קריאות לשכבות
האחרות.
**תלויות**: כל שאר המודולים.
