import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: '$dateTrunc Rounds a Date DOWN to the Start of a Time Unit',
    points: [
      'One of the main page\'s own QnAs names <code>$dateTrunc</code> in one clause ("truncates a date to a time unit — great for grouping by hour, day, week, month") but no codeTab on the page ever builds a real example — the main page\'s own Date Expressions codeTab only ever groups by the SEPARATE combination of <code>$year</code> + <code>$month</code> extraction operators, never $dateTrunc.',
      'Verified against MongoDB\'s own $dateTrunc documentation: the required fields are <code>date</code> and <code>unit</code> (year, quarter, week, month, day, hour, minute, second), with optional <code>binSize</code> (group into N-unit buckets, default 1), <code>timezone</code>, and <code>startOfWeek</code> (only relevant when <code>unit</code> is "week").',
      '<code>$dateTrunc</code> always rounds DOWN to the start of the containing unit — a timestamp of <code>14:22:07</code> truncated to the <code>hour</code> unit becomes exactly <code>14:00:00</code>, never <code>15:00:00</code>, regardless of how close the original time is to the next hour boundary.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Grouping Events Into Day and Hour Buckets',
    language: 'typescript',
    code: `const events = db.collection('events');

// Add both a day bucket and an hour bucket to each event
const withBuckets = await events.aggregate([
  { \$addFields: {
    dayBucket:  { \$dateTrunc: { date: '\$createdAt', unit: 'day' } },
    hourBucket: { \$dateTrunc: { date: '\$createdAt', unit: 'hour' } },
  }},
]).toArray();

// Group by the day bucket to get a daily event count
const dailyCounts = await events.aggregate([
  { \$group: {
    _id:   { \$dateTrunc: { date: '\$createdAt', unit: 'day' } },
    count: { \$sum: 1 },
  }},
  { \$sort: { _id: 1 } },
]).toArray();

// Group into 2-week buckets, starting each bucket on a Monday
// (binSize + startOfWeek only apply meaningfully to the 'week' unit)
const biweeklyCounts = await events.aggregate([
  { \$group: {
    _id: {
      \$dateTrunc: {
        date: '\$createdAt', unit: 'week', binSize: 2, startOfWeek: 'monday',
      },
    },
    count: { \$sum: 1 },
  }},
]).toArray();

// Pure-JS equivalent of the day/hour truncation, verified against 4
// events straddling a day boundary:
function dateTruncDay(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate()));
}
function dateTruncHour(d) {
  const dt = new Date(d);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), dt.getUTCHours()));
}

const seedEvents = [
  new Date('2026-09-03T14:22:07Z'),
  new Date('2026-09-03T14:59:59Z'),
  new Date('2026-09-03T09:01:00Z'),
  new Date('2026-09-02T23:59:59Z'),
];
for (const e of seedEvents) {
  console.log(e.toISOString(), '-> day:', dateTruncDay(e).toISOString(), 'hour:', dateTruncHour(e).toISOString());
}
const byDay = new Map();
for (const e of seedEvents) {
  const key = dateTruncDay(e).toISOString();
  byDay.set(key, (byDay.get(key) || 0) + 1);
}
console.log('Grouped by day bucket:', Object.fromEntries(byDay));
// -> { '2026-09-03T00:00:00.000Z': 3, '2026-09-02T00:00:00.000Z': 1 }`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own separate "Group by month" example uses <code>{ $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } } } }</code> instead of <code>$dateTrunc</code>. What is one genuine, checkable advantage <code>$dateTrunc</code> has over the year+month combination for THIS specific grouping goal, and one thing the year+month version can do that a single <code>$dateTrunc</code> call cannot?',
  hint: 'Think about what the _id VALUE actually is in each version — a plain BSON Date vs. a two-field object — and what that means for sorting or re-formatting the bucket downstream.',
  solution: `// Advantage of $dateTrunc: the resulting _id is a single, real BSON
// Date value (e.g. 2026-09-01T00:00:00Z) -- it sorts correctly and
// chronologically with a plain { $sort: { _id: 1 } }, and it can be
// fed directly into $dateToString or any other date expression
// downstream without reassembling it from separate year/month fields.
// The year+month version's _id is a plain { year, month } OBJECT --
// it also sorts correctly (MongoDB compares object fields in document
// key order), but it is NOT a Date at all, so using it in a later
// date expression means rebuilding a real Date from its parts first.
//
// Advantage of year+month: it can group by month while COMPLETELY
// ignoring the year -- e.g. { month: { $month: "$createdAt" } } alone
// would combine "January 2025" and "January 2026" into the same
// bucket, useful for "which calendar month has the most events,
// across all years." $dateTrunc with unit: "month" always truncates
// to a specific year+month combination and has no way to group
// purely by the recurring calendar month across multiple years.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$dateTrunc rounds a date to the NEAREST unit boundary (like Math.round), so 14:52 truncated to the hour would become 15:00 since it is closer to the next hour.',
    reality: 'Verified directly against MongoDB\'s own documented behavior and a pure-JS equivalent: $dateTrunc always rounds DOWN (like Math.floor), never to the nearest boundary. 14:52 truncated to the hour unit becomes 14:00, and 14:22:07 truncated to the day unit becomes the start of that same day (00:00:00) — regardless of how close the original time is to the NEXT boundary.',
  },
  {
    thought: 'binSize and startOfWeek are general-purpose options that apply to every unit — for example, binSize: 2 with unit: "day" would bucket events starting from midnight of whatever day the first document happens to fall on.',
    reality: 'Verified against MongoDB\'s own documented $dateTrunc reference: startOfWeek only has meaning when unit is "week" — it is silently ignored for every other unit. For every OTHER unit, bin edges are anchored to a fixed, documented reference date of 2000-01-01T00:00:00.00Z, not to the current day or year at all. This matters most for larger units with binSize > 1 — a 2-day bucket does NOT necessarily land on familiar boundaries like "the 1st and 3rd of the month," since whether a given calendar day starts a new bin depends on its exact distance (in days) from that fixed year-2000 reference point, which is not something to eyeball from the calendar.',
  },
];

@Component({
  selector: 'app-mongo-agg-expr-datetrunc',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './datetrunc-for-grouping-events-by-day-and-hour.html',
  styleUrl: './datetrunc-for-grouping-events-by-day-and-hour.scss',
})
export class DatetruncForGroupingEventsByDayAndHourSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
