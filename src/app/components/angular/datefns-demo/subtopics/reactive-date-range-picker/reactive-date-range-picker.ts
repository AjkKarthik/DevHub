import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-reactive-date-range-picker-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './reactive-date-range-picker.html',
  styleUrl: './reactive-date-range-picker.scss',
})
export class ReactiveDateRangePickerSubtopic {

  dateFnsDeps = { 'date-fns': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Modeling a range as two signals, derived state as computed()',
      points: [
        'A date range picker\'s core state is just two signals: <code>rangeStart = signal&lt;Date | null&gt;(null)</code> and <code>rangeEnd = signal&lt;Date | null&gt;(null)</code>. Everything else — the list of days to highlight, whether the range is valid, the formatted display string — is DERIVED with <code>computed()</code>, never stored redundantly.',
        '<code>computed(() =&gt; this.rangeStart() && this.rangeEnd() ? eachDayOfInterval({ start: this.rangeStart()!, end: this.rangeEnd()! }) : [])</code> gives you the exact set of days to visually highlight in a calendar grid, automatically recomputing whenever either endpoint signal changes — no manual re-derivation logic needed.',
      ],
    },
    {
      heading: 'Swapping endpoints and validating the range',
      points: [
        'When a user clicks a SECOND date that is chronologically BEFORE the first-clicked date, the natural UX is to swap them rather than reject the click — <code>const [start, end] = isBefore(clicked, this.rangeStart()!) ? [clicked, this.rangeStart()!] : [this.rangeStart()!, clicked]</code> normalizes the order using <code>isBefore</code> from date-fns.',
        'A <code>computed()</code> validity signal — <code>isValidRange = computed(() =&gt; !!this.rangeStart() && !!this.rangeEnd() && !isAfter(this.rangeStart()!, this.rangeEnd()!))</code> — gives the template (and a submit button\'s <code>disabled</code> binding) a single source of truth for whether the current selection is usable, combining several date-fns predicates into one derived boolean.',
      ],
    },
    {
      heading: 'Formatting the range for display and for the server',
      points: [
        'Display format and API format are usually DIFFERENT and should be derived independently: a human-readable <code>computed(() =&gt; \`${format(start, \'MMM d\')} - ${format(end, \'MMM d, yyyy\')}\`)</code> for the UI, versus <code>computed(() =&gt; ({ start: formatISO(start), end: formatISO(end) }))</code> (ISO 8601 strings) for whatever gets sent to an API — keep these as SEPARATE computed signals rather than reformatting one into the other ad hoc at each call site.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, signal, computed } from '@angular/core';
import { JsonPipe } from '@angular/common';
import {
  eachDayOfInterval, isBefore, isAfter, isSameDay, format, formatISO,
  startOfMonth, endOfMonth, eachDayOfInterval as daysInMonth,
} from 'date-fns';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JsonPipe],
  template: \`
    <h3>Click two days to select a range (auto-normalizes order)</h3>
    <div style="display: grid; grid-template-columns: repeat(7, 40px); gap: 2px;">
      @for (day of monthDays(); track day.getTime()) {
        <button
          (click)="selectDay(day)"
          [style.background]="isInRange(day) ? '#6366f1' : '#eee'"
          [style.color]="isInRange(day) ? 'white' : 'black'">
          {{ day.getDate() }}
        </button>
      }
    </div>

    <p>Display: {{ displayText() }}</p>
    <p>API payload: {{ apiPayload() | json }}</p>
    <p>Valid: {{ isValidRange() }}</p>
  \`,
})
export class App {
  private month = new Date(2024, 5, 1); // June 2024, fixed for a stable demo
  monthDays = signal(daysInMonth({ start: startOfMonth(this.month), end: endOfMonth(this.month) }));

  rangeStart = signal<Date | null>(null);
  rangeEnd = signal<Date | null>(null);

  highlightedDays = computed(() =>
    this.rangeStart() && this.rangeEnd()
      ? eachDayOfInterval({ start: this.rangeStart()!, end: this.rangeEnd()! })
      : [],
  );

  isValidRange = computed(() =>
    !!this.rangeStart() && !!this.rangeEnd() && !isAfter(this.rangeStart()!, this.rangeEnd()!),
  );

  displayText = computed(() =>
    this.rangeStart() && this.rangeEnd()
      ? \`\${format(this.rangeStart()!, 'MMM d')} - \${format(this.rangeEnd()!, 'MMM d, yyyy')}\`
      : 'Pick a start and end date',
  );

  apiPayload = computed(() =>
    this.rangeStart() && this.rangeEnd()
      ? { start: formatISO(this.rangeStart()!, { representation: 'date' }), end: formatISO(this.rangeEnd()!, { representation: 'date' }) }
      : null,
  );

  isInRange(day: Date): boolean {
    return this.highlightedDays().some(d => isSameDay(d, day));
  }

  selectDay(day: Date) {
    if (!this.rangeStart() || (this.rangeStart() && this.rangeEnd())) {
      // Starting a new selection
      this.rangeStart.set(day);
      this.rangeEnd.set(null);
      return;
    }
    // Second click — normalize order with isBefore
    const start = this.rangeStart()!;
    if (isBefore(day, start)) {
      this.rangeStart.set(day);
      this.rangeEnd.set(start);
    } else {
      this.rangeEnd.set(day);
    }
  }
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
  <head><title>Reactive date range picker</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Click a later date first, then an earlier date — verify the range still normalizes correctly (isBefore swaps the endpoints) and the highlighted days are correct either way.',
    hint: 'Click e.g. June 20 first, then June 10 — selectDay() detects isBefore(day, start) is true for the second click and swaps rangeStart/rangeEnd so the range is always stored start-before-end regardless of click order.',
    solution: `// No code change needed — this confirms the existing selectDay() logic:
// clicking a chronologically earlier date second correctly swaps
// rangeStart and rangeEnd via the isBefore(day, start) check.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the list of highlighted days in a range picker should be stored as its own signal, updated manually whenever the range changes.',
      reality: 'it should be a computed() derived from rangeStart/rangeEnd — storing it as a separate signal risks it going out of sync if you forget to update it manually after an endpoint changes.',
    },
    {
      thought: 'a range picker should reject a second click that lands before the first-clicked date.',
      reality: 'the standard UX swaps the endpoints (using isBefore to detect the out-of-order click) rather than rejecting it — normalizing the order gives a smoother experience than an error message.',
    },
    {
      thought: 'the same formatted string used for display can also be sent directly to an API.',
      reality: 'display format ("Jun 10 - Jun 15, 2024") and API format (ISO 8601 date strings) are different formats for different consumers and should be separate computed signals, not one reformatted into the other ad hoc.',
    },
  ];
}
