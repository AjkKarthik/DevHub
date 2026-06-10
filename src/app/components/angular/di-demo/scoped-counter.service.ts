import { Injectable, signal } from '@angular/core';

@Injectable()
export class ScopedCounterService {
  count = signal(0);
  increment() { this.count.update(n => n + 1); }
  reset()     { this.count.set(0); }
}
