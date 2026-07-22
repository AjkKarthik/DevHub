import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './pino-redact-paths-must-match-the-exact-log-object-shape.html',
  styleUrl: './pino-redact-paths-must-match-the-exact-log-object-shape.scss'
})
export class PinoRedactPathsMustMatchTheExactLogObjectShapeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own two code samples actually use two DIFFERENT redact paths for what looks like the same intent — the Pino structured logging example redacts headers.authorization, while the Request Logger Middleware challenge\'s own solution redacts req.headers.authorization — worth knowing this difference is not a typo\'s worth of insignificant, since Pino treats these as two completely separate, non-interchangeable paths',
      points: [
        'Per Pino\'s own documentation, redact paths use ECMAScript-style dot/bracket notation (a.b.c, wildcards like a.b.*) and must match the object\'s actual key structure exactly — internally, Pino uses the fast-redact library, whose own documented approach is: "for static paths, the function checks that the path exists and then overwrites." A path that does not exist in the logged object structure simply has nothing to overwrite.',
        'The practical, easy-to-miss consequence: if a redact path doesn\'t match the real shape of what gets logged, Pino does NOT throw an error, does NOT log a warning, and gives no signal whatsoever that the configuration is ineffective. The log call succeeds normally, the output looks completely normal — the ONLY difference from a working redact configuration is that the sensitive field is sitting there in plain text instead of showing [Redacted].',
        'This is exactly why the main page\'s own two code samples matter as a real-world illustration: headers.authorization as a redact path only matches an object where headers is a TOP-LEVEL key of whatever gets passed to the log call. req.headers.authorization only matches an object where headers is nested one level deeper, under a req key. If the actual code that constructs a log call\'s object doesn\'t match whichever redact path was configured, that specific authorization header is logged in full, silently, with the redact config present and looking correct on casual review.',
      ]
    },
    {
      heading: 'How to actually verify a redact configuration is doing anything at all',
      points: [
        'Since there is no error or warning to rely on, the only reliable way to confirm a redact path is actually matching is empirical: log a test call with the EXACT object shape the real code path will produce, and manually inspect the output for [Redacted] versus the real value — a redact configuration should never be trusted based on the config alone, especially after any refactor that changes how a log object is constructed (e.g., wrapping fields under a new parent key, or renaming a field the redact path references).',
        'This risk compounds specifically at refactor time: a redact path that was correct when originally written can silently stop matching anything if the SHAPE of the logged object later changes (a field gets renamed, moved under a new parent key, or the logging call site itself changes) — with zero indication anywhere that the protection quietly stopped working the moment that refactor landed.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own two redact paths, side by side',
      language: 'typescript',
      code: `// Pino structured logging example (main page) — logs headers
// directly as a TOP-LEVEL property of the log call's object:
req.log = logger.child({
  requestId,
  method: req.method,
  path:   req.path,
  ip:     req.ip,
  // If headers were logged here too, this shape needs the path
  // 'headers.authorization' to redact correctly:
  // headers: req.headers,
});

const logger1 = pino({
  redact: ['body.password', 'headers.authorization', '*.token'],
});

// Request Logger Middleware challenge (main page's own solution) —
// nests everything under a "req" key instead:
const logger2 = pino({
  redact: ['req.headers.authorization', 'req.headers.cookie'],
});
// This SAME literal header value, logged as { req: { headers } }
// instead of { headers } directly, needs the DIFFERENT path
// 'req.headers.authorization' — 'headers.authorization' alone
// would silently never match this shape at all.`,
    },
    {
      label: 'The silent failure mode — no error, just a leaked field',
      language: 'typescript',
      code: `const logger = pino({
  redact: ['headers.authorization'], // configured for THIS shape...
});

// ...but the actual log call nests headers under "req" instead:
logger.info({
  req: { headers: { authorization: 'Bearer secret-token-abc123' } },
}, 'incoming request');

// Output: NO error, NO warning — the call succeeds completely
// normally. But the redact path 'headers.authorization' does not
// match req.headers.authorization at all, so the output is:
// {"req":{"headers":{"authorization":"Bearer secret-token-abc123"}},"msg":"incoming request", ...}
//
// The authorization token is logged in FULL PLAIN TEXT — the
// redact config is present, looks reasonable on review, and does
// absolutely nothing for this specific log call's actual shape.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s Pino logger is configured with redact: ["req.headers.authorization"], and a security review six months ago confirmed this correctly redacted authorization headers in production logs. Recently, a refactor changed the request-logging middleware to attach headers directly to the log object\'s top level (logger.info({ headers: req.headers, ... })) instead of nesting them under req, to simplify some downstream log-parsing code. No one updated the redact configuration. What is the current state of authorization-header redaction in this codebase, and how would the team most reliably discover the problem?',
    hint: 'Does the redact path "req.headers.authorization" match an object shaped like { headers: {...} } (headers at the top level, no req wrapper)? Would Pino throw any error or warning here, or would the log calls simply succeed as normal?',
    solution: 'Authorization-header redaction is now completely broken for every log call going through the refactored middleware — the configured path "req.headers.authorization" requires a req key wrapping the headers, but the refactored code now logs { headers: req.headers, ... } with headers directly at the top level, a shape that path does not match at all. Every request\'s Authorization header is now being logged in full plain text, and this has been true since the refactor shipped, with zero errors, warnings, or any other signal anywhere in the system indicating the redaction stopped working — the log calls succeed completely normally, they just no longer redact anything for this field. The team would NOT reliably discover this through normal operation, code review of the redact config alone (which still "looks correct" in isolation), or any kind of automated test that doesn\'t specifically check actual log OUTPUT. The most reliable discovery method is exactly the kind of empirical verification this subtopic describes: manually triggering a request through the actual refactored code path and inspecting the real emitted log line\'s content for the literal string "[Redacted]" versus a real Authorization header value — config review alone cannot catch a redact-path mismatch like this.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If a Pino redact path is misconfigured — doesn\'t match the actual shape of the logged object — Pino will throw an error or at least log a warning to alert the developer their sensitive-data protection isn\'t working.',
      reality: 'This subtopic\'s theory and second code example both show the opposite — a non-matching redact path fails completely silently, with the log call succeeding normally and no indication anywhere that the configured protection did nothing for that specific log entry.'
    },
    {
      thought: 'The main page\'s own two code samples (Pino structured logging example vs. the Request Logger Middleware challenge solution) use functionally interchangeable redact paths — "headers.authorization" and "req.headers.authorization" both accomplish the same protection.',
      reality: 'This subtopic\'s first code example shows these are genuinely different, non-interchangeable paths that match different object shapes — one requires headers as a top-level key, the other requires it nested under req, and using the wrong one for a given log call\'s actual structure means that field is never redacted at all.'
    },
    {
      thought: 'Once a redact configuration has been verified correct (e.g., during a security review), it remains reliably correct indefinitely, as long as the redact configuration itself is never edited.',
      reality: 'This subtopic\'s exercise shows the opposite — a redact path can silently stop matching anything the moment the SHAPE of the logged object changes elsewhere in the codebase (a refactor moving or renaming fields), even though the redact configuration itself was never touched, since matching depends on both sides staying in sync.'
    }
  ];
}
