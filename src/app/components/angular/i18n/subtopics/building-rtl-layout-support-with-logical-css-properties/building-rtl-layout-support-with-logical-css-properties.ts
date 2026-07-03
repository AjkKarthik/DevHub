import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-building-rtl-layout-support-with-logical-css-properties-subtopic',
  standalone: true,
  imports: [
    PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './building-rtl-layout-support-with-logical-css-properties.html',
  styleUrl: './building-rtl-layout-support-with-logical-css-properties.scss',
})
export class BuildingRtlLayoutSupportWithLogicalCssPropertiesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A whole dimension of i18n the main topic doesn\'t mention',
      points: [
        'The main i18n page covers TEXT translation (strings, plurals, locale-aware formatting) extensively but never mentions LAYOUT DIRECTION. Arabic, Hebrew, Persian, and Urdu are read right-to-left (RTL) — supporting these languages correctly requires the entire PAGE LAYOUT to mirror, not just the text content to translate. A perfectly translated Arabic UI with an untouched left-to-right (LTR) layout looks visibly broken to native readers: navigation on the wrong side, icons pointing the wrong way, text alignment fighting the reading direction.',
        'This is a genuinely separate concern from everything else on the main page — you can have flawless Transloco or built-in i18n translation coverage and STILL ship a broken RTL experience if layout direction was never addressed.',
      ],
    },
    {
      heading: 'The dir attribute — the single source of truth for direction',
      points: [
        'Set <code>&lt;html dir="rtl"&gt;</code> (or bind it dynamically: <code>document.documentElement.dir = lang === \'ar\' ? \'rtl\' : \'ltr\'</code>) when the active language is RTL. This single attribute cascades browser-native mirroring to native form controls, scrollbars, and — critically — the meaning of CSS LOGICAL properties described below.',
        'Do NOT set <code>dir</code> per-component or per-section unless you specifically need a MIXED-direction page (e.g. an English admin panel embedding Arabic user-generated content) — for a fully RTL-active language, set it once at the <code>&lt;html&gt;</code> root so it inherits everywhere by default.',
        'Combine <code>dir</code> with the signal-based (or Transloco) language service from the main topic: an <code>effect(() =&gt; document.documentElement.dir = RTL_LANGS.has(lang()) ? \'rtl\' : \'ltr\')</code> keeps direction in sync automatically whenever the user switches language, with zero manual wiring per page.',
      ],
    },
    {
      heading: 'CSS logical properties — write once, mirror automatically',
      points: [
        'Physical CSS properties (<code>margin-left</code>, <code>padding-right</code>, <code>left: 0</code>, <code>text-align: left</code>) are direction-BLIND — they always mean the same physical side regardless of <code>dir</code>, so an LTR-authored layout using them looks mirrored-WRONG when <code>dir="rtl"</code> is applied (padding that should hug the "start" edge stays stuck on the literal left).',
        'CSS LOGICAL properties describe position relative to the READING FLOW instead: <code>margin-inline-start</code> (start-of-line side), <code>margin-inline-end</code> (end-of-line side), <code>padding-block-start</code>/<code>padding-block-end</code> (top/bottom, direction-independent), and <code>inset-inline-start</code>/<code>inset-inline-end</code> as the logical equivalents of <code>left</code>/<code>right</code> positioning. The browser automatically flips these based on the computed <code>dir</code> — no media query, no RTL-specific stylesheet needed.',
        '<code>text-align: start</code> and <code>text-align: end</code> replace <code>text-align: left</code>/<code>right</code> the same way — <code>start</code> means "the edge text naturally begins from," which is left in English and right in Arabic, resolved automatically by the browser from the ambient <code>dir</code>.',
        'Flexbox and Grid are ALREADY logical by default: <code>flex-direction: row</code> lays out children start-to-end (right-to-left visually under <code>dir="rtl"</code>) with no extra work — this is a major reason modern layout (flex/grid) needs far less RTL-specific CSS than older float/positioning-based layouts did.',
      ],
    },
    {
      heading: 'What does NOT mirror — and needs an explicit exception',
      points: [
        'Not everything should flip under RTL. Numerals, embedded LTR content (a URL, an email address, a code snippet, a brand logo image), and directional ICONS THAT REPRESENT A UNIVERSAL CONCEPT (a play button ▶, typically) usually stay as-is or need a case-by-case decision — a chevron meaning "next" SHOULD flip (it now points right-to-left toward where content actually continues), but a settings gear icon should NOT.',
        'Wrap content that must stay LTR regardless of the page direction in its own <code>dir="ltr"</code> override — e.g. <code>&lt;code dir="ltr"&gt;&#123;&#123; snippet &#125;&#125;&lt;/code&gt;</code> for a code block embedded in an otherwise-RTL page, so code syntax (which is always LTR regardless of UI language) does not get bidi-reordered incorrectly.',
        'Icons that encode direction (arrows, chevrons, "back"/"forward" controls) need an explicit RTL-aware icon choice or a CSS transform: <code>[dir="rtl"] .next-icon &#123; transform: scaleX(-1); &#125;</code> — logical CSS properties handle SPACING and POSITIONING automatically, but they do NOT automatically mirror the visual content of an SVG or icon font glyph.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'src/app/rtl-lang.service.ts',
      content: `import { Injectable, signal, effect } from '@angular/core';

export type Lang = 'en' | 'ar' | 'he';

const RTL_LANGS = new Set<Lang>(['ar', 'he']);

@Injectable({ providedIn: 'root' })
export class RtlLangService {
  private _lang = signal<Lang>('en');
  readonly lang = this._lang.asReadonly();

  constructor() {
    // Keeps <html dir="..."> in sync with the active language automatically —
    // every future page benefits with zero per-page wiring.
    effect(() => {
      document.documentElement.dir = RTL_LANGS.has(this._lang()) ? 'rtl' : 'ltr';
    });
  }

  setLang(l: Lang) {
    this._lang.set(l);
  }
}
`,
    },
    {
      path: 'src/app/card.component.ts',
      content: `import { Component, inject } from '@angular/core';
import { RtlLangService } from './rtl-lang.service';

@Component({
  selector: 'app-card',
  standalone: true,
  template: \`
    <div class="card">
      <span class="badge">NEW</span>
      <p>{{ label() }}</p>
      <button class="next-btn">
        {{ nextLabel() }} <span class="chevron">&rarr;</span>
      </button>
      <code dir="ltr">GET /api/v1/items</code>
    </div>
  \`,
  styleUrl: './card.component.scss',
})
export class CardComponent {
  lang = inject(RtlLangService).lang;

  label = () => ({ en: 'Featured item', ar: 'عنصر مميز', he: 'פריט מומלץ' })[this.lang()];
  nextLabel = () => ({ en: 'Next', ar: 'التالي', he: 'הבא' })[this.lang()];
}
`,
    },
    {
      path: 'src/app/card.component.scss',
      content: `.card {
  // Logical properties — automatically mirror under dir="rtl", no [dir] selector needed.
  padding-inline: 1rem;
  padding-block: 0.75rem;
  border-inline-start: 4px solid #1976d2; // "start" side accent — flips with direction
  text-align: start;

  .badge {
    // inset-inline-end instead of "right" — stays on the correct visual
    // corner (top-right in LTR, top-left in RTL) automatically.
    float: inline-end;
    margin-inline-start: 0.5rem;
  }

  .next-btn {
    margin-block-start: 0.75rem;
  }

  code {
    // dir="ltr" on the element itself (set in the template) keeps this
    // readable regardless of page direction — logical CSS alone can't
    // fix bidi text reordering inside the element's own content.
    display: block;
    margin-block-start: 0.5rem;
  }
}

// Icons that ENCODE direction need an explicit mirror — logical properties
// only handle spacing/positioning, not the visual content of a glyph.
:host-context([dir='rtl']) .chevron {
  display: inline-block;
  transform: scaleX(-1);
}
`,
    },
    {
      path: 'src/app/app.ts',
      content: `import { Component, inject } from '@angular/core';
import { RtlLangService, Lang } from './rtl-lang.service';
import { CardComponent } from './card.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CardComponent],
  template: \`
    <h3>RTL layout with CSS logical properties</h3>
    <div class="lang-buttons">
      @for (l of langs; track l) {
        <button (click)="rtlLang.setLang(l)">{{ l.toUpperCase() }}</button>
      }
    </div>
    <p>Switch to AR or HE — the card's padding, border accent, badge position, and
    text alignment all flip automatically. The chevron icon flips via an explicit
    [dir='rtl'] rule; the code snippet stays LTR via its own dir="ltr" override.</p>
    <app-card />
  \`,
})
export class App {
  rtlLang = inject(RtlLangService);
  langs: Lang[] = ['en', 'ar', 'he'];
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
  <head><title>Building RTL Layout Support with Logical CSS Properties</title></head>
  <body><app-root></app-root></body>
</html>
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The <code>.card</code>\'s <code>border-inline-start</code> accent border currently uses a fixed color. Add a second, THINNER logical border on the opposite (end) side using <code>border-inline-end</code>, and verify in the playground that it correctly swaps from the right edge (LTR) to the left edge (RTL) without writing any <code>[dir]</code>-specific CSS.',
    hint: 'Add border-inline-end: 1px solid #ccc; to the .card rule in card.component.scss. Because it is a logical property (not border-right), the browser resolves which physical side is the "end" based on the current dir — no conditional CSS needed.',
    solution: `.card {
  padding-inline: 1rem;
  padding-block: 0.75rem;
  border-inline-start: 4px solid #1976d2;
  border-inline-end: 1px solid #ccc; // thinner accent on the opposite logical side
  text-align: start;
  // ...rest unchanged
}

// No [dir='rtl'] override needed — border-inline-end automatically resolves
// to border-left under RTL and border-right under LTR.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'supporting an RTL language is primarily a translation task — once the strings are in Arabic or Hebrew, the UI "just works."',
      reality: 'text translation and layout direction are separate concerns — a perfectly translated RTL language still needs dir="rtl" and logical CSS properties (or the layout stays mirrored-wrong: navigation on the wrong side, misaligned spacing, backward-pointing icons).',
    },
    {
      thought: 'supporting RTL requires a whole separate stylesheet with [dir="rtl"] overrides for every physical-property rule in the app.',
      reality: 'CSS logical properties (margin-inline-start, padding-block, inset-inline-end, text-align: start/end) resolve automatically based on the ambient dir attribute — most layout CSS needs ZERO [dir]-specific overrides once authored with logical properties from the start.',
    },
    {
      thought: 'every directional icon (arrows, chevrons) should be mirrored under RTL for consistency.',
      reality: 'only icons that encode a directional MEANING relative to reading flow (a "next" chevron, a back arrow) should flip — icons representing universal concepts (a settings gear, a play button) should generally stay as-is; mirroring blindly can look wrong or even reverse the icon\'s actual meaning.',
    },
  ];
}
