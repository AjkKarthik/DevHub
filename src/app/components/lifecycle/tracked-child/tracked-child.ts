import { Component, Input, OnChanges, OnInit, OnDestroy, SimpleChanges, signal } from '@angular/core';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-tracked-child',
  templateUrl: './tracked-child.html',
  styleUrl: './tracked-child.scss',
})
export class TrackedChildComponent implements OnInit, OnChanges, OnDestroy {
  // Uses @Input() (not input()) so ngOnChanges fires
  @Input() text   = '';
  @Input() number = 0;

  log         = signal<string[]>([]);
  timerCount  = signal(0);
  mountedAt   = signal('');

  private timerSub!: Subscription;

  ngOnChanges(changes: SimpleChanges) {
    for (const [key, c] of Object.entries(changes)) {
      if (!c.firstChange) {
        this.addLog(`ngOnChanges — ${key}: ${JSON.stringify(c.previousValue)} → ${JSON.stringify(c.currentValue)}`);
      }
    }
  }

  ngOnInit() {
    this.mountedAt.set(new Date().toLocaleTimeString());
    this.addLog(`ngOnInit — component mounted at ${this.mountedAt()}`);
    this.timerSub = interval(1000).subscribe(() => this.timerCount.update(n => n + 1));
  }

  ngOnDestroy() {
    this.addLog('ngOnDestroy — subscription cancelled, timer stopped');
    this.timerSub.unsubscribe();
  }

  private addLog(msg: string) {
    this.log.update(l => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...l].slice(0, 10));
  }
}
