import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-intervals-and-recurring-events-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './intervals-and-recurring-events.html',
  styleUrl: './intervals-and-recurring-events.scss',
})
export class IntervalsAndRecurringEventsSubtopic {

  dateFnsDeps = { 'date-fns': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'The Interval object — a shared shape across many functions',
      points: [
        'An <code>Interval</code> is just <code>{ start: Date | number, end: Date | number }</code> — the SAME shape is accepted by <code>eachDayOfInterval</code>, <code>eachWeekOfInterval</code>, <code>eachMonthOfInterval</code>, <code>isWithinInterval</code>, and <code>areIntervalsOverlapping</code>. Learning this one shape unlocks the whole family of interval functions.',
        '<code>eachWeekOfInterval({ start, end })</code> returns the START DATE of every week that overlaps the interval — pass <code>{ weekStartsOn: 1 }</code> (Monday) as a second argument to override the default Sunday-start convention, essential for non-US calendar UIs.',
        '<code>eachMonthOfInterval({ start, end })</code> returns the 1st of every month between start and end — the standard way to generate month-picker tabs or a year-at-a-glance view without manual month-increment loops.',
      ],
    },
    {
      heading: 'Overlap and containment checks',
      points: [
        '<code>isWithinInterval(date, { start, end })</code> answers "is this single date inside this range?" — INCLUSIVE of both boundaries. The standard check for "is today within the promotion period" or "does this booking fall in the blocked-out range."',
        '<code>areIntervalsOverlapping(intervalA, intervalB)</code> answers a genuinely different question: "do these TWO RANGES overlap at all?" — the standard building block for calendar/booking conflict detection (does a new reservation collide with an existing one). Pass <code>{ inclusive: true }</code> to treat touching endpoints as overlapping.',
        'These two functions are commonly confused because they sound similar — <code>isWithinInterval</code> checks a POINT against a range; <code>areIntervalsOverlapping</code> checks a RANGE against a range. Using the wrong one silently produces incorrect conflict detection.',
      ],
    },
    {
      heading: 'intervalToDuration — a human-shaped breakdown',
      points: [
        '<code>intervalToDuration({ start, end })</code> returns a <code>Duration</code> object — <code>{ years, months, days, hours, minutes, seconds }</code> — the CORRECT calendar-aware breakdown between two dates, unlike naively dividing <code>differenceInDays</code> by 30 for "months" (which is wrong for months of different lengths).',
        '<code>formatDuration(duration, { format: [\'years\', \'months\', \'days\'] })</code> turns that object into a readable string like "2 years 3 months 12 days" — combine the two functions for a genuinely accurate "time remaining" or "age" display.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal } from '@angular/core';
import {
  eachMonthOfInterval, format, isWithinInterval, areIntervalsOverlapping,
  intervalToDuration, formatDuration,
} from 'date-fns';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>eachMonthOfInterval — months in a 6-month range</h3>
    <p>{{ months().join(', ') }}</p>

    <h3>Booking conflict check with areIntervalsOverlapping</h3>
    <p>Existing booking: Jun 10 - Jun 15</p>
    <p>New booking: Jun 14 - Jun 20</p>
    <p>Conflict: {{ hasConflict() ? '❌ Overlaps' : '✅ No overlap' }}</p>

    <h3>intervalToDuration + formatDuration — accurate breakdown</h3>
    <p>{{ durationText() }}</p>
  \`,
})
export class App {
  months = signal(
    eachMonthOfInterval({ start: new Date(2024, 0, 1), end: new Date(2024, 5, 1) })
      .map(d => format(d, 'MMM yyyy')),
  );

  private existingBooking = { start: new Date(2024, 5, 10), end: new Date(2024, 5, 15) };
  private newBooking = { start: new Date(2024, 5, 14), end: new Date(2024, 5, 20) };

  hasConflict = signal(areIntervalsOverlapping(this.existingBooking, this.newBooking));

  durationText = signal(
    formatDuration(
      intervalToDuration({ start: new Date(2022, 2, 15), end: new Date() }),
      { format: ['years', 'months', 'days'] },
    ),
  );
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
  <head><title>Intervals and recurring events</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the new booking to Jun 16 - Jun 20 (no longer overlapping the existing Jun 10-15 booking), and verify hasConflict correctly flips to false.',
    hint: 'Change newBooking\'s start from new Date(2024, 5, 14) to new Date(2024, 5, 16) — since the existing booking ends on the 15th, a booking starting the 16th no longer overlaps.',
    solution: `private newBooking = { start: new Date(2024, 5, 16), end: new Date(2024, 5, 20) };`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'isWithinInterval and areIntervalsOverlapping check the same kind of thing, just with different argument counts.',
      reality: 'isWithinInterval checks a single POINT against a range — areIntervalsOverlapping checks whether two RANGES overlap each other; using the wrong one for booking-conflict detection silently produces incorrect results.',
    },
    {
      thought: 'computing "months between two dates" by dividing differenceInDays by 30 is close enough for a duration display.',
      reality: 'months have different lengths (28-31 days) — intervalToDuration computes the CORRECT calendar-aware breakdown, while a division-by-30 approximation produces visibly wrong results especially over longer spans.',
    },
    {
      thought: 'eachWeekOfInterval always starts weeks on Sunday.',
      reality: 'Sunday is only the DEFAULT — pass { weekStartsOn: 1 } (or another day 0-6) as a second argument to match a Monday-start (or other) calendar convention.',
    },
  ];
}
