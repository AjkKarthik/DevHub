import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-timezone-handling-date-fns-tz-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './timezone-handling-date-fns-tz.html',
  styleUrl: './timezone-handling-date-fns-tz.scss',
})
export class TimezoneHandlingDateFnsTzSubtopic {

  dateFnsDeps = { 'date-fns': 'latest', 'date-fns-tz': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'The core problem — a JS Date has no timezone of its own',
      points: [
        'A native JavaScript <code>Date</code> object internally stores a single UTC timestamp — it has NO timezone attached to it. Every display operation (<code>format()</code>, <code>toLocaleString()</code>) implicitly uses the BROWSER\'s local timezone, which is fine for a single-timezone app but wrong the moment you need to show "what time is it for this user in Tokyo" while the app itself runs in New York.',
        'date-fns core intentionally has NO timezone conversion functions — <code>formatInTimeZone</code>, <code>toZonedTime</code>, and <code>fromZonedTime</code> live in the SEPARATE companion package <code>date-fns-tz</code>, keeping the core library\'s bundle size minimal for the (majority) of apps that only ever deal with one timezone.',
      ],
    },
    {
      heading: 'formatInTimeZone — display in a SPECIFIC zone regardless of the browser\'s',
      points: [
        '<code>formatInTimeZone(date, \'America/New_York\', \'yyyy-MM-dd HH:mm:ss zzz\')</code> formats a Date as it would appear IN THAT TIMEZONE, no matter what timezone the browser running the code is actually in — the standard way to show "meeting time in the customer\'s timezone" on a dashboard used by support staff worldwide.',
        'IANA timezone identifiers (<code>\'America/New_York\'</code>, <code>\'Asia/Tokyo\'</code>, <code>\'Europe/London\'</code>) — NOT abbreviations like <code>\'EST\'</code> or offsets like <code>\'-05:00\'</code> — are the correct input, because IANA zones correctly encode daylight saving time transitions; a fixed offset does not.',
      ],
    },
    {
      heading: 'toZonedTime and fromZonedTime — converting between representations',
      points: [
        '<code>toZonedTime(utcDate, \'Asia/Tokyo\')</code> returns a Date object whose LOCAL-TIMEZONE-INTERPRETED fields (via <code>getHours()</code>, <code>getDate()</code>, etc.) match what a clock in Tokyo would show — useful when you need to feed a timezone-shifted value into a component (like a native date picker) that only understands the browser\'s local time.',
        '<code>fromZonedTime(localDateString, \'Asia/Tokyo\')</code> does the REVERSE — given wall-clock time that a person in Tokyo entered (e.g., from a form input), it returns the correct underlying UTC Date. This round-trip pair is essential for "the user picks a time in their own timezone, but we store/send UTC to the server."',
      ],
    },
    {
      heading: 'Practical guidance',
      points: [
        'ALWAYS store and transmit dates as UTC (ISO 8601 strings with a <code>Z</code> suffix, or Unix timestamps) — only convert to a specific timezone at the very last step, for DISPLAY. Storing "local time" strings without a timezone attached is a common source of off-by-several-hours bugs when data crosses timezone boundaries.',
        'Detect the browser\'s current IANA timezone with <code>Intl.DateTimeFormat().resolvedOptions().timeZone</code> — this native browser API (not date-fns) is the standard way to get a value like <code>\'America/Los_Angeles\'</code> for the "display in MY timezone" default case.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>The SAME instant, formatted in three different timezones</h3>
    <p>New York: {{ nyTime() }}</p>
    <p>Tokyo: {{ tokyoTime() }}</p>
    <p>London: {{ londonTime() }}</p>

    <h3>Round trip — a user in Tokyo enters "2024-06-15 09:00", stored as UTC</h3>
    <p>UTC instant stored: {{ storedUtc() }}</p>
    <p>Displayed back to the Tokyo user: {{ displayedToTokyoUser() }}</p>

    <h3>Your browser's detected timezone</h3>
    <p>{{ browserTimeZone() }}</p>
  \`,
})
export class App {
  private now = new Date('2024-06-15T13:00:00Z'); // a fixed UTC instant for a stable demo

  nyTime = signal(formatInTimeZone(this.now, 'America/New_York', 'yyyy-MM-dd HH:mm zzz'));
  tokyoTime = signal(formatInTimeZone(this.now, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm zzz'));
  londonTime = signal(formatInTimeZone(this.now, 'Europe/London', 'yyyy-MM-dd HH:mm zzz'));

  // A Tokyo user typed "2024-06-15 09:00" into a form — convert THEIR wall-clock time to UTC
  private tokyoUserInput = '2024-06-15 09:00';
  private storedUtcDate = fromZonedTime(this.tokyoUserInput, 'Asia/Tokyo');

  storedUtc = signal(formatInTimeZone(this.storedUtcDate, 'UTC', 'yyyy-MM-dd HH:mm zzz'));
  displayedToTokyoUser = signal(formatInTimeZone(this.storedUtcDate, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm zzz'));

  browserTimeZone = signal(Intl.DateTimeFormat().resolvedOptions().timeZone);
}
`,
    },
    {
      path: 'src/main.ts',
      content: `import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';

bootstrapApplication(App);
`,
    },
    {
      path: 'src/index.html',
      content: `<!doctype html>
<html>
  <head><title>Timezone handling with date-fns-tz</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a fourth timezone display for Sydney (Australia/Sydney), and verify it shows a date roughly 9-10 hours ahead of Tokyo (accounting for daylight saving).',
    hint: 'Add sydneyTime = signal(formatInTimeZone(this.now, \'Australia/Sydney\', \'yyyy-MM-dd HH:mm zzz\')); and a matching <p> in the template.',
    solution: `sydneyTime = signal(formatInTimeZone(this.now, 'Australia/Sydney', 'yyyy-MM-dd HH:mm zzz'));`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a JavaScript Date object has a timezone attached to it that you can read or change.',
      reality: 'a Date internally stores a single UTC timestamp with NO timezone attached — every display operation implicitly uses the browser\'s local timezone unless you explicitly convert with a library like date-fns-tz.',
    },
    {
      thought: 'timezone abbreviations like "EST" or fixed offsets like "-05:00" are safe inputs for timezone conversion.',
      reality: 'IANA timezone identifiers (America/New_York) are required for correctness — they encode daylight saving time transitions, while a fixed offset or abbreviation does not and will silently produce wrong results half the year.',
    },
    {
      thought: 'storing "local time" strings without a timezone is fine as long as your app only has one timezone right now.',
      reality: 'this is a common source of off-by-several-hours bugs the moment data crosses timezone boundaries (a new user signs up from another region, or the server moves) — always store/transmit UTC and convert only at the final display step.',
    },
  ];
}
