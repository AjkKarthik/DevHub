import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  format, formatDistance, formatRelative, addDays, addMonths, subDays,
  differenceInDays, differenceInYears, isWeekend, isPast, isFuture,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, parse, isValid,
  eachDayOfInterval, getDay
} from 'date-fns';
import { CodeBlockComponent, CodeTab } from '../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../shared/version-badge/version-badge';
import { PageMetaComponent } from '../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../shared/page-complete/page-complete';

@Component({
  selector: 'app-datefns-demo',
  imports: [FormsModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './datefns-demo.html',
  styleUrl: './datefns-demo.scss',
})
export class DateFnsDemo {
  now = new Date();

  // ── Format demo ───────────────────────────────────────────────────────────
  selectedDate = signal(format(new Date(), 'yyyy-MM-dd'));
  formatStr    = signal('MMMM do, yyyy');

  formatted = computed(() => {
    try {
      const d = parse(this.selectedDate(), 'yyyy-MM-dd', new Date());
      return isValid(d) ? format(d, this.formatStr()) : 'Invalid date';
    } catch { return 'Invalid format'; }
  });

  // ── Date math ─────────────────────────────────────────────────────────────
  baseDate  = signal(format(new Date(), 'yyyy-MM-dd'));
  addAmount = signal(7);
  addUnit   = signal<'days'|'months'>('days');

  afterAdd = computed(() => {
    const d = parse(this.baseDate(), 'yyyy-MM-dd', new Date());
    const result = this.addUnit() === 'days' ? addDays(d, this.addAmount()) : addMonths(d, this.addAmount());
    return format(result, 'MMMM do, yyyy');
  });

  // ── Relative time ─────────────────────────────────────────────────────────
  birthday    = signal('1995-06-15');
  birthdayAge = computed(() => {
    const d = parse(this.birthday(), 'yyyy-MM-dd', new Date());
    if (!isValid(d)) return 'Invalid date';
    return `${differenceInYears(new Date(), d)} years old (${formatDistance(d, new Date(), { addSuffix: true })})`;
  });

  // ── Calendar ──────────────────────────────────────────────────────────────
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

  qna: QnaItem[] = [
    { q: 'Why use date-fns instead of Moment.js?', a: 'date-fns is tree-shakeable — you import only the functions you use, so unused functions are removed from the bundle. Moment.js adds the full library (~67 kB). date-fns also treats dates as immutable — no mutation bugs.' },
    { q: 'How do you safely parse a user-typed date string with date-fns?', a: '<code>const d = parse(input, \'yyyy-MM-dd\', new Date())</code> then <code>isValid(d)</code>. Always check <code>isValid()</code> — <code>parse()</code> returns <code>Invalid Date</code> if the string doesn\'t match the format, which causes silent bugs if unchecked.' },
    { q: 'What is the difference between format() and formatDistance()?', a: '<code>format(date, \'dd MMM yyyy\')</code> formats to a fixed string like "08 Jun 2026". <code>formatDistance(date, new Date())</code> returns a relative string like "3 days ago" — useful for comment timestamps.' },
    { q: 'How do you add/subtract time with date-fns?', a: '<code>addDays(date, 7)</code>, <code>subMonths(date, 1)</code>, <code>addHours(date, 2)</code>. All return a <strong>new</strong> Date — the original is not mutated. Chain freely: <code>addHours(startOfDay(new Date()), 9)</code>.' },
    { q: 'How do you compare two dates with date-fns?', a: '<code>isBefore(dateA, dateB)</code>, <code>isAfter(dateA, dateB)</code>, <code>isEqual(dateA, dateB)</code>. For sorting: <code>compareAsc(a, b)</code> returns -1, 0, or 1 — pass directly to <code>Array.sort()</code>.' },
    { q: 'How do you generate a range of dates for a calendar?', a: '<code>eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) })</code> returns an array of every Date in the range. Perfect for building calendar grids — one call generates all 28–31 cells.' },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'Why date-fns over moment.js?',
    points: [
      'date-fns is tree-shakeable — you import only the functions you use, keeping bundle size tiny.',
      'All functions are pure and immutable — they return new Date objects, never mutate the input.',
      'Native <code>Date</code> objects throughout — no wrapper type to unwrap or convert.',
      'Moment.js is in maintenance mode (no new features). date-fns and Luxon are the recommended alternatives.',
    ],
  },
  {
    heading: 'format & parse',
    points: [
      '<code>format(date, pattern)</code> uses Unicode token patterns: <code>yyyy</code> year, <code>MM</code> month, <code>dd</code> day, <code>HH</code> 24h hour.',
      '<code>parse(str, pattern, referenceDate)</code> parses a string — the reference date fills in any missing parts.',
      'Always check <code>isValid(date)</code> after parsing user input — parse returns <code>Invalid Date</code> on bad input.',
      'Do NOT confuse <code>DD</code> (day of year) with <code>dd</code> (day of month) — a common bug in format strings.',
    ],
  },
  {
    heading: 'Date math & helpers',
    points: [
      'All math functions (<code>addDays</code>, <code>subMonths</code>, etc.) return new Date objects — originals are unchanged.',
      '<code>differenceInDays(later, earlier)</code> — argument order matters: later first, earlier second.',
      '<code>startOfMonth</code>, <code>endOfMonth</code>, <code>startOfWeek</code> etc. snap to boundaries — great for calendar UIs.',
      '<code>eachDayOfInterval({ start, end })</code> returns every Date in the range — perfect for building calendar grids.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      '<code>formatDistance</code> is locale-aware — pass <code>{ locale: enUS }</code> from <code>date-fns/locale</code> for explicit locale.',
      'Use <code>format(date, "yyyy-MM-dd\'T\'HH:mm:ss")</code> for ISO strings without timezone offset.',
      'date-fns works in UTC too: import functions from <code>date-fns/utc</code> (v3+) for UTC-safe operations.',
      'Avoid calling <code>new Date(\'2024-06-08\')</code> directly in browsers — parse with <code>parseISO</code> for reliable results.',
    ],
  },
];

  tabs: CodeTab[] = [
    {
      label: 'format',
      language: 'typescript',
      code: `import { format } from 'date-fns';

const now = new Date();

format(now, 'yyyy-MM-dd')           // '2025-06-08'
format(now, 'MMMM do, yyyy')        // 'June 8th, 2025'
format(now, 'dd/MM/yyyy HH:mm')     // '08/06/2025 14:30'
format(now, 'EEEE, MMM d')          // 'Sunday, Jun 8'
format(now, 'h:mm a')               // '2:30 PM'
format(now, 'ISO')                  // '2025-06-08T14:30:00'

// Parse a string first, then format:
import { parse, isValid } from 'date-fns';
const d = parse('15/06/1995', 'dd/MM/yyyy', new Date());
if (isValid(d)) format(d, 'MMMM do, yyyy');  // 'June 15th, 1995'`,
    },
    {
      label: 'Date math',
      language: 'typescript',
      code: `import { addDays, addMonths, subDays, addHours } from 'date-fns';

const now = new Date();

addDays(now, 7)       // 7 days from now
addMonths(now, 3)     // 3 months from now
subDays(now, 14)      // 14 days ago
addHours(now, -2)     // 2 hours ago

// Differences
import { differenceInDays, differenceInYears } from 'date-fns';
differenceInDays(future, past)    // days between two dates
differenceInYears(new Date(), dob)  // age in years`,
    },
    {
      label: 'Relative & helpers',
      language: 'typescript',
      code: `import { formatDistance, formatRelative, isPast, isFuture, isWeekend } from 'date-fns';

// Human-readable relative time
formatDistance(pastDate, new Date(), { addSuffix: true })
// → '3 days ago', '2 months ago', 'about 1 year ago'

formatRelative(nextSunday, new Date())
// → 'next Sunday at 12:00 PM'

// Predicates
isPast(date)      // date is before now
isFuture(date)    // date is after now
isWeekend(date)   // Saturday or Sunday
isValid(date)     // not NaN/Invalid Date

// Calendar helpers
import { eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
const days = eachDayOfInterval({
  start: startOfMonth(new Date()),
  end:   endOfMonth(new Date()),
});
// → array of every Date in the month`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What does `format(new Date(), \'MMMM do, yyyy\')` return for June 8th, 2026?', options: ['June 8th, 2026', '06/08/2026', '2026-06-08', 'Mon Jun 08 2026'], answer: 0, explanation: 'The pattern \'MMMM do, yyyy\' uses MMMM for the full month name, do for the ordinal day (8th), and yyyy for the 4-digit year — producing \'June 8th, 2026\'.' },
    { q: 'Which call correctly parses the string \'2024-03-15\' and checks that it is valid before formatting?', options: ['const d = new Date(\'2024-03-15\'); format(d, \'dd MMM yyyy\');', 'const d = parseISO(\'2024-03-15\'); format(d, \'dd MMM yyyy\');', 'const d = parse(\'2024-03-15\', \'yyyy-MM-dd\', new Date()); if (isValid(d)) format(d, \'dd MMM yyyy\');', 'const d = Date.parse(\'2024-03-15\'); format(d, \'dd MMM yyyy\');'], answer: 2, explanation: 'The correct approach is to use parse() with a format pattern and a reference date, then guard with isValid() before formatting. Date.parse() returns a number, and new Date() without parseISO can be unreliable across browsers.' },
    { q: 'What is the correct argument order for `differenceInDays` to get a positive number of days between two dates?', options: ['differenceInDays(earlier, later)', 'differenceInDays(later, earlier)', 'differenceInDays(start, end)', 'differenceInDays(dateA, dateB) — order does not matter'], answer: 1, explanation: 'differenceInDays(later, earlier) returns a positive number. Reversing the arguments yields a negative result. Order always matters — the component\'s theory block specifically calls this out.' },
    { q: 'In the DateFnsDemo component, what does `addDays(d, this.addAmount())` return when `addAmount` signal is 7?', options: ['The same Date object `d` mutated to be 7 days later', 'A new Date object representing 7 days after `d`', 'A string formatted as the date 7 days later', 'The number of milliseconds 7 days from `d`'], answer: 1, explanation: 'All date-fns math functions are pure and immutable — they return a new Date object and never mutate the input. The component relies on this to safely derive computed values from signals.' },
    { q: 'Why does the component call `eachDayOfInterval({ start: startOfMonth(…), end: endOfMonth(…) })` for the calendar grid?', options: ['To get the number of days in the current month as a number', 'To generate an array of every Date in the month, one per calendar cell', 'To validate that the start and end of the month are valid Date objects', 'To calculate the difference in days between the first and last day of the month'], answer: 1, explanation: 'eachDayOfInterval returns an array of Date objects — one for each day in the given range. The component uses this array directly in an @for loop to render each calendar cell.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'format', type: 'function', desc: 'Formats a Date object into a string using Unicode token patterns like \'yyyy-MM-dd\' or \'MMMM do, yyyy\'.' },
    { name: 'parse', type: 'function', desc: 'Parses a date string into a Date object given a format pattern and a reference date for filling missing parts.' },
    { name: 'isValid', type: 'function', desc: 'Returns true if the given Date object is valid, false for Invalid Date — always use after parse() on user input.' },
    { name: 'formatDistance', type: 'function', desc: 'Returns a human-readable relative time string such as \'3 days ago\' or \'in about 2 months\'.' },
    { name: 'addDays / addMonths', type: 'function', desc: 'Returns a new Date with the specified number of days or months added; originals are never mutated.' },
    { name: 'differenceInDays / differenceInYears', type: 'function', desc: 'Calculates the integer difference between two dates; argument order matters — pass the later date first for a positive result.' },
    { name: 'eachDayOfInterval', type: 'function', desc: 'Returns an array of every Date in a given { start, end } interval — ideal for building calendar grids.' },
    { name: 'startOfMonth / endOfMonth', type: 'function', desc: 'Snaps a date to the exact start or end boundary of its month, useful for calendar range queries.' },
    { name: 'isWeekend / isPast / isFuture', type: 'function', desc: 'Predicate helpers that return a boolean indicating whether a date falls on a weekend, before now, or after now.' },
    { name: 'parseISO', type: 'function', desc: 'Safely parses ISO 8601 strings (e.g. \'2024-06-08\') in a browser-consistent way, unlike new Date() which can misinterpret timezone.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Date formatting: native toString vs date-fns format()', before: '// Old approach — relies on browser locale, unpredictable output\nconst d = new Date();\nconst str = d.toLocaleDateString(); // \'en-US\' vs \'en-GB\' differ\nconsole.log(str); // \'6/8/2026\' or \'08/06/2026\'', after: '// date-fns: explicit, locale-independent, tree-shakeable\nimport { format } from \'date-fns\';\nconst d = new Date();\nconst str = format(d, \'MMMM do, yyyy\'); // \'June 8th, 2026\'\nconsole.log(str);',
      note: 'format() uses Unicode token patterns giving you full control regardless of the user\'s system locale.' },
    { title: 'Parsing user input: new Date() vs parse() + isValid()', before: '// Risky — browser-inconsistent, no validation\nconst d = new Date(userInput);\nconst result = format(d, \'dd MMM yyyy\'); // may throw or give wrong date', after: '// Safe — explicit pattern, validated before use\nimport { parse, isValid, format } from \'date-fns\';\nconst d = parse(userInput, \'yyyy-MM-dd\', new Date());\nconst result = isValid(d) ? format(d, \'dd MMM yyyy\') : \'Invalid date\';',
      note: 'Always guard with isValid() after parse() — it returns Invalid Date on bad input which causes silent bugs downstream.' },
    { title: 'Relative time: manual string building vs formatDistance()', before: '// Manual, error-prone, no locale support\nconst diff = Math.floor((Date.now() - date.getTime()) / 86400000);\nconst label = diff + \' days ago\';', after: '// date-fns: locale-aware, handles all time units automatically\nimport { formatDistance } from \'date-fns\';\nconst label = formatDistance(date, new Date(), { addSuffix: true });\n// \'3 days ago\', \'about 2 months ago\', \'in 1 hour\'',
      note: 'formatDistance() handles seconds through years and is locale-aware when a locale option is passed.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Wrong argument order in differenceInDays', wrong: '// Returns negative number — args reversed\nconst days = differenceInDays(pastDate, futureDate);\nconsole.log(days); // -30 (wrong)', right: '// Later date first for a positive result\nconst days = differenceInDays(futureDate, pastDate);\nconsole.log(days); // 30', explanation: 'differenceInDays(a, b) computes a minus b. To get a positive count, always pass the later date as the first argument.'  },
    { title: 'Using new Date() instead of parseISO for ISO strings', wrong: '// Unreliable in some browsers — treats as UTC midnight\nconst d = new Date(\'2024-06-08\');\nformat(d, \'yyyy-MM-dd\'); // may show \'2024-06-07\' in UTC-offset browsers', right: 'import { parseISO } from \'date-fns\';\nconst d = parseISO(\'2024-06-08\');\nformat(d, \'yyyy-MM-dd\'); // \'2024-06-08\' reliably', explanation: 'Passing a date-only ISO string to new Date() creates a UTC midnight date which can shift to the previous day in negative UTC offset timezones. parseISO handles this correctly.'  },
    { title: 'Skipping isValid() after parse()', wrong: 'const d = parse(userInput, \'yyyy-MM-dd\', new Date());\nconst out = format(d, \'dd MMM yyyy\'); // throws if d is Invalid Date', right: 'const d = parse(userInput, \'yyyy-MM-dd\', new Date());\nconst out = isValid(d) ? format(d, \'dd MMM yyyy\') : \'Invalid date\';', explanation: 'parse() returns an Invalid Date object (not null or undefined) when the string does not match the pattern. Calling format() on it throws a RangeError at runtime.'  },
    { title: 'Confusing DD (day of year) with dd (day of month) in format patterns', wrong: '// DD is day-of-year (1-365), not day-of-month!\nformat(new Date(\'2026-06-08\'), \'DD/MM/yyyy\'); // \'159/06/2026\' — wrong', right: '// dd is day-of-month (1-31)\nformat(new Date(\'2026-06-08\'), \'dd/MM/yyyy\'); // \'08/06/2026\' — correct', explanation: 'date-fns follows Unicode token conventions strictly: lowercase dd is day of month, uppercase DD is day of year. Mixing them up is a very common bug.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'date-fns v3', label: 'date-fns v3 (2023)', features: ['UTC-safe variants of all functions available under the \'date-fns/utc\' subpath import', 'TypeScript-first rewrite with improved type inference and stricter interval types', 'Tree-shaking improved further — individual functions are ES modules by default'] },
    { version: 'Angular 16', label: 'Angular 16 — Signals', features: ['signal() and computed() introduced as developer preview — enables reactive date state without RxJS', 'Component class properties can be signals, making date-fns computed formatting fully reactive'] },
  ];

  challenge: Challenge = {
    title: 'Trip Countdown Tracker',
    description: 'Build a small Angular component that takes a departure date string from a signal, parses it with date-fns, validates it with isValid, then computes and displays: (1) the formatted departure date (e.g. \'Monday, June 15th, 2026\'), (2) the number of days until departure using differenceInDays, and (3) the date 3 days before departure (a reminder date) using addDays. Show an \'Invalid date\' message if the input cannot be parsed.',
    language: 'typescript',
    hints: [
      'Use parse(str, \'yyyy-MM-dd\', new Date()) to convert the signal string to a Date object — never pass the raw string to new Date() directly.',
      'Always call isValid(date) before using the parsed Date in format(), differenceInDays(), or addDays() to avoid runtime errors with bad input.',
      'differenceInDays(departure, today) gives a positive number when the departure is in the future — make sure the argument order is later date first.',
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
        <input type="date" [value]="departureStr()" (change)="departureStr.set($any($event.target).value)" />
      </label>

      <!-- TODO: Show 'Invalid date entered.' if the parsed date is not valid -->

      <!-- TODO: Show the formatted departure date, days until departure,
           and the reminder date (3 days before departure) -->
    </div>
  \`,
})
export class TripCountdown {
  departureStr = signal(format(new Date(), 'yyyy-MM-dd'));

  // TODO: computed signal that parses departureStr and returns a Date (or Invalid Date)
  departureDate = computed(() => {
    // parse departureStr() using pattern 'yyyy-MM-dd'
  });

  // TODO: computed signal — formatted string like 'EEEE, MMMM do, yyyy'
  formattedDeparture = computed(() => {
    // guard with isValid, return 'Invalid date' if not valid
  });

  // TODO: computed signal — days between today and departure (use differenceInDays)
  daysUntil = computed(() => {
    // guard with isValid
  });

  // TODO: computed signal — reminder date (3 days before departure) formatted
  reminderDate = computed(() => {
    // use addDays with a negative offset, guard with isValid
  });
}
`,
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
        <input type="date" [value]="departureStr()" (change)="departureStr.set($any($event.target).value)" />
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
}
`,
  };
}
