import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-formatting-pipes-locale-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './formatting-pipes-locale.html',
  styleUrl: './formatting-pipes-locale.scss',
})
export class FormattingPipesLocaleSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'DatePipe — Unicode format patterns',
      points: [
        '<code>{{ d | date:\'MMM d, y\' }}</code> — the format string follows Unicode Date Format patterns (<code>MMM</code> = short month name, <code>y</code> = year, <code>EEEE</code> = full weekday name, and so on). Angular also ships named presets: <code>\'short\'</code>, <code>\'medium\'</code>, <code>\'long\'</code>, <code>\'full\'</code>, each with date/time variants.',
        'The locale used for month/day names comes from the app\'s <code>LOCALE_ID</code> — NOT from the browser\'s language setting automatically. Without explicitly configuring <code>LOCALE_ID</code>, every DatePipe call falls back to <code>en-US</code> regardless of where the user actually is.',
      ],
    },
    {
      heading: 'CurrencyPipe and DecimalPipe — the digit-info string',
      points: [
        '<code>{{ 1234.5 | currency:\'EUR\':\'symbol\':\'1.2-2\' }}</code> — three arguments after the currency code: DISPLAY (<code>\'code\'</code>, <code>\'symbol\'</code>, or <code>\'symbol-narrow\'</code>), and a DIGIT-INFO string.',
        'The digit-info string format is <code>{minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}</code> — <code>\'1.2-2\'</code> means at least 1 integer digit, and EXACTLY 2 fraction digits (min and max both 2). <code>DecimalPipe</code> (<code>&#123;&#123; n | number:\'1.0-2\' &#125;&#125;</code>) and <code>PercentPipe</code> use this exact same digit-info format — learn it once, reuse it across all three.',
      ],
    },
    {
      heading: 'Registering additional locales',
      points: [
        'All four formatting pipes (Date/Currency/Decimal/Percent) are LOCALE-AWARE by default, but only <code>en-US</code> data ships automatically. To format correctly for another locale, call <code>registerLocaleData(localeFr)</code> (imported from <code>&#64;angular/common/locales/fr</code>) AND set <code>LOCALE_ID</code> in your app\'s providers — registering the data alone is not enough without also telling Angular which locale to actually use.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/app.ts',
      content: `import { Component } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, PercentPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DatePipe, CurrencyPipe, DecimalPipe, PercentPipe],
  template: \`
    <p>Date (short preset): {{ today | date:'short' }}</p>
    <p>Date (custom pattern): {{ today | date:'EEEE, MMMM d, y' }}</p>

    <p>Currency (symbol, 2 decimals): {{ price | currency:'EUR':'symbol':'1.2-2' }}</p>
    <p>Currency (code, 0 decimals): {{ price | currency:'USD':'code':'1.0-0' }}</p>

    <p>Decimal: {{ pi | number:'1.0-3' }}</p>
    <p>Percent: {{ ratio | percent:'1.1-2' }}</p>
  \`,
})
export class App {
  today = new Date();
  price = 1234.5;
  pi = 3.14159265;
  ratio = 0.742;
}
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
  <head><title>Formatting pipes and locale</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Add a display of "price" formatted as GBP with the "symbol-narrow" display option, and 2 decimal places.',
    hint: '{{ price | currency:\'GBP\':\'symbol-narrow\':\'1.2-2\' }} — same pattern as the existing currency examples, just swapping the currency code and display argument.',
    solution: `<p>Currency (narrow symbol): {{ price | currency:'GBP':'symbol-narrow':'1.2-2' }}</p>`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'DatePipe automatically formats dates according to the user\'s browser language setting.',
      reality: 'the locale comes from Angular\'s LOCALE_ID configuration, which defaults to en-US regardless of the browser\'s actual language — you must explicitly register locale data and set LOCALE_ID to format correctly for other locales.',
    },
    {
      thought: 'the digit-info string format (\'1.2-2\') is specific to CurrencyPipe and works differently for DecimalPipe and PercentPipe.',
      reality: 'all three pipes share the EXACT SAME digit-info string format — {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits} — learning it once for CurrencyPipe means you already know it for DecimalPipe and PercentPipe too.',
    },
    {
      thought: 'calling registerLocaleData() for a locale is enough to make formatting pipes use it.',
      reality: 'registerLocaleData() only makes the locale DATA available — you must ALSO set LOCALE_ID in your app\'s providers to tell Angular which registered locale to actually use for formatting. Registering without setting LOCALE_ID has no visible effect.',
    },
  ];
}
