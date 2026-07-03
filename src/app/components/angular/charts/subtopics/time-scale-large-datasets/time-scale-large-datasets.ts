import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-time-scale-large-datasets-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './time-scale-large-datasets.html',
  styleUrl: './time-scale-large-datasets.scss',
})
export class TimeScaleLargeDatasetsSubtopic {

  chartDeps = { 'chart.js': 'latest', 'chartjs-adapter-date-fns': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'The time scale — real dates on the x-axis',
      points: [
        '<code>scales: { x: { type: \'time\' } }</code> switches the x-axis from evenly-spaced category labels to a REAL TIME axis — data points are positioned proportionally to their actual timestamp gaps, not just their array index. Irregular data (e.g. one reading Monday, the next reading Thursday) is positioned correctly instead of evenly spaced.',
        'The time scale requires a DATE ADAPTER package — Chart.js does not parse dates itself. Install <code>chartjs-adapter-date-fns</code> (or <code>-luxon</code>/<code>-moment</code>) and import it once; it registers itself with Chart.js automatically, no explicit <code>Chart.register()</code> call needed for the adapter.',
        'Data points use <code>{ x: Date | timestamp | ISOString, y: value }</code> objects instead of a parallel <code>labels</code> array when using the time scale — the x value IS the position, not an index into a separate labels array.',
        '<code>scales.x.time.unit: \'day\'</code> (or <code>\'hour\'</code>, <code>\'month\'</code>) controls the axis tick granularity explicitly; omitting it lets Chart.js auto-select based on the data\'s actual time span.',
      ],
    },
    {
      heading: 'The decimation plugin — rendering thousands of points',
      points: [
        'The built-in <code>decimation</code> plugin (<code>options.plugins.decimation: { enabled: true, algorithm: \'lttb\' }</code>) downsamples large datasets FOR RENDERING ONLY — your underlying data array is untouched, only what gets drawn to the canvas is reduced.',
        '<code>\'lttb\'</code> (Largest Triangle Three Buckets) preserves the VISUAL SHAPE of the trend — peaks, valleys, and overall pattern — far better than naive every-Nth-point sampling, which can skip over meaningful spikes entirely.',
        'Decimation requires <code>parsing: false</code> and pre-sorted, evenly-spaced-ish numeric data for best results — it is designed for large time-series/numeric datasets, not for categorical bar charts.',
      ],
    },
    {
      heading: 'Practical guidance for real-time and streaming data',
      points: [
        'For a live-updating chart (new point every few seconds), push to <code>chart.data.datasets[0].data</code> and call <code>chart.update(\'none\')</code> to skip animation — combine with a fixed-size sliding window (shift the oldest point off the front) so the dataset doesn\'t grow unbounded in memory.',
        'A dataset with more than roughly 1,000–2,000 points on screen at once benefits from decimation — below that threshold, Chart.js\'s default rendering is fast enough that decimation adds complexity without a noticeable performance gain.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, ElementRef, viewChild, afterNextRender, DestroyRef, inject } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);

// Simulate irregular timestamps — not evenly spaced days
function daysAgo(n: number): Date {
  const d = new Date('2024-06-15T00:00:00Z');
  d.setDate(d.getDate() - n);
  return d;
}

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Time scale — irregular timestamps positioned by real date, not index</h3>
    <canvas #chartCanvas width="500" height="300"></canvas>
  \`,
})
export class App {
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart!: Chart;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.chart = new Chart(this.canvas().nativeElement, {
        type: 'line',
        data: {
          datasets: [{
            label: 'Readings (irregular gaps)',
            // Note the uneven gaps: 20, 15, 14, 3, 2, 0 days ago
            data: [
              { x: daysAgo(20), y: 12 },
              { x: daysAgo(15), y: 19 },
              { x: daysAgo(14), y: 15 },
              { x: daysAgo(3),  y: 28 },
              { x: daysAgo(2),  y: 22 },
              { x: daysAgo(0),  y: 30 },
            ],
            borderColor: 'rgba(99,102,241,1)',
            backgroundColor: 'rgba(99,102,241,0.1)',
            fill: true,
          }],
        },
        options: {
          responsive: false,
          scales: {
            x: { type: 'time', time: { unit: 'day' } },
            y: { beginAtZero: true },
          },
        },
      });
      destroyRef.onDestroy(() => this.chart?.destroy());
    });
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
  <head><title>Time scale and large datasets</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add one more data point at daysAgo(1) with y: 25, and observe where it lands on the time axis relative to the daysAgo(2) and daysAgo(0) points.',
    hint: 'Add { x: daysAgo(1), y: 25 } to the data array, positioned between the daysAgo(2) and daysAgo(0) entries — the time scale will place it proportionally between them based on the actual 1-day gaps, not just insert it evenly.',
    solution: `data: [
  { x: daysAgo(20), y: 12 },
  { x: daysAgo(15), y: 19 },
  { x: daysAgo(14), y: 15 },
  { x: daysAgo(3),  y: 28 },
  { x: daysAgo(2),  y: 22 },
  { x: daysAgo(1),  y: 25 },
  { x: daysAgo(0),  y: 30 },
],`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'the time scale works out of the box with just type: \'time\' — no extra installation needed.',
      reality: 'Chart.js does not parse dates itself — a date adapter package (chartjs-adapter-date-fns, -luxon, or -moment) must be installed and imported, or the time scale throws at runtime.',
    },
    {
      thought: 'the decimation plugin permanently reduces the dataset, so subsequent operations see fewer points.',
      reality: 'decimation only affects what gets DRAWN to the canvas — the underlying data array in chart.data is completely untouched, so any code reading the raw data still sees every original point.',
    },
    {
      thought: 'with the time scale, data points still need a labels array like category charts do.',
      reality: 'time-scale data points carry their own x value directly ({ x: Date, y: value }) — there is no separate labels array; the x property IS the position on the axis.',
    },
  ];
}
