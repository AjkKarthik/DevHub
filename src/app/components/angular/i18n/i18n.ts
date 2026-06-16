import { Component, signal, computed } from '@angular/core';
import { CodeBlockComponent, CodeTab } from '../../shared/code-block/code-block';
import { TheoryBlockComponent, TheoryPoint } from '../../shared/theory-block/theory-block';
import { QnaBlockComponent, QnaItem } from '../../shared/qna-block/qna-block';
import { QuizBlockComponent, QuizQuestion } from '../../shared/quiz-block/quiz-block';
import { ChallengeBlockComponent, Challenge } from '../../shared/challenge-block/challenge-block';
import { QuickRefComponent, QuickRefItem } from '../../shared/quick-ref/quick-ref';
import { BeforeAfterComponent, BeforeAfterExample } from '../../shared/before-after/before-after';
import { CommonMistakesComponent, CommonMistake } from '../../shared/common-mistakes/common-mistakes';
import { PageMetaComponent } from '../../shared/page-meta/page-meta';
import { PageCompleteComponent } from '../../shared/page-complete/page-complete';
import { RevisionCardComponent, RevisionSummary } from '../../shared/revision-card/revision-card';
import { PrerequisitesComponent, Prerequisite } from '../../shared/prerequisites/prerequisites';

type Lang = 'en' | 'es' | 'fr' | 'de';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { greeting: 'Hello', farewell: 'Goodbye', count: 'You have {n} messages', tagline: 'Angular is awesome!' },
  es: { greeting: 'Hola', farewell: 'Adiós', count: 'Tienes {n} mensajes', tagline: '¡Angular es increíble!' },
  fr: { greeting: 'Bonjour', farewell: 'Au revoir', count: 'Vous avez {n} messages', tagline: 'Angular est formidable!' },
  de: { greeting: 'Hallo', farewell: 'Auf Wiedersehen', count: 'Sie haben {n} Nachrichten', tagline: 'Angular ist großartig!' },
};

@Component({
  selector: 'app-i18n',
  imports: [
    CodeBlockComponent, TheoryBlockComponent, QnaBlockComponent, QuizBlockComponent,
    ChallengeBlockComponent, QuickRefComponent, BeforeAfterComponent, CommonMistakesComponent,
    PageMetaComponent, PageCompleteComponent, RevisionCardComponent, PrerequisitesComponent,
  ],
  templateUrl: './i18n.html',
  styleUrl: './i18n.scss',
})
export class I18nDemo {
  prerequisites: Prerequisite[] = [
    { label: 'Angular Signals', route: '/angular/signals' },
    { label: 'Pipes', route: '/angular/pipes' },
  ];

  lang     = signal<Lang>('en');
  msgCount = signal(3);
  langs: Lang[] = ['en', 'es', 'fr', 'de'];

  t        = computed(() => TRANSLATIONS[this.lang()]);
  countMsg = computed(() => this.t()['count'].replace('{n}', String(this.msgCount())));

  theory: TheoryPoint[] = [
    {
      heading: 'i18n options — built-in, Transloco, and signal-based maps',
      points: [
        'Angular provides three i18n approaches: <strong>built-in i18n</strong> (AOT-compiled per locale, zero runtime overhead), <strong>Transloco</strong> (one build, runtime JSON loading, language switching), and <strong>manual signal maps</strong> (simplest for small apps with a fixed key set).',
        'Built-in i18n is ideal for content-heavy public sites where SEO per locale matters and runtime switching is not required — search engines index locale-specific URLs independently.',
        '<strong>Transloco</strong> (<code>@jsverse/transloco</code>) is the community consensus successor to the unmaintained ngx-translate — actively maintained, standalone-first, and signal-compatible. Choose it for SaaS apps that need runtime locale switching.',
        'The signal-based map pattern (<code>signal&lt;Lang&gt;(\'en\')</code> + <code>computed(() =&gt; MAP[lang()])</code>) is zero-dependency and perfect for small apps with a fixed key set — no library, no build step, instant switching.',
        'All three approaches share the same challenge: keeping source strings synchronised across locales. Built-in i18n uses XLIFF tooling; Transloco uses JSON files; the signal map is code — all require a discipline of never hardcoding user-facing strings in the component.',
      ],
    },
    {
      heading: 'Transloco — setup, configuration, and pipes',
      points: [
        '<code>ng add @jsverse/transloco</code> scaffolds the setup: creates <code>assets/i18n/en.json</code>, adds <code>provideTransloco()</code> to <code>app.config.ts</code>, and wires <code>TranslocoHttpLoader</code> to fetch JSON files on demand.',
        '<code>provideTransloco({ config: { availableLangs, defaultLang, reRenderOnLangChange: true }, loader: TranslocoHttpLoader })</code> — <code>reRenderOnLangChange: true</code> is essential: without it, pipes rendered before a language switch remain stale.',
        'The <code>transloco</code> pipe: <code>{{ \'greeting\' | transloco }}</code> looks up the key in the active language file. With params: <code>{{ \'count\' | transloco: { n: messageCount() } }}</code> interpolates named parameters from the JSON value.',
        '<code>TranslocoService.setActiveLang(lang)</code> switches the language at runtime — no page reload. Files are cached after first fetch. Provide a fallback language with <code>fallbackLang: \'en\'</code> so missing keys gracefully degrade.',
        'For scoped translations (feature modules with their own JSON files), use <code>TranslocoScope</code> and <code>provideTranslocoScope(\'admin\')</code>. Scoped files live at <code>/assets/i18n/admin/en.json</code> and are loaded lazily when the scope is first requested.',
      ],
    },
    {
      heading: 'Angular built-in i18n — marking, extracting, and building',
      points: [
        'Add the <code>i18n</code> attribute to any element whose text content should be translated: <code>&lt;h1 i18n="site header|Greeting for logged-in user"&gt;Hello&lt;/h1&gt;</code>. The string after the pipe is a description for translators; it does not appear in the UI.',
        '<code>ng extract-i18n --output-path src/locale</code> scans all templates and generates <code>messages.xlf</code> (XLIFF 1.2 by default). Pass <code>--format xlf2</code> or <code>--format json</code> for other formats accepted by different CAT tools.',
        'The angular.json <code>i18n</code> block lists locale files: <code>{ "fr": "src/locale/messages.fr.xlf" }</code>. <code>ng build --localize</code> compiles an AOT bundle per locale into <code>dist/en/</code>, <code>dist/fr/</code> etc. — each fully optimised, zero runtime overhead.',
        'Deploy each locale bundle to its URL — typically a subdirectory (<code>/fr/</code>) or subdomain (<code>fr.example.com</code>). Use the <code>baseHref</code> option in the build to match: <code>ng build --localize --base-href /fr/</code>.',
        'In a production CI pipeline, run <code>ng build --localize</code> once and upload all locale folders. Serve through a language-detection reverse proxy (Nginx, Cloudflare) that reads the <code>Accept-Language</code> header and routes to the correct folder.',
      ],
    },
    {
      heading: 'ICU message format — pluralisation, gender, and select',
      points: [
        'ICU is an industry-standard message format for expressing grammatical variations. In Angular templates: <code>{count, plural, =0 {No items} =1 {One item} other {{{count}} items}}</code>. The double braces inside ICU are Angular interpolations.',
        'Transloco uses double-brace params in JSON: <code>"count": "{{ count, plural, =0 {no items} other {{{count}} items} }}"</code>. Pass <code>{ count: n }</code> as the params object to the pipe.',
        'The <code>select</code> category handles string-valued variants: <code>{gender, select, male {He posted} female {She posted} other {They posted}}</code>. Use for gendered languages (French, Spanish, German) where the right word depends on grammatical gender.',
        'Nested ICU messages are supported: <code>{count, plural, =1 {{gender, select, male {He has 1 item} female {She has 1 item} other {They have 1 item}}} other {They have {{count}} items}}</code>. Angular\'s compiler validates ICU syntax at build time.',
        'For the <code>ordinal</code> variant (<code>{n, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}</code>), Angular built-in i18n supports it; Transloco delegates to <code>Intl.PluralRules</code>. The <code>#</code> token is substituted with the numeric value.',
      ],
    },
    {
      heading: 'Locale-aware formatting — Intl.NumberFormat, DateTimeFormat, and RelativeTimeFormat',
      points: [
        '<code>new Intl.NumberFormat(locale, { style: \'currency\', currency: \'EUR\' }).format(1234.5)</code> produces <code>1.234,50 €</code> in German and <code>€1,234.50</code> in English — same number, correct separators and symbol placement for each locale.',
        '<code>new Intl.DateTimeFormat(locale, { dateStyle: \'full\', timeStyle: \'short\' }).format(new Date())</code> outputs <code>Monday, June 16, 2025 at 3:30 PM</code> in en-US and the equivalent in any other locale. No third-party library required.',
        '<code>new Intl.RelativeTimeFormat(locale, { numeric: \'auto\' }).format(-1, \'day\')</code> produces <code>yesterday</code> in English, <code>hier</code> in French. This removes the need for libraries like moment.js for human-relative timestamps.',
        '<code>new Intl.PluralRules(locale).select(n)</code> returns <code>\'zero\'</code>, <code>\'one\'</code>, <code>\'two\'</code>, <code>\'few\'</code>, <code>\'many\'</code>, or <code>\'other\'</code> for a given number. Use it to select the correct plural form from your manual translation map.',
        'Create a reusable Angular pipe wrapping Intl APIs: <code>@Pipe({ name: \'localNumber\', pure: true }) transform(val, locale, opts) { return new Intl.NumberFormat(locale, opts).format(val); }</code>. Mark it <code>pure: true</code> (the default) so Angular only re-runs it when inputs change.',
      ],
    },
    {
      heading: 'Signals and i18n — reactive language switching without a library',
      points: [
        'The minimal signal-based pattern: <code>const lang = signal&lt;Lang&gt;(\'en\')</code> + <code>const t = computed(() =&gt; MAP[lang()])</code> + <code>const price = computed(() =&gt; new Intl.NumberFormat(lang()).format(amount))</code>. Every computed that reads <code>lang()</code> updates automatically on switch.',
        'Expose the language service as a <code>providedIn: \'root\'</code> injectable: <code>readonly lang = this._lang.asReadonly(); setLang(l: Lang) { this._lang.set(l); }</code>. All components share the same signal — switching from a nav component updates every page instantly.',
        'Combine signal-based maps with <code>Intl</code> APIs for a zero-dependency i18n solution: the map holds text strings; <code>Intl</code> handles numbers, dates, and plurals. Together they cover ~80% of localisation needs with no bundle cost.',
        'For Transloco + signals, use <code>toSignal(this.transloco.langChanges$)</code> from <code>@angular/core/rxjs-interop</code> to bridge the Transloco language stream into a signal. Derived computed() signals can then react to language changes without subscribing.',
        'Server-side rendering (Angular SSR) and signals: the locale should be determined per-request from the <code>Accept-Language</code> header or URL and injected as a DI token. Signal state is per-request in SSR — no cross-request contamination when the locale is stored in a signal rather than a module-level variable.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
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
      reRenderOnLangChange: true,   // CRITICAL — pipes re-render on lang change
      prodMode: !isDevMode(),
    },
    loader: TranslocoHttpLoader,    // fetches /assets/i18n/{lang}.json
  }),
]`,
    },
    {
      label: 'Transloco usage',
      language: 'typescript',
      code: `// assets/i18n/en.json
// { "greeting": "Hello", "count": "{{ count }} messages" }

// In template — transloco pipe
<h1>{{ 'greeting' | transloco }}</h1>

// With params:
<p>{{ 'count' | transloco: { count: messageCount() } }}</p>

// Switch language programmatically
export class NavComponent {
  transloco = inject(TranslocoService);
  switchLang(lang: string) { this.transloco.setActiveLang(lang); }
}`,
    },
    {
      label: 'Built-in i18n',
      language: 'html',
      code: `<!-- Mark strings with i18n attribute -->
<h1 i18n="site header|Greeting for logged-in user">Hello, {{ user }}</h1>
<p i18n>Welcome to our app</p>

<!-- Pluralisation via ICU format -->
<span i18n>
  {messageCount, plural,
    =0 {No messages}
    =1 {One message}
    other {{{messageCount}} messages}}
</span>

<!-- CLI commands -->
<!-- ng extract-i18n --output-path src/locale -->
<!-- ng build --localize -->
<!-- angular.json: i18n.locales.fr = "src/locale/messages.fr.xlf" -->`,
    },
    {
      label: 'Signal-based lang switch',
      language: 'typescript',
      code: `type Lang = 'en' | 'es' | 'fr';

const MAP: Record<Lang, Record<string, string>> = {
  en: { greeting: 'Hello', farewell: 'Goodbye', items: '{n} items' },
  es: { greeting: 'Hola',  farewell: 'Adiós',   items: '{n} artículos' },
  fr: { greeting: 'Bonjour', farewell: 'Au revoir', items: '{n} articles' },
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private _lang = signal<Lang>('en');
  readonly lang = this._lang.asReadonly();

  // Derived translation getter + locale-aware formatters
  t       = computed(() => MAP[this._lang()]);
  price   = (amount: number) =>
    new Intl.NumberFormat(this._lang(), { style: 'currency', currency: 'USD' }).format(amount);
  date    = (d: Date) =>
    new Intl.DateTimeFormat(this._lang(), { dateStyle: 'medium' }).format(d);

  setLang(l: Lang) { this._lang.set(l); }
}

// In any component: i18n = inject(I18nService)
// Template: {{ i18n.t()['greeting'] }}`,
    },
    {
      label: 'Intl APIs',
      language: 'typescript',
      code: `// Locale-aware number/currency — no library needed
const price = new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR'
}).format(1234567.89);
// → "1.234.567,89 €" (German separators + symbol placement)

// Locale-aware date
const date = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'full', timeStyle: 'short'
}).format(new Date());
// → "lundi 16 juin 2025 à 15:30"

// Relative time
const ago = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  .format(-1, 'day');
// → "yesterday"

// Plural rules — select the right form from your map
const form = new Intl.PluralRules('ar').select(3);
// → "few" (Arabic has 6 plural categories)

// Reusable Angular pipe wrapping Intl
@Pipe({ name: 'localNumber', pure: true, standalone: true })
export class LocalNumberPipe implements PipeTransform {
  transform(value: number, locale: string, opts?: Intl.NumberFormatOptions) {
    return new Intl.NumberFormat(locale, opts).format(value);
  }
}`,
    },
  ];

  quiz: QuizQuestion[] = [
    {
      q: 'What Angular CLI command extracts marked strings into an XLIFF file for translation?',
      options: [
        'ng build --localize',
        'ng extract-i18n',
        'ng generate i18n',
        'ng serve --i18n-locale',
      ],
      answer: 1,
      explanation: 'ng extract-i18n scans templates for elements marked with the i18n attribute and produces a messages.xlf file that you send to translators. The output path is configurable: --output-path src/locale.',
    },
    {
      q: 'Which attribute marks an HTML element\'s text for Angular\'s built-in i18n extraction?',
      options: [
        'translate',
        'data-i18n',
        'i18n',
        'localize',
      ],
      answer: 2,
      explanation: 'The i18n attribute tells the Angular compiler to extract the element\'s text. For example: <h1 i18n="description|meaning">Hello</h1>. The string after the pipe is a translator description — it does not appear in the rendered UI.',
    },
    {
      q: 'What is the main trade-off of Angular\'s built-in i18n vs Transloco?',
      options: [
        'Built-in i18n requires a third-party package; Transloco ships with Angular',
        'Built-in i18n only supports XLIFF; Transloco supports JSON and XLIFF',
        'Built-in i18n compiles one separate build per locale; Transloco uses a single build with runtime loading',
        'Built-in i18n does not support pluralisation; Transloco does',
      ],
      answer: 2,
      explanation: 'Angular\'s built-in i18n uses AOT compilation per locale — best performance, zero runtime overhead — but you must produce one dist/ bundle per language. Transloco generates one build and loads JSON translation files at runtime, enabling in-app language switching without page reload.',
    },
    {
      q: 'In Transloco, what does reRenderOnLangChange: true do?',
      options: [
        'It reloads the page when the language changes',
        'It causes all active transloco pipes to re-evaluate and re-render when setActiveLang() is called',
        'It pre-fetches all available language files on app startup',
        'It enables ICU pluralisation support in translation JSON files',
      ],
      answer: 1,
      explanation: 'Without reRenderOnLangChange: true, calling setActiveLang() changes the internal state but already-rendered transloco pipes remain stale. Setting this to true makes pipes reactive — they re-render automatically when the active language changes.',
    },
    {
      q: 'Which browser-native APIs handle locale-aware number and date formatting without installing a library?',
      options: [
        'Date.toLocaleDateString() and Number.toLocaleString() only',
        'Intl.NumberFormat and Intl.DateTimeFormat',
        'Intl.Collator and Intl.PluralRules',
        'moment.js and numeral.js',
      ],
      answer: 1,
      explanation: 'Intl.NumberFormat and Intl.DateTimeFormat are standard browser APIs available in all modern browsers. They handle currency symbols, decimal separators, date orders, and time formats correctly for any IETF BCP 47 language tag — no library required.',
    },
    {
      q: 'In ICU pluralisation, what does the `other` category represent?',
      options: [
        'A fallback key for any plural case not explicitly listed (e.g. all counts not covered by =0 or =1)',
        'A key for non-English languages only',
        'A wildcard that matches exactly 0 items',
        'An error state when the count value is NaN',
      ],
      answer: 0,
      explanation: 'In ICU message format, `other` is the required catch-all category — it matches any count not explicitly handled by =0, =1, =2, `one`, `few`, `many`, etc. For English `{n, plural, =1 {one item} other {{{n}} items}}`, other covers all counts ≠ 1.',
    },
    {
      q: 'How does the signal-based lang-switching pattern integrate with computed() derived translations?',
      options: [
        'You must manually call detectChanges() after lang.set() to update the template',
        'Any computed() that reads lang() automatically recalculates when lang changes, updating all dependent template expressions',
        'computed() values are cached permanently — lang.set() does not invalidate them',
        'You must re-inject the translation map each time the language changes',
      ],
      answer: 1,
      explanation: 'computed(() => MAP[lang()]) reads lang() inside its callback. When lang.set(\'fr\') is called, Angular marks the computed as stale. On the next template read, it recalculates and returns the French translations. All template expressions that reference t() update automatically without any manual invalidation.',
    },
  ];

  qna: QnaItem[] = [
    { q: 'What is the difference between Angular built-in i18n and Transloco?', a: '<strong>Built-in i18n</strong>: AOT-compiled per locale — one build per language, best performance, zero runtime overhead, best for SEO (locale-specific URLs). <strong>Transloco</strong>: one build, JSON files loaded at runtime, supports language switching without page reload, best for SaaS apps. Choose Transloco when users must be able to switch locale inside the app.' },
    { q: 'How does Transloco load translation files?', a: '<code>TranslocoHttpLoader</code> fetches <code>/assets/i18n/{lang}.json</code> on demand when that language is first activated. Files are cached after the first load — switching back to a previously loaded language incurs no HTTP request. Configure the base path in <code>provideTransloco()</code>.' },
    { q: 'How do you handle pluralisation in Angular built-in i18n?', a: 'Use ICU message format inside the i18n-marked element: <code>{count, plural, =0 {No items} =1 {One item} other {{{count}} items}}</code>. Angular\'s compiler validates the ICU syntax at build time and produces correct plural forms for each locale\'s XLIFF file.' },
    { q: 'How do you format dates and numbers for different locales?', a: 'Use <code>Intl.DateTimeFormat</code> and <code>Intl.NumberFormat</code>: <code>new Intl.NumberFormat(lang, { style: \'currency\', currency: \'EUR\' }).format(price)</code>. These are standard browser APIs — no library required. Wrap them in an Angular pure pipe for template reuse.' },
    { q: 'How do you mark strings for extraction in Angular built-in i18n?', a: 'Add the <code>i18n</code> attribute: <code>&lt;h1 i18n="description|meaning"&gt;Hello&lt;/h1&gt;</code>. Run <code>ng extract-i18n --output-path src/locale</code> to produce <code>messages.xlf</code>. Send to translators; place translated <code>.xlf</code> files in <code>src/locale/</code>; build with <code>ng build --localize</code>.' },
    { q: 'Should you internationalise error messages from the API?', a: 'Ideally yes — pass the <code>Accept-Language</code> header to the API and return locale-aware error messages from the server. If that is not possible, maintain a frontend mapping: translate error codes or keys to locale-specific strings using your i18n library. Never hardcode English error text in production UI.' },
    { q: 'How do you use signals to drive locale-aware Intl formatting reactively?', a: 'Expose the language as a <code>signal&lt;Lang&gt;</code> in a root service. Computed signals can call <code>Intl</code> APIs inline: <code>price = computed(() =&gt; new Intl.NumberFormat(this.lang()).format(this.amount()))</code>. The computed recalculates whenever <code>lang()</code> or <code>amount()</code> changes — no subscription, no pipe needed in the service.' },
    { q: 'What is the ICU `select` category and when would you use it?', a: '<code>{gender, select, male {He posted} female {She posted} other {They posted}}</code> selects a phrase variant based on a string value rather than a number. Use it for grammatical gender (French, Spanish, Russian) where noun form, adjective agreement, and pronouns depend on gender. The <code>other</code> key is required as a fallback.' },
  ];

  quickRef: QuickRefItem[] = [
    { name: 'i18n', type: 'directive', desc: 'HTML attribute that marks an element\'s text content for extraction by the Angular i18n tooling pipeline (ng extract-i18n).', since: '2' },
    { name: 'ng extract-i18n', type: 'syntax', desc: 'Angular CLI command that scans templates for i18n-marked strings and generates an XLIFF messages.xlf file for translators.', since: '2' },
    { name: 'provideTransloco', type: 'function', desc: 'Registers the Transloco i18n library in app providers. Key config: availableLangs, defaultLang, reRenderOnLangChange, fallbackLang, loader.', since: '17' },
    { name: 'TranslocoService.setActiveLang', type: 'method', desc: 'Switches the active language at runtime without page reload. Triggers re-render of all active transloco pipes when reRenderOnLangChange is true.', since: '17' },
    { name: 'transloco', type: 'pipe', desc: 'Transloco pipe: {{ \'key\' | transloco }} looks up a translation key. With params: {{ \'count\' | transloco: { n: 3 } }} interpolates named parameters.', since: '17' },
    { name: 'TranslocoHttpLoader', type: 'class', desc: 'Built-in Transloco loader that fetches /assets/i18n/{lang}.json on demand and caches the response after first load.', since: '17' },
    { name: 'Intl.NumberFormat', type: 'class', desc: 'Browser-native API for locale-aware number and currency formatting — no library required. new Intl.NumberFormat(locale, opts).format(n).', since: '2' },
    { name: 'Intl.DateTimeFormat', type: 'class', desc: 'Browser-native API for locale-aware date and time formatting across any IETF BCP 47 language tag.', since: '2' },
    { name: 'Intl.RelativeTimeFormat', type: 'class', desc: 'Browser-native API for locale-aware relative time strings: "yesterday", "in 3 hours", "2 days ago".', since: '16' },
    { name: 'Intl.PluralRules', type: 'class', desc: 'Browser-native API that returns the plural category (one/few/many/other) for a number in a given locale — used to select the right plural form from a translation map.', since: '16' },
  ];

  beforeAfter: BeforeAfterExample[] = [
    {
      title: 'Language switching: BehaviorSubject vs Signals',
      before: `// Old: BehaviorSubject + async pipe
lang$ = new BehaviorSubject<string>('en');
t$    = this.lang$.pipe(map(l => TRANSLATIONS[l]));
// Template: {{ (t$ | async)?.greeting }}
// Switch:   lang$.next('fr')`,
      after: `// New: signal + computed
lang = signal<Lang>('en');
t    = computed(() => TRANSLATIONS[this.lang()]);
// Template: {{ t()['greeting'] }}
// Switch:   lang.set('fr')`,
      note: 'Signals eliminate the async pipe, are synchronous, and integrate naturally with Angular\'s reactivity graph. No subscription setup or teardown needed.',
    },
    {
      title: 'Runtime translation: ngx-translate vs Transloco',
      before: `// Old: ngx-translate (unmaintained as of 2024)
import { TranslateModule } from '@ngx-translate/core';
// No standalone support, no signal integration
// template: {{ 'greeting' | translate }}`,
      after: `// New: Transloco (@jsverse/transloco)
import { provideTransloco, TranslocoHttpLoader } from '@jsverse/transloco';
provideTransloco({
  config: { availableLangs: ['en','es'], defaultLang: 'en',
            reRenderOnLangChange: true },
  loader: TranslocoHttpLoader
})
// template: {{ 'greeting' | transloco }}`,
      note: 'Transloco is the modern successor: actively maintained, standalone-first, signal-compatible, and supports lazy-loaded translation scopes.',
    },
    {
      title: 'Locale-aware numbers: hardcoded vs Intl.NumberFormat',
      before: `// Hardcoded — only works correctly in one locale
const price = '\$' + amount.toFixed(2);
// → "$1234.50" (no thousands separator, wrong for non-US)`,
      after: `// Intl.NumberFormat — correct for any locale
const price = new Intl.NumberFormat(
  lang(), { style: 'currency', currency: 'USD' }
).format(amount);
// en-US → "$1,234.50"
// de-DE → "1.234,50 $"`,
      note: 'Intl.NumberFormat is a standard browser API — no library needed. It handles thousands separators, decimal characters, currency symbol placement, and currency code by locale.',
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Forgetting reRenderOnLangChange: true in Transloco config',
      wrong: `provideTransloco({
  config: { availableLangs: ['en','es'], defaultLang: 'en' }
})
// setActiveLang() changes state but pipes stay stale!`,
      right: `provideTransloco({
  config: { availableLangs: ['en','es'], defaultLang: 'en',
            reRenderOnLangChange: true }  // ← required for live switching
})`,
      explanation: 'Without reRenderOnLangChange: true, calling setActiveLang() updates the internal state but all transloco pipes already rendered in the DOM remain stale. They only update when the component is destroyed and recreated.',
    },
    {
      title: 'Using the unmaintained ngx-translate in a new project',
      wrong: `// ngx-translate is unmaintained (2024+)
import { TranslateModule } from '@ngx-translate/core';
// No standalone support, no signal integration, no active development`,
      right: `// Use Transloco instead (@jsverse/transloco)
import { provideTransloco } from '@jsverse/transloco';
// Actively maintained, standalone-first, signal-ready`,
      explanation: 'ngx-translate has no active maintainer. Transloco (@jsverse/transloco) is the community-endorsed replacement with full Angular 17+ standalone and signal support.',
    },
    {
      title: 'Expecting one Angular built-in i18n build to serve all locales at runtime',
      wrong: `// One build — expect runtime locale switching
ng build   // produces one dist/ folder
// Try to detect locale from Accept-Language at runtime → fails`,
      right: `// Separate build per locale — deploy each subfolder
ng build --localize
// produces: dist/en/, dist/fr/, dist/de/
// Serve via Nginx lang-detection proxy or CDN routing`,
      explanation: 'Angular\'s built-in i18n compiles a separate optimised AOT bundle per locale — runtime switching is not supported. For in-app language switching use Transloco; use built-in i18n for performance-critical public sites where locale is fixed per URL.',
    },
    {
      title: 'Hardcoding locale-formatted numbers and dates',
      wrong: `// Not locale-aware — always English format
const label = '\$' + price.toFixed(2);       // "$1234.50"
const ds    = date.toDateString();           // "Mon Jun 16 2025"`,
      right: `// Locale-aware with browser-native Intl APIs
const label = new Intl.NumberFormat(lang(), {
  style: 'currency', currency: 'USD'
}).format(price);

const ds = new Intl.DateTimeFormat(lang(), {
  dateStyle: 'medium'
}).format(date);`,
      explanation: 'Intl.NumberFormat and Intl.DateTimeFormat are built into every modern browser. They produce correct separators, currency symbols, and date orders for any locale automatically.',
    },
    {
      title: 'Adding a language to the language switcher but forgetting availableLangs',
      wrong: `// Component has lang button for 'de'
// but Transloco config does NOT list 'de'
provideTransloco({ config: { availableLangs: ['en','es'] } })
// setActiveLang('de') → runtime error or empty strings`,
      right: `provideTransloco({
  config: {
    availableLangs: ['en', 'es', 'de'],  // ← must match every button
    fallbackLang: 'en',                  // graceful fallback for missing keys
  }
})`,
      explanation: 'Transloco validates that the requested language is in availableLangs. Requesting an unlisted language throws a runtime error. Always keep availableLangs in sync with both your translation JSON files and your UI language switcher options.',
    },
  ];

  challenge: Challenge = {
    title: 'Runtime Language Switcher with Plural Support',
    description: 'Create a standalone Angular component that lets users switch between English, Spanish, and French. The component should display three translated strings — a greeting, a farewell, and an item-count message that uses a custom plural() helper to pick the right form (singular vs plural). Clicking a language button must update all displayed strings instantly without a page reload.',
    language: 'typescript',
    hints: [
      'Declare signal<\'en\'|\'es\'|\'fr\'>(\'en\') for the active language and signal<number>(1) for the item count.',
      'Use a computed() that reads the active language signal and returns the matching translation record.',
      'For pluralisation, use new Intl.PluralRules(lang()).select(count) to get the plural category, then look up the right form: { one: \'item\', other: \'items\' }[form].',
      'Bind [class.active] on each button so the current language is visually highlighted.',
    ],
    starterCode: `import { Component, signal, computed } from '@angular/core';

type Lang = 'en' | 'es' | 'fr';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { greeting: 'Hello!', farewell: 'Goodbye!', item_one: 'item', item_other: 'items' },
  es: { greeting: '¡Hola!', farewell: '¡Adiós!', item_one: 'artículo', item_other: 'artículos' },
  fr: { greeting: 'Bonjour!', farewell: 'Au revoir!', item_one: 'article', item_other: 'articles' },
};

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [],
  template: \`
    <!-- TODO: render buttons for each language -->
    <!-- TODO: display greeting, farewell, and item count with correct plural form -->
    <!-- TODO: add a number input bound to itemCount -->
  \`,
})
export class LangSwitcherComponent {
  langs: Lang[] = ['en', 'es', 'fr'];

  // TODO: declare lang signal (default 'en')
  // TODO: declare itemCount signal (default 1)
  // TODO: declare t computed (translation record for active lang)
  // TODO: declare itemLabel computed using Intl.PluralRules
}`,
    solution: `import { Component, signal, computed } from '@angular/core';

type Lang = 'en' | 'es' | 'fr';

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  en: { greeting: 'Hello!', farewell: 'Goodbye!', item_one: 'item', item_other: 'items' },
  es: { greeting: '¡Hola!', farewell: '¡Adiós!', item_one: 'artículo', item_other: 'artículos' },
  fr: { greeting: 'Bonjour!', farewell: 'Au revoir!', item_one: 'article', item_other: 'articles' },
};

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  imports: [],
  template: \`
    <div style="font-family:sans-serif;padding:1rem">
      <div style="display:flex;gap:.5rem;margin-bottom:1rem">
        @for (l of langs; track l) {
          <button
            type="button"
            [style.background]="lang() === l ? '#1976d2' : '#eee'"
            [style.color]="lang() === l ? '#fff' : '#333'"
            style="padding:6px 14px;border:none;border-radius:4px;cursor:pointer"
            (click)="lang.set(l)">
            {{ l.toUpperCase() }}
          </button>
        }
      </div>
      <ul style="list-style:none;padding:0">
        <li><strong>Greeting:</strong> {{ t()['greeting'] }}</li>
        <li><strong>Farewell:</strong> {{ t()['farewell'] }}</li>
        <li>
          <strong>Count:</strong>
          <input type="number" [value]="itemCount()"
                 (input)="itemCount.set(+\$any(\$event.target).value)"
                 style="width:60px;margin:0 8px" min="0" />
          {{ itemCount() }} {{ itemLabel() }}
        </li>
      </ul>
    </div>
  \`,
})
export class LangSwitcherComponent {
  langs: Lang[] = ['en', 'es', 'fr'];
  lang      = signal<Lang>('en');
  itemCount = signal(1);
  t         = computed(() => TRANSLATIONS[this.lang()]);
  itemLabel = computed(() => {
    const form = new Intl.PluralRules(this.lang()).select(this.itemCount());
    const key  = form === 'one' ? 'item_one' : 'item_other';
    return this.t()[key];
  });
}`,
  };

  revision: RevisionSummary = {
    oneLiner: 'Angular i18n has three approaches: built-in i18n (one AOT build per locale, best performance), Transloco (one build, runtime JSON loading, lang switching), and signal maps (zero-dependency, simplest for small apps); browser-native Intl APIs handle numbers, dates, and plurals for any locale without a library.',
    mustKnow: [
      'Built-in i18n: <code>i18n</code> attribute + <code>ng extract-i18n</code> → XLIFF → <code>ng build --localize</code> = one bundle per locale, zero runtime overhead',
      'Transloco: <code>reRenderOnLangChange: true</code> is required for pipes to re-render on <code>setActiveLang()</code> — forgetting it is the most common Transloco bug',
      'The language switcher must always list every language in Transloco\'s <code>availableLangs</code> — a missing entry causes a runtime error',
      'Signal-based maps: <code>const t = computed(() =&gt; MAP[lang()])</code> — every computed reading <code>lang()</code> updates automatically on switch, no async pipe needed',
      'ICU pluralisation: <code>{n, plural, =0 {none} =1 {one} other {{{n}} items}}</code> — <code>other</code> is mandatory and catches all remaining cases',
      '<code>Intl.NumberFormat</code>, <code>Intl.DateTimeFormat</code>, and <code>Intl.RelativeTimeFormat</code> are standard browser APIs — no library needed for locale-aware formatting',
      'ngx-translate is unmaintained — use Transloco (<code>@jsverse/transloco</code>) for new projects',
    ],
    interviewFocus: [
      'What is the main trade-off between Angular built-in i18n and Transloco? When would you choose each?',
      'Why is reRenderOnLangChange: true critical in Transloco config?',
      'How do you handle pluralisation in both built-in i18n (ICU format) and with Intl.PluralRules?',
      'How would you architect a zero-dependency locale-aware service using Angular Signals and Intl APIs?',
      'What happens to the Transloco pipe if a requested language is not listed in availableLangs?',
    ],
  };
}
