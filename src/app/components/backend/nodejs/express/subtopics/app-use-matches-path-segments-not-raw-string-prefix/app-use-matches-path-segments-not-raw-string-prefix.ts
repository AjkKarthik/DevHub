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
  templateUrl: './app-use-matches-path-segments-not-raw-string-prefix.html',
  styleUrl: './app-use-matches-path-segments-not-raw-string-prefix.scss'
})
export class AppUseMatchesPathSegmentsNotRawStringPrefixSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes app.use("/api", middleware) as matching "a path prefix" — worth being precise about what "prefix" actually means here, since it isn\'t raw string matching',
      points: [
        'Express\'s routing is built on the path-to-regexp library, which compiles a path pattern like "/api" into a regular expression requiring the character immediately AFTER the matched segment to be either a path separator (/) or the end of the string. This means "/api" as a mount path is NOT the same as a naive JavaScript string.startsWith("/api") check — it specifically matches path SEGMENT boundaries, not arbitrary substrings.',
        'The practical consequence: app.use("/api", middleware) correctly matches requests to /api, /api/users, and /api/users/123 — but genuinely does NOT match /apiv2, /apikey, or /apiary, even though all three of those path strings technically start with the literal characters "/api" as a plain string comparison would see it.',
      ]
    },
    {
      heading: 'Why this matters beyond just being a curiosity about routing internals',
      points: [
        'This segment-boundary behavior is what makes mount-path-based middleware scoping SAFE to rely on without extra defensive checks — a developer scoping auth middleware to app.use("/admin", authCheck) doesn\'t need to separately worry about an unrelated public route at /admin-status or /administration accidentally triggering that auth check, since Express\'s own path matching already excludes those by segment-boundary design.',
        'This is specifically a path-to-regexp implementation detail (Express 4 bundles an older version of that library) rather than something spelled out explicitly in Express\'s own high-level routing guide — worth verifying directly against the actual matching behavior rather than assuming from the informal "prefix matching" description alone, especially since path-to-regexp\'s exact matching rules have changed across its own major versions (Express 5 uses a newer path-to-regexp with some different edge-case behaviors).',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Segment-boundary matching — /apiv2 never accidentally matches /api',
      language: 'typescript',
      code: `const app = express();

app.use('/api', (req, res, next) => {
  console.log('API middleware ran for:', req.path);
  next();
});

// Matches — segment boundary after "/api" is "/" or end-of-string:
//   GET /api          -> middleware runs
//   GET /api/users     -> middleware runs
//   GET /api/users/123 -> middleware runs

// Does NOT match — the character after "/api" is neither "/" nor
// end-of-string, so path-to-regexp's compiled pattern rejects these:
//   GET /apiv2         -> middleware does NOT run
//   GET /apikey         -> middleware does NOT run
//   GET /apiary          -> middleware does NOT run

app.get('/apiv2/status', (req, res) => {
  // This route is completely UNAFFECTED by the /api middleware
  // above, despite the string "/apiv2" starting with "/api" —
  // Express's segment-aware matching correctly keeps them separate.
  res.json({ status: 'v2 ok' });
});`,
    },
    {
      label: 'Why this makes mount-path-scoped middleware safe by default',
      language: 'typescript',
      code: `const app = express();

// Scoping auth checks to /admin is genuinely safe from accidental
// false-positive matches on similarly-named but unrelated paths —
// no extra defensive check needed for this specific concern.
app.use('/admin', requireAuth);

app.get('/admin/dashboard', (req, res) => { /* protected */ });
app.get('/admin-status', (req, res) => {
  // NOT protected by the /admin middleware above — segment-boundary
  // matching correctly treats "/admin-status" as unrelated to the
  // "/admin" mount path, even though it starts with those characters.
  res.json({ ok: true });
});
app.get('/administration', (req, res) => {
  // Also NOT protected — same reasoning, different unrelated path.
  res.json({ info: 'public' });
});`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer scopes authentication middleware with app.use(\'/admin\', requireAuth) to protect everything under the admin section of their API. A security reviewer asks: "does this also accidentally protect (or fail to protect) an unrelated public endpoint at /admin-status, since that path literally starts with the string \'/admin\'?" Using what you know about how Express actually matches mount paths, answer the reviewer\'s question precisely.',
    hint: 'Does Express\'s app.use() path matching work like a plain JavaScript string.startsWith() check, or does it specifically require the character immediately after the matched segment to be a path separator or end-of-string?',
    solution: '/admin-status is NOT matched by app.use(\'/admin\', requireAuth), so the reviewer\'s concern doesn\'t apply here — but understanding precisely WHY matters. Express\'s routing (via the path-to-regexp library it\'s built on) compiles the mount path "/admin" into a pattern requiring the character immediately after the matched segment to be either a path separator (/) or the end of the string — not a naive substring/prefix check. Since the character immediately after "/admin" in the path "/admin-status" is a hyphen (-), which is neither a slash nor end-of-string, the compiled pattern correctly rejects this as a match, despite the plain string "/admin-status" technically starting with the characters "/admin". This segment-boundary behavior is exactly what makes mount-path-scoped middleware safe to rely on without additional defensive checks — a developer scoping requireAuth to "/admin" doesn\'t need to separately verify that unrelated, similarly-prefixed public routes are excluded, since Express\'s own path matching already handles that correctly by design.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'app.use(\'/api\', middleware) matches any request path that starts with the literal string "/api", the same way a plain JavaScript path.startsWith(\'/api\') check would.',
      reality: 'This subtopic\'s theory clarifies Express\'s actual matching (via path-to-regexp) requires the character immediately after the matched segment to be a path separator or end-of-string — a genuinely different, segment-aware rule than raw substring/prefix matching.'
    },
    {
      thought: 'To safely scope middleware to a specific path prefix without accidentally affecting similarly-named but unrelated routes, a developer needs to add extra defensive path-checking logic beyond just the mount path string itself.',
      reality: 'This subtopic\'s exercise shows Express\'s own segment-boundary matching already provides this safety by design — a route like /admin-status is correctly excluded from app.use(\'/admin\', ...) with no additional defensive code needed at all.'
    },
    {
      thought: 'Express\'s path-matching behavior for app.use() is officially documented in detail in Express\'s own high-level routing guide, spelling out the segment-boundary rule explicitly.',
      reality: 'This subtopic\'s theory notes this specific matching precision is actually a path-to-regexp implementation detail (the underlying library Express is built on) rather than something Express\'s own informal "prefix matching" documentation spells out explicitly — worth verifying against the actual behavior rather than assuming from the high-level description alone.'
    }
  ];
}
