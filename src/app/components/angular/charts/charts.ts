import { Component, signal, ElementRef, viewChild, afterNextRender, computed, effect, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartType, registerables } from 'chart.js';
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
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';

Chart.register(...registerables);

@Component({
  selector: 'app-charts',
  imports: [
    FormsModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, PrerequisitesComponent, RevisionCardComponent,
  ],
  templateUrl: './charts.html',
  styleUrl: './charts.scss',
})
export class ChartsDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Angular Signals', route: '/angular/signals' },
    { label: 'Lifecycle Hooks', route: '/angular/lifecycle' },
  ];

  // Canvas references
  barCanvas  = viewChild<ElementRef<HTMLCanvasElement>>('barCanvas');
  lineCanvas = viewChild<ElementRef<HTMLCanvasElement>>('lineCanvas');
  pieCanvas  = viewChild<ElementRef<HTMLCanvasElement>>('pieCanvas');

  private barChart!:  Chart;
  private lineChart!: Chart;
  private pieChart!:  Chart;

  // Bar chart data
  barData = signal([42, 78, 35, 91, 56, 23, 67]);
  months  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

  // Line chart — two datasets
  sales    = signal([120, 145, 130, 168, 155, 172, 188]);
  expenses = signal([90, 95, 80, 105, 110, 98, 115]);

  // Pie chart
  pieLabels  = ['TypeScript', 'HTML', 'SCSS', 'Tests', 'Config'];
  pieValues  = signal([45, 20, 15, 12, 8]);
  selectedSlice = signal<number | null>(null);

  constructor() {
    afterNextRender(() => {
      this.initBarChart();
      this.initLineChart();
      this.initPieChart();
    });
  }

  private initBarChart() {
    const ctx = this.barCanvas()!.nativeElement;
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.months,
        datasets: [{
          label: 'Monthly Sales',
          data: this.barData(),
          backgroundColor: 'rgba(99,102,241,0.7)',
          borderColor:     'rgba(99,102,241,1)',
          borderWidth: 2,
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private initLineChart() {
    const ctx = this.lineCanvas()!.nativeElement;
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.months,
        datasets: [
          {
            label: 'Revenue',
            data: this.sales(),
            borderColor: 'rgba(34,197,94,1)',
            backgroundColor: 'rgba(34,197,94,0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Expenses',
            data: this.expenses(),
            borderColor: 'rgba(239,68,68,1)',
            backgroundColor: 'rgba(239,68,68,0.1)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private initPieChart() {
    const ctx = this.pieCanvas()!.nativeElement;
    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.pieLabels,
        datasets: [{
          data: this.pieValues(),
          backgroundColor: [
            'rgba(99,102,241,0.8)',
            'rgba(34,197,94,0.8)',
            'rgba(239,68,68,0.8)',
            'rgba(251,191,36,0.8)',
            'rgba(147,51,234,0.8)',
          ],
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' },
          tooltip: { enabled: true },
        },
      },
    });
  }

  randomizeBar() {
    const data = this.months.map(() => Math.floor(Math.random() * 100) + 10);
    this.barData.set(data);
    this.barChart.data.datasets[0].data = data;
    this.barChart.update();
  }

  randomizeLine() {
    const sales    = this.months.map(() => Math.floor(Math.random() * 100) + 80);
    const expenses = this.months.map(() => Math.floor(Math.random() * 60) + 60);
    this.sales.set(sales);
    this.expenses.set(expenses);
    this.lineChart.data.datasets[0].data = sales;
    this.lineChart.data.datasets[1].data = expenses;
    this.lineChart.update();
  }

  theory: TheoryPoint[] = [
    {
      heading: 'Integrating Chart.js with Angular',
      points: [
        'Chart.js operates on a <code>&lt;canvas&gt;</code> element and calls the browser\'s 2D canvas API immediately on instantiation. You must wait until the canvas is painted and has real dimensions before calling <code>new Chart()</code>.',
        'Use <code>afterNextRender()</code> (Angular 17+) instead of <code>ngAfterViewInit</code>. It fires after the first browser paint — not just after Angular\'s render cycle — so canvas dimensions are computed and SSR contexts are safely excluded.',
        'Get a reference to the canvas with the signal-based <code>viewChild&lt;ElementRef&lt;HTMLCanvasElement&gt;&gt;(\'myCanvas\')</code>. Access the raw element via <code>.nativeElement</code> and pass it to <code>new Chart()</code>.',
        'Store the chart instance in a private class property (<code>private chart!: Chart</code>). You need this reference to call <code>chart.update()</code> on data changes and <code>chart.destroy()</code> on cleanup.',
        'Always call <code>chart.destroy()</code> when the component is torn down. Each Chart.js instance holds a canvas context; without cleanup you accumulate contexts until the browser logs "Too many active Chart.js instances".',
      ],
    },
    {
      heading: 'Chart configuration — the config object',
      points: [
        'Every Chart.js chart takes a single config object: <code>{ type, data: { labels, datasets }, options }</code>. The <code>type</code> string (<code>\'bar\'</code>, <code>\'line\'</code>, <code>\'pie\'</code>, etc.) selects the chart renderer.',
        '<code>datasets</code> is an array — each entry is an independent data series with its own <code>data</code> array and visual properties (<code>backgroundColor</code>, <code>borderColor</code>, <code>fill</code>, <code>tension</code>).',
        '<code>options.responsive: true</code> (default) makes the chart resize with its container. Add <code>maintainAspectRatio: false</code> plus a fixed-height container for full layout control.',
        'Plugins — legend, tooltip, annotation, data labels — are configured under <code>options.plugins</code>. Install additional plugins (<code>chartjs-plugin-datalabels</code>) with <code>Chart.register(pluginInstance)</code>.',
        'Scales are configured under <code>options.scales</code>. Common overrides: <code>scales.y.beginAtZero: true</code>, <code>scales.x.type: \'time\'</code> for time-series, <code>scales.y.max</code> for fixed upper bounds.',
      ],
    },
    {
      heading: 'Updating charts reactively with Angular signals',
      points: [
        'To update data: mutate the dataset array in-place <code>chart.data.datasets[0].data = newData</code> then call <code>chart.update()</code>. This triggers a smooth animated re-render without recreating the canvas context.',
        'For animated transitions pass a mode: <code>chart.update(\'active\')</code>. The <code>\'none\'</code> mode skips animation entirely — useful for real-time dashboards that update every second.',
        'Bridge signals to Chart.js with <code>effect()</code>: <code>effect(() => { this.chart?.data.datasets[0].data = this.chartData(); this.chart?.update(); })</code>. The effect re-runs whenever <code>chartData</code> changes.',
        'Do <strong>NOT</strong> recreate the Chart instance on every signal change. Destroy + new causes a visible flash, loses zoom/pan state, and is significantly slower than an in-place update.',
        'For adding/removing data points (streaming), push/splice the <code>chart.data.labels</code> array directly and push to <code>datasets[0].data</code>, then call <code>chart.update(\'none\')</code> for the fastest possible re-render.',
      ],
    },
    {
      heading: 'Chart types and when to use each',
      points: [
        '<strong>Bar / horizontal bar</strong>: comparing discrete categories side-by-side. Use grouped bars (<code>grouped: true</code>) to compare multiple series per category. Best for quantities with clear labels.',
        '<strong>Line</strong>: trends over a continuous axis (usually time). <code>fill: true</code> creates an area chart. Set <code>tension: 0.4</code> for smooth curves; <code>0</code> for straight segments. Use two datasets on the same axis to compare trends.',
        '<strong>Doughnut / Pie</strong>: part-to-whole relationships. Doughnut is better than pie for readability — the hollow centre allows a total label. Limit to 5–7 slices; more becomes unreadable.',
        '<strong>Scatter</strong>: correlations between two numeric variables. Data is <code>[{x, y}]</code> pairs. Add a best-fit line with <code>chartjs-plugin-annotation</code>.',
        '<strong>Radar</strong>: comparing multiple attributes of one or more entities on the same scale. Classic use case: a skills radar or product feature comparison.',
      ],
    },
    {
      heading: 'Performance, tree-shaking, and SSR',
      points: [
        'Chart.js is tree-shakable: instead of <code>Chart.register(...registerables)</code> (imports everything), import and register only what you use: <code>import { BarController, LinearScale, CategoryScale } from \'chart.js\'</code>. This can save 20–30 kB.',
        'For high-frequency updates (real-time dashboards), disable animation on update: <code>chart.update(\'none\')</code>. Consider <code>decimation</code> plugin for datasets with thousands of points — it downsamples for rendering without losing the trend.',
        'Chart.js uses <code>devicePixelRatio</code> automatically for HiDPI/Retina screens. You do not need to set canvas <code>width</code>/<code>height</code> attributes manually — let <code>responsive: true</code> handle sizing.',
        '<strong>SSR (Angular Universal)</strong>: Chart.js uses <code>document</code> and <code>canvas</code> — unavailable on the server. Wrap chart instantiation in <code>afterNextRender()</code> (browser-only) or guard with <code>isPlatformBrowser(inject(PLATFORM_ID))</code>. The canvas renders blank on server and hydrates in the browser.',
        'For charts inside tabs or collapsible sections that are initially hidden, call <code>chart.resize()</code> when the container becomes visible. Chart.js measures the container on initialisation — if it is hidden, dimensions are 0 and the chart renders incorrectly.',
      ],
    },
    {
      heading: 'Accessibility and alternatives',
      points: [
        'Chart.js generates a <code>&lt;canvas&gt;</code> which is not screen-reader-friendly by default. Add an <code>aria-label</code> on the canvas and a visually-hidden data table as fallback: <code>&lt;canvas aria-label="Monthly sales chart"&gt;&lt;/canvas&gt;</code> with a summary table in <code>&lt;details&gt;</code>.',
        'The <code>plugins.tooltip</code> block is keyboard-accessible by default in Chart.js 4+. Ensure <code>options.animation.duration</code> respects <code>prefers-reduced-motion</code> by reading the media query and setting <code>duration: 0</code> if requested.',
        'For complex interactive charts (drill-down, zoom, pan), consider <strong>D3.js</strong> — full SVG-based control, screen-reader-friendly, but steeper learning curve and much more code.',
        '<strong>Apache ECharts</strong> (via <code>ngx-echarts</code>) provides richer chart types (heatmaps, tree maps, sunburst) with better built-in accessibility and a declarative Angular API. Good choice when Chart.js types aren\'t enough.',
        '<strong>Recharts</strong> (React only) and <strong>ngx-charts</strong> (Angular-native, D3 under the hood) are Angular-idiomatic alternatives. <code>ngx-charts</code> uses SVG, is tree-shakable by chart type, and integrates cleanly with Angular modules.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'typescript',
      code: `// npm install chart.js
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);  // register all chart types + scales + plugins

// For production — register only what you use (smaller bundle):
// import { BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
// Chart.register(BarController, BarElement, LinearScale, CategoryScale, Tooltip, Legend);

@Component({
  template: '<canvas #myCanvas></canvas>',
  ...
})
export class ChartsComponent {
  // Signal-based canvas reference (Angular 17+)
  myCanvas = viewChild.required<ElementRef<HTMLCanvasElement>>('myCanvas');
  private chart!: Chart;

  constructor(private destroyRef: DestroyRef) {
    // afterNextRender = browser-only, fires after first paint (SSR-safe)
    afterNextRender(() => {
      this.chart = new Chart(this.myCanvas().nativeElement, {
        type: 'bar',
        data: { labels: ['A','B','C'], datasets: [{ data: [10, 20, 30] }] },
        options: { responsive: true },
      });
      // Co-locate cleanup with creation
      destroyRef.onDestroy(() => this.chart?.destroy());
    });
  }
}`,
    },
    {
      label: 'Bar chart',
      language: 'typescript',
      code: `new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Jan','Feb','Mar','Apr','May'],
    datasets: [{
      label: 'Monthly Sales',
      data: [42, 78, 35, 91, 56],
      backgroundColor: 'rgba(99,102,241,0.7)',
      borderColor:     'rgba(99,102,241,1)',
      borderWidth: 2,
      borderRadius: 6,    // rounded bar tops
    }],
  },
  options: {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: 'top' } },
  },
});

// Update data reactively (no destroy/recreate):
chart.data.datasets[0].data = newData;
chart.update();            // animated re-render

// Skip animation for real-time dashboards:
chart.update('none');`,
    },
    {
      label: 'Line chart',
      language: 'typescript',
      code: `new Chart(ctx, {
  type: 'line',
  data: {
    labels: months,
    datasets: [
      {
        label: 'Revenue',
        data: salesData,
        borderColor: 'rgba(34,197,94,1)',
        backgroundColor: 'rgba(34,197,94,0.1)',
        fill: true,     // area chart
        tension: 0.4,   // smooth curves (0 = straight lines)
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: 'rgba(239,68,68,1)',
        backgroundColor: 'rgba(239,68,68,0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'top' } },
    scales: { y: { beginAtZero: true } },
  },
});`,
    },
    {
      label: 'Doughnut chart',
      language: 'typescript',
      code: `new Chart(ctx, {
  type: 'doughnut',   // 'pie' for a filled pie — same config otherwise
  data: {
    labels: ['TypeScript', 'HTML', 'SCSS', 'Tests'],
    datasets: [{
      data: [45, 20, 15, 12],
      backgroundColor: [
        'rgba(99,102,241,0.8)',
        'rgba(34,197,94,0.8)',
        'rgba(239,68,68,0.8)',
        'rgba(251,191,36,0.8)',
      ],
      borderWidth: 2,
    }],
  },
  options: {
    responsive: true,
    plugins: {
      legend: { position: 'right' },
      tooltip: { enabled: true },
    },
    // cutout: '0%'  → turns doughnut into a filled pie chart
  },
});`,
    },
    {
      label: 'Reactive with effect()',
      language: 'typescript',
      code: `import { Component, signal, effect, viewChild, ElementRef, afterNextRender, DestroyRef, inject } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({ ... })
export class ReactiveChartComponent {
  canvasEl = viewChild.required<ElementRef<HTMLCanvasElement>>('chartCanvas');
  private chart!: Chart;

  // Signal is the source of truth for chart data
  chartData = signal([10, 20, 30, 40, 50]);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      // Create chart once after DOM is ready
      this.chart = new Chart(this.canvasEl().nativeElement, {
        type: 'bar',
        data: {
          labels: ['A', 'B', 'C', 'D', 'E'],
          datasets: [{ label: 'Values', data: this.chartData() }],
        },
        options: { responsive: true },
      });

      // effect() inside afterNextRender runs in browser context only
      effect(() => {
        // Reading chartData() tracks this signal — re-runs on every change
        const data = this.chartData();
        if (this.chart) {
          this.chart.data.datasets[0].data = data;
          this.chart.update();
        }
      });

      destroyRef.onDestroy(() => this.chart?.destroy());
    });
  }

  // Any signal update triggers the effect above
  addPoint() {
    this.chartData.update(d => [...d, Math.floor(Math.random() * 100)]);
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'Why does the ChartsDemo component initialize Chart.js charts inside afterNextRender() rather than ngAfterViewInit()?',
      options: [
        'afterNextRender() is the only lifecycle hook that works in standalone components',
        'afterNextRender() fires after the browser paints, guaranteeing the canvas has real DOM dimensions and is browser-only (SSR-safe)',
        'ngAfterViewInit() does not support viewChild signals',
        'afterNextRender() automatically destroys the chart when the component unmounts',
      ],
      answer: 1,
      explanation: 'afterNextRender() (Angular 17+) fires after the first browser paint, ensuring the canvas element is in the DOM with computed dimensions. ngAfterViewInit fires after Angular\'s render cycle but before the browser paints, which can produce zero-dimension canvases or fail in SSR contexts where document doesn\'t exist.',
    },
    {
      q: 'What is the correct way to update bar chart data reactively after calling randomizeBar()?',
      options: [
        'Destroy and recreate the Chart instance with new Chart(ctx, config)',
        'Call this.barChart.data = newConfig and then this.barChart.render()',
        'Mutate this.barChart.data.datasets[0].data = data and then call this.barChart.update()',
        'Re-assign the barData signal and Angular\'s change detection syncs Chart.js automatically',
      ],
      answer: 2,
      explanation: 'Mutate chart.data.datasets[0].data directly and call chart.update(). Recreating the chart causes visual flashes and loses animation/zoom state. Chart.js does not observe Angular signals — you must explicitly call update() after mutating the data reference.',
    },
    {
      q: 'Which Angular API is used to get a reference to a canvas element in the ChartsDemo component?',
      options: [
        '@ViewChild() decorator with ElementRef',
        'document.querySelector() inside the constructor',
        'viewChild<ElementRef<HTMLCanvasElement>>() signal function (Angular 17+)',
        'inject(ElementRef) from the DI system',
      ],
      answer: 2,
      explanation: 'The component uses the viewChild<ElementRef<HTMLCanvasElement>>(\'barCanvas\') signal API (Angular 17+). It returns a signal whose value is the ElementRef. .nativeElement accesses the raw HTMLCanvasElement passed to new Chart().',
    },
    {
      q: 'The doughnut chart uses type: \'doughnut\'. What single change produces a standard filled pie chart?',
      options: [
        'Change options.plugins.legend.position to \'bottom\'',
        'Add cutout: 0 to the options object (or change type to \'pie\')',
        'Set datasets[0].fill = true',
        'Add options.elements.arc.offset = 0',
      ],
      answer: 1,
      explanation: 'Both options work: changing type from \'doughnut\' to \'pie\' is the semantic change, and setting options.cutout to \'0%\' or 0 on an existing doughnut chart fills the centre hole. The type change is more explicit.',
    },
    {
      q: 'What does Chart.register(...registerables) accomplish at the top of the ChartsDemo file?',
      options: [
        'It injects Chart.js as an Angular service so it can be used with dependency injection',
        'It pre-renders all chart types server-side for SSR compatibility',
        'It registers all built-in Chart.js controllers, scales, elements, and plugins so they are available at runtime',
        'It enables two-way data binding between Angular signals and Chart.js datasets',
      ],
      answer: 2,
      explanation: 'Chart.js is tree-shakable — controllers like BarController and scales like LinearScale are not included unless registered. Chart.register(...registerables) registers everything at once. For production, import and register only the specific types and scales you use to reduce bundle size by up to 30 kB.',
    },
    {
      q: 'What is the best way to bridge Angular signal changes to Chart.js updates?',
      options: [
        'Use Zone.js to trigger change detection and let Angular automatically sync the chart',
        'Read the signal in ngDoCheck() and compare values manually to decide when to call chart.update()',
        'Create a computed() that derives the chart config and pass it as an @Input to Chart.js',
        'Use effect() to track a signal and call chart.data.datasets[0].data = data; chart.update() inside the callback',
      ],
      answer: 3,
      explanation: 'effect() re-runs its callback whenever any tracked signal changes. Reading chartData() inside effect() automatically registers the dependency; Chart.js is then updated imperatively. This avoids manual subscription management and integrates naturally with Angular\'s reactive primitives.',
    },
    {
      q: 'When should you call chart.resize() explicitly in Angular?',
      options: [
        'After every data update to recalculate the chart aspect ratio',
        'When the component is first created before afterNextRender fires',
        'When a chart is initialised inside a hidden container (tab, accordion) and becomes visible later',
        'Chart.resize() is deprecated in Chart.js 4 — use responsive: false instead',
      ],
      answer: 2,
      explanation: 'Chart.js measures its container\'s dimensions on initialisation. If the container is hidden (display: none or inside a closed tab), the measured dimensions are 0 and the chart renders incorrectly or not at all. Call chart.resize() when the container becomes visible to force a correct measurement.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'Why use afterNextRender() to initialise a Chart.js chart?', a: '<code>afterNextRender()</code> fires after the first browser paint — the canvas element is guaranteed to be in the DOM with real dimensions. Initialising in <code>ngOnInit</code> or <code>ngAfterViewInit</code> can fail in SSR (no canvas API) or before dimensions are computed.' },
    { q: 'How do you update a Chart.js chart without re-creating it?', a: 'Mutate <code>chart.data.datasets[0].data = newData</code> then call <code>chart.update()</code>. Never destroy and recreate — it causes a visible flash. For real-time dashboards call <code>chart.update(\'none\')</code> to skip animation.' },
    { q: 'How do you destroy a Chart.js instance to prevent memory leaks?', a: 'Call <code>chart.destroy()</code> in <code>ngOnDestroy()</code> or use <code>inject(DestroyRef).onDestroy(() => this.chart?.destroy())</code>. Without it, old canvas contexts accumulate — eventually the browser warns "Too many active Chart.js instances".' },
    { q: 'How do you make a Chart.js chart responsive to container size?', a: 'Set <code>responsive: true</code> (default) in the chart options. The chart resizes with its container. If the container is hidden initially (e.g. inside a tab), call <code>chart.resize()</code> when it becomes visible, or Chart.js will render at 0 dimensions.' },
    { q: 'How do you access the canvas element for Chart.js in Angular?', a: '<code>myCanvas = viewChild.required&lt;ElementRef&lt;HTMLCanvasElement&gt;&gt;(\'myCanvas\')</code> in the component. Pass <code>this.myCanvas().nativeElement</code> to <code>new Chart(ctx, config)</code> inside <code>afterNextRender()</code>.' },
    { q: 'Can you use Chart.js with SSR (Angular Universal)?', a: 'Chart.js uses <code>document</code> and <code>canvas</code> — not available on the server. Wrap instantiation in <code>afterNextRender()</code> (browser-only) or guard with <code>isPlatformBrowser(inject(PLATFORM_ID))</code>. The chart renders blank on the server and hydrates client-side.' },
    { q: 'An effect() bridging a chartData signal to Chart.js calls chart.update() on every change, but a colleague suggests using chart.update(\'none\') instead for frequently-updating real-time data. What does the \'none\' argument change, and why would that matter for a chart receiving updates every 100ms?', a: 'chart.update() with no argument (or the default mode) re-runs Chart.js\'s full transition/animation pipeline on every call, including easing calculations for the update animation — fine for occasional updates, but for high-frequency updates (every 100ms from a live data feed) that animation overhead compounds, competing with the next update before the current animation even finishes, causing visible jank or wasted CPU cycles animating toward a target that\'s already stale. chart.update(\'none\') skips the animation entirely and redraws immediately, which is the correct choice for real-time/streaming chart data where each update should render as fast as possible rather than animate smoothly — reserving the default animated update for user-triggered, infrequent data changes where the animation adds visual polish rather than competing with itself.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'afterNextRender', type: 'function', desc: 'Schedules a callback to run once after the first browser paint — the correct place to initialize Chart.js since the canvas has real dimensions and is browser-only.', since: '17' },
    { name: 'viewChild', type: 'function', desc: 'Signal-based query returning a live signal holding an ElementRef — use to get the canvas element reference for Chart.js initialization.', since: '17' },
    { name: 'effect()', type: 'function', desc: 'Reactive side-effect that re-runs whenever its tracked signals change — bridge Angular signals to Chart.js by calling chart.update() inside.', since: '16' },
    { name: 'DestroyRef', type: 'class', desc: 'Injectable that lets you register onDestroy callbacks — co-locate chart.destroy() with chart creation for clean teardown without the OnDestroy interface.', since: '16' },
    { name: 'Chart', type: 'class', desc: 'Core Chart.js class — new Chart(canvas, { type, data, options }) renders an interactive chart on the canvas element.' },
    { name: 'Chart.register', type: 'function', desc: 'Registers Chart.js components (controllers, scales, plugins). Call Chart.register(...registerables) for all types, or register individual types for a smaller bundle.' },
    { name: 'chart.update()', type: 'method', desc: 'Re-renders a chart in-place with optional animation mode. Pass \'none\' for synchronous no-animation updates in real-time dashboards.' },
    { name: 'chart.destroy()', type: 'method', desc: 'Releases the Chart.js instance and its canvas context. Must be called on component teardown to prevent context accumulation.' },
    { name: 'chart.resize()', type: 'method', desc: 'Forces Chart.js to re-measure its container and redraw. Required when showing a chart that was initialised inside a hidden container.' },
    { name: 'tension', type: 'keyword', desc: 'Dataset option (0–1) controlling line curve smoothness in line charts. 0 = straight segments, 0.4 = smooth bezier curves.' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Canvas element reference: @ViewChild decorator vs viewChild() signal',
      before: `// Angular < 17 — decorator-based
@ViewChild('barCanvas')
barCanvas!: ElementRef<HTMLCanvasElement>;

ngAfterViewInit() {
  new Chart(this.barCanvas.nativeElement, config);
}`,
      after: `// Angular 17+ — signal-based, SSR-safe
barCanvas = viewChild<ElementRef<HTMLCanvasElement>>('barCanvas');

constructor() {
  afterNextRender(() => {               // browser-only, post-paint
    new Chart(this.barCanvas()!.nativeElement, config);
  });
}`,
      note: 'viewChild() returns a signal; afterNextRender() replaces ngAfterViewInit and is SSR-safe — the callback is skipped entirely on the server.',
    },
    {
      title: 'Chart data storage: plain array vs signal',
      before: `// Plain array — no reactivity
barData = [42, 78, 35, 91, 56];

randomize() {
  this.barData = this.months.map(() => Math.random() * 100);
  // still need to push to chart manually — no difference from signals
}`,
      after: `// Signal — reactive source of truth
barData = signal([42, 78, 35, 91, 56]);

randomize() {
  const data = this.months.map(() => Math.floor(Math.random() * 100));
  this.barData.set(data);             // signal update (for UI bindings)
  this.barChart.data.datasets[0].data = data;
  this.barChart.update();             // Chart.js still needs explicit push
}`,
      note: 'Signals power reactive template bindings (e.g. {{ barData() | json }}). Chart.js does not observe Angular signals — chart.update() must still be called explicitly.',
    },
    {
      title: 'Chart cleanup: ngOnDestroy interface vs DestroyRef callback',
      before: `// Old pattern — class must implement OnDestroy
export class ChartsComponent implements OnDestroy {
  private chart!: Chart;
  ngOnDestroy() { this.chart?.destroy(); }
}`,
      after: `// Modern pattern — inject DestroyRef, no interface needed
export class ChartsComponent {
  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      this.chart = new Chart(...);
      destroyRef.onDestroy(() => this.chart?.destroy());
    });
  }
}`,
      note: 'DestroyRef (Angular 16+) keeps cleanup co-located with initialisation and works in standalone functions and class-less contexts.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Initialising Chart.js before the DOM paints (in ngAfterViewInit)',
      wrong: `ngAfterViewInit() {
  // canvas may have 0 dimensions or throw in SSR
  new Chart(this.canvas.nativeElement, config);
}`,
      right: `constructor() {
  afterNextRender(() => {   // browser-only, post-paint
    new Chart(this.canvas()!.nativeElement, config);
  });
}`,
      explanation: 'ngAfterViewInit fires after Angular\'s render cycle but before the browser paints, so canvas dimensions may be zero or the API unavailable in SSR. afterNextRender() is browser-only and fires after the first real paint.',
    },
    {
      title: 'Recreating the chart on every data change instead of updating in-place',
      wrong: `updateChart(newData: number[]) {
  this.chart.destroy();
  this.chart = new Chart(ctx, { ...config, data: { datasets: [{ data: newData }] } });
}`,
      right: `updateChart(newData: number[]) {
  this.chart.data.datasets[0].data = newData;
  this.chart.update();
}`,
      explanation: 'Destroying and recreating the chart on every update causes a visible flash, loses zoom/pan state, and is significantly slower. Mutate the data reference directly and call chart.update() for smooth animated transitions.',
    },
    {
      title: 'Forgetting Chart.register() causes blank/silent chart failures',
      wrong: `import { Chart } from 'chart.js';
// No register call — BarController is not bundled
new Chart(ctx, { type: 'bar', ... }); // renders blank, no error`,
      right: `import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
new Chart(ctx, { type: 'bar', ... }); // works`,
      explanation: 'Chart.js is tree-shakable; chart controllers and scales are not included unless registered. Always call Chart.register(...registerables) at module level, or register only the specific types you use for a smaller bundle.',
    },
    {
      title: 'Not destroying the chart instance on component teardown',
      wrong: `export class ChartComponent {
  chart = new Chart(...);
  // no ngOnDestroy / DestroyRef — context leaks
}`,
      right: `constructor() {
  const destroyRef = inject(DestroyRef);
  afterNextRender(() => {
    this.chart = new Chart(...);
    destroyRef.onDestroy(() => this.chart?.destroy());
  });
}`,
      explanation: 'Each Chart.js instance holds a canvas context. Without chart.destroy(), navigating away and back leaks contexts until the browser warns "Too many active Chart.js instances" and charts stop rendering.',
    },
    {
      title: 'Not calling chart.resize() when chart is in a hidden container',
      wrong: `// Chart initialised inside a closed mat-tab or accordion
// Container is display:none → canvas dimensions are 0
// chart renders as a tiny 0×0 box when tab opens`,
      right: `// Listen for the tab's selected change event and resize:
tabGroup.selectedTabChange.subscribe(tab => {
  if (tab.index === this.chartTabIndex) {
    this.chart?.resize();
  }
});`,
      explanation: 'Chart.js measures its container on initialisation. Hidden containers have 0 dimensions, so the chart renders incorrectly or not at all. Call chart.resize() when the container becomes visible to force correct measurement and re-render.',
    },
  ];

  challenge: Challenge = {
    title: 'Reactive Line Chart with Signal-Driven Updates',
    description: 'Create an Angular standalone component that renders a Chart.js line chart showing temperature data for 7 days. The chart must update reactively when the user clicks a button to add a new day\'s reading. Use Angular signals to store the data array and afterNextRender() to initialize the chart. When new data is added, update the existing chart instance in-place (do not recreate it).',
    language: 'typescript',
    hints: [
      'Use afterNextRender() inside the constructor to initialize the Chart — not ngAfterViewInit',
      'Store the Chart instance in a private class property (private chart!: Chart) so you can call chart.update() later',
      'When adding a new data point, push to both chart.data.labels and chart.data.datasets[0].data, then call chart.update()',
      'Use viewChild<ElementRef<HTMLCanvasElement>>(\'myCanvas\') to get the canvas reference as a signal',
    ],
    starterCode: `import { Component, signal, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-temp-chart',
  standalone: true,
  template: \`
    <div style="max-width: 600px; margin: 2rem auto;">
      <h2>Weekly Temperature (°C)</h2>
      <canvas #myCanvas></canvas>
      <button (click)="addDay()" style="margin-top: 1rem;">Add Next Day</button>
      <p>Days tracked: {{ labels().length }}</p>
    </div>
  \`,
})
export class TempChartComponent {
  myCanvas = viewChild<ElementRef<HTMLCanvasElement>>('myCanvas');

  // TODO: declare a private Chart instance property

  labels = signal(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  temps  = signal([18, 21, 19, 24, 22, 26, 23]);

  private allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon+1','Tue+1','Wed+1'];
  private dayIndex = 7;

  constructor() {
    afterNextRender(() => {
      // TODO: initialize the Chart.js line chart
    });
  }

  addDay() {
    // TODO: add a new data point and update the chart in-place
  }
}`,
    solution: `import { Component, signal, ElementRef, viewChild, afterNextRender, inject, DestroyRef } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-temp-chart',
  standalone: true,
  template: \`
    <div style="max-width: 600px; margin: 2rem auto;">
      <h2>Weekly Temperature (°C)</h2>
      <canvas #myCanvas></canvas>
      <button (click)="addDay()" style="margin-top: 1rem;">Add Next Day</button>
      <p>Days tracked: {{ labels().length }}</p>
    </div>
  \`,
})
export class TempChartComponent {
  myCanvas = viewChild<ElementRef<HTMLCanvasElement>>('myCanvas');
  private chart!: Chart;

  labels = signal(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  temps  = signal([18, 21, 19, 24, 22, 26, 23]);

  private allDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun','Mon+1','Tue+1','Wed+1'];
  private dayIndex = 7;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const ctx = this.myCanvas()!.nativeElement;
      this.chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [...this.labels()],
          datasets: [{
            label: 'Temperature (°C)',
            data: [...this.temps()],
            borderColor: 'rgba(99,102,241,1)',
            backgroundColor: 'rgba(99,102,241,0.15)',
            fill: true,
            tension: 0.4,
          }],
        },
        options: {
          responsive: true,
          scales: { y: { beginAtZero: false, min: 10, max: 35 } },
          plugins: { legend: { position: 'top' } },
        },
      });
      destroyRef.onDestroy(() => this.chart?.destroy());
    });
  }

  addDay() {
    if (this.dayIndex >= this.allDays.length) return;
    const newTemp = Math.floor(Math.random() * 16) + 15;
    const newLabel = this.allDays[this.dayIndex++];

    this.labels.update(l => [...l, newLabel]);
    this.temps.update(t => [...t, newTemp]);

    (this.chart.data.labels as string[]).push(newLabel);
    this.chart.data.datasets[0].data.push(newTemp);
    this.chart.update();
  }
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Chart.js with Angular: initialize charts in afterNextRender() (browser-only, post-paint), store the instance in a private property, update in-place with chart.update(), and destroy with DestroyRef.onDestroy() to prevent canvas context leaks.',
    mustKnow: [
      '<code>afterNextRender()</code> is the correct place to initialize Chart.js — fires after first browser paint, skipped in SSR; never use <code>ngAfterViewInit</code> for DOM-dependent libs',
      '<code>viewChild&lt;ElementRef&lt;HTMLCanvasElement&gt;&gt;(\'canvasRef\')</code> gets the canvas signal; access <code>.nativeElement</code> to pass to <code>new Chart()</code>',
      'Update in-place: <code>chart.data.datasets[0].data = newData; chart.update()</code> — never destroy + recreate (causes flash)',
      '<code>Chart.register(...registerables)</code> at module level — required for tree-shakable Chart.js; missing it causes blank charts with no error',
      'Use <code>effect()</code> to bridge Angular signals to Chart.js: read signal inside effect, call <code>chart.update()</code> imperatively',
      '<code>inject(DestroyRef).onDestroy(() =&gt; this.chart?.destroy())</code> — always cleanup to prevent canvas context leaks',
      'Call <code>chart.resize()</code> when showing a chart inside a previously-hidden container (tab, accordion)',
    ],
    interviewFocus: [
      'Why is afterNextRender() better than ngAfterViewInit for Chart.js initialization?',
      'How do you update chart data reactively from an Angular signal without recreating the chart?',
      'What happens if you forget Chart.register() and how does tree-shaking affect it?',
      'How do you prevent canvas context memory leaks in an Angular chart component?',
      'How would you use Chart.js with Angular SSR (Universal)?',
    ],
  };
}
