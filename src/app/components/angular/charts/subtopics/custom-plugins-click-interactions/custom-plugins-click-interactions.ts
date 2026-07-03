import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-custom-plugins-click-interactions-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './custom-plugins-click-interactions.html',
  styleUrl: './custom-plugins-click-interactions.scss',
})
export class CustomPluginsClickInteractionsSubtopic {

  chartDeps = { 'chart.js': 'latest' };

  theory: TheoryPoint[] = [
    {
      heading: 'Writing a custom Chart.js plugin',
      points: [
        'A plugin is a plain object with lifecycle hook methods — <code>{ id: \'myPlugin\', beforeDraw(chart) {...}, afterDraw(chart) {...} }</code> — registered via <code>Chart.register(myPlugin)</code> (globally) or passed per-chart in <code>options.plugins</code>. Chart.js calls each hook at the matching point in its render cycle.',
        'A common use case: drawing custom text in the empty centre of a doughnut chart. <code>afterDraw(chart)</code> gets the raw 2D canvas context via <code>chart.ctx</code> and the chart\'s pixel dimensions via <code>chart.chartArea</code>, letting you draw arbitrary text/shapes on top of the rendered chart.',
        'Give every custom plugin a unique <code>id</code> string — it is how you reference the plugin for per-chart configuration overrides (<code>options.plugins.myPlugin = {...}</code>) and how Chart.js reports errors if something in the hook throws.',
      ],
    },
    {
      heading: 'Click and hover interactions — drilling into chart data',
      points: [
        'Pass an <code>onClick</code> handler in the chart config: <code>onClick: (event, elements) =&gt; {...}</code>. The <code>elements</code> array (populated via Chart.js\'s built-in hit-testing) tells you exactly which dataset index and data index the user clicked, if any — an empty array means the click landed outside any chart element.',
        '<code>chart.getElementsAtEventForMode(event, \'nearest\', { intersect: true }, true)</code> gives more control than the elements array passed to <code>onClick</code> — useful when you need hover-based (not just click-based) hit-testing, e.g. for a custom tooltip or highlight effect.',
        'A drill-down pattern: on doughnut-slice click, read <code>elements[0].index</code> to get which slice, look up the corresponding category in your own data array, and either navigate to a detail route or swap the chart\'s <code>data</code> to show a breakdown of that category — then call <code>chart.update()</code>.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component, ElementRef, viewChild, afterNextRender, signal, DestroyRef, inject } from '@angular/core';
import { Chart, registerables, Plugin } from 'chart.js';

Chart.register(...registerables);

// Custom plugin: draws total count in the centre of the doughnut hole
const centerTextPlugin: Plugin<'doughnut'> = {
  id: 'centerText',
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    const total = (chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
    const x = (chartArea.left + chartArea.right) / 2;
    const y = (chartArea.top + chartArea.bottom) / 2;

    ctx.save();
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(total), x, y);
    ctx.restore();
  },
};

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <h3>Custom plugin (center text) + click drill-down</h3>
    <canvas #chartCanvas width="400" height="300"></canvas>
    <p>Clicked slice: {{ clickedSlice() || '(click a slice)' }}</p>
  \`,
})
export class App {
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart!: Chart;
  clickedSlice = signal<string | null>(null);

  private labels = ['TypeScript', 'HTML', 'SCSS'];
  private values = [45, 20, 15];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.chart = new Chart(this.canvas().nativeElement, {
        type: 'doughnut',
        data: {
          labels: this.labels,
          datasets: [{ data: this.values, backgroundColor: ['#6366f1', '#22c55e', '#ef4444'] }],
        },
        options: {
          responsive: false,
          plugins: { legend: { position: 'right' } },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const index = elements[0].index;
              this.clickedSlice.set(\`\${this.labels[index]}: \${this.values[index]}\`);
            }
          },
        },
        plugins: [centerTextPlugin],
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
  <head><title>Custom plugins and click interactions</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Change centerTextPlugin to display the total with a "Total: " prefix instead of just the raw number.',
    hint: 'Inside afterDraw, change ctx.fillText(String(total), x, y) to ctx.fillText(`Total: ${total}`, x, y).',
    solution: `afterDraw(chart) {
  const { ctx, chartArea } = chart;
  const total = (chart.data.datasets[0].data as number[]).reduce((a, b) => a + b, 0);
  const x = (chartArea.left + chartArea.right) / 2;
  const y = (chartArea.top + chartArea.bottom) / 2;

  ctx.save();
  ctx.font = 'bold 20px sans-serif';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(\`Total: \${total}\`, x, y);
  ctx.restore();
},`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a Chart.js plugin needs to be a class implementing a specific interface, similar to an Angular directive.',
      reality: 'a plugin is just a plain object with an id and any subset of the documented hook method names (beforeDraw, afterDraw, etc.) — Chart.js calls whichever hooks you define, with no class or decorator required.',
    },
    {
      thought: 'onClick with an empty elements array means the click handler itself failed to register.',
      reality: 'an empty elements array is the NORMAL result when the click lands on empty chart area (not on a bar/slice/point) — Chart.js\'s built-in hit-testing simply found nothing at that pixel, which is expected and should be handled as a no-op.',
    },
    {
      thought: 'custom canvas drawing in a plugin hook persists across chart.update() calls automatically.',
      reality: 'afterDraw (and similar hooks) re-run on EVERY render, including every update() — the custom drawing is redrawn each time rather than persisted, which is exactly why it stays in sync with the chart\'s current data without any extra code.',
    },
  ];
}
