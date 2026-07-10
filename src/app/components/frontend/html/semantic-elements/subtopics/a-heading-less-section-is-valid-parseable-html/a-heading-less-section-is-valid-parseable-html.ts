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
  selector: 'app-heading-less-section-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './a-heading-less-section-is-valid-parseable-html.html',
  styleUrl: './a-heading-less-section-is-valid-parseable-html.scss',
})
export class UsingSectionAsAGenericWrapperSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #1, Proven by Writing a Real Audit Script',
      points: [
        'The main page\'s Mistake #1 states: "<code>&lt;section&gt;</code> must have a heading (h2-h6) and represent a thematic grouping. Without a heading, use <code>&lt;div&gt;</code>." This subtopic writes a heading-less <code>&lt;section&gt;</code> directly into the demo\'s own HTML, confirms it parses and renders with zero errors, then builds the exact kind of programmatic check (walking every <code>&lt;section&gt;</code>, looking for a heading descendant) that a real accessibility audit tool would run to catch this.',
        'Just like the "exactly one <code>&lt;main&gt;</code>" rule from the previous subtopic, "a section needs a heading" is a semantic/content-model expectation from the specification, NOT something the parser validates while building the DOM — the browser has no built-in mechanism that inspects a <code>&lt;section&gt;</code>\'s children looking for a heading and rejects or warns if one is missing.',
      ],
    },
    {
      heading: 'Why This Specific Rule Exists — Sections Exist FOR Their Heading',
      points: [
        '<code>&lt;section&gt;</code>\'s entire semantic purpose is to represent a THEMATICALLY COHERENT chunk of content that would logically appear as an entry in a document outline — book chapters, tabbed panel content, a numbered set of steps. A heading is what SUPPLIES that outline entry\'s label; a <code>&lt;section&gt;</code> with no heading has no way to communicate what its "theme" actually is, to a screen reader user navigating by headings or to a tool trying to generate a table of contents.',
        'This is exactly why the fix isn\'t "add an invisible or hidden heading just to satisfy the rule" — the correct fix (shown in the main page\'s own right/wrong example) is usually to recognize that the content DOESN\'T have a coherent, headline-able theme at all, meaning <code>&lt;div&gt;</code> (which carries no such semantic promise) was the correct choice from the start.',
        'A useful mental test the main page implies but doesn\'t state explicitly: if you genuinely can\'t write a short, meaningful <code>&lt;h2&gt;</code>–<code>&lt;h6&gt;</code> for a piece of content, that\'s a strong signal the content isn\'t actually a "section" in the semantic sense — it\'s just a styling/layout grouping, which is precisely what <code>&lt;div&gt;</code> is for.',
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
  <title>Heading-less section demo</title>
</head>
<body>
  <section id="good-section">
    <h2>Customer Reviews</h2>
    <p>This section correctly has a heading.</p>
  </section>

  <section id="bad-section" class="wrapper">
    <p>This section has NO heading at all -- it's really just being used as a styling wrapper.</p>
  </section>

  <div id="correct-div-wrapper" class="wrapper">
    <p>This is a div used correctly, as a plain layout wrapper with no semantic claim.</p>
  </div>

  <p>Open the browser console (or the StackBlitz Console tab) to see output.</p>
  <script type="module" src="index.ts"></script>
</body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `console.log('--- Did the page load normally despite the heading-less section? ---');
console.log('document.readyState:', document.readyState, '<-- loaded completely normally, no parser errors');

console.log('--- Manually checking #bad-section for a heading ---');
const badSection = document.getElementById('bad-section')!;
const headingInBadSection = badSection.querySelector('h1, h2, h3, h4, h5, h6');
console.log('Does #bad-section contain a heading?', !!headingInBadSection, '<-- false, but the browser rendered it anyway');

console.log('--- A real audit function: find every <section> missing a heading ---');
function auditSectionsForHeadings() {
  const sections = document.querySelectorAll('section');
  let violations = 0;
  sections.forEach((section, i) => {
    const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
    if (!heading) {
      violations++;
      console.log('AUDIT FAIL: section #' + i + ' (id="' + section.id + '") has NO heading descendant -- should probably be a <div> instead.');
    } else {
      console.log('AUDIT PASS: section #' + i + ' (id="' + section.id + '") has a heading: "' + heading.textContent + '"');
    }
  });
  console.log('Total violations found:', violations, 'out of', sections.length, 'total <section> elements');
}
auditSectionsForHeadings();

console.log('--- Contrast: the div is never audited this way at all -- it never claimed to need one ---');
console.log('#correct-div-wrapper is a <div>, so it is correctly excluded from this audit entirely.');`,
    },
  ];

  exercise: TryItExercise = {
    prompt: '<code>#bad-section</code> is a <code>&lt;section&gt;</code> with no heading inside it at all. Does the page fail to load, or does the browser show any error about the missing heading?',
    hint: 'Ask whether the HTML parser has any built-in logic that inspects a section\'s CHILDREN looking for a heading element -- or whether that kind of check would need to be written as a completely separate piece of code that walks the DOM after the fact.',
    solution: `No -- the page loads with document.readyState reporting "complete"
exactly as normal, with zero errors related to the missing heading.
querySelector('h1, h2, h3, h4, h5, h6') on #bad-section correctly
confirms there genuinely is no heading inside it, but that check is
something WE wrote and ran manually -- the browser's own parser never
performed anything like it while building the page.

The auditSectionsForHeadings() function shows what it actually takes
to catch this class of mistake: manually querying every <section> on
the page and checking each one's children for a heading element. This
is conceptually identical to what real accessibility/HTML-quality
tools (axe, the W3C validator) do under the hood -- they aren't
using some special browser API the parser exposes; they're just
running the same kind of DOM-walking check you could write yourself.

The contrast with #correct-div-wrapper reinforces the underlying
point: a <div> never gets flagged by this audit at all, because
<div> never made any semantic promise about having a heading in the
first place. The "problem" isn't the absence of a heading in the
abstract -- it's specifically that <section> is the wrong element to
use when there's no coherent, headline-able theme to give the
content.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'a &lt;section&gt; element with no heading inside it is invalid HTML that browsers will refuse to render, or at minimum flag with a visible console warning.',
      reality: 'a heading-less section parses and renders exactly like any other element, with zero errors or warnings — "a section should have a heading" is a semantic best-practice guideline, not something the browser\'s parser checks or enforces.',
    },
    {
      thought: 'catching a heading-less &lt;section&gt; requires some special browser API or accessibility-specific tool that has privileged access to check semantic correctness.',
      reality: 'catching this is just ordinary DOM traversal — querying every &lt;section&gt; and checking its children for a heading element with querySelector, exactly the same technique any JavaScript developer already knows, is precisely what real auditing tools do under the hood.',
    },
    {
      thought: 'the fix for a heading-less &lt;section&gt; that fails an accessibility audit is usually to add a heading — even a visually hidden one — to satisfy the check.',
      reality: 'adding an artificial heading just to pass a check misses the actual point — if the content genuinely has no coherent, headline-able theme, the correct fix is switching the element to &lt;div&gt; entirely, not forcing a heading onto content that was never meant to be a semantic "section" in the first place.',
    },
  ];
}
