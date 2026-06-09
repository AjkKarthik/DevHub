import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SharedCounterService {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => n - 1); }
  reset()     { this.count.set(0); }
}
