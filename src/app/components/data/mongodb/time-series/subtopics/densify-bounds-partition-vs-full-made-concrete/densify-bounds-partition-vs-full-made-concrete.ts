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
    heading: 'Partition Stays Within Each Sensor; Full Stretches Every Sensor to Match',
    points: [
      'The main page\'s own QnA explains the difference between $densify\'s <code>bounds: "partition"</code> and <code>bounds: "full"</code> in real detail, with a worked example (sensor A from 9:00-10:00, sensor B from 8:00-9:00) — but the ONLY $densify codeTab on the page uses <code>bounds: "partition"</code>, so <code>"full"</code> is never actually demonstrated.',
      '<code>bounds: "partition"</code> densifies each partition (each distinct <code>partitionByFields</code> value) only between ITS OWN observed minimum and maximum timestamp. A sensor that only ever reported between 9:00 and 9:15 gets densified only within that 15-minute window.',
      '<code>bounds: "full"</code> instead uses the GLOBAL minimum and maximum timestamp across the ENTIRE input to the stage — every partition gets densified across that same full range, even for time periods where that specific partition never had a single real reading at all.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'partition vs. full, Same Input Data',
    language: 'typescript',
    code: `const readings = db.collection('temperatures');
// Sensor A: readings from 9:00 to 9:15 only
// Sensor B: readings from 8:00 to 8:15 only (a DIFFERENT, earlier window)

const densifiedPartition = await readings.aggregate([
  { \$densify: {
    field: 'timestamp',
    partitionByFields: ['sensorId'],
    range: { step: 5, unit: 'minute', bounds: 'partition' },
  }},
]).toArray();
// Sensor A densified ONLY within 9:00-9:15; Sensor B ONLY within 8:00-8:15

const densifiedFull = await readings.aggregate([
  { \$densify: {
    field: 'timestamp',
    partitionByFields: ['sensorId'],
    range: { step: 5, unit: 'minute', bounds: 'full' },
  }},
]).toArray();
// BOTH sensors densified across the FULL 8:00-9:15 range -- Sensor A
// gets null placeholders for 8:00-8:55 (it never reported then), and
// Sensor B gets null placeholders for 8:20-9:15 (it never reported then)

// Pure-JS equivalent, verified against the exact scenario above:
function toMinutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
function toTimeStr(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return \`\${String(h).padStart(2, '0')}:\${String(m).padStart(2, '0')}\`;
}

function densifyPartition(docs, step) {
  const bySensor = new Map();
  for (const d of docs) { if (!bySensor.has(d.sensorId)) bySensor.set(d.sensorId, []); bySensor.get(d.sensorId).push(d); }
  const result = [];
  for (const [sensorId, group] of bySensor) {
    const times = group.map(d => toMinutes(d.timestamp));
    const min = Math.min(...times), max = Math.max(...times);
    const existing = new Set(times);
    for (let t = min; t <= max; t += step) {
      result.push(existing.has(t) ? group.find(d => toMinutes(d.timestamp) === t) : { sensorId, timestamp: toTimeStr(t), value: null });
    }
  }
  return result;
}
function densifyFull(docs, step) {
  const allTimes = docs.map(d => toMinutes(d.timestamp));
  const globalMin = Math.min(...allTimes), globalMax = Math.max(...allTimes);
  const bySensor = new Map();
  for (const d of docs) { if (!bySensor.has(d.sensorId)) bySensor.set(d.sensorId, []); bySensor.get(d.sensorId).push(d); }
  const result = [];
  for (const [sensorId, group] of bySensor) {
    const existing = new Map(group.map(d => [toMinutes(d.timestamp), d]));
    for (let t = globalMin; t <= globalMax; t += step) {
      result.push(existing.has(t) ? existing.get(t) : { sensorId, timestamp: toTimeStr(t), value: null });
    }
  }
  return result;
}

const seed = [
  { sensorId: 'A', timestamp: '09:00', value: 20 },
  { sensorId: 'A', timestamp: '09:15', value: 23 },
  { sensorId: 'B', timestamp: '08:00', value: 30 },
  { sensorId: 'B', timestamp: '08:15', value: 33 },
];
console.log('partition:', densifyPartition(seed, 5).map(d => \`\${d.sensorId}@\${d.timestamp}=\${d.value}\`));
console.log('full count:', densifyFull(seed, 5).length, '(vs. partition count:', densifyPartition(seed, 5).length, ')');
// -> partition: 8 total documents (4 per sensor, each within its OWN range)
// -> full count: 32 (vs. partition count: 8) -- every sensor stretched
//    across the entire 8:00-9:15 global window`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'The main page\'s own theory says to use "full" bounds "when you want all sources aligned to the same time grid." If Sensor A\'s null placeholders (for 8:00-8:55, where it genuinely never reported) are then run through $fill with method: "locf" (last observation carried forward), what value would those null slots end up with?',
  hint: 'locf carries forward the PREVIOUS non-null value within that same partition, in timestamp order. Is there any earlier value at all for Sensor A to carry forward from at 8:00?',
  solution: `// They would STAY null. locf ("last observation carried forward")
// only has a previous value to carry forward once one has actually
// been seen, in timestamp order, within that partition. Sensor A's
// very FIRST real reading is at 9:00 -- every null slot densified
// BEFORE that point (8:00 through 8:55) has no earlier observation
// within Sensor A's own partition to carry forward from at all, so
// locf leaves them null.
//
// This is a real, easy-to-miss consequence of combining "full" bounds
// with locf: "aligning all sources to the same time grid" does NOT
// mean every sensor gets a plausible-looking value for that grid --
// a sensor with a genuinely later start time will show a real gap
// (still null) for any point before its own actual first reading,
// even after $fill runs. Only "linear" interpolation, and even then
// only BETWEEN two real readings (never before the first or after
// the last), can fill some of what locf leaves as null.`,
};

const misconceptions: Misconception[] = [
  {
    thought: '$densify with bounds: "full" is simply a stricter/more thorough version of bounds: "partition" — it does everything partition does, plus a bit more.',
    reality: 'Verified directly with a concrete count: for the same 4-document input, "partition" bounds produces 8 total documents (4 per sensor, each spanning only that sensor\'s own 15-minute observed range), while "full" bounds produces 32 (every sensor stretched across the ENTIRE 75-minute combined range) — a 4x difference for this small dataset that grows further with more sensors or a wider time spread between them. "Full" is not a superset refinement of "partition"; it is a fundamentally different, much larger densification scope.',
  },
  {
    thought: '$fill with method: "locf" will always successfully replace every null value $densify introduces, regardless of which bounds mode created them.',
    reality: 'Verified directly: locf can only carry forward a value from an EARLIER point already seen within the same partition. Null slots that $densify (with "full" bounds specifically) inserts BEFORE a partition\'s own first real reading have no earlier value to carry forward at all, and remain null even after $fill runs — a gap that "full" bounds can introduce but that locf alone cannot close.',
  },
];

@Component({
  selector: 'app-mongo-timeseries-densify-bounds',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './densify-bounds-partition-vs-full-made-concrete.html',
  styleUrl: './densify-bounds-partition-vs-full-made-concrete.scss',
})
export class DensifyBoundsPartitionVsFullMadeConcreteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
