import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  selector: 'app-devdeps-vs-deps-subtopic',
  standalone: true,
  imports: [
    RouterLink, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent,
    SubtopicEyebrowComponent,
  ],
  templateUrl: './devdependencies-vs-dependencies-affects-production-install-size.html',
  styleUrl: './devdependencies-vs-dependencies-affects-production-install-size.scss',
})
export class DevDependenciesVsDependenciesAffectsProductionInstallSizeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The Main Page\'s Mistake #3, Explained Through What npm ci Actually Installs',
      points: [
        'The main page states: putting build tools in <code>dependencies</code> "Adds to dependencies — deployed to production, increases install size." Its fix moves them to <code>devDependencies</code> with the explanation: "only installed in dev, excluded from prod deploys." This subtopic explains the MECHANISM that makes this true — the specific npm install flag that actually skips devDependencies in a production environment, and what silently breaks if the classification is wrong.',
        'This distinction is invisible during local development, where <code>npm install</code> (with no flags) installs BOTH <code>dependencies</code> and <code>devDependencies</code> — the bug only surfaces in a production or CI environment specifically configured to skip dev tooling, which is exactly why it\'s easy to misclassify a package without ever noticing locally.',
      ],
    },
    {
      heading: 'The Flag That Makes the Split Matter: --omit=dev / --production',
      points: [
        'Production deployment pipelines typically run <code>npm ci --omit=dev</code> (or the older <code>npm install --production</code>) specifically to skip everything listed under <code>devDependencies</code> — this is the actual mechanism that turns "which section of package.json a package is listed in" into a real difference in what gets installed on a production server.',
        'If a package your RUNTIME code genuinely needs (e.g. a logging library actually imported and called in production) is mistakenly placed under <code>devDependencies</code>, a production install using <code>--omit=dev</code> will not install it at all — the app crashes on startup with a "Cannot find module" error, in an environment where it worked perfectly fine locally (since local <code>npm install</code> installed it anyway, alongside devDependencies).',
        'The reverse mistake — a build tool like TypeScript or a linter under <code>dependencies</code> — doesn\'t crash anything; it just means production installs waste time and disk space installing something that will never actually run, which is the exact issue the main page\'s mistake highlights.',
      ],
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The Silent Local vs. Production Divergence',
      language: 'typescript',
      code: `// package.json — a logging library mistakenly in devDependencies
{
  "dependencies": {
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "pino": "^8.0.0"   // ⚠️ this is a RUNTIME logger, actually used in production code!
  }
}

// server.js — genuinely imported and called at runtime
import pino from 'pino';
const logger = pino();
logger.info('Server starting...');

// Locally: "npm install" (no flags) installs BOTH sections.
// pino is present, the app runs fine, nobody notices the misclassification.

// In production CI/CD:
// $ npm ci --omit=dev
// devDependencies (typescript, eslint, AND pino) are all skipped entirely.
// $ node server.js
// Error: Cannot find module 'pino'
// -- crashes on startup, in an environment that worked perfectly locally.`,
    },
    {
      label: 'The Fix — Classify by "Does Production Code Actually Need This?"',
      language: 'typescript',
      code: `// package.json — corrected
{
  "dependencies": {
    "express": "^4.18.0",
    "pino": "^8.0.0"        // moved here -- genuinely used at runtime
  },
  "devDependencies": {
    "typescript": "^5.0.0", // only needed to COMPILE the code
    "eslint": "^8.0.0"      // only needed to LINT the code
  }
}

// Now "npm ci --omit=dev" correctly installs express AND pino
// (both genuinely needed to run the server), while still skipping
// typescript and eslint (neither is imported or called by server.js
// at runtime -- they only matter during the BUILD step, which
// typically already happened before this production install runs).

// ── The one-question test for classifying any package ────────────────
// "Does the code that actually RUNS in production import or call this
// package directly?" -- Yes → dependencies. No (build/lint/test only)
// → devDependencies.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Locally, running plain <code>npm install</code> with <code>pino</code> misclassified under <code>devDependencies</code> works fine, and the server starts without any error. Does that prove the classification is correct?',
    hint: 'Ask exactly which npm command a production deploy pipeline actually runs, and whether that command behaves identically to a plain, unflagged local "npm install".',
    solution: `No -- a working local "npm install" proves nothing about whether the
classification is correct, because plain "npm install" (no flags)
installs BOTH dependencies and devDependencies unconditionally. Since
pino ends up installed locally either way, the app runs fine and the
misclassification is completely invisible during local development.

The bug only surfaces when a DIFFERENT command runs -- specifically
"npm ci --omit=dev" (or the older "npm install --production"), which
production deploy pipelines and CI/CD systems typically use precisely
BECAUSE it's supposed to skip build-only tooling and keep the
production install lean. That flag is what actually turns "which
JSON key pino is nested under" into a real difference in what files
end up on disk.

Once that flag is used, devDependencies (typescript, eslint, AND the
misplaced pino) are all skipped -- pino genuinely never gets
installed, and the very first "import pino from 'pino'" line in
server.js throws "Cannot find module 'pino'" the moment the app tries
to start.

The lesson: the correct classification test isn't "does this work
when I run plain npm install locally" -- it's "does the code that
actually runs in PRODUCTION import or call this package," since only
a flagged, production-style install (--omit=dev) actually enforces
the dependencies/devDependencies distinction at all.`,
  };

  misconceptions: Misconception[] = [
    {
      thought: 'if a package works fine when running plain "npm install" locally and the app starts without any errors, that confirms it\'s correctly classified between dependencies and devDependencies.',
      reality: 'plain "npm install" with no flags installs BOTH dependencies and devDependencies unconditionally — a misclassified package still gets installed locally either way, so a working local install proves nothing about whether the classification is actually correct.',
    },
    {
      thought: 'the dependencies vs devDependencies distinction is purely organizational — a way to keep package.json tidy and communicate intent — with no actual functional difference in what gets installed.',
      reality: 'production deploy pipelines commonly run "npm ci --omit=dev" specifically to skip everything under devDependencies — this is a real, functional command flag that determines what files physically end up installed on a production server, not just a documentation convention.',
    },
    {
      thought: 'misclassifying a build tool (like TypeScript or a linter) into dependencies instead of devDependencies is a relatively harmless mistake — it might waste some disk space, but at least it can\'t break anything at runtime the way misclassifying a runtime package would.',
      reality: 'this direction of mistake is comparatively low-risk (it wastes install time/disk space rather than crashing anything) but it is still a real classification error — the more dangerous direction is a genuinely runtime-required package accidentally placed under devDependencies, which causes a hard production crash with --omit=dev, exactly as the main page\'s mistake demonstrates.',
    },
  ];
}
