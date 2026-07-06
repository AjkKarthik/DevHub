import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-testing-components-that-use-transloco-and-signal-i18n-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './testing-components-that-use-transloco-and-signal-i18n.html',
  styleUrl: './testing-components-that-use-transloco-and-signal-i18n.scss',
})
export class TestingComponentsThatUseTranslocoAndSignalI18nSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main topic never covers testing — and translated text is an easy assertion to get wrong',
      points: [
        'The main i18n page shows how to WIRE UP Transloco and signal-based translation maps but not how to test a component that displays translated text. A naive test that asserts hardcoded English strings (<code>expect(el.textContent).toBe(\'Hello\')</code>) is fragile in two ways: it breaks the moment a translator updates the English copy, and it gives zero coverage that OTHER locales render correctly at all.',
        'The right approach mirrors the pattern used elsewhere in this series (mocking Workers, mocking SwUpdate): provide a TEST-CONTROLLED translation source, then assert against the SAME source the test configured — not against a literal string duplicated in both the component and the spec.',
      ],
    },
    {
      heading: 'Testing the signal-based map pattern',
      points: [
        'For the zero-dependency <code>signal&lt;Lang&gt;</code> + <code>computed()</code> pattern from the main topic, no mocking is needed at all — inject the REAL <code>I18nService</code>, call <code>service.setLang(\'fr\')</code> directly, then assert the computed <code>t()</code> value or the rendered DOM text matches the French entry in the SAME translation map the component imports. This works because the map is plain data, not a network-backed dependency.',
        'Assert reactivity itself, not just the end state: render with <code>lang</code> at its default (<code>\'en\'</code>), capture the greeting text, call <code>setLang(\'es\')</code>, then <code>fixture.detectChanges()</code>, and assert the DOM text actually CHANGED — a test that only checks the Spanish case in isolation would miss a bug where the language never updated the DOM at all (a stale computed(), a missing <code>fixture.detectChanges()</code> call, or a template not reading the signal reactively).',
      ],
    },
    {
      heading: 'Testing Transloco — override the loader, not the network',
      points: [
        'Transloco\'s <code>TranslocoTestingModule</code> (from <code>@jsverse/transloco</code>) is purpose-built for this: <code>provideTranslocoTesting(&#123; langs: &#123; en: &#123; greeting: \'Hello\' &#125;, fr: &#123; greeting: \'Bonjour\' &#125; &#125;, translocoConfig: &#123; availableLangs: [\'en\', \'fr\'], defaultLang: \'en\' &#125; &#125;)</code> — this supplies translation JSON directly in the test, bypassing <code>TranslocoHttpLoader</code>\'s real HTTP fetch entirely.',
        'Without the testing module, a spec using the real <code>provideTransloco()</code> setup would need an <code>HttpTestingController</code> to flush a fake HTTP response for every language the test touches — the testing module\'s in-memory language map removes that whole layer of ceremony for what is fundamentally a data-lookup concern, not a networking concern.',
        'To test <code>setActiveLang()</code> reactivity in Transloco specifically (mirroring the signal-map test above), the main topic\'s emphasis on <code>reRenderOnLangChange: true</code> becomes directly testable: render with the default language, call <code>translocoService.setActiveLang(\'fr\')</code>, run <code>fixture.detectChanges()</code>, and assert the DOM updated — a regression test that would have CAUGHT the "Common Mistake" the main topic warns about (forgetting that config flag) if it had existed at the time.',
      ],
    },
    {
      heading: 'Asserting pluralisation and Intl formatting deterministically',
      points: [
        '<code>Intl.PluralRules</code> and <code>Intl.NumberFormat</code> are DETERMINISTIC pure functions of (locale, value) — no mocking needed. A test can call the exact same <code>Intl</code> constructor the component uses with the same arguments and assert equality, OR (more robust to implementation changes) assert on a locale-and-value pair known to differ across plural categories, e.g. asserting the count-1 case renders differently from the count-5 case in a language with distinct singular/plural forms.',
        'A useful REGRESSION-style test for pluralisation bugs specifically: assert count <code>0</code>, <code>1</code>, and <code>5</code> each produce visibly different rendered text for a locale with an ICU <code>=0</code>/<code>=1</code>/<code>other</code> split — a bug that collapses all three into the same "other" text (e.g. a missing <code>=0</code> case) is easy to introduce during a refactor and easy to catch with three assertions, but easy to miss with only one.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/i18n.service.ts',
      content: `import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'en' | 'es' | 'fr';

export const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { greeting: 'Hello' },
  es: { greeting: 'Hola' },
  fr: { greeting: 'Bonjour' },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private _lang = signal<Lang>('en');
  readonly lang = this._lang.asReadonly();

  t = computed(() => TRANSLATIONS[this._lang()]);

  setLang(l: Lang) {
    this._lang.set(l);
  }
}
`,
    },
    {
      path: 'src/app/greeting.component.ts',
      content: `import { Component, inject } from '@angular/core';
import { I18nService } from './i18n.service';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: \`<p class="greeting">{{ i18n.t()['greeting'] }}</p>\`,
})
export class GreetingComponent {
  i18n = inject(I18nService);
}
`,
    },
    {
      path: 'src/app/greeting.component.spec.ts',
      content: `import { TestBed } from '@angular/core/testing';
import { GreetingComponent } from './greeting.component';
import { I18nService, TRANSLATIONS } from './i18n.service';

describe('GreetingComponent — signal-based i18n', () => {
  function createGreeting() {
    const fixture = TestBed.createComponent(GreetingComponent);
    fixture.detectChanges();
    return { fixture, i18n: TestBed.inject(I18nService) };
  }

  it('renders the greeting for the DEFAULT language, sourced from the same map', () => {
    const { fixture } = createGreeting();
    const text = fixture.nativeElement.querySelector('.greeting').textContent;

    // Assert against the SAME map the component reads from — not a duplicated
    // literal — so a translator edit to the English copy doesn't break this test.
    expect(text).toBe(TRANSLATIONS.en['greeting']);
  });

  it('updates the DOM text reactively when the language signal changes', () => {
    const { fixture, i18n } = createGreeting();
    const before = fixture.nativeElement.querySelector('.greeting').textContent;

    i18n.setLang('fr');
    fixture.detectChanges();

    const after = fixture.nativeElement.querySelector('.greeting').textContent;
    expect(after).toBe(TRANSLATIONS.fr['greeting']);
    expect(after).not.toBe(before); // proves the DOM actually reacted, not just the signal
  });
});
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { GreetingComponent } from './greeting.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GreetingComponent],
  template: \`
    <h3>Testing components that use signal-based i18n</h3>
    <p>Open greeting.component.spec.ts — the second test proves the DOM actually
    re-renders on a language change, not just that the signal value changed.</p>
    <app-greeting />
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
  <head><title>Testing Components That Use Transloco and Signal-Based i18n</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a test proving that calling <code>i18n.setLang(\'es\')</code> then <code>i18n.setLang(\'en\')</code> (switching away and back) returns the DOM to EXACTLY the original English text — a regression guard against any per-language state that might not fully reset when switching languages twice.',
    hint: 'Capture the initial text, switch to \'es\' and detectChanges(), switch back to \'en\' and detectChanges() again, then assert the final text strictly equals the initial text captured at the start.',
    solution: `it('returns to the exact original text after switching away and back', () => {
  const { fixture, i18n } = createGreeting();
  const original = fixture.nativeElement.querySelector('.greeting').textContent;

  i18n.setLang('es');
  fixture.detectChanges();

  i18n.setLang('en');
  fixture.detectChanges();

  const final = fixture.nativeElement.querySelector('.greeting').textContent;
  expect(final).toBe(original);
});`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'testing a translated component means asserting the exact hardcoded English string the component currently renders.',
      reality: 'asserting against a literal duplicates the translation source in two places — the test should read from the SAME translation map or Transloco testing config the component reads from, so a translator copy edit does not spuriously break the test.',
    },
    {
      thought: 'testing Transloco-based components requires either hitting the real HTTP loader or manually flushing HttpTestingController requests for every language touched.',
      reality: '<code>TranslocoTestingModule</code> supplies translation JSON directly in-memory for tests, bypassing TranslocoHttpLoader\'s real fetch entirely — no HttpTestingController ceremony needed for what is fundamentally a data-lookup concern.',
    },
    {
      thought: 'if a test asserts the correct translated text appears after switching languages, that proves the reactivity chain (signal or Transloco pipe) is wired correctly.',
      reality: 'a test should ALSO assert the text actually CHANGED from its initial value — a component with a broken reactivity chain that happens to render the correct text by coincidence (e.g. hardcoded per-locale HTML that never actually re-renders) can pass a same-value assertion while still being broken.',
    },
  ];
}
