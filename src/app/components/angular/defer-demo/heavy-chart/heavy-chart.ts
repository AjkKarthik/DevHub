import { Component, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-heavy-chart',
  template: `
    <div class="chart">
      <h4>Heavy Chart Component</h4>
      <p>Simulating a large charting library load ({{ status() }}).</p>
      <div class="bars">
        @for (bar of bars; track bar.label) {
          <div class="bar-wrap">
            <div class="bar" [style.height.px]="bar.value * 2">
              <span>{{ bar.value }}</span>
            </div>
            <label>{{ bar.label }}</label>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .chart { padding: 1rem; background: #f0f4ff; border-radius: 8px; }
    .bars { display: flex; gap: 12px; align-items: flex-end; height: 140px; margin-top: 1rem; }
    .bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .bar { width: 40px; background: #4f6ef7; border-radius: 4px 4px 0 0; display: flex; align-items: flex-start; justify-content: center; padding-top: 4px; }
    .bar span { color: #fff; font-size: 0.75rem; font-weight: 600; }
    label { font-size: 0.75rem; color: #555; }
  `],
})
export class HeavyChartComponent implements OnInit {
  status = signal('loading…');
  bars = [
    { label: 'Jan', value: 30 },
    { label: 'Feb', value: 55 },
    { label: 'Mar', value: 42 },
    { label: 'Apr', value: 65 },
    { label: 'May', value: 38 },
    { label: 'Jun', value: 72 },
  ];

  ngOnInit() {
    // Simulate async initialisation
    setTimeout(() => this.status.set('ready'), 600);
  }
}
