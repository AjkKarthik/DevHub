import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-let-driven-templates-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-let-driven-templates.html',
  styleUrl: './testing-let-driven-templates.scss',
})
export class TestingLetDrivenTemplatesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'There is no @let value to spy on — it is erased before runtime',
      points: [
        'The main topic states plainly: "<code>@let</code> declarations do not exist in compiled component metadata... they are erased before runtime." This has a direct testing consequence — there is NO <code>fixture.componentInstance.someLetVar</code> to read, no property to spy on, and no way to assert on the "value of the @let" in isolation. The ONLY way to verify a <code>@let</code>-driven template behaves correctly is to assert on the RENDERED DOM OUTPUT.',
        'This is actually a useful DESIGN forcing-function: if you find yourself WANTING to test a <code>@let</code> expression\'s value directly (rather than its rendered effect), that is a signal the computation probably belongs in a <code>computed()</code> on the class instead — which naturally becomes directly testable via <code>fixture.componentInstance.myComputed()</code>.',
      ],
    },
    {
      heading: 'Testing @let via the rendered DOM — one @let, multiple assertions',
      points: [
        'The main topic\'s classic example — <code>@let count = items().length;</code> used in THREE places (a total display, an "empty" boolean check, and a disabled button state) — is tested by asserting on all THREE rendered outcomes for the SAME underlying data change, not just one. This indirectly proves the <code>@let</code> is being read consistently everywhere it is used, since a bug where one consumer reads a stale or different value would show up as an inconsistency between the three assertions.',
        'Query the DOM via <code>fixture.debugElement.query(By.css(...))</code> or <code>fixture.nativeElement.querySelector(...)</code> exactly as with any other Angular template test — <code>@let</code> requires NO special testing utilities or setup beyond what you would already use to test <code>{{ interpolation }}</code> or a structural directive\'s conditional rendering.',
      ],
    },
    {
      heading: 'A regression test specifically for the block-scoping rule',
      points: [
        'Since <code>@let</code>\'s block-scoping is enforced at TEMPLATE COMPILE TIME (referencing an out-of-scope <code>@let</code> is a compile error, not a runtime one — same category as the typed-forms <code>@ts-expect-error</code> pattern from an earlier subtopic), there is no runtime test possible for "does @let correctly stay out of scope outside its block" — the compiler already guarantees this on every build. What IS worth a runtime test: that a value INTENTIONALLY declared at a shared outer scope (specifically to be visible in multiple inner blocks) is correctly rendered consistently across ALL those blocks, proving the scoping decision in the template was made correctly for the use case.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/cart-summary.ts',
      content: `import { Component, signal } from '@angular/core';

interface CartItem { id: number; name: string; price: number; }

@Component({
  selector: 'app-cart-summary',
  standalone: true,
  template: \`
    @let count = items().length;
    @let empty = count === 0;

    <p class="count">Items: {{ count }}</p>
    <p class="empty-state">{{ empty ? 'Cart is empty' : 'Cart has items' }}</p>
    <button [disabled]="empty">Checkout</button>
  \`,
})
export class CartSummaryComponent {
  items = signal<CartItem[]>([]);

  addItem(item: CartItem) {
    this.items.update(list => [...list, item]);
  }

  clear() {
    this.items.set([]);
  }
}
`,
    },
    {
      path: 'src/app/cart-summary.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CartSummaryComponent } from './cart-summary';

describe('CartSummaryComponent @let-driven rendering', () => {
  it('renders all three count-derived outcomes consistently when empty', () => {
    const fixture = TestBed.createComponent(CartSummaryComponent);
    fixture.detectChanges();

    const countEl = fixture.debugElement.query(By.css('.count')).nativeElement;
    const emptyEl = fixture.debugElement.query(By.css('.empty-state')).nativeElement;
    const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;

    expect(countEl.textContent).toContain('0');
    expect(emptyEl.textContent).toContain('Cart is empty');
    expect(button.disabled).toBe(true);
  });

  it('renders all three count-derived outcomes consistently after adding an item', () => {
    const fixture = TestBed.createComponent(CartSummaryComponent);
    fixture.componentInstance.addItem({ id: 1, name: 'Widget', price: 10 });
    fixture.detectChanges();

    const countEl = fixture.debugElement.query(By.css('.count')).nativeElement;
    const emptyEl = fixture.debugElement.query(By.css('.empty-state')).nativeElement;
    const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;

    // All three assertions must agree — proving the @let is read consistently
    // everywhere it's used, not recomputed differently per usage site.
    expect(countEl.textContent).toContain('1');
    expect(emptyEl.textContent).toContain('Cart has items');
    expect(button.disabled).toBe(false);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { CartSummaryComponent } from './cart-summary';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CartSummaryComponent],
  template: \`
    <h3>Testing @let-driven templates</h3>
    <p>Open cart-summary.spec.ts — since @let has no runtime value to inspect directly,
    tests assert on all three rendered consumers (count, empty state, button) for the
    same underlying data change.</p>
    <app-cart-summary />
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
  <head><title>Testing @let-driven templates</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving that calling clear() after adding items resets all three rendered outcomes back to the empty state.',
    hint: 'Add an item, detectChanges(), call clear(), detectChanges() again, then repeat the same three assertions used in the "when empty" test.',
    solution: `it('resets all three outcomes after clear()', () => {
  const fixture = TestBed.createComponent(CartSummaryComponent);
  fixture.componentInstance.addItem({ id: 1, name: 'Widget', price: 10 });
  fixture.detectChanges();

  fixture.componentInstance.clear();
  fixture.detectChanges();

  const countEl = fixture.debugElement.query(By.css('.count')).nativeElement;
  const emptyEl = fixture.debugElement.query(By.css('.empty-state')).nativeElement;
  const button = fixture.debugElement.query(By.css('button')).nativeElement as HTMLButtonElement;

  expect(countEl.textContent).toContain('0');
  expect(emptyEl.textContent).toContain('Cart is empty');
  expect(button.disabled).toBe(true);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a @let variable can be read directly in a test via fixture.componentInstance, similar to a class property.',
      reality: '@let declarations are erased before runtime and do not exist in compiled component metadata — there is no property to read; the only way to verify behavior is asserting on the rendered DOM.',
    },
    {
      thought: 'testing that a @let stays correctly out of scope outside its declaring block requires a runtime test.',
      reality: '@let scoping is enforced at TEMPLATE COMPILE TIME — an out-of-scope reference is a compile error, already guaranteed on every build; no runtime test is possible or needed for that specific guarantee.',
    },
    {
      thought: 'testing one rendered consumer of a @let variable is sufficient if that @let is used in multiple places.',
      reality: 'asserting on ALL consumers for the same data change catches a bug where one consumer might read a stale or inconsistent value — a single-consumer test would miss that class of inconsistency.',
    },
  ];
}
