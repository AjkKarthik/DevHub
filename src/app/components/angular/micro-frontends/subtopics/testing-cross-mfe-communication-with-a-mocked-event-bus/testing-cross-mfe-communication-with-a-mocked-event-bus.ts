import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-cross-mfe-communication-with-a-mocked-event-bus-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-cross-mfe-communication-with-a-mocked-event-bus.html',
  styleUrl: './testing-cross-mfe-communication-with-a-mocked-event-bus.scss',
})
export class TestingCrossMfeCommunicationWithAMockedEventBusSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'Testing each side of the event contract in complete isolation',
      points: [
        'The main topic\'s cross-MFE communication pattern (typed <code>CustomEvent</code>s on <code>window</code>) has a genuinely useful testing property: since <code>window</code> is a single, real, ordinary DOM object available in any test environment, you can test the DISPATCHING side (the remote that fires the event) and the LISTENING side (the shell that reacts to it) as two COMPLETELY SEPARATE unit tests — neither test needs the other MFE\'s actual code running, because <code>window</code> is the shared contract, not a direct reference between the two apps.',
        'This mirrors exactly how you would test any two decoupled systems that communicate through a shared protocol — you do not need a real HTTP server to test a fetch call\'s request shape, and you do not need the SECOND micro-frontend actually running to test whether the FIRST one dispatches the correct event with the correct payload shape.',
      ],
    },
    {
      heading: 'Testing the dispatching side — asserting the exact event shape',
      points: [
        'Spy on <code>window.dispatchEvent</code> (or attach a real listener before triggering the action) and assert not just THAT an event fired, but its <code>type</code> and <code>detail</code> payload EXACTLY match the shared contract\'s TypeScript interface — a typo in the event name string (<code>\'mfe:cart:updated\'</code> vs <code>\'mfe:cart:updates\'</code>) compiles fine (event names are just strings) but silently breaks cross-MFE communication in production, and only a test asserting the EXACT string catches it.',
        'Use the shared TypeScript interface (like the main topic\'s <code>CartUpdatedEvent</code>) as the SOURCE OF TRUTH for the test\'s assertions — construct the expected detail object using the interface\'s shape, so a later change to the shared contract that is not matched by the dispatching code\'s payload causes a TYPE ERROR in the test file itself, catching contract drift at compile time in addition to the runtime assertion.',
      ],
    },
    {
      heading: 'Testing the listening side — simulating the OTHER MFE\'s dispatch',
      points: [
        'To test the SHELL\'s reaction to a cart-updated event WITHOUT the cart remote actually running, manually dispatch the event yourself in the test: <code>window.dispatchEvent(new CustomEvent(CART_UPDATED, { detail: { itemCount: 3, total: 29.99 } }))</code>, then assert the shell component\'s signal/state updated correctly — this proves the LISTENING logic works, independent of whether the actual remote correctly PRODUCES that event (which is the dispatching-side test\'s job).',
        'Always test the CLEANUP path too — render the component, unmount/destroy it (simulating navigation away or the component being torn down), dispatch the event AGAIN, and assert the component\'s (now-destroyed) state did NOT update — this catches a missing <code>window.removeEventListener</code> call in <code>ngOnDestroy</code>, exactly the kind of leak that accumulates listeners silently in a long-running SPA session across many mounts/unmounts of the same remote.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/cart-events.ts',
      content: `export interface CartUpdatedDetail {
  itemCount: number;
  total: number;
}

export const CART_UPDATED = 'mfe:cart:updated';

export function dispatchCartUpdated(detail: CartUpdatedDetail): void {
  window.dispatchEvent(new CustomEvent<CartUpdatedDetail>(CART_UPDATED, { detail, bubbles: true }));
}
`,
    },
    {
      path: 'src/app/cart-events.spec.ts',
      content: `import { dispatchCartUpdated, CART_UPDATED, CartUpdatedDetail } from './cart-events';

describe('cart-events dispatching contract', () => {
  it('dispatches the exact event type and detail shape', () => {
    const listener = jasmine.createSpy('listener');
    window.addEventListener(CART_UPDATED, listener);

    // Using the shared TypeScript interface as the source of truth — a change
    // to CartUpdatedDetail that is not matched here is a compile-time error.
    const expectedDetail: CartUpdatedDetail = { itemCount: 3, total: 29.99 };
    dispatchCartUpdated(expectedDetail);

    expect(listener).toHaveBeenCalledTimes(1);
    const event = listener.calls.mostRecent().args[0] as CustomEvent<CartUpdatedDetail>;
    expect(event.type).toBe(CART_UPDATED); // catches a typo'd event name string
    expect(event.detail).toEqual(expectedDetail);

    window.removeEventListener(CART_UPDATED, listener);
  });
});
`,
    },
    {
      path: 'src/app/header.ts',
      content: `import { Component, signal, DestroyRef } from '@angular/core';
import { CART_UPDATED, CartUpdatedDetail } from './cart-events';

@Component({
  selector: 'app-header',
  standalone: true,
  template: \`<p>Cart items: {{ cartCount() }}</p>\`,
})
export class HeaderComponent {
  cartCount = signal(0);

  private listener = (e: Event) => {
    const detail = (e as CustomEvent<CartUpdatedDetail>).detail;
    this.cartCount.set(detail.itemCount);
  };

  constructor(destroyRef: DestroyRef) {
    window.addEventListener(CART_UPDATED, this.listener);
    destroyRef.onDestroy(() => window.removeEventListener(CART_UPDATED, this.listener));
  }
}
`,
    },
    {
      path: 'src/app/header.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header';
import { dispatchCartUpdated } from './cart-events';

describe('HeaderComponent listening contract', () => {
  it('updates cartCount when a cart-updated event fires — no cart remote needed', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();

    // Manually simulating the OTHER MFE's dispatch — the cart remote never runs.
    dispatchCartUpdated({ itemCount: 5, total: 49.99 });

    expect(fixture.componentInstance.cartCount()).toBe(5);
  });

  it('stops updating after the component is destroyed (listener cleanup)', () => {
    const fixture = TestBed.createComponent(HeaderComponent);
    fixture.detectChanges();
    dispatchCartUpdated({ itemCount: 2, total: 10 });
    expect(fixture.componentInstance.cartCount()).toBe(2);

    fixture.destroy(); // triggers DestroyRef.onDestroy → removeEventListener

    dispatchCartUpdated({ itemCount: 99, total: 999 });
    // Component instance still exists in memory but should NOT have updated —
    // proves the listener was actually removed, not leaked.
    expect(fixture.componentInstance.cartCount()).toBe(2);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { HeaderComponent } from './header';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent],
  template: \`
    <h3>Testing cross-MFE communication with a mocked event bus</h3>
    <p>Open cart-events.spec.ts (dispatching side) and header.spec.ts (listening side) —
    neither test needs the OTHER micro-frontend's actual code running, since window is
    the shared contract, not a direct reference between the two apps.</p>
    <app-header />
  \`,
})
export class App {}
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
  <head><title>Testing cross-MFE communication with a mocked event bus</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving that an event with the WRONG type string (a typo) does NOT trigger HeaderComponent\'s listener.',
    hint: 'Dispatch a CustomEvent with type "mfe:cart:updates" (extra "s", a typo) instead of the correct CART_UPDATED constant, and assert cartCount() remains unchanged from its initial value.',
    solution: `it('ignores events with a mismatched (typo\\'d) event type', () => {
  const fixture = TestBed.createComponent(HeaderComponent);
  fixture.detectChanges();

  window.dispatchEvent(new CustomEvent('mfe:cart:updates', { // typo — extra 's'
    detail: { itemCount: 99, total: 999 },
  }));

  expect(fixture.componentInstance.cartCount()).toBe(0); // unchanged — listener never fired
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing cross-MFE event communication requires running both the shell and the remote together, similar to an e2e test.',
      reality: 'since window is the shared contract (not a direct code reference between the two apps), the dispatching side and listening side can be tested as two completely separate unit tests, neither needing the other MFE\'s actual code running.',
    },
    {
      thought: 'a test confirming "some event fired" is sufficient coverage for the dispatching side of a cross-MFE contract.',
      reality: 'a typo\'d event name string compiles fine (event names are just strings) but silently breaks communication in production — only asserting the EXACT type and detail shape against the shared interface catches this.',
    },
    {
      thought: 'testing that a component reacts correctly to an event is sufficient without also testing cleanup.',
      reality: 'dispatching the event again AFTER destroying the component and asserting no update occurred catches a missing removeEventListener call — a real leak class in long-running SPA sessions with many mount/unmount cycles.',
    },
  ];
}
