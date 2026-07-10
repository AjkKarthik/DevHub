import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-duplicate-head-parser-correction-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './a-duplicate-head-elements-content-is-moved-into-body.html',
  styleUrl: './a-duplicate-head-elements-content-is-moved-into-body.scss',
})
export class IsItOkayToHaveTwoHeadElementsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s QnA, Proven by Inspecting the Actual Parsed DOM',
      points: [
        'The main page\'s QnA states directly: "An HTML document has exactly one <code>&lt;head&gt;</code> and one <code>&lt;body&gt;</code>. Duplicate <code>&lt;head&gt;</code> elements cause the browser to close the first and treat the second as part of <code>&lt;body&gt;</code>, breaking metadata parsing." This subtopic writes an HTML document with a genuine SECOND <code>&lt;head&gt;</code> tag, loads it in a real browser, and inspects <code>document.head</code> and <code>document.body</code> directly to confirm exactly where each element actually ended up.',
        'This is the HTML parser\'s ERROR-CORRECTION behavior in action, not a rejected/invalid document — browsers never simply refuse to render malformed HTML. Instead, the HTML parsing spec defines PRECISE rules for how to recover from exactly this kind of mistake, and the specific rule here is unambiguous: encountering a second <code>&lt;head&gt;</code> start tag while already inside <code>&lt;body&gt;</code> is simply IGNORED as a tag (the content that follows becomes part of <code>&lt;body&gt;</code>), rather than opening an actual second head section.',
      ],
    },
    {
      heading: 'Why This Silently Breaks Metadata, Not Just "Looks Wrong"',
      points: [
        'Elements that are only meaningful inside <code>&lt;head&gt;</code> — like <code>&lt;title&gt;</code>, <code>&lt;meta&gt;</code>, and <code>&lt;link rel="stylesheet"&gt;</code> — do NOT automatically become invalid or throw errors when they end up inside <code>&lt;body&gt;</code> instead; some of them (like <code>&lt;title&gt;</code>) simply have no effect there, while others may behave inconsistently across browsers, since the spec\'s guarantees for head-only elements only apply when they\'re actually inside the (single, real) <code>&lt;head&gt;</code>.',
        'This is exactly why the bug is so easy to miss during development — the page usually still LOOKS approximately correct (there\'s no visible parser error, no console warning by default), while metadata like the page title, SEO description, or a stylesheet reference silently fails to take effect, because the tag that was supposed to declare it ended up in the wrong structural location entirely.',
        'The fix the main page implies is equally simple: write exactly ONE <code>&lt;head&gt;</code> element containing ALL metadata, and exactly ONE <code>&lt;body&gt;</code> element containing all visible content — this is not merely a style convention, it is the only structure the HTML parser will actually interpret the way the author intends.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
<head>
  <title>First Title (from the FIRST head)</title>
</head>
<body>
  <p>Some visible body content, written first.</p>
</body>
<head>
  <meta name="description" content="This description is written inside a SECOND, duplicate head tag.">
</head>
<body>
  <p id="second-body-marker">This paragraph is written inside what LOOKS like a second body tag.</p>
</body>
<script type="module" src="index.ts"></script>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- Inspecting the ACTUAL parsed DOM structure ---');
console.log('document.head children:', Array.from(document.head.children).map(el => el.tagName + (el.textContent ? ': ' + el.textContent.trim().slice(0, 40) : '')));

console.log('--- Was the description meta tag from the "second head" actually placed in <head>? ---');
const desc = document.querySelector('meta[name="description"]');
console.log('meta[name=description] found:', !!desc);
console.log('Is it inside document.head?', desc ? document.head.contains(desc) : 'N/A');
console.log('Is it inside document.body instead?', desc ? document.body.contains(desc) : 'N/A');

console.log('--- Was the "second body content" merged into the SAME single <body>? ---');
const marker = document.getElementById('second-body-marker');
console.log('second-body-marker element found:', !!marker);
console.log('Is it a direct child of the SAME document.body as the first paragraph?', marker ? document.body.contains(marker) : 'N/A');

console.log('--- How many <head> and <body> elements does the parsed document ACTUALLY have? ---');
console.log('document.getElementsByTagName("head").length:', document.getElementsByTagName('head').length);
console.log('document.getElementsByTagName("body").length:', document.getElementsByTagName('body').length);`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The source HTML has a <code>&lt;meta name="description"&gt;</code> tag written inside what LOOKS like a second <code>&lt;head&gt;</code> element. Does that meta tag actually end up inside <code>document.head</code> once the browser parses it?',
    hint: 'Ask what the parser does the moment it encounters a second &lt;head&gt; opening tag while it\'s already past the first &lt;head&gt;...&lt;/head&gt; and into &lt;body&gt; -- does it open a genuine second head section, or treat that tag as meaningless and keep going in the body it\'s already in?',
    solution: `No -- the description meta tag does NOT end up inside document.head.
document.head.contains(desc) is false, and document.body.contains
(desc) is true instead -- the meta tag was silently placed inside
the single, real <body>, not inside any <head>.

The DOM inspection confirms the parser's error-correction rule
exactly as described: document.getElementsByTagName("head").length
is 1, and document.getElementsByTagName("body").length is also 1 --
there is only ever ONE head and ONE body in the final parsed
document, no matter how many <head> or <body> START TAGS appeared
in the raw source text. The second <head> tag (and the second
<body> tag) were not treated as opening new sections at all --
they were effectively ignored as parser signals, with their
CONTENT still ending up somewhere, just not where the raw markup
visually suggests.

The second-body-marker paragraph confirms the same thing for the
"second body": document.body.contains(marker) is true, and it sits
in the exact same document.body as the very first paragraph -- both
paragraphs, despite being written inside what looks like two
separate <body> tags in the source, end up as siblings in one real
body element.

This is exactly the "silent metadata breakage" the main page's QnA
warns about: the description meta tag LOOKS like it should set the
page's SEO description, and there's no console error or visual
sign anything went wrong -- but because it landed in <body> instead
of <head>, it has no effect on the page's actual metadata at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'writing a second &lt;head&gt; element in an HTML document causes the browser to reject the document as invalid, or at minimum log a visible parser error to the console.',
      reality: 'browsers never simply reject malformed HTML — the parser applies well-defined error-correction rules and continues silently; a second &lt;head&gt; tag produces no visible error at all, making the resulting metadata bug easy to miss entirely.',
    },
    {
      thought: 'a &lt;meta&gt; or &lt;title&gt; tag written inside a duplicate &lt;head&gt; element still gets recognized and applied by the browser as document metadata, since it\'s clearly intended to describe the document.',
      reality: 'once the parser has moved past the first, real &lt;head&gt;...&lt;/head&gt; and is inside &lt;body&gt;, a second &lt;head&gt; tag is not treated as opening a real head section at all — any metadata-only elements written after it end up structurally inside &lt;body&gt;, where they have no effect on the document\'s actual metadata.',
    },
    {
      thought: 'this "duplicate head gets merged into body" behavior is unique to head/body specifically — other structural HTML elements would behave completely differently if accidentally duplicated at the top level of a document.',
      reality: 'this is a specific instance of a MUCH broader principle — the HTML parsing spec defines precise error-recovery rules for essentially every kind of malformed markup, and different elements have their own specific recovery behaviors; duplicate head/body happens to result in silent content relocation, but other mistakes (like improperly nested tags) can produce different, equally well-defined correction behaviors.',
    },
  ];
}
