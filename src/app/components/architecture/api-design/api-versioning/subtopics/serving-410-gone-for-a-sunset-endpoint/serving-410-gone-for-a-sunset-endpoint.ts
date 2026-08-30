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
    heading: 'Named in TWO Separate QnAs — Never Actually Built',
    points: [
      'The main page’s own deprecation-process QnA states it directly: "Sunset — after the sunset date, return 410 Gone (not 404) for removed endpoints." A SEPARATE, dedicated QnA explains WHY: a 410 with an explanatory body gives a developer "an immediately actionable, human-readable signal," while a plain 404 or connection failure "forces the developer to guess." Neither QnA’s guidance is ever shown as an actual Express route anywhere on the page.',
      'The main page’s own "URL Versioning" codeTab shows the BEFORE-sunset state (a working v1 route with Sunset/Deprecation headers) — this subtopic builds the AFTER-sunset state the QnA describes: what v1 actually serves once its sunset date has passed.',
      'The distinction from a plain 404 matters mechanically, not just rhetorically: 404 means "no resource matches this identifier" (could be a typo, could be a resource that was deleted) — 410 means "this specific, well-known resource EXISTED and was DELIBERATELY removed," a categorically different signal a well-behaved client or monitoring tool can act on differently.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Route, After Its Own Sunset Date',
    language: 'typescript',
    code: `const V1_SUNSET_DATE = new Date('2026-01-01T00:00:00Z');

function isPastSunset(): boolean {
  return Date.now() >= V1_SUNSET_DATE.getTime();
}

// Registered on the v1 router -- runs BEFORE any of v1's real route
// handlers (per the middleware-ordering lesson from the previous
// subtopic: this needs to be registered first to actually run).
v1.use((req, res, next) => {
  if (!isPastSunset()) return next(); // still within the grace period

  res.status(410).json({
    type: 'https://api.example.com/errors/version-retired',
    title: 'API Version Retired',
    status: 410,
    detail: \`API v1 was retired on \${V1_SUNSET_DATE.toISOString()}. \` +
            'This endpoint no longer serves requests.',
    migrationGuide: 'https://docs.example.com/migration/v1-to-v2',
  });
  // Deliberately NOT calling next() -- the response is complete.
});

// Every v1 route handler below this point is now UNREACHABLE once
// the sunset date passes -- the middleware above intercepts and
// responds first. The handlers themselves never needed to change at
// all; retiring v1 required zero edits to this file below the
// middleware.
v1.get('/users', async (req, res) => {
  const users = await db.users.findMany({ select: { id: true, name: true, email: true } });
  res.json(users);
});`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate suggests simplifying this by deleting the v1 router entirely once the sunset date passes, rather than keeping it around with this intercepting middleware. What does the QnA’s own reasoning say is lost by doing that, and does the codeTab above actually need the underlying route handlers to still exist at all?',
  hint: 'Trace what a request to a genuinely DELETED route (no matching handler anywhere) actually returns, versus what the codeTab’s own middleware returns — and notice that the middleware never calls <code>next()</code> once sunset has passed.',
  solution: `// If the v1 router were deleted entirely, requests to it would fall
// through to whatever generic 404 handler (or none at all) the app
// has configured -- exactly the "ambiguous 404 or connection
// failure" outcome the dedicated 410-Gone QnA specifically argues
// against. The developer debugging a broken integration would have
// no way to distinguish "this was a real, intentionally-retired
// endpoint" from "this URL never existed" or "I have a typo."

// And notice the codeTab's own middleware never calls next() once
// isPastSunset() is true -- meaning the actual v1 route handlers
// BELOW it (like the /users handler) are now completely
// UNREACHABLE, even though they still exist in the file. This means
// the teammate's proposed simplification isn't actually necessary
// for CORRECTNESS -- the old handlers are already inert dead code in
// practice, intercepted before they'd ever run. The only reason to
// keep them physically in the file at all is that DELETING them
// would also delete the informative 410 response's context (the
// migration guide, the retirement date) unless that's moved
// somewhere else -- keeping the file as-is is simply the path of
// least effort, not a functional requirement.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A 410 Gone response and a 404 Not Found response mean essentially the same thing — "you can’t have this."',
    reality: '404 means the server has no information about whether a resource at this identifier ever existed — it could be a typo, or a resource ID that never existed at all. 410 means the server KNOWS this specific, well-known resource existed and was DELIBERATELY, permanently removed — a categorically stronger, more specific signal that tells a client "stop retrying, this is not coming back."',
  },
  {
    thought: 'Once an API version passes its sunset date, its route handlers should be deleted from the codebase immediately.',
    reality: 'The codeTab above shows the SAFER approach: an intercepting middleware registered before the old routes makes them unreachable without deleting anything, and the retirement date/migration guide from the 410 response provides real value to slow-to-update clients that keeping the code around costs almost nothing to preserve — matching the dedicated 410-Gone QnA’s own reasoning about the value of an informative response over a hard removal.',
  },
  {
    thought: 'The 410 middleware needs to run AFTER the real route handlers to check whether they succeeded first.',
    reality: 'It needs to run BEFORE them, and specifically needs to NOT call <code>next()</code> once the sunset date has passed — this is a direct application of the previous subtopic’s middleware-ordering lesson: a middleware that terminates the response must be registered ahead of anything it is meant to intercept, or the routes behind it will still run.',
  },
];

@Component({
  selector: 'app-api-versioning-410-gone',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './serving-410-gone-for-a-sunset-endpoint.html',
  styleUrl: './serving-410-gone-for-a-sunset-endpoint.scss',
})
export class Serving410GoneForASunsetEndpointSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
