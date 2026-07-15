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
  templateUrl: './dotenv-config-never-throws-on-a-missing-env-file.html',
  styleUrl: './dotenv-config-never-throws-on-a-missing-env-file.scss'
})
export class DotenvConfigNeverThrowsOnAMissingEnvFileSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows import \'dotenv/config\' as the standard way to load a .env file — worth knowing exactly what happens when that file isn\'t actually there',
      points: [
        'dotenv\'s config() function, when the .env file doesn\'t exist at the expected path, does NOT throw an exception and does NOT exit the process — it returns an object with an error property (an ENOENT-style error) instead of throwing, following the documented, deliberate return-value-over-exception pattern: const result = dotenv.config(); if (result.error) { /* handle it */ }.',
        'The shorthand import \'dotenv/config\' used throughout the main page\'s own code samples is a side-effect-only import — it calls config() internally but gives the calling code no way to access the returned result at all. If the .env file is missing when using this shorthand, there is structurally no way to check for that failure from the importing file, even if you wanted to.',
      ]
    },
    {
      heading: 'Why this quietly undermines the "fail fast" principle the rest of the main page emphasizes so heavily',
      points: [
        'A missing .env file (a wrong working directory when the process starts, a deployment step that failed to copy it, a typo in the file path passed to dotenv.config({ path: ... })) produces ZERO visible symptoms at the exact point of failure. process.env simply remains unchanged from whatever it already was — the app continues starting up as if dotenv had never been called at all.',
        'Whether this silent gap actually gets caught downstream depends ENTIRELY on whether separate, explicit env-var validation (the Zod schema pattern the main page itself recommends) exists and runs afterward — if that validation exists and correctly requires the variables the missing .env file would have provided, the app still fails, just later and with a less specific error message ("DATABASE_URL is required" rather than "the .env file could not be found"). If NO such validation exists, the app can start "successfully" with all the wrong (or completely absent) configuration and fail in confusing, delayed ways instead.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The silent gap — a missing .env produces no visible error',
      language: 'typescript',
      code: `// server.js — using the shorthand from the main page's own examples
import 'dotenv/config'; // if .env is missing, THIS LINE gives no
                          // way to detect it — no thrown error, no
                          // accessible return value at all
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
});

// If .env was missing, process.env.DATABASE_URL is whatever it
// already was BEFORE this file ran — likely undefined, in which
// case THIS validation step is what actually catches the problem,
// not dotenv itself. dotenv silently did nothing.
const result = envSchema.safeParse(process.env);
if (!result.success) {
  console.error(result.error.format());
  process.exit(1);
}
// Without a validation step like this after it, a missing .env
// file produces NO error anywhere — the app just starts with
// whatever (possibly empty) config happened to already be present.`,
    },
    {
      label: 'The fix — check dotenv\'s own result explicitly for a precise error',
      language: 'typescript',
      code: `// server.js — checking dotenv's return value directly
import dotenv from 'dotenv';

const result = dotenv.config();

if (result.error) {
  // This distinguishes "the .env file itself is missing/unreadable"
  // from "the file loaded fine, but a specific required variable
  // wasn't in it" — a more precise, faster diagnosis than waiting
  // for downstream Zod validation to fail with a generic message.
  console.error('❌ Failed to load .env file:', result.error.message);
  process.exit(1);
}

console.log(\`✅ Loaded \${Object.keys(result.parsed ?? {}).length} variables from .env\`);

// Still layer Zod validation AFTER this — dotenv only confirms the
// FILE loaded; it says nothing about whether the specific variables
// your app actually needs were present inside it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI/CD pipeline change accidentally stops copying the .env file into the deployment artifact. The application still uses import \'dotenv/config\' at the top of its entry file, exactly matching the main page\'s own code sample, but has NO separate Zod (or any other) validation step afterward — the team assumed dotenv itself would fail loudly if something went wrong with loading configuration. Instead, the app starts successfully and appears to run normally in early smoke tests, only failing hours later with confusing, seemingly-unrelated database connection errors deep in production traffic. Explain precisely why dotenv itself never surfaced this problem.',
    hint: 'Does import \'dotenv/config\' give the calling code ANY way to inspect whether the underlying config() call succeeded or failed? What does dotenv actually DO when the target .env file simply doesn\'t exist — does it throw, exit, or something else entirely?',
    solution: 'dotenv\'s config() function is deliberately designed to return a result object (with an error property on failure) rather than throw an exception when the .env file is missing — and the import \'dotenv/config\' shorthand used here is a side-effect-only import that discards that return value entirely, making it structurally impossible to check for the failure from the importing file even if the team had wanted to. When the .env file went missing from the CI/CD artifact, dotenv silently did nothing: no exception, no process exit, no console output of any kind — process.env simply remained whatever it already was (in this case, missing the database configuration that .env would have provided) and the application continued starting up completely normally. Since there was no separate validation step (Zod or otherwise) checking that required variables were actually present, nothing in the startup sequence ever detected the gap — the app appeared healthy until code paths that actually needed the missing DATABASE_URL executed under real traffic, surfacing as confusing runtime errors far removed from the actual root cause. The fix is either switching from the side-effect-only import to explicitly checking dotenv\'s own returned error (giving an immediate, precise "the .env file itself failed to load" diagnosis), or — more robustly — always pairing dotenv\'s file-loading step with separate, mandatory Zod validation of the resulting process.env, which the main page already recommends but which this specific deployment omitted.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If dotenv.config() (or the import \'dotenv/config\' shorthand) can\'t find the .env file it\'s looking for, it throws an error or crashes the process, alerting you immediately to the problem.',
      reality: 'This subtopic\'s theory clarifies dotenv deliberately does neither — it returns a result object with an error property instead of throwing, and the commonly-used side-effect-only import shorthand discards that return value entirely, making the failure completely invisible by default.'
    },
    {
      thought: 'Since the main page recommends both dotenv for loading and Zod for validation, using dotenv correctly is sufficient on its own to catch a missing-.env-file deployment mistake.',
      reality: 'This subtopic\'s exercise shows dotenv alone provides no such protection — catching a missing .env file specifically requires EITHER explicitly checking dotenv\'s own returned error, OR relying on a separate downstream validation step (like the Zod schema pattern) to eventually notice the resulting missing variables.'
    },
    {
      thought: 'An application starting up successfully and passing initial smoke tests is reasonably strong evidence that its environment configuration, including whether a .env file was loaded, is correct.',
      reality: 'This subtopic\'s theory shows a missing .env file produces literally no startup-time symptom on its own — successful startup and passing smoke tests say nothing about whether config was actually loaded, only that whatever config (or lack of it) happened to be present didn\'t immediately crash anything.'
    }
  ];
}
