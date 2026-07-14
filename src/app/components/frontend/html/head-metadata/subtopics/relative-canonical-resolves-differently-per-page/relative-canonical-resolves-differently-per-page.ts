import { Component } from '@angular/core';
import { SubtopicEyebrowComponent } from '../../../../../../components/shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../../components/shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../../components/shared/theory-block/theory-block';
import { LivePlaygroundComponent, PlaygroundFile } from '../../../../../../components/shared/live-playground/live-playground';
import { TryItComponent, TryItExercise } from '../../../../../../components/shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../../components/shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../../components/shared/subtopic-nav/subtopic-nav';

@Component({
  selector: 'app-relative-canonical-resolves-differently-per-page',
  standalone: true,
  imports: [
    SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    LivePlaygroundComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent
  ],
  templateUrl: './relative-canonical-resolves-differently-per-page.html',
  styleUrl: './relative-canonical-resolves-differently-per-page.scss'
})
export class RelativeCanonicalResolvesDifferentlyPerPageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A relative href is resolved against the CURRENT page\'s own URL — every time, silently',
      points: [
        'The main page\'s Common Mistake is direct: "Canonical URLs must be absolute... A relative canonical is ambiguous — if the page is mirrored on multiple domains, a relative URL resolves differently on each, defeating the purpose of the canonical tag."',
        'This is not unique to <code>&lt;link rel="canonical"&gt;</code> — it is how EVERY relative URL in HTML resolves, using the page\'s own address (or a <code>&lt;base&gt;</code> tag, if present) as the base. The problem is specific to canonical because its entire JOB is to unambiguously name ONE preferred URL — a value that silently changes meaning depending on where it\'s served defeats that job completely.',
      ]
    },
    {
      heading: 'The DOM property .href HIDES the raw value — always showing a resolved absolute URL',
      points: [
        'If you write <code>&lt;link rel="canonical" href="/blog/post"&gt;</code> and then check <code>document.querySelector(\'link[rel=canonical]\').href</code> from JavaScript, you always get back a fully-resolved ABSOLUTE URL — even though the actual HTML attribute value is relative.',
        'This is genuinely misleading if you\'re debugging with JS: the DOM property makes a relative canonical LOOK like a correctly absolute one. You have to check <code>.getAttribute(\'href\')</code> instead to see the raw, original (possibly relative and problematic) value that was actually written in the HTML source.',
      ]
    },
  ];

  liveDemoFiles: PlaygroundFile[] = [
    {
      path: 'index.html',
      content: `<!doctype html>
<html>
  <head>
    <title>relative canonical resolves per-page</title>
    <!-- Deliberately relative — this is the Common Mistake from the main page -->
    <link rel="canonical" href="/blog/head-tags">
  </head>
  <body>
    <pre id="output" style="background:#111;color:#0f0;padding:1rem;white-space:pre-wrap;"></pre>
    <script type="module" src="index.ts"></script>
  </body>
</html>
`,
    },
    {
      path: 'index.ts',
      content: `const output = document.getElementById('output')!;
const link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;

const rawAttribute = link.getAttribute('href')!;
const resolvedProperty = link.href;

// Simulate the exact same relative href being resolved on two DIFFERENT
// "mirror" domains — this is the real-world scenario the main page warns
// about (http vs https, or two entirely different domains serving the
// same content).
const mirrorA = new URL(rawAttribute, 'https://blog.example.com/');
const mirrorB = new URL(rawAttribute, 'https://cdn-mirror.example.net/archive/');

output.textContent =
  \`Raw HTML attribute (link.getAttribute('href')):\\n  "\${rawAttribute}"\\n\\n\` +
  \`DOM property, resolved against THIS page's own URL (link.href):\\n  "\${resolvedProperty}"\\n  ← looks perfectly absolute! Easy to assume this IS the real value.\\n\\n\` +
  \`The SAME raw relative value, resolved against two different mirror origins:\\n\` +
  \`  mirror A (blog.example.com):        \${mirrorA.href}\\n\` +
  \`  mirror B (cdn-mirror.example.net):   \${mirrorB.href}\\n\\n\` +
  'Two genuinely different absolute URLs from the identical HTML attribute value —\\n' +
  'exactly the ambiguity a canonical tag exists to eliminate.';
`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'The canonical tag above has <code>href="/blog/head-tags"</code> — a relative value. Predict: if you check <code>link.href</code> (the DOM property, not the attribute) from JavaScript, will it show you the relative string you wrote, or something else?',
    hint: 'DOM URL-valued properties like <code>.href</code> are specified to always return a fully resolved absolute URL, regardless of how the underlying attribute was written.',
    solution: `It shows a fully resolved absolute URL, resolved against THIS page's own address — not the
relative string that was actually written in the HTML. This is exactly what makes the mistake easy
to miss during debugging: a developer checking link.href in the console sees something that looks
perfectly correct and absolute, with no obvious sign that the underlying markup is fragile and
relative. Catching the real problem requires checking getAttribute('href') instead, or simply always
writing canonical hrefs as absolute URLs in the first place so there's nothing to resolve.`
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Checking <code>link.href</code> in the browser console is a reliable way to verify a canonical tag is written correctly.',
      reality: '<code>.href</code> always returns a resolved ABSOLUTE URL, even when the underlying HTML attribute is relative — it cannot tell you whether the original markup was safely absolute or fragile and relative. Use <code>getAttribute(\'href\')</code> to see the real, raw value.'
    },
    {
      thought: 'A relative canonical URL is only a problem if the site is actually mirrored on multiple domains — otherwise it resolves fine.',
      reality: 'It resolves "fine" on any single domain, but the main page\'s point is broader: canonical\'s entire purpose is to be an unambiguous, portable statement of the preferred URL. A value whose meaning depends on where it\'s hosted defeats that purpose even before a mirror scenario ever occurs.'
    },
    {
      thought: 'Relative URL resolution is a special behavior specific to the canonical link tag.',
      reality: 'It is the same universal relative-URL-resolution rule every HTML attribute like <code>href</code> or <code>src</code> follows, resolved against the current page\'s own address (or a <code>&lt;base&gt;</code> tag). Canonical is simply the tag where getting this wrong causes the most damage, since its whole job depends on being unambiguous.'
    },
  ];
}
