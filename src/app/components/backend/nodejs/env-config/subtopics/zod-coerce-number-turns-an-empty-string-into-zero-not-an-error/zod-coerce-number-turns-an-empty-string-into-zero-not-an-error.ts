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
  templateUrl: './zod-coerce-number-turns-an-empty-string-into-zero-not-an-error.html',
  styleUrl: './zod-coerce-number-turns-an-empty-string-into-zero-not-an-error.scss'
})
export class ZodCoerceNumberTurnsAnEmptyStringIntoZeroNotAnErrorSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows z.coerce.number() as the fix for "PORT is always a string" — worth knowing exactly what happens on the input a deployment platform sometimes actually produces: an empty string',
      points: [
        'z.coerce.number() works by internally calling JavaScript\'s Number() function on whatever value it receives. This is exactly what makes it convert the string "3000" into the number 3000 — but Number("") (an empty string) evaluates to 0 in JavaScript, not NaN and not an error. This is a genuine, well-known JavaScript quirk, not a Zod-specific bug — Number("") being 0 is standard, specified JavaScript behavior.',
        'This matters specifically because some deployment platforms and orchestration tools can produce a REAL, technically-set environment variable whose value is an empty string — distinct from the variable being entirely absent. A blank field in a platform\'s environment-variable UI, or a templated deployment config that substitutes an empty value for an unset placeholder, can result in process.env.PORT === "" rather than process.env.PORT === undefined.',
      ]
    },
    {
      heading: 'Why the actual failure mode depends entirely on whether OTHER constraints are chained after coerce',
      points: [
        'A bare z.coerce.number() with no further constraints SILENTLY ACCEPTS an empty-string input as valid, producing the number 0 — no error, no warning, validation passes. If your schema has additional constraints like .min(1024) (a realistic port range check), an empty string DOES get rejected, but only because 0 happens to fail that specific downstream constraint, not because Zod detected "this was empty" as its own distinct failure category.',
        'This means the exact reliability of catching this class of misconfiguration depends entirely on how tightly each individual field\'s schema is constrained — a schema author who adds .min(1024) to PORT gets accidental protection against this specific case, while a schema author who writes a bare z.coerce.number() for some OTHER numeric field (a retry count, a timeout value in ms, a batch size) gets silent acceptance of an accidentally-blank env var as if it correctly meant "zero."',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A bare z.coerce.number() silently accepts an empty string as 0',
      language: 'typescript',
      code: `import { z } from 'zod';

const envSchema = z.object({
  // BUG: no .min()/.max() constraint — an accidentally blank
  // MAX_RETRIES env var (process.env.MAX_RETRIES === "") passes
  // validation completely silently, coerced to the number 0.
  MAX_RETRIES: z.coerce.number(),
});

const result = envSchema.safeParse({ MAX_RETRIES: '' });
console.log(result.success);       // true — validation PASSED
console.log(result.data.MAX_RETRIES); // 0 — silently, not an error

// If MAX_RETRIES=0 was never intended as a real, meaningful config
// value (e.g. retry logic that treats 0 as "disabled" when the
// developer actually wanted a sensible positive default), this
// silently changes real application behavior with zero warning
// anywhere in the validation layer.`,
    },
    {
      label: 'The fix — a tight constraint (or explicit non-empty check) catches it',
      language: 'typescript',
      code: `import { z } from 'zod';

const envSchema = z.object({
  // Option 1: a realistic constraint incidentally catches this,
  // since 0 fails .min(1) for a retry count that should be at
  // least 1.
  MAX_RETRIES: z.coerce.number().min(1).default(3),

  // Option 2: explicit, deliberate protection against blank
  // strings specifically, independent of what range is valid —
  // reject empty input BEFORE coercion even runs.
  PORT: z.string().min(1, 'PORT must not be empty')
    .pipe(z.coerce.number().min(1024).max(65535)),
});

// Option 2 is the more robust pattern for any numeric env var
// where "silently defaults to 0" would be a real bug, not just
// for values with a naturally restrictive valid range.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s env schema includes BATCH_SIZE: z.coerce.number() (no additional constraints, since any non-negative batch size seemed technically "valid" to them) for a background job processor. After a deployment platform migration, a job silently stops processing any records at all, with no validation error and no crash — the app starts up successfully every time. Investigation eventually reveals process.env.BATCH_SIZE is set to an empty string on the new platform (a blank field left over from a config template), rather than being unset or containing a real number. Explain why Zod\'s own validation never caught this, and how the schema should have been written to catch it.',
    hint: 'Does z.coerce.number() distinguish between "this value was never set" and "this value is a real string that happens to be empty"? What does Number("") actually evaluate to in JavaScript, and does a bare z.coerce.number() with no further constraints reject that result?',
    solution: 'Zod\'s validation never caught this because z.coerce.number() internally calls JavaScript\'s Number() function, and Number("") evaluates to 0 — not NaN, not an error. Since the schema had no additional constraint like .min(1) chained after coerce, a coerced value of 0 is a perfectly valid number as far as the schema is concerned, so validation passes silently with BATCH_SIZE set to 0. The job processor then genuinely, correctly processes batches of size 0 forever — which looks exactly like "not processing anything," but isn\'t a crash or an error, it\'s the application doing precisely what a batch size of 0 means. The schema should have been written with an explicit lower-bound constraint appropriate to what BATCH_SIZE actually needs to be (z.coerce.number().min(1)), which would have correctly rejected the coerced 0 value and surfaced a clear validation error at startup — turning a silent, hours-long production incident into an immediate, loud deploy-time failure, consistent with the main page\'s own "fail fast" principle.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'z.coerce.number() treats an empty-string environment variable value the same as a missing/unset one — both should fail validation as "not a valid number."',
      reality: 'This subtopic\'s theory clarifies these are genuinely different inputs to Zod\'s coercion — a missing key produces undefined (which a required field DOES reject), while an empty string is coerced via JavaScript\'s Number(""), which evaluates to 0, a technically valid number that a bare z.coerce.number() happily accepts.'
    },
    {
      thought: 'If a Zod schema uses z.coerce.number() for a field, that alone guarantees any malformed or accidentally-blank environment variable value will be caught and rejected at startup.',
      reality: 'This subtopic\'s exercise shows this guarantee only holds if the schema ALSO includes a constraint (like .min()) that the coerced result of an empty string (0) would actually fail — a bare, unconstrained z.coerce.number() provides no such protection on its own.'
    },
    {
      thought: 'This coercion quirk is a bug specific to the Zod library that a different validation library would not have.',
      reality: 'This subtopic\'s theory shows the root cause is standard, specified JavaScript behavior (Number("") === 0), not a Zod-specific defect — any validation approach relying on JavaScript\'s native Number() coercion under the hood would exhibit the same behavior unless it explicitly guards against empty-string input first.'
    }
  ];
}
