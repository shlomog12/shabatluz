# עקרונות ומבנה תיקיות

## המצב לפני הריפקטור

כל הלוגיקה — קונפיגורציה, טעינת CSV, חישוב זמנים, בניית הודעה,
שמירה ל-cache, וטיפול באירועים — ישבה בקובץ `index.js` יחיד (כ-370
שורות), עם קונפיגורציה גלובלית נוספת ב-`config.js`. סימפטומים
אופייניים:

- **נתוני פרשה מוטמעים ב-DOM**: זמן הדלקת נרות/הבדלה/מברכים/קיץ-חורף
  נשמרו כ-`dataset` על אלמנטי `<option>` בתפריט הנפתח — ה-DOM שימש
  גם כמקור הנתונים, לא רק כתצוגה.
- **פונקציית `gen()` אחת ענקית** שקראה ישירות מה-DOM (`val()`,
  `chk()`, `numVal()`), חישבה את כל הזמנים, בנתה את מחרוזת ההודעה,
  **וגם** כתבה בחזרה ל-DOM (תצוגה מקדימה) — כמה סיבות שונות לשינוי
  מעורבבות בפונקציה אחת.
- **כל האירועים חוּוְטו inline ב-HTML** (`onclick`, `onchange`,
  `oninput`) — כ-35 מופעים, ללא מקום מרוכז אחד לראות מה האפליקציה
  מאזינה לו.
- **ללא הפרדה בין לוגיקה טהורה לקוד תלוי-דפדפן** — אי אפשר היה לבדוק
  את כללי החישוב (למשל "מה קורה כשההבדלה חסרה") בלי DOM אמיתי.

## SRP — Single Responsibility Principle

כל מודול ב-`src/` אחראי על דבר אחד:

- `domain/scheduleGenerator.js` — **רק** חישוב טהור: פרשה + מצב טופס
  → מערך שורות. לא נוגע ב-DOM בכלל.
- `csv/parashaRepository.js` — **רק** טעינה ופענוח של נתוני פרשות.
- `storage/settingsStore.js` — **רק** סנכרון טופס ↔ `localStorage`.
- `ui/formBinding.js` — **רק** הגבול בין ה-DOM לאובייקט `FormState`
  נקי (טיפוסים מומרים, לא מחרוזות גולמיות).
- `ui/preview.js`, `ui/templatePanel.js` — **רק** עדכוני DOM ספציפיים
  (תצוגה מקדימה, פאנל הגדרות בהתאמה).
- `app.js` — **רק** תזמור: מחבר בין כל השכבות, לא מכיל לוגיקת חישוב
  או פענוח בעצמו.

השינוי המרכזי ביחס לקוד הישן: **הזמנים הנגזרים לא נשמרים ב-DOM
יותר**. `app.js` מחזיק מערך `parashaRecords` (מקור אמת יחיד בזיכרון),
ו-`<option>` בתפריט מכיל רק `value`/`textContent` — תצוגה בלבד.

## OCP — Open/Closed Principle

הוספת שורת טמפלט חדשה (למשל "קידוש") לא דורשת שינוי בקוד הלוגיקה:
מוסיפים זוג `[row-id, checkbox-id]` ל-`CONFIG.ALL_ROWS`, ברירת מחדל
ל-`CONFIG.DEFAULTS`, והשדות המתאימים ב-`index.html` — `resetTemplateSettings`,
`syncAllRowsVisibility`, `readFormState` ו-`saveFormToStorage` כבר
פועלים גנרית על פי `CONFIG`, בלי `if` נוסף.

## DIP — Dependency Inversion Principle

`domain/scheduleGenerator.js` ו-`domain/minchaSuggestion.js` מקבלים
נתונים כפרמטרים (`ParashaRecord`, `FormState`) ומחזירים נתונים —
הם **לא יודעים** מהו `document`, `fetch`, או `localStorage`. שכבת
ה-UI (`app.js`) היא זו שתלויה בשכבת הדומיין, ולא להפך. תועלת מעשית:
כל כללי החישוב נבדקים ב-`tests/` ללא דפדפן/DOM בכלל (ראו
`tests/scheduleGenerator.test.mjs`).

## ISP — Interface Segregation Principle

אין מודול "אלוהים" אחד שמכיר הכול. `ui/preview.js` לא יודע דבר על
`localStorage`; `storage/settingsStore.js` לא יודע דבר על איך נראית
הודעת וואטסאפ. כל צרכן מייבא (`import`) רק את מה שהוא באמת צריך.

## מה **לא** משתנה: "בלי שרת"

שום עיקרון מהנ"ל לא דורש שרת, בסיס נתונים, או build tool. המבנה
משתמש ב-ES modules טבעיים (`<script type="module">`) הנטענים ישירות
ע"י הדפדפן — פריסה נשארת: להעתיק את התיקייה לכל אחסון סטטי.

## מבנה תיקיות

```
shabatluz/
├── index.html              נקודת הכניסה; טוען src/app.js כמודול
├── style.css
├── shabbat_times.csv        מקור נתוני הפרשות (תלוי-שנה)
├── site.webmanifest, favicon*, apple-touch-icon*, android-chrome-*
├── src/
│   ├── app.js                נקודת הכניסה של הלוגיקה: מחברת את כל השכבות
│   ├── config.js              CONFIG: מפתחות, ברירות מחדל, רשימת שורות טמפלט
│   ├── utils/
│   │   ├── time.js             toM / frM / r5 — המרות זמן טהורות
│   │   └── format.js            escapeHtml / toWhatsAppHtml — טקסט → HTML בטוח
│   ├── csv/
│   │   ├── csvParser.js         פרסר CSV כללי (splitCSVLine, parseCSV)
│   │   └── parashaRepository.js טעינת קובץ הפרשות → ParashaRecord[]
│   ├── domain/
│   │   ├── scheduleGenerator.js  חישוב הודעת הלו"ז (טהור, ללא DOM)
│   │   └── minchaSuggestion.js    הצעת מנחה אמצע שבוע (טהור, ללא DOM)
│   ├── storage/
│   │   └── settingsStore.js       שמירה/שחזור/מחיקה מ-localStorage
│   └── ui/
│       ├── formBinding.js          DOM → FormState (טיפוסים מומרים)
│       ├── templatePanel.js         פתיחה/סגירה, סנכרון שורות, איפוס
│       └── preview.js                תצוגה מקדימה, כפתור העתקה
├── tests/                    בדיקות יחידה טהורות (Node test runner מובנה, ללא תלות)
│   ├── time.test.mjs
│   ├── format.test.mjs
│   ├── csvParser.test.mjs
│   ├── scheduleGenerator.test.mjs
│   └── minchaSuggestion.test.mjs
└── spec/                     המסמכים האלה
```

הרצת הבדיקות: `node --test tests/*.test.mjs` (Node 18+, ללא `npm install`).
