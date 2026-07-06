import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-update-prompts-and-install-banners-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-update-prompts-and-install-banners.html',
  styleUrl: './testing-update-prompts-and-install-banners.scss',
})
export class TestingUpdatePromptsAndInstallBannersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic never covers testing — and SW-dependent code is unusually hard to unit test',
      points: [
        'The main PWA page shows the update-prompt and install-banner CODE but never how to test it. Both features depend on browser objects a unit test environment does not provide for real: <code>SwUpdate</code> requires an actual registered service worker, and the <code>beforeinstallprompt</code> event is fired by the BROWSER at its own discretion — neither can be triggered for real inside Karma/Jest.',
        'As with the Web Workers testing subtopic\'s pattern, the fix is to make both dependencies INJECTABLE and FAKEABLE — <code>SwUpdate</code> is already an Angular DI-provided class, so it can be overridden with <code>TestBed.overrideProvider</code>; the DOM-level <code>beforeinstallprompt</code> event can be dispatched synthetically with <code>window.dispatchEvent(new Event(...))</code>.',
      ],
    },
    {
      heading: 'Faking SwUpdate.versionUpdates as a test-controlled Subject',
      points: [
        '<code>SwUpdate.versionUpdates</code> is a real Observable in production, backed by actual service worker events — in a test, replace the WHOLE <code>SwUpdate</code> instance with a fake object exposing a plain RxJS <code>Subject</code> in place of <code>versionUpdates</code>, plus a fake <code>isEnabled: true</code>. This lets the test manually <code>.next()</code> a <code>&#123; type: \'VERSION_READY\' &#125;</code> event and assert the component reacted — exactly as fast and deterministic as the worker-mock pattern from the Web Workers testing subtopic.',
        '<code>TestBed.overrideProvider(SwUpdate, &#123; useValue: fakeSwUpdate &#125;)</code> swaps the DI-provided instance for the fake BEFORE <code>TestBed.createComponent()</code> — this must happen before component creation, since the component\'s constructor is what calls <code>inject(SwUpdate)</code> and subscribes to <code>versionUpdates</code>.',
        'Because the component filters for <code>e.type === \'VERSION_READY\'</code>, a useful additional test emits an event with a DIFFERENT type (e.g. <code>VERSION_DETECTED</code>) and asserts the update prompt does NOT appear — proving the filter logic itself, not just the happy path.',
      ],
    },
    {
      heading: 'Testing the install banner without a real beforeinstallprompt',
      points: [
        'The browser fires <code>beforeinstallprompt</code> on <code>window</code> with a non-standard event carrying a <code>.prompt()</code> method and a <code>.userChoice</code> promise — a test can construct a plain object shaped the same way and dispatch it: <code>const fakeEvent = Object.assign(new Event(\'beforeinstallprompt\'), &#123; preventDefault: jasmine.createSpy(), prompt: jasmine.createSpy(), userChoice: Promise.resolve(&#123; outcome: \'accepted\' &#125;) &#125;); window.dispatchEvent(fakeEvent);</code>.',
        'Because the component\'s listener was registered at construction time (<code>window.addEventListener(\'beforeinstallprompt\', ...)</code> in the constructor), the fixture must already be created BEFORE dispatching the fake event — otherwise there is no listener yet to receive it.',
        'Assert both halves of the flow: dispatching the fake event makes <code>showInstall()</code> become <code>true</code>; then clicking the install button and letting <code>userChoice</code> resolve with <code>&#123; outcome: \'accepted\' &#125;</code> should make <code>showInstall()</code> return to <code>false</code> — this proves the FULL round trip, not just that the banner appeared.',
      ],
    },
    {
      heading: 'A note on what these tests do NOT prove',
      points: [
        'None of this proves the REAL browser fires these events correctly, that your <code>ngsw-config.json</code> actually produces a <code>VERSION_READY</code> transition, or that Chrome\'s install-prompt heuristics will actually offer the prompt on your site. These unit tests verify your COMPONENT\'S reaction to the events — they are a fast, deterministic complement to (not a replacement for) manually verifying the real flow with <code>ng build</code> + a static server + Chrome DevTools\' Application panel, as the main topic\'s debugging section describes.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/update-banner.component.ts',
      content: `import { Component, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
  selector: 'app-update-banner',
  standalone: true,
  template: \`
    @if (updateReady()) {
      <div class="banner">
        New version available.
        <button (click)="reload()">Reload</button>
      </div>
    }
  \`,
})
export class UpdateBannerComponent {
  private swUpdate = inject(SwUpdate);
  updateReady = signal(false);

  constructor() {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates.pipe(
      filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'),
    ).subscribe(() => this.updateReady.set(true));
  }

  reload() {
    document.location.reload();
  }
}
`,
    },
    {
      path: 'src/app/install-banner.component.ts',
      content: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-install-banner',
  standalone: true,
  template: \`
    @if (showInstall()) {
      <div class="banner">
        Install this app.
        <button (click)="install()">Install</button>
      </div>
    }
  \`,
})
export class InstallBannerComponent {
  private deferredPrompt = signal<any>(null);
  showInstall = computed(() => !!this.deferredPrompt());

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt.set(e);
    });
  }

  async install() {
    const prompt = this.deferredPrompt();
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') this.deferredPrompt.set(null);
  }
}
`,
    },
    {
      path: 'src/app/banners.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { SwUpdate } from '@angular/service-worker';
import { UpdateBannerComponent } from './update-banner.component';
import { InstallBannerComponent } from './install-banner.component';

describe('UpdateBannerComponent with a faked SwUpdate', () => {
  function createBanner(versionUpdates$: Subject<any>) {
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: { isEnabled: true, versionUpdates: versionUpdates$ } },
      ],
    });
    const fixture = TestBed.createComponent(UpdateBannerComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('shows the banner on a VERSION_READY event', () => {
    const versionUpdates$ = new Subject<any>();
    const { component } = createBanner(versionUpdates$);

    versionUpdates$.next({ type: 'VERSION_READY' });

    expect(component.updateReady()).toBe(true);
  });

  it('does NOT show the banner for a non-READY event type', () => {
    const versionUpdates$ = new Subject<any>();
    const { component } = createBanner(versionUpdates$);

    versionUpdates$.next({ type: 'VERSION_DETECTED' });

    expect(component.updateReady()).toBe(false);
  });
});

describe('InstallBannerComponent with a synthetic beforeinstallprompt', () => {
  it('shows the install button after a fake beforeinstallprompt event', () => {
    const fixture = TestBed.createComponent(InstallBannerComponent);
    fixture.detectChanges(); // registers the window listener in the constructor

    const fakeEvent = Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: jasmine.createSpy(),
      prompt: jasmine.createSpy(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(fakeEvent);

    expect(fixture.componentInstance.showInstall()).toBe(true);
  });

  it('hides the banner after a successful install', async () => {
    const fixture = TestBed.createComponent(InstallBannerComponent);
    fixture.detectChanges();

    const fakeEvent = Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: jasmine.createSpy(),
      prompt: jasmine.createSpy(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    window.dispatchEvent(fakeEvent);

    await fixture.componentInstance.install();

    expect(fixture.componentInstance.showInstall()).toBe(false);
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { UpdateBannerComponent } from './update-banner.component';
import { InstallBannerComponent } from './install-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UpdateBannerComponent, InstallBannerComponent],
  template: \`
    <h3>Testing update prompts and install banners</h3>
    <p>Open banners.spec.ts — SwUpdate.versionUpdates is faked with a plain Subject,
    and beforeinstallprompt is dispatched as a synthetic window event, so both flows
    run deterministically with no real service worker involved.</p>
    <app-update-banner />
    <app-install-banner />
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
  <head><title>Testing Update Prompts and Install Banners</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving that when <code>userChoice</code> resolves with <code>&#123; outcome: \'dismissed\' &#125;</code> instead of <code>\'accepted\'</code>, the install banner STAYS visible — since the component only hides it on acceptance.',
    hint: 'Build a fakeEvent identical to the existing tests but with userChoice: Promise.resolve({ outcome: \'dismissed\' }). After awaiting install(), assert showInstall() is still true.',
    solution: `it('keeps the banner visible if the user dismisses the prompt', async () => {
  const fixture = TestBed.createComponent(InstallBannerComponent);
  fixture.detectChanges();

  const fakeEvent = Object.assign(new Event('beforeinstallprompt'), {
    preventDefault: jasmine.createSpy(),
    prompt: jasmine.createSpy(),
    userChoice: Promise.resolve({ outcome: 'dismissed' }),
  });
  window.dispatchEvent(fakeEvent);

  await fixture.componentInstance.install();

  expect(fixture.componentInstance.showInstall()).toBe(true);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing update-prompt and install-banner components requires a real registered service worker running in the test browser.',
      reality: '<code>SwUpdate</code> is an ordinary Angular DI-provided class — <code>TestBed.overrideProvider</code> (or a providers array override) can substitute a fake with a plain Subject for <code>versionUpdates</code>, no real service worker needed.',
    },
    {
      thought: 'the <code>beforeinstallprompt</code> browser event cannot be simulated in a test since it is triggered by internal browser heuristics.',
      reality: 'it is just a DOM event — a test can construct a plain object with the same shape (<code>preventDefault</code>, <code>prompt</code>, <code>userChoice</code>) and dispatch it via <code>window.dispatchEvent()</code>, which any listener registered with <code>addEventListener</code> receives identically to a real one.',
    },
    {
      thought: 'if these component-level tests pass, the PWA\'s update and install flow is fully verified.',
      reality: 'these tests only verify the COMPONENT\'s reaction to the events — they say nothing about whether ngsw-config.json actually produces a VERSION_READY transition or whether the real browser will offer the install prompt at all. Pair them with manual verification via ng build + DevTools, as the main topic\'s debugging section describes.',
    },
  ];
}
