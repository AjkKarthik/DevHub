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
  selector: 'app-second-main-no-error-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './a-second-main-is-silently-allowed-with-no-thrown-error.html',
  styleUrl: './a-second-main-is-silently-allowed-with-no-thrown-error.scss',
})
export class MultipleMainElementsOnOnePageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #2, Proven With a Live DOM Query',
      points: [
        'The main page\'s Mistake #2 shows two <code>&lt;main&gt;</code> elements on one page and states plainly: "A page must have exactly one <code>&lt;main&gt;</code>." This subtopic actually loads a document with two <code>&lt;main&gt;</code> elements and checks <code>document.querySelectorAll(\'main\').length</code>, proving the browser does not reject, merge, or error on the second one — it simply renders both, exactly as written, with zero indication anything is wrong.',
        'This is a genuinely important distinction: "invalid" in HTML does not mean "rejected" or "throws an error" — the HTML specification defines what a CONFORMING document looks like, but browsers are built to be maximally forgiving of non-conforming markup, parsing and rendering it anyway rather than refusing to display the page.',
      ],
    },
    {
      heading: 'Why the Browser Stays Silent — And Where the Rule Is Actually Enforced',
      points: [
        'The "exactly one <code>&lt;main&gt;</code>" rule is a CONTENT MODEL constraint from the HTML specification, not a PARSING rule — parsing rules (like the duplicate <code>&lt;head&gt;</code> correction covered on the Document Structure page) are things the browser\'s PARSER actively enforces while building the DOM tree. Content model rules are closer to style/linting guidance: the browser will happily build a DOM containing two <code>&lt;main&gt;</code> elements, since nothing about that structure is ambiguous or un-parseable.',
        'This rule IS actively enforced somewhere, just not by the raw parser — HTML validators (like the W3C Nu Html Checker) and some accessibility auditing tools (axe, Lighthouse) specifically flag multiple <code>&lt;main&gt;</code> elements as an error, and browsers\' own accessibility trees behave inconsistently once there\'s more than one (typically, only the FIRST is exposed as the "main" landmark region to assistive technology, silently orphaning the second).',
        'This is precisely why "does it look right in the browser" is an unreliable test for whether markup is genuinely correct — a page with two <code>&lt;main&gt;</code> elements can look and function completely normally to a sighted mouse user while being broken for a screen reader user relying on "jump to main content" navigation.',
      ],
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Multiple main elements demo</title>
</head>
<body>
  <main>
    <h1>Homepage content</h1>
    <p>This is the first main element.</p>
  </main>

  <main>
    <h1>Secondary section</h1>
    <p>This is a SECOND main element -- technically invalid HTML.</p>
  </main>

  <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
  <script type="module" src="index.ts"></script>
</body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- Checking how many <main> elements the browser actually parsed ---');
const mains = document.querySelectorAll('main');
console.log('document.querySelectorAll("main").length:', mains.length, '<-- both are genuinely present in the DOM, no error, no merge');

mains.forEach((m, i) => {
  console.log('main[' + i + '] first heading text:', m.querySelector('h1')?.textContent);
});

console.log('--- Did the page fail to load, throw, or show any visible error? ---');
console.log('document.readyState:', document.readyState, '<-- loaded completely normally');
console.log('Any parser errors thrown into the console automatically? Check above -- there are none.');

console.log('--- A small "audit" function, similar to what a linter or a11y tool does ---');
function auditMainCount() {
  const count = document.querySelectorAll('main').length;
  if (count === 0) {
    console.log('AUDIT FAIL: no <main> element found -- screen reader users have no "main content" landmark to jump to.');
  } else if (count > 1) {
    console.log('AUDIT FAIL: ' + count + ' <main> elements found -- only the FIRST is reliably exposed as the accessibility landmark; the rest are effectively invisible to "skip to main content" navigation.');
  } else {
    console.log('AUDIT PASS: exactly one <main> element found.');
  }
}
auditMainCount();`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'This demo\'s HTML has two <code>&lt;main&gt;</code> elements. Does the page fail to load, throw a JavaScript error, or show any visible sign of a problem when you run it?',
    hint: 'Ask what kind of rule "exactly one main per page" actually is -- something the browser\'s PARSER checks while building the DOM (like matching tags), or something closer to a style guideline that the parser has no reason to reject?',
    solution: `No -- nothing fails, throws, or visibly breaks. document.readyState
reports "complete" exactly as it would for perfectly valid markup,
and document.querySelectorAll("main").length genuinely returns 2 --
both <main> elements are present in the DOM tree, fully rendered,
with zero errors anywhere in the console.

This is because "exactly one main per page" is a CONTENT MODEL rule
from the HTML specification, not a PARSING rule. The browser's
parser only rejects or corrects markup that is fundamentally
ambiguous to interpret (like the duplicate <head> case covered
elsewhere on this site) -- two <main> elements are perfectly
unambiguous to parse; the browser just builds a DOM with two of
them, since nothing about that structure confuses the parsing
algorithm at all.

The rule IS still meaningful and enforced -- just not by the raw
parser. HTML validators (like the W3C Nu Html Checker) explicitly
flag this as invalid. More practically, browsers' own accessibility
trees typically only expose the FIRST <main> as the "main content"
landmark that screen reader users can jump to directly -- the second
one silently becomes unreachable via that navigation shortcut, even
though it renders completely normally on screen.

The custom auditMainCount() function at the end shows how you'd
actually CATCH this programmatically, since the browser itself gives
you no built-in warning -- this is exactly the kind of check real
accessibility auditing tools (axe, Lighthouse) perform under the hood.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a piece of HTML is technically "invalid" according to the specification (like having two &lt;main&gt; elements), the browser will refuse to render it correctly, throw a console error, or otherwise visibly signal that something is wrong.',
      reality: 'browsers are built to be maximally forgiving of non-conforming markup — invalid content-model violations like multiple &lt;main&gt; elements parse and render completely normally, with zero errors or warnings printed anywhere, unless you specifically run the page through a validator or accessibility auditing tool.',
    },
    {
      thought: 'a page "looking correct" and functioning normally for a sighted mouse user is a reliable enough test that the underlying HTML structure is genuinely correct.',
      reality: 'visual correctness and structural correctness are completely independent — a page with two &lt;main&gt; elements can look and behave perfectly normally for a sighted user while being broken for a screen reader user, since accessibility landmark navigation typically only recognizes the FIRST &lt;main&gt; on the page.',
    },
    {
      thought: 'HTML "validity" rules like "exactly one main per page" are essentially the same kind of rule as tag-matching or duplicate-head correction — things the browser\'s own parser actively checks and corrects while building the page.',
      reality: 'these are two fundamentally different categories of rule — parsing rules (like duplicate &lt;head&gt; handling) are actively enforced by the parser itself while building the DOM, while content-model rules (like "exactly one main") are specification guidance that only external tools (validators, accessibility auditors), not the browser\'s parser, actually check.',
    },
  ];
}
