import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-mixed-charts-annotations-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './mixed-charts-annotations.html',
  styleUrl: './mixed-charts-annotations.scss',
})
export class MixedChartsAnnotationsSubtopic {

  chartDeps = { 'chart.js': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Mixed charts — combining chart types in one canvas',
      points: [
        'Chart.js lets each DATASET declare its own <code>type</code>, overriding the top-level chart <code>type</code> — <code>datasets: [{ type: \'bar\', data: [...] }, { type: \'line\', data: [...] }]</code> renders bars and a line on the SAME chart, sharing the same x-axis and canvas.',
        'A common combo: monthly revenue as bars with a rolling-average trend line overlaid — the bar dataset shows raw values while the line dataset (often on a secondary y-axis) shows the smoothed trend, both readable at a glance.',
        'Use a secondary y-axis (<code>yAxisID: \'y1\'</code> on the line dataset, with a matching <code>scales.y1</code> definition) when the two datasets have very different value ranges — otherwise a small-range dataset gets visually flattened by a large-range one sharing the same axis.',
      ],
    },
    {
      heading: 'Reference lines and threshold boxes with chartjs-plugin-annotation',
      points: [
        '<code>chartjs-plugin-annotation</code> (installed separately, registered via <code>Chart.register(annotationPlugin)</code>) adds <code>options.plugins.annotation.annotations</code> — a map of named annotation objects drawn on top of the chart.',
        'A horizontal threshold line: <code>{ type: \'line\', yMin: 100, yMax: 100, borderColor: \'red\', borderWidth: 2, label: { content: \'Target\', display: true } }</code>. Common for showing a budget cap, SLA threshold, or goal line against actual data bars.',
        'A shaded region: <code>{ type: \'box\', xMin: 2, xMax: 4, backgroundColor: \'rgba(255,0,0,0.1)\' }</code> highlights a specific index range — useful for marking an anomaly window, an outage period, or a promotional campaign on a time-series chart.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, ElementRef, viewChild, afterNextRender, DestroyRef, inject } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Mixed bar + line chart with a threshold reference line</h3>
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
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          datasets: [
            {
              type: 'bar',
              label: 'Monthly revenue',
              data: [42, 78, 55, 91, 68],
              backgroundColor: 'rgba(99,102,241,0.7)',
            },
            {
              type: 'line',
              label: 'Trend (rolling avg)',
              data: [50, 60, 65, 70, 72],
              borderColor: 'rgba(34,197,94,1)',
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: false,
          scales: { y: { beginAtZero: true } },
        },
        // A simplified stand-in for chartjs-plugin-annotation's threshold-line behavior,
        // drawn manually here since the plugin isn't installed in this sandbox.
        plugins: [{
          id: 'thresholdLine',
          afterDraw(chart) {
            const { ctx, chartArea, scales } = chart;
            const y = scales['y'].getPixelForValue(80);
            ctx.save();
            ctx.strokeStyle = 'red';
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(chartArea.left, y);
            ctx.lineTo(chartArea.right, y);
            ctx.stroke();
            ctx.fillStyle = 'red';
            ctx.font = '12px sans-serif';
            ctx.fillText('Target: 80', chartArea.left + 4, y - 6);
            ctx.restore();
          },
        }],
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
  <head><title>Mixed charts and annotations</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change the threshold value from 80 to 60, and update both the getPixelForValue(80) call and the "Target: 80" label text to match.',
    hint: 'Replace both occurrences of 80 with 60: scales[\'y\'].getPixelForValue(60) and ctx.fillText(\'Target: 60\', ...).',
    solution: `const y = scales['y'].getPixelForValue(60);
// ...
ctx.fillText('Target: 60', chartArea.left + 4, y - 6);`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a chart can only have one type — mixing a bar and a line in the same chart requires two separate canvas elements.',
      reality: 'a single chart config supports per-dataset type overrides — datasets: [{ type: \'bar\', ... }, { type: \'line\', ... }] renders both on ONE canvas, sharing the same axes (or a secondary axis if configured).',
    },
    {
      thought: 'chartjs-plugin-annotation is a built-in part of Chart.js core.',
      reality: 'it is a SEPARATE package that must be installed and registered via Chart.register() — Chart.js core does not include reference-line/box annotation support out of the box.',
    },
    {
      thought: 'combining datasets with very different value ranges on the same y-axis is always fine as long as both are visible.',
      reality: 'a small-range dataset gets visually flattened next to a large-range one sharing the same axis — use a secondary y-axis (yAxisID + a matching scales entry) when ranges differ significantly, or the smaller series becomes unreadable.',
    },
  ];
}
