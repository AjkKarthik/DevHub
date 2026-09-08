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
    heading: 'A Regex With Zero Understanding of JSON Structure',
    points: [
      'The main page’s own "Loki + Tempo Linking" codeTab configures a <code>derivedField</code> with <code>matcherRegex: \'"traceId":"(\\w+)"\'</code> — a plain text-pattern regex, not a JSON parser. It has no concept of nesting, object boundaries, or which JSON level a matched field actually belongs to; it simply scans the raw log line, left to right, for the first literal substring matching the pattern.',
      'Verified via direct execution: a log line where a NESTED sub-object (e.g. an embedded upstream-request context) happens to ALSO contain a field literally named <code>traceId</code>, appearing textually BEFORE the intended top-level <code>traceId</code> field, causes the regex to extract the WRONG value — the decoy nested one, not the actual request’s own trace ID.',
      'A second, independent limitation: the pattern’s capture group is <code>(\\w+)</code> — word characters only (letters, digits, underscore). Verified that a hyphenated trace ID value (e.g. a UUID-style ID like <code>4bf92f35-77b3-4da6</code>) fails to match the pattern AT ALL, since <code>\\w+</code> cannot span the hyphen and reach the required closing quote — the entire derivedField link silently fails to render for that log line, with no error or fallback.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Two Real Limits, Verified',
    language: 'typescript',
    code: `const matcherRegex = /"traceId":"(\\w+)"/;

// LIMIT 1: JSON-structure blindness. A nested decoy field named
// exactly "traceId" (word characters only, so it fully matches the
// pattern) sitting BEFORE the real, intended top-level field wins,
// purely because it appears earlier in the raw text.
const logWithNestedDecoy =
  '{"timestamp":"2024-01-15T10:30:00Z","upstreamContext":{"traceId":"decoyupstream111"},"traceId":"4bf92f3577b34da6","message":"ok"}';

const match1 = logWithNestedDecoy.match(matcherRegex);
console.log('Extracted (WRONG -- grabbed the nested decoy):', match1![1]);
// -> 'decoyupstream111', NOT the intended '4bf92f3577b34da6'

// LIMIT 2: \\w+ cannot span a hyphen. A perfectly valid, real trace ID
// that happens to use a hyphenated format is invisible to this pattern
// entirely -- no match at all, not even a wrong one.
const logWithHyphenatedId = '{"traceId":"4bf92f35-77b3-4da6"}';
const match2 = logWithHyphenatedId.match(matcherRegex);
console.log('Extracted from hyphenated ID:', match2 ? match2[1] : 'NO MATCH AT ALL');
// -> 'NO MATCH AT ALL' -- the derivedField link simply never appears
//    for this log line, with no indication why.

// A log line with NEITHER problem -- the common, "happy path" case
// this regex was actually verified against on the main page.
const normalLog = '{"timestamp":"2024-01-15T10:30:00Z","level":"error","traceId":"4bf92f3577b34da6","message":"failed"}';
const match3 = normalLog.match(matcherRegex);
console.log('Extracted from a normal log line:', match3![1]);
// -> '4bf92f3577b34da6' -- correct, this is the case the pattern was designed for`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A team fixes Limit 1 by renaming the nested decoy field from <code>traceId</code> to <code>upstreamTraceId</code> (still word characters only, still appears earlier in the log line). Does the regex now correctly extract the intended, top-level <code>traceId</code>?',
  hint: 'The regex pattern requires the LITERAL substring <code>"traceId":"</code> immediately preceded by a <code>"</code> — does <code>"upstreamTraceId":"decoyupstream111"</code> contain that exact substring anywhere within it?',
  solution: `// The literal substring "traceId":" (with the leading quote directly
// before the lowercase 't' in traceId) does NOT appear anywhere inside
// "upstreamTraceId":"decoyupstream111" -- the field name has extra
// characters ("upstream") immediately BEFORE "TraceId", and critically
// a capital T, not lowercase, so it doesn't match the regex's exact
// case-sensitive "traceId" text at all.
//
// const logWithRenamedDecoy =
//   '{"upstreamContext":{"upstreamTraceId":"decoyupstream111"},"traceId":"4bf92f3577b34da6"}';
// logWithRenamedDecoy.match(matcherRegex)[1]
//   -> '4bf92f3577b34da6' -- now CORRECT, the rename fixes it.
//
// This demonstrates the regex's collision risk is narrower than "any
// nested traceId-shaped data" -- it specifically requires another
// field to be named EXACTLY "traceId" (same case, same exact string)
// somewhere earlier in the log line. A field with a DIFFERENT name
// that merely represents similar data (an upstream/parent trace ID)
// is completely safe from this collision, which is exactly why this
// specific naming convention (avoiding the bare "traceId" name for any
// field other than the one truly meant to drive this link) is a real,
// practical mitigation worth adopting -- not a full fix for the
// regex's structural blindness, but a narrower, cheaper one.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A regex-based log field matcher like this one understands JSON well enough to distinguish a top-level field from a nested one with the same name.',
    reality: 'The regex is pure text pattern matching with zero awareness of JSON syntax, brace depth, or nesting level — it treats the entire log line as one flat string and returns whatever matches its pattern FIRST, regardless of which JSON "level" that match happens to live at.',
  },
  {
    thought: 'Since the main page’s own worked example log line extracts the correct trace ID, the regex pattern is generally reliable for real production log formats.',
    reality: 'The codeTab above demonstrates the main page’s own example specifically avoided both failure modes (no nested decoy field, no hyphenated ID) — a genuinely representative test needs log lines that DO exercise these conditions, which real production logging (especially logs with nested context objects, or trace IDs from a system using UUID formatting) can absolutely produce.',
  },
  {
    thought: 'A trace ID that fails to match the <code>\\w+</code> pattern will at least produce a visibly broken or malformed link in Grafana, making the problem easy to spot.',
    reality: 'Verified directly: a non-matching log line produces <code>NO MATCH AT ALL</code> — the <code>derivedField</code> link simply doesn’t render for that log line, with no error, no placeholder, and no visible indication anything went wrong. The failure is silent, which is precisely what makes it dangerous in practice — an engineer investigating an incident might never notice the missing link at all.',
  },
];

@Component({
  selector: 'app-obs-grafana-traceid-regex-limits',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './testing-the-loki-trace-id-regexs-real-limits.html',
  styleUrl: './testing-the-loki-trace-id-regexs-real-limits.scss',
})
export class TestingTheLokiTraceIdRegexsRealLimitsSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
