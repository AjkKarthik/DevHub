import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';

const theory: TheoryPoint[] = [
  {
    heading: 'Nested JSON, Hand-Escaped, Rendered Broken',
    points: [
      'The main page’s own "Dashboard has no links to logs or traces" mistake block showed a panel link’s <code>url</code> field as a hand-escaped string containing a nested JSON payload — a Grafana Explore state object embedded directly in a URL. Verified by extracting the EXACT source text and evaluating it: most of the inner double quotes were escaped with a single backslash (<code>\\"</code>), which is a NO-OP inside a backtick template literal (JS treats <code>\\"</code> as just <code>"</code> there) — meaning almost every nested quote silently collapsed to a bare, unescaped <code>"</code> in the actual rendered code.',
      'The practical consequence: the code shown to a reader was not valid nested JSON at all — the outer <code>"url": "..."</code> string value would have terminated at the FIRST unescaped inner quote it hit, corrupting the rest of the value into loose, syntactically-broken text.',
      'Curiously, exactly ONE nested quote pair (around <code>$service</code>) WAS correctly triple-escaped (<code>\\\\\\"</code>, which genuinely does survive as a literal <code>\\"</code>) — suggesting the original author understood the escaping rule in that one spot but didn’t apply it consistently everywhere else the same rule needed to hold.',
      'This has now been fixed on the main page — not by patching the escaping (a fragile, error-prone fix given how easy it is to miscount backslashes across multiple nesting levels), but by rewriting the example to BUILD the URL programmatically with <code>JSON.stringify()</code> and <code>encodeURIComponent()</code> instead of hand-typing an escaped JSON blob. This sidesteps the whole class of escaping bug entirely, and is also what real dashboard-as-code tooling actually does.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Broken vs. Fixed, Verified',
    language: 'typescript',
    code: `// The ORIGINAL hand-escaped url value, reproduced exactly as it
// appeared on the main page before the fix.
const brokenUrlValue = "/explore?left={\\"datasource\\":\\"Loki\\",\\"queries\\":[{\\"expr\\":\\"{service=\\\\\\"$service\\\\\\"}\\"}],\\"range\\":{\\"from\\":\\"\${__from}\\",\\"to\\":\\"\${__to}\\"}}";

// The bug only shows up once this value is embedded as a proper JSON
// STRING FIELD inside the surrounding panel-link object -- exactly
// what the page's own code sample was illustrating.
const brokenPanelLinkJson = \`{
  "links": [{
    "title": "View logs in Loki",
    "url": "\` + brokenUrlValue + \`"
  }]
}\`;

console.log('BROKEN -- parsing the full panel-link JSON as shown on the page:');
try {
  JSON.parse(brokenPanelLinkJson);
  console.log('parsed OK (unexpected)');
} catch (e) {
  console.log('FAILED:', (e as Error).message);
}
// -> FAILED: Expected ',' or '}' after property value in JSON at
//    position 78 -- exactly where the first unescaped inner quote
//    prematurely closed the outer "url" string.

// FIXED -- build the url value programmatically instead of hand-
// escaping it, then let it live as an ordinary string field.
const lokiExploreState = {
  datasource: 'Loki',
  queries: [{ expr: '{service="$service"}' }],
  range: { from: '\${__from}', to: '\${__to}' },
};
const fixedUrlValue = '/explore?left=' + encodeURIComponent(JSON.stringify(lokiExploreState));

const fixedPanelLink = {
  links: [{ title: 'View logs in Loki', url: fixedUrlValue }],
};

console.log('FIXED -- parsing the full panel-link JSON:');
const parsed = JSON.parse(JSON.stringify(fixedPanelLink));
console.log('parsed OK:', JSON.stringify(parsed, null, 2));
// -> parses cleanly -- encodeURIComponent() percent-encodes every
//    character that could ever collide with the outer JSON's own
//    delimiters, so there's nothing left to escape at all.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes adding a THIRD level of nesting -- a <code>panels</code> array inside the Explore state, each with its own <code>title</code> that might contain a double quote (e.g. a panel titled <code>Say "hello"</code>). Using the fixed, <code>JSON.stringify()</code> + <code>encodeURIComponent()</code> approach, does this new field need any special hand-escaping to render correctly in the final URL?',
  hint: 'Trace what <code>JSON.stringify()</code> does to a quote inside a string value first, then what <code>encodeURIComponent()</code> does to THAT result afterward.',
  solution: `// No special hand-escaping is needed at any nesting depth.
//
// const stateWithQuotedTitle = {
//   ...lokiExploreState,
//   panels: [{ title: 'Say "hello"' }],
// };
//
// JSON.stringify(stateWithQuotedTitle) automatically escapes the
// quote inside the title:
//   ...,"panels":[{"title":"Say \\"hello\\""}]
//
// encodeURIComponent() then percent-encodes EVERY character in that
// entire JSON string that could collide with anything -- including
// the backslash and quote characters JSON.stringify() just added --
// turning the whole blob into a single opaque, URL-safe sequence with
// no literal " or \\ characters left in it at all.
//
// This is the real reason the fix is robust at ANY nesting depth: the
// two-step pipeline (stringify, then percent-encode) never leaves a
// raw quote character anywhere in the final URL for the OUTER JSON
// document to trip over -- there's nothing left for a future nesting
// level to accidentally break, unlike hand-escaping, where every new
// level requires the author to get ANOTHER round of backslash-doubling
// exactly right.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A single backslash before a double quote (<code>\\"</code>) always produces an escaped, "protected" quote, regardless of what kind of string it appears inside.',
    reality: 'Inside a BACKTICK template literal specifically, <code>\\"</code> is a completely unnecessary, no-op escape — double quotes never need escaping there at all, since backticks aren’t terminated by <code>"</code>. The bug happened precisely because the author applied the escaping RULE FOR DOUBLE-QUOTED STRINGS inside a template-literal context where that rule doesn’t apply the same way.',
  },
  {
    thought: 'The one correctly-escaped quote pair (around <code>$service</code>, using triple backslashes) proves the rest of the string was ALSO probably fine, just formatted differently.',
    reality: 'The codeTab’s own direct extraction and evaluation shows the opposite — that one correctly-escaped pair was the EXCEPTION, not the rule, surrounded by many incorrectly single-escaped quotes elsewhere in the exact same string. Consistency has to be verified field-by-field; one correct instance doesn’t imply the others are correct too.',
  },
  {
    thought: 'The safest way to fix a broken hand-escaped JSON string is to carefully count the backslashes and add however many are missing.',
    reality: 'The fix that was actually applied deliberately avoided this — hand-recounting backslashes across multiple nesting levels is exactly the error-prone process that produced the original bug. Replacing the hand-escaped string with <code>JSON.stringify()</code> eliminates the entire category of mistake, rather than trying to get the manual escaping right this time.',
  },
];

@Component({
  selector: 'app-obs-grafana-broken-json-link',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-broken-nested-json-panel-link.html',
  styleUrl: './the-broken-nested-json-panel-link.scss',
})
export class TheBrokenNestedJsonPanelLinkSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
