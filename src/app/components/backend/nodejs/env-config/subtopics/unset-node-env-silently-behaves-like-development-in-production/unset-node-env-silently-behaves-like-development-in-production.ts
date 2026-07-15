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
  templateUrl: './unset-node-env-silently-behaves-like-development-in-production.html',
  styleUrl: './unset-node-env-silently-behaves-like-development-in-production.scss'
})
export class UnsetNodeEnvSilentlyBehavesLikeDevelopmentInProductionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page already says "always set NODE_ENV=production in deployed environments" — the reason this is a MUST, not just a best practice, deserves its own explanation',
      points: [
        'NODE_ENV is not a Node.js runtime feature at all — Node.js itself never sets any default value for it. It is purely a community convention that Express and countless other libraries have adopted, meaning if nothing in your deployment pipeline explicitly sets it, process.env.NODE_ENV is genuinely undefined, not "development" as a fallback.',
        'Express\'s own documentation states plainly that setting NODE_ENV to "production" makes Express cache view templates and generate less verbose error messages — the natural, undocumented-but-logical inverse is that anything OTHER than the literal string "production" (including undefined) leaves those production optimizations off.',
      ]
    },
    {
      heading: 'Why forgetting to set it produces silent, not loud, failure',
      points: [
        'Since JavaScript\'s strict inequality means undefined !== \'production\' evaluates to true, any library checking process.env.NODE_ENV !== \'production\' to decide whether to enable development-mode behavior treats a completely UNSET NODE_ENV exactly the same as an explicitly-set NODE_ENV=development — there is no third "unset, please warn me" branch anywhere in this check. The app starts successfully, serves requests successfully, and shows no error of any kind.',
        'The consequences are two well-documented, real production concerns rather than a hypothetical: Express\'s own docs cite disabled view caching as able to reduce performance "by a factor of three," and the more verbose, uncached error-handling behavior can expose internal stack traces and implementation details directly to real users hitting a production error — both silently in effect the entire time NODE_ENV was never explicitly set, with nothing in the deployment pipeline ever surfacing that fact.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The bug — a deployment pipeline that never sets NODE_ENV',
      language: 'typescript',
      code: `// Dockerfile — BUG: no ENV NODE_ENV=production line anywhere
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --production
CMD ["node", "server.js"]

// server.js
import express from 'express';
const app = express();

app.get('/error-demo', (req, res) => {
  throw new Error('Something failed internally');
});

// With NODE_ENV never set (undefined), Express's default error
// handler shows the FULL error, including the stack trace, in the
// HTTP response — the exact same verbose behavior a developer
// would want to see locally, now visible to every real user who
// happens to trigger this error in production. No crash, no
// warning — the app runs and serves requests completely normally
// otherwise, which is exactly why this goes unnoticed.
app.listen(3000);`,
    },
    {
      label: 'The fix — explicitly set it, and verify it at startup',
      language: 'typescript',
      code: `// Dockerfile — explicit, unambiguous
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --production
ENV NODE_ENV=production
CMD ["node", "server.js"]

// Belt-and-suspenders: fail loudly if it's STILL not set correctly,
// rather than trusting the deployment config alone
if (process.env.NODE_ENV !== 'production' && process.env.STRICT_PROD_CHECK === 'true') {
  console.error('❌ NODE_ENV is not "production" in a production deploy — refusing to start.');
  process.exit(1);
}

// This turns a silent, undetected misconfiguration into an
// immediate, loud startup failure — the same "fail fast" principle
// the main page already applies to missing DATABASE_URL, just
// extended to NODE_ENV itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team deploys a Node.js/Express app to production. The app runs successfully, serves traffic normally, and passes all health checks for months. During a security audit, a tester triggers an unhandled error on a production endpoint and discovers the full stack trace, including internal file paths and a database connection string fragment, returned directly in the HTTP response. The team is confused: "we never configured verbose error output — where is this coming from?" Explain the likely root cause, given that nothing was ever explicitly misconfigured.',
    hint: 'Does Express require NODE_ENV to be explicitly set to something in order to decide its error-verbosity behavior, or does it have a fallback that only activates when NODE_ENV is a SPECIFIC value? What happens when NODE_ENV was simply never set at all?',
    solution: 'The team never explicitly configured verbose error output — but they also never explicitly configured NODE_ENV=production, and those are not the same thing as "doing nothing." Express decides whether to show verbose error output based on whether process.env.NODE_ENV is exactly the string "production" — anything else, including an entirely unset (undefined) NODE_ENV, falls through to the SAME development-mode behavior Express uses locally, which includes detailed error responses with stack traces. Since Node.js itself never sets any default for NODE_ENV, if the deployment pipeline (Dockerfile, platform config, CI/CD script) never explicitly sets it, the app runs with development-mode error handling in production indefinitely, with no error, warning, or failed health check to reveal the misconfiguration — health checks only verify the app is UP and responding, not which mode it\'s running in. The fix is explicitly setting ENV NODE_ENV=production wherever the deployment is configured, and ideally adding an explicit startup check that fails loudly if NODE_ENV isn\'t the expected value in a production context, rather than relying on every deployment surface remembering to set it correctly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Node.js automatically defaults NODE_ENV to "development" if nothing else sets it, similar to how many config systems have a documented fallback value.',
      reality: 'This subtopic\'s theory clarifies Node.js sets no default for NODE_ENV at all — it is purely a community convention, so an unset NODE_ENV is genuinely undefined, not a fallback string "development" that some runtime mechanism assigns.'
    },
    {
      thought: 'If verbose, stack-trace-containing error responses appear in production, this must mean someone explicitly configured a debug or development mode setting somewhere in the deployment.',
      reality: 'This subtopic\'s exercise shows the opposite can be true — this exact symptom can occur from an OMISSION (never setting NODE_ENV=production) rather than an explicit misconfiguration, since undefined and "development" are treated identically by Express\'s own inequality check.'
    },
    {
      thought: 'Passing health checks and running without crashing for months is strong evidence that a deployment\'s NODE_ENV and other environment configuration are set correctly.',
      reality: 'This subtopic\'s theory shows health checks only confirm the process is up and responding — they have no awareness of which mode (development vs. production) the app is actually running in, so a missing NODE_ENV can go completely undetected for an arbitrarily long time.'
    }
  ];
}
