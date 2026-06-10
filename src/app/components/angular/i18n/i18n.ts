import { Component, signal, computed } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { VersionBadgeComponent, VersionInfo } from '../../shared/version-badge/version-badge';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';

type Lang = 'en' | 'es' | 'fr' | 'de';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { greeting: 'Hello', farewell: 'Goodbye', count: 'You have {n} messages', tagline: 'Angular is awesome!' },
  es: { greeting: 'Hola', farewell: 'Adiós', count: 'Tienes {n} mensajes', tagline: '¡Angular es increíble!' },
  fr: { greeting: 'Bonjour', farewell: 'Au revoir', count: 'Vous avez {n} messages', tagline: 'Angular est formidable!' },
  de: { greeting: 'Hallo', farewell: 'Auf Wiedersehen', count: 'Sie haben {n} Nachrichten', tagline: 'Angular ist großartig!' },
};

@Component({
  selector: 'app-i18n',
  imports: [CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent, ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent, VersionBadgeComponent, PageMetaComponent, PageCompleteComponent],
  templateUrl: './i18n.html',
  styleUrl: './i18n.scss',
})
export class I18nDemo {
  qna: QnaItem[] = [
    { q: 'What is the difference between Angular built-in i18n and Transloco?', a: '<strong>Built-in i18n</strong>: AOT-compiled per locale — one build per language, best performance, no runtime overhead. <strong>Transloco</strong>: one build, JSON files loaded at runtime, supports language switching without page reload. Choose Transloco for runtime switching.' },
    { q: 'How does Transloco load translation files?', a: '<code>TranslocoHttpLoader</code> fetches <code>/assets/i18n/{lang}.json</code> on demand. Configure the path in <code>provideTransloco()</code>. Files are cached after first load — no re-fetch on language switch back.' },
    { q: 'How do you handle pluralisation in Transloco?', a: 'Use the <code>transpileScope</code> or ICU message format: <code>{ "items": "{ count, plural, =0 {no items} =1 {one item} other {{{count}} items} }" }</code>. Pass params: <code>{{ \'items\' | transloco: { count: n } }}</code>.' },
    { q: 'How do you format dates and numbers for different locales?', a: 'Use <code>Intl.DateTimeFormat</code> and <code>Intl.NumberFormat</code>: <code>new Intl.NumberFormat(lang, { style: \'currency\', currency: \'EUR\' }).format(price)</code>. These are native browser APIs — no library needed.' },
    { q: 'How do you mark strings for extraction in Angular built-in i18n?', a: 'Add the <code>i18n</code> attribute: <code>&lt;h1 i18n="site header"&gt;Hello&lt;/h1&gt;</code>. Run <code>ng extract-i18n</code> to produce <code>messages.xlf</code>. Send to translators; add locale files; build with <code>--localize</code>.' },
    { q: 'Should you internationalise error messages from the API?', a: 'Ideally yes — pass the locale header to the API and return locale-aware error messages. If not possible, maintain a mapping on the frontend: translate error codes or keys to locale-specific strings using your i18n library.' },
  ];

  lang       = signal<Lang>('en');
  msgCount   = signal(3);
  langs: Lang[] = ['en', 'es', 'fr', 'de'];

  t = computed(() => TRANSLATIONS[this.lang()]);
  countMsg = computed(() => this.t()['count'].replace('{n}', String(this.msgCount())));

  theory: TheoryPoint[] = [
    {
      heading: 'i18n options in Angular',
      points: [
        'Angular built-in i18n: mark strings with i18n attribute, extract with ng extract-i18n, compile per-locale builds.',
        'Transloco: runtime translation library — no per-locale build, supports lazy-loading translation files.',
        'ngx-translate: another runtime option, widely used but unmaintained as of 2024 — prefer Transloco.',
        'For most apps Transloco is the best choice: one build, multiple locales, signal-compatible.',
      ],
    },
    {
      heading: 'Transloco setup',
      points: [
        'ng add @jsverse/transloco installs the library and generates translation JSON files.',
        'provideTransloco({ config: { availableLangs, defaultLang, reRenderOnLangChange: true } }) in app.config.ts.',
        'Translation files are JSON: { "greeting": "Hello", "count": "You have {{ count }} messages" }.',
        'TranslocoService.setActiveLang(lang) switches the active language at runtime — no page reload.',
      ],
    },
    {
      heading: 'Built-in Angular i18n',
      points: [
        'Add i18n attribute to elements: <h1 i18n>Hello</h1> — Angular marks it for extraction.',
        'Run ng extract-i18n to generate messages.xlf — send to translators.',
        'For each locale, add a translated messages.XX.xlf file and build with --localize.',
        'Each locale gets its own dist/ folder — deploy to locale-specific subdomains.',
      ],
    },
    {
      heading: 'Key points to remember',
      points: [
        'Built-in i18n = best performance (AOT per locale) but requires one build per language.',
        'Runtime i18n (Transloco) = one build, language switcher, great for SaaS apps with many locales.',
        'Always externalise ALL user-facing strings — dates, numbers, and currencies also need locale formatting.',
        'Use Intl.NumberFormat and Intl.DateTimeFormat for locale-aware number and date formatting without a library.',
      ],
    },
  ];

  quiz: QuizQuestion[] = [
    { q: 'What Angular CLI command extracts marked strings into an XLIFF file for translation?', options: ['ng build --localize', 'ng extract-i18n', 'ng generate i18n', 'ng serve --i18n-locale'], answer: 1, explanation: 'ng extract-i18n scans your templates for elements marked with the i18n attribute and produces a messages.xlf (XLIFF) file that you send to translators.' },
    { q: 'Which attribute do you add to an HTML element to mark its text content for Angular\'s built-in i18n extraction?', options: ['translate', 'data-i18n', 'i18n', 'localize'], answer: 2, explanation: 'The i18n attribute tells the Angular compiler that the element\'s text should be extracted. For example: <h1 i18n="site header">Hello</h1>.' },
    { q: 'What is the main trade-off of Angular\'s built-in i18n compared to Transloco?', options: ['Built-in i18n requires a third-party package while Transloco ships with Angular', 'Built-in i18n only supports XLIFF, whereas Transloco supports JSON and XLIFF', 'Built-in i18n compiles one separate build per locale, whereas Transloco uses a single build with runtime loading', 'Built-in i18n does not support pluralisation but Transloco does'], answer: 2, explanation: 'Angular\'s built-in i18n uses AOT compilation per locale — best performance, zero runtime overhead — but you must produce and deploy one dist/ bundle per language. Transloco generates one build and loads JSON translation files at runtime.' },
    { q: 'In Transloco, which function call switches the active language at runtime without a page reload?', options: ['TranslocoService.loadLang(lang)', 'TranslocoService.setActiveLang(lang)', 'TranslocoService.switchLocale(lang)', 'TranslocoService.changeLang(lang)'], answer: 1, explanation: 'TranslocoService.setActiveLang(lang) changes the active language and, with reRenderOnLangChange: true configured, all active transloco pipes re-render automatically.' },
    { q: 'Which browser-native APIs should you use for locale-aware number and date formatting without installing a library?', options: ['Date.toLocaleDateString() and Number.toLocaleString() only', 'Intl.NumberFormat and Intl.DateTimeFormat', 'Intl.Collator and Intl.PluralRules', 'moment.js and numeral.js'], answer: 1, explanation: 'Intl.NumberFormat and Intl.DateTimeFormat are standard browser APIs. For example: new Intl.NumberFormat(lang, { style: \'currency\', currency: \'EUR\' }).format(price) — no library required.' },
  ];

  challenge: Challenge = {
    title: 'Build a Runtime Language Switcher',
    description: 'Create a standalone Angular component that lets users switch between English, Spanish, and French. The component should display three translated strings — a greeting, a farewell, and an item-count message with a numeric parameter — using Angular signals. Clicking a language button must update all displayed strings instantly without a page reload.',
    language: 'typescript',
    hints: [
      'Declare a signal<\'en\'|\'es\'|\'fr\'>(\'en\') for the active language and a signal<number>(1) for the item count.',
      'Use a computed() that reads the active language signal and returns the matching translation record.',
      'For the count message, use a second computed() that calls .replace(\'{n}\', String(itemCount())) on the count string.',
      'Bind [class.active] on each button so the current language is visually highlighted, and call lang.set(l) on (click).',
    ],
    starterCode: `import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type Lang = 'en' | 'es' | 'fr';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { greeting: 'Hello!', farewell: 'Goodbye!', count: 'You have {n} items' },
  es: { greeting: '¡Hola!', farewell: '¡Adiós!', count: 'Tienes {n} artículos' },
  fr: { greeting: 'Bonjour!', farewell: 'Au revoir!', count: 'Vous avez {n} articles' },
};

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div>
      <!-- TODO: render a button for each lang in langs array -->
      <!-- clicking a button should set the active language -->

      <!-- TODO: display greeting, farewell, and count message -->
      <!-- count message should reflect itemCount() -->

      <!-- TODO: add a number input bound to itemCount -->
    </div>
  \`,
})
export class LangSwitcherComponent {
  langs: Lang[] = ['en', 'es', 'fr'];

  // TODO: declare lang signal (default 'en')
  // TODO: declare itemCount signal (default 1)
  // TODO: declare t computed (active translation record)
  // TODO: declare countMsg computed (count string with {n} replaced)
}`,
    solution: `import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

type Lang = 'en' | 'es' | 'fr';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { greeting: 'Hello!', farewell: 'Goodbye!', count: 'You have {n} items' },
  es: { greeting: '¡Hola!', farewell: '¡Adiós!', count: 'Tienes {n} artículos' },
  fr: { greeting: 'Bonjour!', farewell: 'Au revoir!', count: 'Vous avez {n} articles' },
};

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [CommonModule],
  template: \`
    <div class="switcher">
      <div class="lang-btns">
        @for (l of langs; track l) {
          <button
            type="button"
            [class.active]="lang() === l"
            (click)="lang.set(l)">
            {{ l.toUpperCase() }}
          </button>
        }
      </div>
      <ul>
        <li><strong>Greeting:</strong> {{ t()['greeting'] }}</li>
        <li><strong>Farewell:</strong> {{ t()['farewell'] }}</li>
        <li>
          <strong>Count:</strong> {{ countMsg() }}
          <input
            type="number"
            [value]="itemCount()"
            (input)="itemCount.set(+$any($event.target).value)"
            min="0" />
        </li>
      </ul>
    </div>
  \`,
  styles: [\`
    .lang-btns { display: flex; gap: 8px; margin-bottom: 16px; }
    button { padding: 6px 14px; cursor: pointer; border: 1px solid #ccc; border-radius: 4px; }
    button.active { background: #1976d2; color: #fff; border-color: #1976d2; }
    ul { list-style: none; padding: 0; }
    li { margin: 8px 0; }
    input[type=number] { width: 60px; margin-left: 8px; }
  \`],
})
export class LangSwitcherComponent {
  langs: Lang[] = ['en', 'es', 'fr'];

  lang       = signal<Lang>('en');
  itemCount  = signal(1);
  t          = computed(() => TRANSLATIONS[this.lang()]);
  countMsg   = computed(() => this.t()['count'].replace('{n}', String(this.itemCount())));
}`,
  };

  quickRef: QuickRefItem[] = [
    { name: 'i18n', type: 'directive', desc: 'HTML attribute that marks an element\'s text content for extraction by the Angular i18n tooling pipeline.' , since: '2'},
    { name: 'ng extract-i18n', type: 'function', desc: 'Angular CLI command that scans templates for i18n-marked strings and generates an XLIFF messages.xlf file for translators.' , since: '2'},
    { name: 'provideTransloco', type: 'function', desc: 'Registers the Transloco i18n library in the application providers, accepting config (availableLangs, defaultLang, reRenderOnLangChange) and a loader.' , since: '17'},
    { name: 'TranslocoService.setActiveLang', type: 'function', desc: 'Switches the active language at runtime without a page reload; triggers re-render of all active transloco pipes when reRenderOnLangChange is true.' },
    { name: 'transloco', type: 'pipe', desc: 'Transloco pipe that looks up a translation key and optionally interpolates named parameters — for example \'{ \'count\' | transloco: { n: 3 } }\'.' },
    { name: 'TranslocoHttpLoader', type: 'class', desc: 'Built-in Transloco loader that fetches translation JSON files from /assets/i18n/{lang}.json on demand and caches them after the first load.' },
    { name: 'Intl.NumberFormat', type: 'class', desc: 'Browser-native API for locale-aware number and currency formatting — no third-party library required.' , since: '2'},
    { name: 'Intl.DateTimeFormat', type: 'class', desc: 'Browser-native API for locale-aware date and time formatting across any IETF BCP 47 language tag.' , since: '2'},
    { name: 'computed', type: 'function', desc: 'Creates a derived signal that recalculates whenever its reactive dependencies change — ideal for deriving translated strings from an active-language signal.' , since: '16'},
    { name: 'signal', type: 'function', desc: 'Creates a writable reactive primitive; used to hold the active locale key so all dependent computed translations update automatically.' , since: '16'},
  ];

  beforeAfter: BeforeAfterExample[] = [
    { title: 'Language switching: NgRx/BehaviorSubject vs Signals', before: '// Old: BehaviorSubject + async pipe\nlang$ = new BehaviorSubject<string>(\'en\');\nt$ = this.lang$.pipe(\n  map(l => TRANSLATIONS[l])\n);\n// template: {{ (t$ | async)?.greeting }}', after: '// New: signal + computed\nlang = signal<Lang>(\'en\');\nt = computed(() => TRANSLATIONS[this.lang()]);\n// template: {{ t().greeting }}\n// switch: lang.set(\'fr\')',
      note: 'Signals eliminate the async pipe, are synchronous, and integrate naturally with Angular\'s reactivity graph.' },
    { title: 'Runtime translation: ngx-translate vs Transloco', before: '// Old: ngx-translate (unmaintained as of 2024)\nimport { TranslateModule } from \'@ngx-translate/core\';\n// template: {{ \'greeting\' | translate }}\n// No signal support, no standalone-first API', after: '// New: Transloco with provideTransloco()\nimport { provideTransloco, TranslocoHttpLoader } from \'@jsverse/transloco\';\nprovideTransloco({\n  config: { availableLangs: [\'en\',\'es\'], defaultLang: \'en\',\n            reRenderOnLangChange: true },\n  loader: TranslocoHttpLoader })',
      note: 'Transloco is the modern successor: actively maintained, standalone-first, and signal-compatible.' },
    { title: 'Built-in i18n: manual XLIFF workflow vs --localize flag', before: '<!-- Old: no tooling, manual string copies -->\n<h1>Hello, {{ user }}</h1>\n<!-- Duplicate template per locale, error-prone -->', after: '<!-- New: mark once, extract, build per locale -->\n<h1 i18n=\'site header\'>Hello, {{ user }}</h1>\n<!-- ng extract-i18n -->\n<!-- ng build --localize -->',
      note: 'The i18n attribute + ng extract-i18n produces a single source of truth; per-locale AOT builds deliver zero runtime overhead.' },
  ];

  mistakes: CommonMistake[] = [
    { title: 'Forgetting reRenderOnLangChange in Transloco config', wrong: 'provideTransloco({\n  config: { availableLangs: [\'en\',\'es\'],\n            defaultLang: \'en\' } })\n// Pipes do NOT update on setActiveLang()', right: 'provideTransloco({\n  config: { availableLangs: [\'en\',\'es\'],\n            defaultLang: \'en\',\n            reRenderOnLangChange: true } })', explanation: 'Without reRenderOnLangChange: true, calling setActiveLang() changes the service state but all rendered transloco pipes stay stale until the component is re-created.'  },
    { title: 'Using ngx-translate in a new Angular project', wrong: '// ngx-translate is unmaintained (2024+)\nimport { TranslateModule } from \'@ngx-translate/core\';\n// No standalone support, no signal integration', right: '// Use Transloco instead\nimport { provideTransloco } from \'@jsverse/transloco\';\n// Actively maintained, standalone-first, signal-ready', explanation: 'ngx-translate is effectively unmaintained. Transloco (@jsverse/transloco) is the recommended replacement with full Angular 17+ standalone and signal support.'  },
    { title: 'Expecting one Angular built-in i18n build to serve all locales', wrong: '// One build, switch locale at runtime\n// angular.json: no locales config\nng build\n// host /dist/app and expect /en, /fr to work', right: '// angular.json i18n section + --localize\n// produces dist/en/, dist/fr/ separately\nng build --localize\n// deploy each folder to its locale subdomain', explanation: 'Angular\'s built-in i18n compiles one optimised bundle per locale at build time. Runtime locale switching is not supported — use Transloco for that.'  },
    { title: 'Hardcoding locale-formatted numbers and dates', wrong: '// Not locale-aware\nconst price = 1234.5;\nconst label = \'$\' + price.toFixed(2);\n// Always USD, always English separators', right: 'const price = 1234.5;\nconst label = new Intl.NumberFormat(\n  lang(), { style: \'currency\', currency: \'USD\' }\n).format(price);', explanation: 'Intl.NumberFormat and Intl.DateTimeFormat are built into every modern browser. Passing the active locale string produces correct separators, currency symbols, and date orders for free.'  },
  ];

  versionItems: VersionInfo[] = [
    { version: 'Angular 17', label: 'Signal-compatible i18n patterns', features: ['signal() and computed() enable reactive locale switching without RxJS BehaviorSubject or async pipe', '@for and @if control flow syntax works seamlessly with computed translation records', 'Transloco (@jsverse/transloco) gained first-class standalone and signal support in this era'] },
    { version: 'Angular 2+', label: 'Built-in i18n toolchain', features: ['i18n attribute marks template strings for extraction since the framework\'s first release', 'ng extract-i18n generates XLIFF (.xlf) files consumed by professional translation tools', '--localize build flag compiles one optimised AOT bundle per configured locale'] },
  ];

  tabs: CodeTab[] = [
    {
      label: 'Transloco setup',
      language: 'typescript',
      code: `// 1. Install
// ng add @jsverse/transloco

// 2. app.config.ts
import { provideTransloco, TranslocoHttpLoader } from '@jsverse/transloco';

providers: [
  provideTransloco({
    config: {
      availableLangs: ['en', 'es', 'fr'],
      defaultLang: 'en',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
    },
    loader: TranslocoHttpLoader,   // fetches /assets/i18n/{lang}.json
  }),
]`,
    },
    {
      label: 'Transloco usage',
      language: 'typescript',
      code: `// 3. Translation files: assets/i18n/en.json
{ "greeting": "Hello", "user.count": "{{count}} messages" }

// 4. In template — transloco pipe
<h1>{{ 'greeting' | transloco }}</h1>

// With params:
<p>{{ 'user.count' | transloco: { count: messageCount() } }}</p>

// 5. Switch language
import { TranslocoService } from '@jsverse/transloco';

export class NavComponent {
  transloco = inject(TranslocoService);
  switchLang(lang: string) { this.transloco.setActiveLang(lang); }
}`,
    },
    {
      label: 'Built-in i18n',
      language: 'html',
      code: `<!-- Mark strings for extraction -->
<h1 i18n="site header|Greeting message for user">Hello, {{ user }}</h1>
<p i18n>Welcome to our app</p>

<!-- Pluralisation -->
<span i18n>{messageCount, plural, =0 {No messages} =1 {One message} other {{{messageCount}} messages}}</span>

<!-- Extract: ng extract-i18n --output-path src/locale -->
<!-- Build per locale: ng build --localize -->
<!-- angular.json: i18n: { locales: { fr: "src/locale/messages.fr.xlf" } } -->`,
    },
  ];
}
