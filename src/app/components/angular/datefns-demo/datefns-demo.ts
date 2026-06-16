import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  format, formatDistance, addDays, addMonths, subDays,
  differenceInDays, differenceInYears, isWeekend, isValid,
  startOfMonth, endOfMonth, parse, eachDayOfInterval, getDay
} from 'date-fns';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

@Component({
  selector: 'app-datefns-demo',
  imports: [
    FormsModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent,
  ],
  templateUrl: './datefns-demo.html',
  styleUrl: './datefns-demo.scss',
})
export class DateFnsDemo {
  now = new Date();

  selectedDate = signal(format(new Date(), 'yyyy-MM-dd'));
  formatStr    = signal('MMMM do, yyyy');

  formatted = computed(() => {
    try {
      const d = parse(this.selectedDate(), 'yyyy-MM-dd', new Date());
      return isValid(d) ? format(d, this.formatStr()) : 'Invalid date';
    } catch { return 'Invalid format'; }
  });

  baseDate  = signal(format(new Date(), 'yyyy-MM-dd'));
  addAmount = signal(7);
  addUnit   = signal<'days'|'months'>('days');

  afterAdd = computed(() => {
    const d = parse(this.baseDate(), 'yyyy-MM-dd', new Date());
    const result = this.addUnit() === 'days' ? addDays(d, this.addAmount()) : addMonths(d, this.addAmount());
    return format(result, 'MMMM do, yyyy');
  });

  birthday    = signal('1995-06-15');
  birthdayAge = computed(() => {
    const d = parse(this.birthday(), 'yyyy-MM-dd', new Date());
    if (!isValid(d)) return 'Invalid date';
    return `${differenceInYears(new Date(), d)} years old (${formatDistance(d, new Date(), { addSuffix: true })})`;
  });

  calMonth  = signal(new Date());
  calDays   = computed(() => {
    const start = startOfMonth(this.calMonth());
    const end   = endOfMonth(this.calMonth());
    return eachDayOfInterval({ start, end });
  });
  calTitle  = computed(() => format(this.calMonth(), 'MMMM yyyy'));
  firstDow  = computed(() => getDay(startOfMonth(this.calMonth())));

  prevMonth() { this.calMonth.update(d => addMonths(d, -1)); }
  nextMonth() { this.calMonth.update(d => addMonths(d, 1)); }

  isToday(d: Date) { return format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'); }
  isWeekendDay(d: Date) { return isWeekend(d); }

  theory: TheoryPoint[] = [
    {
      heading: 'Why date-fns over Moment.js and native Date',
      points: [
        'date-fns is a collection of <strong>individually importable pure functions</strong> — you write <code>import { format } from \'date-fns\'</code> and your bundler tree-shakes everything you did not import. Moment.js loads the entire library (~330 kB uncompressed; ~67 kB gzipped) even when you use only one function.',
        'All date-fns functions are <strong>pure and immutable</strong> — they accept a Date and return a new Date. The original is never modified. Moment.js wraps dates in a mutable object class; calling <code>.add(7, \'days\')</code> mutates the moment in place, leading to subtle aliasing bugs when two parts of the code share a reference.',
        'date-fns works with <strong>native JavaScript Date objects</strong> throughout. No wrapper type to unwrap, convert, or carry through your API. Functions compose naturally: <code>format(addDays(startOfMonth(now), 5), \'dd MMM\')</code> is readable, safe, and returns a string.',
        'Moment.js is in <strong>maintenance mode</strong> (no new features, only security fixes). The Moment.js team itself recommends migrating to Luxon, date-fns, or the modern <code>Temporal</code> API. For new Angular projects, date-fns is the standard choice.',
        'date-fns v3 (released 2023) is a <strong>full TypeScript rewrite</strong> with stricter generic types, consistent interval object types, and UTC-safe function variants available under <code>date-fns/utc</code>. Version 3 is the current stable release and is what this page covers.',
      ],
    },
    {
      heading: 'format() and Unicode token patterns',
      points: [
        '<code>format(date, pattern)</code> converts a Date to a string using Unicode CLDR token patterns. Key tokens: <code>yyyy</code> (4-digit year), <code>MM</code> (2-digit month 01–12), <code>dd</code> (2-digit day 01–31), <code>HH</code> (24-hour 00–23), <code>hh</code> (12-hour 01–12), <code>mm</code> (minutes), <code>ss</code> (seconds), <code>a</code> (AM/PM).',
        'Named tokens: <code>MMMM</code> full month name ("January"), <code>MMM</code> abbreviated ("Jan"), <code>EEEE</code> full weekday ("Monday"), <code>EEE</code> abbreviated ("Mon"), <code>do</code> ordinal day ("1st", "2nd", "3rd").',
        '<strong>Critical gotcha</strong>: <code>DD</code> is day-of-year (1–366), NOT day-of-month. <code>dd</code> is day-of-month (1–31). Using <code>DD/MM/yyyy</code> for a date like June 8 returns "159/06/2026" — a very common silent bug that date-fns v3 now warns about in development.',
        'To include literal characters in a format string that would otherwise be interpreted as tokens, wrap them in single quotes: <code>format(now, "yyyy-MM-dd\'T\'HH:mm:ss")</code> produces an ISO-style string with a literal T separator.',
        'format() always formats in the <strong>local timezone</strong>. If you need UTC output, use <code>formatInTimeZone</code> from <code>date-fns-tz</code> (a companion package) or UTC functions from <code>date-fns/utc</code> in v3.',
      ],
    },
    {
      heading: 'parse() and safe date parsing',
      points: [
        '<code>parse(dateString, formatString, referenceDate)</code> parses a date string according to the given format pattern. The <code>referenceDate</code> fills in any missing parts — for example, if the string only has month and day, the referenceDate provides the year.',
        '<strong>Always call <code>isValid(d)</code> after <code>parse()</code></strong>. When the string does not match the pattern, parse() returns an Invalid Date object (not null, not undefined). Calling <code>format()</code> on an Invalid Date throws a <code>RangeError</code> at runtime.',
        'For ISO 8601 strings (<code>\'2024-06-08\'</code>, <code>\'2024-06-08T14:30:00Z\'</code>), use <code>parseISO()</code> instead of <code>parse()</code>. It handles timezone suffixes correctly and avoids the browser inconsistency where <code>new Date(\'2024-06-08\')</code> can shift to the previous day in negative-UTC-offset timezones by treating the string as UTC midnight.',
        'The <code>referenceDate</code> parameter in <code>parse()</code> is typically <code>new Date()</code>. In unit tests, pass a fixed date instead of <code>new Date()</code> to avoid flaky tests that depend on the current time.',
        '<code>isDate(value)</code> checks if a value is a Date instance (including Invalid Date). <code>isValid(value)</code> checks if it is a Date instance AND represents a real point in time. Use <code>isValid</code> to guard user input; use <code>isDate</code> for type narrowing.',
      ],
    },
    {
      heading: 'Date math — immutable arithmetic',
      points: [
        'All date-fns arithmetic functions return a <strong>new Date object</strong> — the original is never modified. This makes them safe to use with Angular Signals: <code>this.date.update(d => addDays(d, 1))</code> creates a new reference and triggers signal updates.',
        'Addition: <code>addDays</code>, <code>addMonths</code>, <code>addYears</code>, <code>addHours</code>, <code>addMinutes</code>, <code>addSeconds</code>, <code>addWeeks</code>. Subtraction: use the <code>sub</code> equivalents (<code>subDays</code>, <code>subMonths</code>, etc.) or pass a negative number to the add variant.',
        '<code>differenceInDays(later, earlier)</code> computes the integer number of days between two dates. <strong>Argument order matters</strong>: passing later first gives a positive result; reversing gives a negative number. The same convention applies to all <code>differenceIn*</code> functions.',
        'Boundary helpers: <code>startOfDay(date)</code> → midnight; <code>startOfMonth(date)</code> → 1st of the month at midnight; <code>endOfMonth(date)</code> → last day at 23:59:59.999. Use these to build ranges for calendar grids, weekly views, and report queries.',
        '<code>eachDayOfInterval({ start, end })</code> returns an array containing every Date between start and end (inclusive). This is how the mini calendar in this demo generates its cells — one call produces all 28–31 days for the visible month.',
      ],
    },
    {
      heading: 'Relative time and predicates',
      points: [
        '<code>formatDistance(date, baseDate, { addSuffix: true })</code> returns a human-readable relative string: "3 days ago", "about 2 months ago", "in 1 hour". Without <code>addSuffix</code> the direction is omitted: "3 days". Use it for comment timestamps, activity feeds, and notification lists.',
        '<code>formatDistanceToNow(date, { addSuffix: true })</code> is a shorthand for <code>formatDistance(date, new Date(), ...)</code> — omit the second argument when you always want "from now". Calling <code>new Date()</code> at the call site in the component constructor and passing it as the base keeps the comparison stable during SSR.',
        'Predicate helpers return booleans: <code>isPast(date)</code>, <code>isFuture(date)</code>, <code>isToday(date)</code>, <code>isWeekend(date)</code>, <code>isLeapYear(date)</code>, <code>isSameDay(dateA, dateB)</code>. All are pure functions — great for computed signals: <code>isExpired = computed(() => isPast(this.deadline()))</code>.',
        'Comparison functions: <code>isBefore(dateA, dateB)</code>, <code>isAfter(dateA, dateB)</code>, <code>isEqual(dateA, dateB)</code>. For sorting, <code>compareAsc(a, b)</code> returns -1, 0, or 1 — pass it directly to <code>Array.sort(compareAsc)</code>. <code>compareDesc</code> sorts newest-first.',
        '<code>max([date1, date2, ...])</code> and <code>min([date1, date2, ...])</code> find the latest or earliest date in an array. Useful for computing a deadline range from a list of task dates.',
      ],
    },
    {
      heading: 'Locales, date-fns/utc, and Angular pipe integration',
      points: [
        'Locale support is opt-in — import a locale object from <code>date-fns/locale</code> and pass it as an option: <code>formatDistance(date, now, { addSuffix: true, locale: fr })</code>. Available locales include <code>fr</code>, <code>de</code>, <code>ja</code>, <code>zhCN</code>, and ~80 others. Each locale is a separate import, so unused locales are tree-shaken.',
        '<code>format</code> with a locale changes month/weekday names: <code>format(date, \'MMMM\', { locale: de })</code> returns "Juni" instead of "June". The locale option is supported by most display functions (<code>format</code>, <code>formatDistance</code>, <code>formatRelative</code>, <code>intlFormat</code>).',
        'date-fns v3 introduced <code>date-fns/utc</code> — a subpath with UTC-safe versions of every arithmetic and display function. Import <code>formatUTC</code>, <code>addDaysUTC</code>, etc. to avoid timezone-offset issues in server-side or global-timezone applications.',
        'Building an Angular pipe with date-fns: create a <code>@Pipe({ name: \'dateFns\' })</code> that accepts a <code>Date</code> and a format string and calls <code>format(value, pattern)</code>. This is simpler and more tree-shakeable than wrapping Angular\'s built-in DatePipe, and avoids the need to configure <code>LOCALE_ID</code>.',
        'Angular\'s built-in <code>DatePipe</code> also uses Unicode token patterns but depends on CLDR locale data bundled with <code>@angular/common/locales</code>. For simple formatting, DatePipe is sufficient. For complex date arithmetic or locale-aware relative time, add date-fns as a lightweight complement.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'format & parse',
      language: 'typescript',
      code: `import { format, parse, parseISO, isValid } from 'date-fns';

const now = new Date();

// format() — Unicode token patterns
format(now, 'yyyy-MM-dd')            // '2026-06-16'
format(now, 'MMMM do, yyyy')         // 'June 16th, 2026'
format(now, 'dd/MM/yyyy HH:mm')      // '16/06/2026 14:30'
format(now, 'EEEE, MMM d')           // 'Tuesday, Jun 16'
format(now, 'h:mm a')                // '2:30 PM'
format(now, "yyyy-MM-dd'T'HH:mm:ss") // '2026-06-16T14:30:00'

// parse() — string → Date, always validate result
const d1 = parse('15/06/1995', 'dd/MM/yyyy', new Date());
if (isValid(d1)) format(d1, 'MMMM do, yyyy'); // 'June 15th, 1995'

const bad = parse('not-a-date', 'yyyy-MM-dd', new Date());
isValid(bad); // false — never pass to format() without checking

// parseISO() — for ISO 8601 strings (more reliable than new Date())
const d2 = parseISO('2024-06-08');       // safe across all timezones
const d3 = parseISO('2024-06-08T14:30Z'); // handles timezone suffix

// COMMON BUG: DD is day-of-year, dd is day-of-month!
format(new Date('2026-06-08'), 'DD/MM/yyyy'); // '159/06/2026' — WRONG
format(new Date('2026-06-08'), 'dd/MM/yyyy'); // '08/06/2026' — correct`,
    },
    {
      label: 'Date math',
      language: 'typescript',
      code: `import {
  addDays, addMonths, addYears, addHours,
  subDays, subMonths,
  differenceInDays, differenceInYears, differenceInHours,
  startOfDay, startOfMonth, endOfMonth,
  eachDayOfInterval,
} from 'date-fns';

const now = new Date();

// Arithmetic — always returns a NEW Date, never mutates
addDays(now, 7)          // 7 days from now
addMonths(now, 3)        // 3 months from now
subDays(now, 14)         // 14 days ago
addHours(now, -2)        // 2 hours ago (negative = subtract)

// Chaining is safe because each call returns a new Date
const nextMondayNoon = addHours(addDays(startOfDay(now), 1), 12);

// Differences — later date first for a positive result
differenceInDays(futureDate, now)     // positive: days from now to future
differenceInYears(now, birthDate)     // age in completed years
differenceInHours(now, pastDate)      // hours elapsed

// Boundary helpers — snap to start/end of a period
startOfDay(now)          // today at midnight 00:00:00.000
startOfMonth(now)        // first of month at midnight
endOfMonth(now)          // last day of month at 23:59:59.999

// Generate date arrays for calendar grids
const days = eachDayOfInterval({
  start: startOfMonth(now),
  end:   endOfMonth(now),
});  // → [Date(Jun 1), Date(Jun 2), ..., Date(Jun 30)]`,
    },
    {
      label: 'Relative time & predicates',
      language: 'typescript',
      code: `import {
  formatDistance, formatDistanceToNow, formatRelative,
  isPast, isFuture, isToday, isWeekend, isBefore, isAfter,
  compareAsc, compareDesc, max, min,
} from 'date-fns';

const now = new Date();
const pastDate   = new Date('2026-01-01');
const futureDate = new Date('2026-12-31');

// Relative time strings
formatDistance(pastDate, now, { addSuffix: true })
// → '6 months ago'
formatDistanceToNow(futureDate, { addSuffix: true })
// → 'in 7 months'
formatRelative(futureDate, now)
// → '12/31/2026' (for further dates) or 'next Sunday at 12:00 PM' (soon)

// Boolean predicates — great as computed signals
isPast(pastDate)        // true
isFuture(futureDate)    // true
isToday(now)            // true
isWeekend(new Date('2026-06-14')) // true — Sunday

// Comparison
isBefore(pastDate, now)   // true
isAfter(futureDate, now)  // true

// Sort dates — compareAsc returns -1/0/1, works with Array.sort()
const dates = [futureDate, pastDate, now];
dates.sort(compareAsc);  // oldest first
dates.sort(compareDesc); // newest first

// Find extreme dates
max([pastDate, now, futureDate]); // futureDate
min([pastDate, now, futureDate]); // pastDate`,
    },
    {
      label: 'Locales',
      language: 'typescript',
      code: `// date-fns locales are separate imports — unused locales are tree-shaken
import { format, formatDistance } from 'date-fns';
import { fr, de, ja, zhCN, es } from 'date-fns/locale';

const now = new Date();
const pastDate = new Date('2026-01-01');

// format with locale — month/weekday names in the target language
format(now, 'EEEE, d MMMM yyyy', { locale: fr })
// → 'mardi, 16 juin 2026'

format(now, 'EEEE, d MMMM yyyy', { locale: de })
// → 'Dienstag, 16. Juni 2026'

format(now, 'yyyy年MM月dd日', { locale: ja })
// → '2026年06月16日'

// formatDistance with locale — relative strings in the target language
formatDistance(pastDate, now, { addSuffix: true, locale: fr })
// → 'il y a 6 mois'

formatDistance(pastDate, now, { addSuffix: true, locale: de })
// → 'vor 6 Monaten'

// In an Angular component — dynamic locale based on a signal:
// locale = signal<Locale>(enUS);
// formatted = computed(() =>
//   format(this.date(), 'MMMM do, yyyy', { locale: this.locale() })
// );`,
    },
    {
      label: 'Angular pipe',
      language: 'typescript',
      code: `// A lightweight Angular pipe wrapper around date-fns format()
import { Pipe, PipeTransform } from '@angular/core';
import { format, isValid } from 'date-fns';

@Pipe({
  name: 'dateFns',
  pure: true,  // default — recalculates only when input reference changes
})
export class DateFnsPipe implements PipeTransform {
  transform(value: Date | string | null | undefined, pattern = 'MMMM do, yyyy'): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    return isValid(date) ? format(date, pattern) : 'Invalid date';
  }
}

// Usage in a template:
// Import DateFnsPipe in the component's imports array (standalone)
// <p>{{ item.createdAt | dateFns }}</p>
// <p>{{ item.createdAt | dateFns:'dd/MM/yyyy HH:mm' }}</p>
// <time [attr.datetime]="item.createdAt | dateFns:'yyyy-MM-dd'">
//   {{ item.createdAt | dateFns:'MMMM do, yyyy' }}
// </time>

// Relative time pipe:
@Pipe({ name: 'timeAgo', pure: false }) // impure — must re-run each CD
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    if (!isValid(date)) return '';
    const { formatDistanceToNow } = require('date-fns');
    return formatDistanceToNow(date, { addSuffix: true });
  }
}
// <p>{{ comment.timestamp | timeAgo }}</p> → '3 minutes ago'`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What does format(new Date(), \'MMMM do, yyyy\') return for June 16th, 2026?',
      options: [
        'June 16th, 2026',
        '06/16/2026',
        '2026-06-16',
        'Mon Jun 16 2026',
      ],
      answer: 0,
      explanation: 'The pattern MMMM gives the full month name ("June"), do gives the ordinal day ("16th"), and yyyy gives the 4-digit year — producing "June 16th, 2026". Note that dd would give "16" without the ordinal suffix.',
    },
    {
      q: 'Which call correctly parses "2024-03-15" and validates the result before formatting?',
      options: [
        'const d = new Date("2024-03-15"); format(d, "dd MMM yyyy");',
        'const d = parseISO("2024-03-15"); format(d, "dd MMM yyyy");',
        'const d = parse("2024-03-15", "yyyy-MM-dd", new Date()); if (isValid(d)) format(d, "dd MMM yyyy");',
        'const d = Date.parse("2024-03-15"); format(d, "dd MMM yyyy");',
      ],
      answer: 2,
      explanation: 'parse() with a format pattern and reference date produces a typed Date, but can return Invalid Date on bad input. Always guard with isValid() before formatting. parseISO() is also correct for ISO strings without validation, but option B skips the isValid guard. Date.parse() returns a number — format() does not accept a number.',
    },
    {
      q: 'What is the correct argument order for differenceInDays to get a positive number?',
      options: [
        'differenceInDays(earlier, later)',
        'differenceInDays(later, earlier)',
        'differenceInDays(start, end)',
        'differenceInDays(dateA, dateB) — order does not matter',
      ],
      answer: 1,
      explanation: 'differenceInDays(later, earlier) returns a positive integer — it computes the first argument minus the second. Reversing the arguments yields a negative result. This convention applies to all differenceIn* functions in date-fns.',
    },
    {
      q: 'What does addDays(d, this.addAmount()) return when addAmount() is 7?',
      options: [
        'The same Date object d mutated to be 7 days later',
        'A new Date object representing 7 days after d',
        'A formatted string of the date 7 days later',
        'The number of milliseconds representing 7 days from d',
      ],
      answer: 1,
      explanation: 'All date-fns arithmetic functions are pure and immutable — they accept a Date and return a brand-new Date object. The original d is never mutated. This is safe for use with Angular Signals since a new reference triggers change detection.',
    },
    {
      q: 'In the DateFnsDemo calendar, why does eachDayOfInterval return an array rather than a count?',
      options: [
        'To let the template render each day as a calendar cell in an @for loop',
        'To allow differenceInDays to be called on the result',
        'Because eachDayOfInterval only works with @for — it cannot return a number',
        'To enable locale-aware day name rendering for each cell',
      ],
      answer: 0,
      explanation: 'eachDayOfInterval({ start, end }) returns an array of Date objects — one per day in the range. The template iterates over this array with @for to render each calendar cell. This is the idiomatic date-fns pattern for building calendar UIs.',
    },
    {
      q: 'What is the result of format(new Date("2026-06-08"), "DD/MM/yyyy") and why is it wrong?',
      options: [
        '"08/06/2026" — D and d are interchangeable in date-fns',
        '"159/06/2026" — DD is day-of-year (1–366), not day-of-month',
        'A runtime error — uppercase D is not a valid token',
        '"06/08/2026" — the format is interpreted in US locale automatically',
      ],
      answer: 1,
      explanation: 'In date-fns (following Unicode CLDR conventions), DD is the day-of-year token (1–366) and dd is the day-of-month token (1–31). June 8th is the 159th day of 2026, so "DD/MM/yyyy" returns "159/06/2026". This is one of the most common silent bugs in date-fns. Use dd for the day-of-month.',
    },
    {
      q: 'How do you add French locale support to formatDistance() in date-fns?',
      options: [
        'Set LOCALE_ID to "fr" in the Angular providers array',
        'Import { fr } from "date-fns/locale" and pass { locale: fr } as the options object',
        'Call formatDistance.setLocale("fr") before invoking it',
        'date-fns automatically detects the browser locale — no import needed',
      ],
      answer: 1,
      explanation: 'date-fns locales are individual imports from date-fns/locale — unused locales are tree-shaken. Pass the locale object as part of the options: formatDistance(date, now, { addSuffix: true, locale: fr }). date-fns never reads the browser locale automatically; you always opt in explicitly.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'Why use date-fns instead of Moment.js?', a: 'date-fns is tree-shakeable — you import only the functions you use, so unused functions are removed from the bundle (Moment.js always loads the full ~67 kB). date-fns functions are <strong>pure and immutable</strong> — they return new Date objects and never mutate input, eliminating aliasing bugs. Moment.js is also in maintenance mode — the Moment.js team recommends migrating to date-fns or Luxon.' },
    { q: 'How do you safely parse a user-typed date string?', a: '<code>const d = parse(input, \'yyyy-MM-dd\', new Date())</code> then <code>if (isValid(d)) { format(d, ...) }</code>. Always call <code>isValid()</code> after <code>parse()</code> — it returns an <em>Invalid Date</em> object (not null) on bad input. Calling <code>format()</code> on an Invalid Date throws a <code>RangeError</code>.' },
    { q: 'What is the difference between format() and formatDistance()?', a: '<code>format(date, \'dd MMM yyyy\')</code> formats to a fixed absolute string like "16 Jun 2026". <code>formatDistance(date, new Date(), { addSuffix: true })</code> returns a relative string like "3 days ago" or "in 2 months" — ideal for comment timestamps and activity feeds.' },
    { q: 'How do you add or subtract time in date-fns?', a: '<code>addDays(date, 7)</code>, <code>subMonths(date, 1)</code>, <code>addHours(date, 2)</code>. All return a <strong>new</strong> Date — the original is unchanged. Chain freely: <code>addHours(startOfDay(new Date()), 9)</code> gives today at 9:00 AM. Pass a negative number to add functions as an alternative to sub equivalents.' },
    { q: 'How do you compare two dates with date-fns?', a: '<code>isBefore(dateA, dateB)</code>, <code>isAfter(dateA, dateB)</code>, <code>isEqual(dateA, dateB)</code>. For sorting: <code>compareAsc(a, b)</code> returns -1/0/1 — pass it directly to <code>Array.sort(compareAsc)</code> for chronological order. <code>compareDesc</code> sorts newest-first.' },
    { q: 'How do you generate a range of dates for a calendar grid?', a: '<code>eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })</code> returns an array of every Date in the month. Use it in an <code>@for</code> loop to render calendar cells. The <code>firstDow</code> offset (from <code>getDay(startOfMonth(now))</code>) tells you how many blank cells to prepend before the 1st.' },
    { q: 'How do you use date-fns with locale support for non-English text?', a: 'Import the locale object from <code>date-fns/locale</code>: <code>import { fr } from \'date-fns/locale\'</code>. Pass it as an option: <code>format(date, \'MMMM\', { locale: fr })</code> → "juin". <code>formatDistance(date, now, { addSuffix: true, locale: fr })</code> → "il y a 3 jours". Unused locales are tree-shaken from the bundle.' },
    { q: 'What is parseISO() and when should you use it instead of parse()?', a: '<code>parseISO(\'2024-06-08\')</code> safely parses ISO 8601 strings. Use it instead of <code>new Date(\'2024-06-08\')</code> because some browsers treat date-only ISO strings as UTC midnight, which shifts to the previous day in negative-UTC-offset timezones. <code>parseISO</code> parses consistently across environments. Use <code>parse()</code> for non-ISO strings with explicit format patterns.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'format', type: 'function', desc: 'format(date, pattern) → string. Unicode token patterns: yyyy, MM, dd, HH, mm, ss, MMMM, EEEE, do. Literal chars in single quotes.' },
    { name: 'parse', type: 'function', desc: 'parse(str, pattern, referenceDate) → Date. Always call isValid() on the result — returns Invalid Date on bad input.' },
    { name: 'parseISO', type: 'function', desc: 'Safely parses ISO 8601 strings. More reliable than new Date("2024-06-08") which can shift by one day in negative-UTC timezones.' },
    { name: 'isValid', type: 'function', desc: 'Returns true if the Date represents a real point in time. Always use after parse() on user input before calling format() or arithmetic.' },
    { name: 'formatDistance', type: 'function', desc: 'formatDistance(date, baseDate, { addSuffix: true }) → "3 days ago". Use formatDistanceToNow() as a shorthand.' },
    { name: 'addDays / addMonths', type: 'function', desc: 'Return a NEW Date with the specified amount added — never mutate. Sub equivalents: subDays, subMonths, etc.' },
    { name: 'differenceInDays', type: 'function', desc: 'differenceInDays(later, earlier) → positive integer days. Argument order matters — later date first for a positive result.' },
    { name: 'eachDayOfInterval', type: 'function', desc: 'eachDayOfInterval({ start, end }) → Date[]. Returns every Date in the range. Ideal for calendar grids and date-range pickers.' },
    { name: 'startOfMonth / endOfMonth', type: 'function', desc: 'Snap to the exact start (midnight on 1st) or end (23:59:59.999 on last day) of a month. Compose with eachDayOfInterval.' },
    { name: 'compareAsc / compareDesc', type: 'function', desc: 'Return -1/0/1. Pass directly to Array.sort() for chronological or reverse-chronological ordering.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Date formatting: toLocaleDateString vs format()',
      before: `// Unreliable — output depends on the user's OS locale setting
const d = new Date();
const str = d.toLocaleDateString(); // '6/16/2026' in en-US, '16/06/2026' in en-GB
console.log(str); // different output per browser locale`,
      after: `// Explicit, consistent, tree-shakeable
import { format } from 'date-fns';
const d = new Date();
const str = format(d, 'MMMM do, yyyy'); // 'June 16th, 2026' everywhere
console.log(str);`,
      note: 'format() uses Unicode token patterns giving you full control regardless of the user\'s system locale.',
    },
    {
      title: 'Parsing user input: new Date() vs parse() + isValid()',
      before: `// Risky — browser-inconsistent, no validation
const d = new Date(userInput);
const result = format(d, 'dd MMM yyyy'); // may throw on Invalid Date`,
      after: `// Safe — explicit pattern, always validated before use
import { parse, isValid, format } from 'date-fns';
const d = parse(userInput, 'yyyy-MM-dd', new Date());
const result = isValid(d) ? format(d, 'dd MMM yyyy') : 'Invalid date';`,
      note: 'Always guard with isValid() after parse() — it returns Invalid Date (not null) on bad input which causes a RangeError in format().',
    },
    {
      title: 'Relative time: manual string building vs formatDistance()',
      before: `// Manual — error-prone, no locale support, only handles days
const diff = Math.floor((Date.now() - date.getTime()) / 86400000);
const label = diff + ' days ago';`,
      after: `// date-fns — locale-aware, handles seconds through years automatically
import { formatDistance } from 'date-fns';
const label = formatDistance(date, new Date(), { addSuffix: true });
// 'about 3 hours ago', '6 months ago', 'in 2 years'`,
      note: 'formatDistance() handles seconds through years and is locale-aware when a locale option is passed.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Wrong argument order in differenceInDays',
      wrong: `// Returns negative — arguments are reversed
const days = differenceInDays(pastDate, futureDate);
console.log(days); // -30 (wrong — should be 30)`,
      right: `// Later date first for a positive result
const days = differenceInDays(futureDate, pastDate);
console.log(days); // 30`,
      explanation: 'differenceInDays(a, b) computes a minus b in days. To get a positive count when asking "how many days until the future date?", pass the future date as the first argument. This convention applies to all differenceIn* functions.',
    },
    {
      title: 'Using new Date() instead of parseISO for ISO strings',
      wrong: `// Unreliable — some browsers interpret date-only ISO as UTC midnight
const d = new Date('2024-06-08'); // shifts to 2024-06-07 in UTC-5 timezone
format(d, 'yyyy-MM-dd'); // '2024-06-07' — off by one day`,
      right: `import { parseISO } from 'date-fns';
const d = parseISO('2024-06-08'); // local midnight, consistent everywhere
format(d, 'yyyy-MM-dd'); // '2024-06-08' reliably`,
      explanation: 'Passing a date-only ISO string to new Date() creates a UTC midnight Date, which falls on the previous calendar day in any negative-UTC-offset timezone. parseISO parses as local midnight, matching user expectations.',
    },
    {
      title: 'Forgetting isValid() after parse()',
      wrong: `// BUG: parse() returns Invalid Date on bad input, not null
const d = parse(userInput, 'yyyy-MM-dd', new Date());
const out = format(d, 'dd MMM yyyy'); // RangeError if d is Invalid Date`,
      right: `const d = parse(userInput, 'yyyy-MM-dd', new Date());
const out = isValid(d) ? format(d, 'dd MMM yyyy') : 'Invalid date';`,
      explanation: 'parse() returns an Invalid Date object — not null or undefined — when the string does not match the pattern. Calling format() on it throws a RangeError at runtime. Always guard with isValid() before using the result.',
    },
    {
      title: 'Confusing DD (day of year) with dd (day of month)',
      wrong: `// BUG: DD is day-of-year (1-366), not day-of-month!
format(new Date('2026-06-08'), 'DD/MM/yyyy'); // '159/06/2026' — wrong`,
      right: `// dd is day-of-month (1-31)
format(new Date('2026-06-08'), 'dd/MM/yyyy'); // '08/06/2026' — correct`,
      explanation: 'date-fns follows Unicode CLDR token conventions strictly: lowercase dd = day of month (1–31), uppercase DD = day of year (1–366). This is one of the most common silent bugs — the output looks plausible until you notice dates over 31.',
    },
    {
      title: 'Making a TimeAgo pipe pure — it never updates',
      wrong: `// BUG: pure pipe caches the result and never re-evaluates
// "3 minutes ago" stays frozen even as time passes
@Pipe({ name: 'timeAgo', pure: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date): string { return formatDistanceToNow(value, { addSuffix: true }); }
}`,
      right: `// Correct: pure: false — Angular re-evaluates every change detection cycle
@Pipe({ name: 'timeAgo', pure: false })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date): string { return formatDistanceToNow(value, { addSuffix: true }); }
}`,
      explanation: 'A pure pipe caches its result and only re-runs when the input reference changes. A relative timestamp ("3 minutes ago") changes with time — the input Date reference stays the same. Use pure: false so Angular re-evaluates on every change detection tick.',
    },
  ];

  challenge: Challenge = {
    title: 'Trip Countdown Tracker',
    description: 'Build an Angular component that takes a departure date signal, parses it with date-fns, validates it, then computes and displays: (1) the formatted departure date (e.g. "Monday, June 15th, 2026"), (2) the number of days until departure using differenceInDays, and (3) a reminder date 3 days before departure using addDays. Show "Invalid date entered." if the input cannot be parsed.',
    language: 'typescript',
    hints: [
      'Use parse(str, "yyyy-MM-dd", new Date()) to convert the signal string to a Date — never pass the raw string to new Date() directly.',
      'Always call isValid(date) before using the parsed Date in format(), differenceInDays(), or addDays() to avoid runtime errors with bad input.',
      'differenceInDays(departure, today) gives a positive number when departure is in the future — later date first.',
      'addDays(date, -3) returns a new Date 3 days earlier — date-fns never mutates the original Date object.',
    ],
    starterCode: `import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { format, parse, isValid, differenceInDays, addDays } from 'date-fns';

@Component({
  selector: 'app-trip-countdown',
  imports: [FormsModule],
  template: \`
    <div>
      <h2>Trip Countdown</h2>
      <label>
        Departure date:
        <input type="date" [value]="departureStr()"
               (change)="departureStr.set($any($event.target).value)" />
      </label>

      <!-- TODO: Show 'Invalid date entered.' if the parsed date is not valid -->

      <!-- TODO: Show formatted departure, days until, and reminder date -->
    </div>
  \`,
})
export class TripCountdown {
  departureStr = signal(format(new Date(), 'yyyy-MM-dd'));

  // TODO: computed that parses departureStr() with pattern 'yyyy-MM-dd'
  departureDate = computed(() => { /* ... */ });

  // TODO: formatted departure — 'EEEE, MMMM do, yyyy'
  formattedDeparture = computed(() => { /* ... */ });

  // TODO: days until departure — differenceInDays(departure, today)
  daysUntil = computed(() => { /* ... */ });

  // TODO: reminder date — addDays(departure, -3), formatted
  reminderDate = computed(() => { /* ... */ });
}`,
    solution: `import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { format, parse, isValid, differenceInDays, addDays } from 'date-fns';

@Component({
  selector: 'app-trip-countdown',
  imports: [FormsModule],
  template: \`
    <div>
      <h2>Trip Countdown</h2>
      <label>
        Departure date:
        <input type="date" [value]="departureStr()"
               (change)="departureStr.set($any($event.target).value)" />
      </label>

      @if (!isValid(departureDate())) {
        <p style="color:red">Invalid date entered.</p>
      } @else {
        <p>Departure: <strong>{{ formattedDeparture() }}</strong></p>
        <p>Days until departure: <strong>{{ daysUntil() }}</strong></p>
        <p>Set a reminder on: <strong>{{ reminderDate() }}</strong></p>
      }
    </div>
  \`,
})
export class TripCountdown {
  departureStr = signal(format(new Date(), 'yyyy-MM-dd'));

  departureDate = computed(() =>
    parse(this.departureStr(), 'yyyy-MM-dd', new Date())
  );

  formattedDeparture = computed(() => {
    const d = this.departureDate();
    return isValid(d) ? format(d, 'EEEE, MMMM do, yyyy') : 'Invalid date';
  });

  daysUntil = computed(() => {
    const d = this.departureDate();
    return isValid(d) ? differenceInDays(d, new Date()) : 0;
  });

  reminderDate = computed(() => {
    const d = this.departureDate();
    return isValid(d) ? format(addDays(d, -3), 'MMMM do, yyyy') : 'Invalid date';
  });

  // Make isValid available in the template
  isValid = isValid;
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'date-fns is a collection of tree-shakeable, pure, immutable date utility functions for JavaScript — import only what you use, chain freely, always validate parse() output with isValid(), and pass later date first to differenceIn* functions.',
    mustKnow: [
      'date-fns functions are <strong>pure and immutable</strong> — <code>addDays(d, 7)</code> returns a new Date; the original <code>d</code> is never changed. Safe for Angular Signals.',
      '<code>format(date, pattern)</code> uses Unicode tokens: <code>yyyy</code> year, <code>MM</code> month, <code>dd</code> day-of-month — <code>DD</code> is day-of-year (common bug)',
      'Always call <code>isValid(d)</code> after <code>parse()</code> — it returns an Invalid Date object (not null) on bad input; <code>format(Invalid Date)</code> throws <code>RangeError</code>',
      '<code>differenceInDays(later, earlier)</code> — later date first for a positive result; reversed arguments return a negative number',
      'For ISO 8601 strings use <code>parseISO()</code>, not <code>new Date(\'2024-06-08\')</code> — the latter can shift by one day in negative-UTC timezones',
      'Locales are separate imports: <code>import { fr } from \'date-fns/locale\'</code> then <code>format(date, \'MMMM\', { locale: fr })</code> — unused locales are tree-shaken',
      'A "time ago" Angular pipe must be <code>pure: false</code> so it re-evaluates as time passes — a pure pipe caches on reference, which never changes for a timestamp',
    ],
    interviewFocus: [
      'Why is date-fns preferred over Moment.js in modern Angular? (tree-shaking, immutability, maintenance mode)',
      'What happens if you call format() on the result of parse() without checking isValid() first?',
      'What is the difference between DD and dd in a date-fns format string? (day-of-year vs day-of-month)',
      'Why must you pass the later date first to differenceInDays()?',
      'When should you use parseISO() instead of parse() or new Date()?',
    ],
  };
}
