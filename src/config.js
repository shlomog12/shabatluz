/**
 * הגדרות גלובליות של האפליקציה.
 * - CACHE_KEY / CSV_FILE_PATH: מפתחות אחסון וטעינת נתונים.
 * - DEFAULTS: ערכי ברירת המחדל לכל שדה טקסט/מספר/שעה/בחירה בפאנל
 *   "עריכת טמפלט" (בשימוש על ידי resetTemplateSettings()).
 * - ALL_ROWS: זוגות [row-id, checkbox-id] של שורות הטמפלט, לצורך
 *   סנכרון מצב "מושבת" (disabled) ושחזור מה-cache.
 * - UNCHECKED_BY_DEFAULT: מזהי checkbox שאמורים להיות לא מסומנים
 *   כברירת מחדל; כל שאר השורות ב-ALL_ROWS מסומנות כברירת מחדל.
 */
export const CONFIG = {
  CACHE_KEY: 'givat_haroe_schedule_v1',
  CSV_FILE_PATH: 'shabbat_times.csv',
  DEFAULTS: {
    'parasha': '',
    'mincha-pm': '18:00',
    'mincha-week': '13:30',
    'off-shir': 10,
    'off-kabbalat': 15,
    'off-shki': 30,
    'mincha-minutes-before-sunset': 20,
    'arvit-offset-minutes': 0,
    'arvit-round': 'none',
    'fix-chavura-s': '08:00',
    'fix-chavura-w': '07:30',
    'fix-shacharit-s': '08:30',
    'fix-shacharit-w': '08:00',
    'fix-yeladim-s': '10:00',
    'fix-yeladim-w': '09:30',
    'fix-gdola-s': '13:15',
    'fix-gdola-w': '12:30',
    'fix-nashim': '17:00',
    'off-chlimud': 60,
    'off-oneg': 35,
    'off-horim': 20,
    'fix-wk-shach': '06:20',
    'fix-wk-fri': '06:30',
    'fix-wk-arvit': '20:15',
    'lbl-shir': 'שיר השירים',
    'lbl-kabbalat': 'מנחה וקבלת שבת',
    'lbl-shki': 'שקיעה',
    'lbl-chavura': 'חבורא בעין איה',
    'lbl-shacharit': 'שחרית',
    'lbl-yeladim': 'תפילת ילדים',
    'lbl-gdola': 'מנחה גדולה',
    'lbl-nashim': 'שיעור לנשים',
    'lbl-chlimud': 'חבורת לימוד פרשת שבוע',
    'lbl-oneg': 'עונג שבת לילדים',
    'lbl-horim': 'לימוד הורים וילדים'
  },
  ALL_ROWS: [
    ['row-shir', 'show-shir'],
    ['row-kabbalat', 'show-kabbalat'],
    ['row-shki', 'show-shki'],
    ['row-chavura', 'show-chavura'],
    ['row-shacharit', 'show-shacharit'],
    ['row-yeladim', 'show-yeladim'],
    ['row-gdola', 'show-gdola'],
    ['row-nashim', 'show-nashim'],
    ['row-chlimud', 'show-chlimud'],
    ['row-oneg', 'show-oneg'],
    ['row-livui', 'show-livui'],
    ['row-horim', 'show-horim'],
    ['row-mincha-sunset', 'show-mincha-sunset'],
    ['row-wk-shach', 'show-wk-shach'],
    ['row-wk-arvit', 'show-wk-arvit']
  ],
  UNCHECKED_BY_DEFAULT: ['show-livui'],
  NUMERIC_FIELD_IDS: [
    'off-shir', 'off-kabbalat', 'off-shki', 'mincha-minutes-before-sunset',
    'arvit-offset-minutes', 'off-chlimud', 'off-oneg', 'off-horim'
  ]
};
