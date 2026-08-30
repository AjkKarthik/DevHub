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
    heading: 'Both of the Challenge\'s Own Test Cases Pass — and Hide the Property',
    points: [
      'The main page\'s Challenge solution runs <code>.trim().substring(0, maxLength).replace(...)</code> — truncate FIRST, encode SECOND — and its own two demonstration calls both produce exactly the commented output. Neither test case happens to contain a character that needs HTML-entity encoding right at the truncation boundary, so neither one reveals what this order of operations actually does to the final string length.',
      'Running the same function on an input where a special character sits near the maxLength cutoff shows the real property directly: <code>sanitiseInput(\'&lt;b&gt;hi&lt;/b&gt;\', 4)</code> — trimmed and truncated to the first 4 characters, <code>&lt;b&gt;h</code> — then each of the three special characters left in THAT 4-character slice gets expanded into a multi-character HTML entity, producing a FINAL string 10 characters long. The function\'s own step 2 said "truncate to maxLength characters," and it did — but that only bounds the length BEFORE step 3\'s encoding runs, not the string the caller actually receives.',
    ],
  },
  {
    heading: 'Whether This Is a Bug Depends on What maxLength Is Supposed to Bound',
    points: [
      'This is not a defect in the sense of the function failing to do what its own steps describe — it does exactly steps 1, 2, 3 in the stated order, and the Challenge description never actually promises the FINAL output is capped at maxLength characters, only that truncation happens as step 2. Whether this behaviour is correct or wrong entirely depends on what the caller actually needs <code>maxLength</code> to guarantee.',
      'If <code>maxLength</code> exists to bound RAW USER INPUT (e.g. "a product name field caps at 200 characters of user-typed text"), truncate-then-encode is exactly right — the user never typed more than <code>maxLength</code> characters, and entity-expansion is an unavoidable side effect of safely displaying whatever they did type. If <code>maxLength</code> exists to bound STORAGE or DISPLAY WIDTH of the final safe string (e.g. "this column is <code>VARCHAR(4)</code> in the database"), the current order is a real bug — the stored value can silently exceed the column\'s capacity, or worse, get silently truncated a SECOND time by the database in a way that could cut an HTML entity in half and corrupt it.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Truncate-Then-Encode (Main Page\'s Own Order)',
    language: 'typescript',
    code: `function sanitiseInput(input: string, maxLength: number): string {
  const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };
  return input
    .trim()
    .substring(0, maxLength)     // truncate FIRST
    .replace(/[&<>"']/g, ch => HTML_ENTITIES[ch]);   // encode SECOND
}

// The page's own two demonstration calls -- neither has a special
// character right at the truncation boundary, so neither reveals
// the property below.
console.log(sanitiseInput('<script>alert("xss")</script>', 50));
// -> &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;  (50 chars was never hit)

// A THIRD call, with a special character inside the truncated slice:
const result = sanitiseInput('<b>hi</b>', 4);
console.log(result, '-- length:', result.length);
// -> "&lt;b&gt;h" -- length: 10
//
// maxLength was 4. The trimmed-and-truncated slice ("<b>h") really
// was exactly 4 characters -- but every one of the 3 special
// characters left inside that slice then expanded into a longer HTML
// entity, and the FINAL string the caller receives is 10 characters,
// 2.5x longer than "maxLength" would suggest.`,
  },
  {
    label: 'Encode-Then-Truncate — A Different Bound, A Different Bug',
    language: 'typescript',
    code: `// Swapping the order bounds the FINAL string length exactly --
// but introduces its own new, genuinely worse problem.
function sanitiseInputV2(input: string, maxLength: number): string {
  const HTML_ENTITIES: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  };
  return input
    .trim()
    .replace(/[&<>"']/g, ch => HTML_ENTITIES[ch])   // encode FIRST
    .substring(0, maxLength);                        // truncate SECOND -- now bounds the FINAL string exactly
}

console.log(sanitiseInputV2('<b>hi</b>', 4));
// -> "&lt;" -- length 4, correctly bounded this time...
// ...but this is now a MANGLED, INCOMPLETE HTML entity: "&lt;" happens
// to be a complete, valid entity here by coincidence, but a different
// maxLength value can just as easily cut an entity in half --
// sanitiseInputV2('<b>hi</b>', 3) produces "&lt" (missing the
// trailing semicolon), which most HTML parsers will NOT recognise as
// the "<" entity at all, and will instead render as the literal,
// visible text "&lt" -- not a security hole, but a broken, confusing
// display bug that truncate-then-encode never has (the ORIGINAL order
// always produces complete, well-formed entities, just potentially
// more of them than maxLength alone would suggest).`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A form field is described as "product name, database column is VARCHAR(200)." Given the tradeoff above (truncate-then-encode can exceed the length bound; encode-then-truncate can produce a mangled entity), which order should this specific field use, and why?',
  hint: 'What is the value actually being stored — the user\'s raw typed text, or the HTML-encoded version? Check what the ProductSchema on the main page itself validates against.',
  solution: `// Truncate-then-encode is correct here -- the SAME order the main
// page's Challenge already uses.

// The main page's own ProductSchema (in the "Validation & Encoding"
// codeTab) validates and stores the RAW product name -- z.string()...
// with an allowlist regex, no HTML entities anywhere in the schema.
// VARCHAR(200) is bounding the RAW, UNENCODED text the user actually
// typed -- exactly what truncate-then-encode preserves correctly.

// HTML encoding only needs to happen LATER, at the point the value is
// actually RENDERED into an HTML context (the main page's own
// "renderUserComment" function does exactly this, separately, at
// display time) -- not baked into the stored value at all. Once you
// separate "what gets STORED" (raw, length-bounded, matches the DB
// column) from "what gets DISPLAYED" (encoded fresh, every time, for
// whichever context it's rendered into), the entire truncate-vs-encode
// ordering question disappears -- you never need a single function
// that does both at once. This is the real fix: the Challenge's
// combined function is a reasonable TEACHING exercise, but production
// code should keep "validate/store" and "encode for output" as two
// entirely separate steps, applied at two different times.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The Challenge\'s <code>sanitiseInput</code> function has a bug — <code>maxLength</code> should cap the final returned string length.',
    reality: 'Whether it\'s a bug depends entirely on what the caller needs the bound to mean — see the Try It above. When the value being bounded is the raw, stored, unencoded text (matching the main page\'s own separate <code>ProductSchema</code> pattern), truncate-then-encode is the CORRECT choice, not a defect — it just means the name "maxLength" is easy to misread as "the final output\'s max length" when it actually means "the max length of the input being accepted."',
  },
  {
    thought: 'Swapping to encode-then-truncate (shown in the second codeTab) is a strictly safer fix.',
    reality: 'It fixes the length-bound problem but introduces a DIFFERENT, arguably worse one: a maxLength value can land in the middle of a multi-character HTML entity, producing a mangled, incomplete entity like <code>&amp;lt</code> (no trailing semicolon) that most HTML parsers will render as the literal visible text "&amp;lt" instead of the intended "<" character — a confusing display bug, and evidence that a NEW rendering bug can silently trade places with the length-bound issue rather than genuinely eliminating it.',
  },
];

@Component({
  selector: 'app-sec-sc-truncate-encode',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './why-truncate-then-encode-can-exceed-maxlength.html',
  styleUrl: './why-truncate-then-encode-can-exceed-maxlength.scss',
})
export class WhyTruncateThenEncodeCanExceedMaxlengthSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
