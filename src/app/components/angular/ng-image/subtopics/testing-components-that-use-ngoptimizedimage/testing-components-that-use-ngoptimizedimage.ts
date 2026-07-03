import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-components-that-use-ngoptimizedimage-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-components-that-use-ngoptimizedimage.html',
  styleUrl: './testing-components-that-use-ngoptimizedimage.scss',
})
export class TestingComponentsThatUseNgoptimizedimageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'What is actually worth asserting on an NgOptimizedImage-driven component',
      points: [
        'Testing NgOptimizedImage itself is pointless — it is Angular\'s own directive, already tested by the framework. What IS worth testing is YOUR component\'s logic around it: does the correct image get <code>priority</code> based on a condition, does <code>[loaderParams]</code> receive the right values from component state, does a dynamically-built <code>ngSrc</code> string match what you expect.',
        'The standard approach is <code>TestBed.createComponent</code> + <code>fixture.debugElement.query(By.css(\'img\'))</code> to get the rendered native <code>&lt;img&gt;</code> element, then read its ATTRIBUTES directly — <code>img.nativeElement.getAttribute(\'ngSrc\')</code> won\'t work since <code>ngSrc</code> is consumed by the directive and does not remain as a DOM attribute; instead assert on what the directive actually renders: <code>src</code>, <code>srcset</code>, <code>fetchpriority</code>, <code>loading</code>.',
      ],
    },
    {
      heading: 'Providing a deterministic IMAGE_LOADER in tests',
      points: [
        'Real CDN loaders produce URLs that depend on a live base-URL configuration — in tests, override <code>IMAGE_LOADER</code> with a simple deterministic function so assertions on the resulting <code>src</code>/<code>srcset</code> are predictable and do not depend on your production CDN config being present: <code>{ provide: IMAGE_LOADER, useValue: (c: ImageLoaderConfig) =&gt; `test://\${c.src}?w=\${c.width}` }</code>.',
        'Without overriding the loader, tests fall back to the raw <code>ngSrc</code> value as the URL — which is FINE for asserting the component passed the right <code>ngSrc</code> input, but not sufficient if you specifically want to verify loader-parameter wiring (like <code>loaderParams</code> reaching the loader correctly).',
      ],
    },
    {
      heading: 'Asserting fetchpriority and the preload link for priority images',
      points: [
        'For a component that conditionally sets <code>priority</code> based on an <code>@Input()</code> or index (e.g. "only the first card in a list gets priority"), assert <code>img.nativeElement.getAttribute(\'fetchpriority\')</code> equals <code>\'high\'</code> for that element and is absent (or <code>\'auto\'</code>) for the others — this directly tests YOUR conditional logic, not the directive\'s internals.',
        'Asserting the injected <code>&lt;link rel="preload"&gt;</code> in <code>document.head</code> is possible but usually not worth it in unit tests — that DOM mutation is framework behavior, not something your component logic controls. Reserve head-injection assertions for an e2e test if LCP behavior specifically needs verification.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/product-card.ts',
      content: `import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgOptimizedImage],
  template: \`
    <img
      [ngSrc]="imageSrc()"
      width="400"
      height="400"
      [priority]="isFirst()"
      [loaderParams]="{ quality: 80 }"
      alt="Product"
    />
  \`,
})
export class ProductCardComponent {
  imageSrc = input.required<string>();
  isFirst = input(false);
}
`,
    },
    {
      path: 'src/app/product-card.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { IMAGE_LOADER, ImageLoaderConfig } from '@angular/common';
import { ProductCardComponent } from './product-card';

describe('ProductCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        {
          provide: IMAGE_LOADER,
          useValue: (c: ImageLoaderConfig) =>
            \`test://\${c.src}?w=\${c.width}&q=\${c.loaderParams?.['quality'] ?? 'auto'}\`,
        },
      ],
    });
  });

  it('sets fetchpriority="high" when isFirst is true', () => {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('imageSrc', 'shoe.jpg');
    fixture.componentRef.setInput('isFirst', true);
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('img'));
    expect(img.nativeElement.getAttribute('fetchpriority')).toBe('high');
  });

  it('does NOT set fetchpriority for non-first cards', () => {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('imageSrc', 'shoe.jpg');
    fixture.componentRef.setInput('isFirst', false);
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('img'));
    expect(img.nativeElement.getAttribute('fetchpriority')).not.toBe('high');
  });

  it('routes loaderParams through the configured IMAGE_LOADER', () => {
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('imageSrc', 'shoe.jpg');
    fixture.detectChanges();

    const img = fixture.debugElement.query(By.css('img'));
    expect(img.nativeElement.getAttribute('src')).toContain('q=80');
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { ProductCardComponent } from './product-card';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductCardComponent],
  template: \`
    <h3>Testing NgOptimizedImage-driven components</h3>
    <p>Open product-card.spec.ts — these tests assert the rendered fetchpriority attribute
    and confirm loaderParams reach a test-provided IMAGE_LOADER, without depending on any
    real CDN configuration.</p>
    <app-product-card imageSrc="shoe.jpg" [isFirst]="true" />
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
  <head><title>Testing components that use NgOptimizedImage</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test confirming that the rendered srcset attribute contains "w=400" when ngSrcset is added to ProductCardComponent as "200w, 400w, 800w".',
    hint: 'Add ngSrcset="200w, 400w, 800w" to the template, then in the spec query the img element and assert img.nativeElement.getAttribute(\'srcset\') contains the expected width-query substring from your test loader.',
    solution: `// product-card.ts — add to the template:
[ngSrcset]="'200w, 400w, 800w'"

// product-card.spec.ts
it('generates a srcset with all configured widths', () => {
  const fixture = TestBed.createComponent(ProductCardComponent);
  fixture.componentRef.setInput('imageSrc', 'shoe.jpg');
  fixture.detectChanges();

  const img = fixture.debugElement.query(By.css('img'));
  const srcset = img.nativeElement.getAttribute('srcset');
  expect(srcset).toContain('w=400');
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing an NgOptimizedImage-driven component means testing that ngSrc, ngSrcset, and priority work correctly as directive features.',
      reality: 'those directive mechanics are already tested by the Angular framework itself — worthwhile component tests assert YOUR component\'s logic, like whether a conditional priority input is applied to the right element.',
    },
    {
      thought: 'you can assert on the ngSrc attribute directly in a test, since that is the input you set in the template.',
      reality: 'ngSrc is consumed by the directive and does not remain as a literal DOM attribute — assert on what the directive actually renders instead: src, srcset, fetchpriority, loading.',
    },
    {
      thought: 'tests need a real CDN loader configured to verify anything meaningful about image URLs.',
      reality: 'providing a simple deterministic IMAGE_LOADER override in the test module makes URL assertions predictable and independent of production CDN configuration.',
    },
  ];
}
