import { Component, signal, ElementRef, viewChild, afterNextRender, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Chart, ChartType, registerables } from 'chart.js';
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

Chart.register(...registerables);

@Component({
  selector: 'app-charts',
  imports: [FormsModule, CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './charts.html',
  styleUrl: './charts.scss',
})
export class ChartsDemo {
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

  // Chart type toggle
  barType = signal<'bar' | 'horizontalBar'>('bar');

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

  qna: QnaItem[] = [
    { q: 'Why use afterNextRender() to initialise a Chart.js chart?', a: '<code>afterNextRender()</code> fires after the first browser paint — the canvas element is guaranteed to be in the DOM and have dimensions. Initialising in <code>ngOnInit</code> or <code>ngAfterViewInit</code> can fail in SSR or before the DOM is ready.' },
    { q: 'How do you update a Chart.js chart without re-creating it?', a: 'Mutate <code>chart.data.datasets[0].data = newData</code> then call <code>chart.update()</code>. Never destroy and recreate — it causes a flash. Always store the chart instance in a signal or property.' },
    { q: 'How do you destroy a Chart.js instance to prevent memory leaks?', a: 'Call <code>chart.destroy()</code> in <code>ngOnDestroy()</code> or use <code>DestroyRef.onDestroy(() => this.chart?.destroy())</code>. Without it, old canvas contexts accumulate — eventually the browser warns about "too many active charts".' },
    { q: 'How do you make a Chart.js chart responsive to container size?', a: 'Set <code>responsive: true</code> (default) in the chart options. The chart resizes with its container. If the container is hidden initially (e.g. inside a tab), call <code>chart.resize()</code> when it becomes visible.' },
    { q: 'How do you access the canvas element for Chart.js in Angular?', a: '<code>canvas = viewChild.required&lt;ElementRef&lt;HTMLCanvasElement&gt;&gt;(\'myCanvas\')</code> in the component. Pass <code>this.canvas().nativeElement.getContext(\'2d\')</code> to <code>new Chart(ctx, config)</code>.' },
    { q: 'Can you use Chart.js with SSR (Angular Universal)?', a: 'Chart.js uses <code>document</code> and <code>canvas</code> — not available on the server. Wrap instantiation in <code>afterNextRender()</code> (browser-only) or <code>isPlatformBrowser()</code> check. The chart renders blank on server, hydrates in the browser.' },
  ];

  theory: TheoryPoint[] = [
  {
    heading: 'Integrating Chart.js with Angular',
    points: [
      'Chart.js operates on a <code>&lt;canvas&gt;</code> element — you must wait until the DOM is painted before calling <code>new Chart()</code>.',
      'Use <code>afterNextRender()</code> (Angular 17+) instead of <code>ngAfterViewInit</code> — it fires after the browser paints, not just after Angular renders.',
      'Get a reference to the canvas with <code>viewChild&lt;ElementRef&lt;HTMLCanvasElement&gt;&gt;(\'myCanvas\')</code>.',
      'Always destroy the chart instance (<code>chart.destroy()</code>) in <code>ngOnDestroy</code> to prevent memory leaks.',
    ],
  },
  {
    heading: 'Chart configuration',
    points: [
      'Chart.js uses a single config object: <code>{ type, data: { labels, datasets }, options }</code>.',
      '<code>datasets</code>: each dataset has <code>data</code>, <code>label</code>, and visual properties like <code>backgroundColor</code>, <code>borderColor</code>.',
      '<code>options.responsive: true</code>: the chart resizes with its container. Pair with <code>maintainAspectRatio: false</code> for full control.',
      'Plugins (legend, tooltip, annotation) are configured under <code>options.plugins</code>.',
    ],
  },
  {
    heading: 'Updating charts reactively',
    points: [
      'To update data: mutate <code>chart.data.datasets[0].data</code> then call <code>chart.update()</code>.',
      'For animated updates use <code>chart.update(\'active\')</code> — passes the active animation mode.',
      'Do NOT recreate the Chart instance on every data change — update in place for smooth transitions.',
      'Use <code>effect()</code> to react to signal changes and call <code>chart.update()</code> — clean reactive bridge.',
    ],
  },
  {
    heading: 'Key points to remember',
    points: [
      'Import only the chart types you use from <code>chart.js</code> and call <code>Chart.register(...)</code> for tree-shaking.',
      'Chart.js renders at <code>devicePixelRatio</code> automatically — no manual HiDPI handling needed.',
      'For SSR/prerendering, guard the Chart.js import with <code>isPlatformBrowser()</code> — canvas does not exist on the server.',
      'Alternatives to Chart.js: D3.js (full control), ECharts (richer types), Recharts (React), ngx-charts (Angular-native).',
    ],
  },
];

  tabs: CodeTab[] = [
    {
      label: 'Setup',
      language: 'typescript',
      code: `// npm install chart.js
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);  // register all chart types

@Component({...})
export class ChartsComponent {
  canvasEl = viewChild<ElementRef<HTMLCanvasElement>>('myCanvas');
  private chart!: Chart;

  constructor() {
    // afterNextRender — runs once after the DOM is painted
    afterNextRender(() => {
      this.chart = new Chart(this.canvasEl()!.nativeElement, {
        type: 'bar',
        data: { labels: [...], datasets: [{ data: [...] }] },
        options: { responsive: true },
      });
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
      borderRadius: 6,  // rounded bars
    }],
  },
  options: {
    responsive: true,
    scales: { y: { beginAtZero: true } },
  },
});

// Update data reactively:
chart.data.datasets[0].data = newData;
chart.update();  // re-renders with animation`,
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
        fill: true,   // area under the line
        tension: 0.4, // smooth curves (0=straight)
      },
      {
        label: 'Expenses',
        data: expenseData,
        borderColor: 'rgba(239,68,68,1)',
        fill: true,
        tension: 0.4,
      },
    ],
  },
  options: {
    responsive: true,
    plugins: { legend: { position: 'top' } },
  },
});`,
    },
    {
      label: 'Doughnut chart',
      language: 'typescript',
      code: `new Chart(ctx, {
  type: 'doughnut',  // or 'pie'
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
  },
});`,
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'Why does the ChartsDemo component initialize Chart.js charts inside afterNextRender() rather than ngAfterViewInit()?', options: ['afterNextRender() is the only lifecycle hook that works in standalone components', 'afterNextRender() fires after the browser paints, guaranteeing the canvas has real DOM dimensions', 'ngAfterViewInit() does not support viewChild signals', 'afterNextRender() automatically destroys the chart when the component unmounts'], answer: 1, explanation: 'afterNextRender() (Angular 17+) fires after the first browser paint, ensuring the canvas element is in the DOM and has computed dimensions. ngAfterViewInit fires after Angular\'s render cycle but before the browser paints, which can fail with SSR or when dimensions are 0.' },
    { q: 'In the ChartsDemo component, what is the correct way to update the bar chart data reactively after calling randomizeBar()?', options: ['Destroy and recreate the Chart instance with new Chart(ctx, config)', 'Call this.barChart.data = newConfig and then this.barChart.render()', 'Mutate this.barChart.data.datasets[0].data = data and then call this.barChart.update()', 'Re-assign the barData signal and Angular\'s change detection syncs Chart.js automatically'], answer: 2, explanation: 'The correct pattern is to mutate chart.data.datasets[0].data directly and then call chart.update(). Recreating the chart causes visual flashes. Chart.js does not watch Angular signals — you must call update() manually after mutating the data reference.' },
    { q: 'Which Angular API is used to get a reference to a canvas element in the ChartsDemo component?', options: ['@ViewChild() decorator with ElementRef', 'document.querySelector() inside the constructor', 'viewChild<ElementRef<HTMLCanvasElement>>() signal function', 'inject(ElementRef) from the DI system'], answer: 2, explanation: 'The component uses the viewChild<ElementRef<HTMLCanvasElement>>(\'barCanvas\') signal API introduced in Angular 17. It returns a signal whose value is the ElementRef. .nativeElement is accessed to get the raw HTMLCanvasElement passed to new Chart().' },
    { q: 'The pie/doughnut chart in ChartsDemo uses type: \'doughnut\'. What single property would you change in the Chart.js config to turn it into a standard filled pie chart?', options: ['Change options.plugins.legend.position to \'bottom\'', 'Add cutout: 0 to the options object', 'Change type: \'doughnut\' to type: \'pie\'', 'Set datasets[0].fill = true'], answer: 2, explanation: 'Changing type from \'doughnut\' to \'pie\' renders a standard pie chart. Alternatively, setting options.cutout to \'0%\' or 0 on a doughnut chart also produces the same visual result, but the most direct semantic change is swapping the type string.' },
    { q: 'What does Chart.register(...registerables) accomplish at the top of the ChartsDemo file?', options: ['It injects Chart.js as an Angular service so it can be used with dependency injection', 'It pre-renders all chart types server-side for SSR compatibility', 'It registers all built-in Chart.js controllers, scales, and plugins so they are available at runtime', 'It enables two-way data binding between Angular signals and Chart.js datasets'], answer: 2, explanation: 'Chart.js is tree-shakable — components like BarController and LinearScale are not included unless registered. Chart.register(...registerables) registers everything at once. For production you would import and register only the specific chart types and scales you use.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'afterNextRender', type: 'function', desc: 'Schedules a callback to run once after the first browser paint, guaranteeing the DOM and canvas dimensions are available before Chart.js initialisation.' , since: '17'},
    { name: 'viewChild', type: 'function', desc: 'Signal-based query that returns a live signal holding a reference to a child element or component, replacing the @ViewChild decorator.' , since: '17'},
    { name: 'signal', type: 'function', desc: 'Creates a reactive primitive that holds a value; reading it inside reactive contexts (templates, effects, computed) automatically tracks dependencies.' , since: '16'},
    { name: 'computed', type: 'function', desc: 'Derives a read-only signal whose value is recalculated whenever its dependent signals change, with memoisation.' , since: '16'},
    { name: 'Chart', type: 'class', desc: 'The core Chart.js class — instantiate with a canvas element and a config object ({ type, data, options }) to render interactive charts.' },
    { name: 'Chart.register', type: 'function', desc: 'Registers Chart.js controllers, scales, and plugins; required for tree-shaking — call Chart.register(...registerables) to enable all built-in chart types.' },
    { name: 'chart.update', type: 'function', desc: 'Re-renders an existing Chart.js instance in-place with optional animation mode; call this after mutating chart.data instead of recreating the chart.' },
    { name: 'chart.destroy', type: 'function', desc: 'Releases the Chart.js instance and its canvas context; must be called in ngOnDestroy or via DestroyRef to prevent memory leaks.' },
    { name: 'ElementRef', type: 'class', desc: 'Angular wrapper around a native DOM element; access the raw HTMLCanvasElement via elementRef.nativeElement to pass to new Chart().' },
    { name: 'DestroyRef', type: 'class', desc: 'Injectable reference that lets you register cleanup callbacks (onDestroy) without implementing the OnDestroy lifecycle interface.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Canvas element reference: @ViewChild decorator vs viewChild() signal', before: '// Angular < 17 — decorator-based\n@ViewChild(\'barCanvas\')\nbarCanvas!: ElementRef<HTMLCanvasElement>;\n\nngAfterViewInit() {\n  new Chart(this.barCanvas.nativeElement, config);\n}', after: '// Angular 17+ — signal-based\nbarCanvas = viewChild<ElementRef<HTMLCanvasElement>>(\'barCanvas\');\n\nconstructor() {\n  afterNextRender(() => {\n    new Chart(this.barCanvas()!.nativeElement, config);\n  });\n}',
      note: 'viewChild() returns a signal; afterNextRender() replaces ngAfterViewInit() and is SSR-safe.' },
    { title: 'Chart data storage: plain array vs signal', before: '// Plain array — change detection must diff manually\nbarData = [42, 78, 35, 91, 56];\n\nrandomize() {\n  this.barData = this.months.map(() => Math.random() * 100);\n  // template does NOT update chart automatically\n}', after: '// Signal — reactive source of truth\nbarData = signal([42, 78, 35, 91, 56]);\n\nrandomize() {\n  const data = this.months.map(() => Math.floor(Math.random() * 100));\n  this.barData.set(data);\n  this.barChart.data.datasets[0].data = data;\n  this.barChart.update();\n}',
      note: 'Signals make the data source reactive; Chart.js still requires a manual .update() call since it does not observe Angular signals.' },
    { title: 'Chart cleanup: ngOnDestroy interface vs DestroyRef callback', before: '// Old pattern — implements OnDestroy\nexport class ChartsComponent implements OnDestroy {\n  private chart!: Chart;\n\n  ngOnDestroy() {\n    this.chart?.destroy();\n  }\n}', after: '// Modern pattern — inject DestroyRef, no interface needed\nexport class ChartsComponent {\n  private chart!: Chart;\n\n  constructor(private destroyRef: DestroyRef) {\n    destroyRef.onDestroy(() => this.chart?.destroy());\n  }\n}',
      note: 'DestroyRef (Angular 16+) keeps cleanup co-located with initialisation and works in functional contexts.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Initialising Chart.js before the DOM paints', wrong: 'ngAfterViewInit() {\n  // canvas may have 0 dimensions or fail in SSR\n  new Chart(this.canvas.nativeElement, config);\n}', right: 'constructor() {\n  afterNextRender(() => {\n    new Chart(this.canvas()!.nativeElement, config);\n  });\n}', explanation: 'ngAfterViewInit fires after Angular\'s render cycle but before the browser paints, so canvas dimensions can be zero. afterNextRender() (Angular 17+) is browser-only and fires after the first real paint.'  },
    { title: 'Recreating the chart on every data change', wrong: 'updateChart(newData: number[]) {\n  this.chart.destroy();\n  this.chart = new Chart(ctx, { ...config, data: newData });\n}', right: 'updateChart(newData: number[]) {\n  this.chart.data.datasets[0].data = newData;\n  this.chart.update();\n}', explanation: 'Destroying and recreating the chart on every update causes a visible flash and is expensive. Mutate the data reference directly and call chart.update() for smooth animated transitions.'  },
    { title: 'Forgetting Chart.register() causing blank charts', wrong: 'import { Chart } from \'chart.js\';\n// No register call — BarController is not bundled\nnew Chart(ctx, { type: \'bar\', ... }); // silent blank', right: 'import { Chart, registerables } from \'chart.js\';\nChart.register(...registerables);\nnew Chart(ctx, { type: \'bar\', ... }); // works', explanation: 'Chart.js is tree-shakable; chart controllers and scales are not included unless registered. Always call Chart.register(...registerables) at module level (or register only what you use for smaller bundles).'  },
    { title: 'Not destroying the chart instance on component teardown', wrong: '// No cleanup — canvas contexts accumulate\nexport class ChartComponent {\n  chart = new Chart(...);\n}', right: 'constructor(private destroyRef: DestroyRef) {\n  afterNextRender(() => {\n    this.chart = new Chart(...);\n    destroyRef.onDestroy(() => this.chart?.destroy());\n  });\n}', explanation: 'Each Chart.js instance registers itself against its canvas context. Without chart.destroy(), navigating away and back leaks contexts until the browser warns \'too many active charts\'.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 17', label: 'afterNextRender() and viewChild() signal API', features: ['afterNextRender() replaces ngAfterViewInit for DOM-dependent third-party libs like Chart.js — runs after the first browser paint and is automatically skipped on the server', 'viewChild() / viewChild.required() return signals instead of decorated properties, making canvas references reactive and removing the need for the @ViewChild decorator', '@if / @for / @defer block syntax replaces structural directives for cleaner templates'] },
    { version: 'Angular 16', label: 'Signals and DestroyRef', features: ['signal(), computed(), and effect() provide a fine-grained reactive primitive to store chart data with automatic dependency tracking', 'DestroyRef allows registering chart.destroy() cleanup callbacks co-located with chart creation, without implementing the OnDestroy interface'] },
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
      // TODO: initialize the Chart.js line chart using this.myCanvas()!.nativeElement
      // Use this.labels() for labels and this.temps() for data
      // Set type: 'line', tension: 0.4, fill: true, responsive: true
    });
  }

  addDay() {
    // TODO: generate a random temperature between 15 and 30
    // TODO: update the labels and temps signals
    // TODO: push new values to chart.data.labels and chart.data.datasets[0].data
    // TODO: call chart.update()
  }
}`,
    solution: `import { Component, signal, ElementRef, viewChild, afterNextRender } from '@angular/core';
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
}
