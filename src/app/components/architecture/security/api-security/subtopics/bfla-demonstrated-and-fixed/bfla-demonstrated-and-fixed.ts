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
    heading: 'BOLA Gets Every CodeTab; BFLA Gets None',
    points: [
      'The QnA distinguishes the two precisely: "BOLA... accessing another user\'s SPECIFIC RESOURCE by changing an object ID... BFLA... calling a FUNCTION (endpoint) that requires elevated privileges without having them." Every codeTab and mistake block on the main page demonstrates BOLA (object ownership checks on <code>/api/orders/:id</code>) — none of them shows a BFLA vulnerability or its fix.',
      'This subtopic builds exactly that: an admin-only endpoint with no function-level check at all, and the specific middleware fix — deliberately using the SAME resource-ownership style check pattern the main page already established for BOLA, so the structural difference between the two vulnerability classes is visible side by side.',
    ],
  },
  {
    heading: 'Why Being Authenticated Is Not the Same as Being Authorized for This Function',
    points: [
      'The QnA\'s own authn-vs-authz distinction applies directly here: a regular, legitimately logged-in user has a perfectly valid, correctly-signed JWT — <code>requireAuth</code> passes cleanly, because AUTHENTICATION only asks "who is this caller?" A BFLA vulnerability exists specifically when the code stops there, treating "authenticated" as sufficient permission to call ANY endpoint, rather than separately checking "is THIS caller allowed to call THIS SPECIFIC function?"',
      'This is a different failure from BOLA in exactly the way the QnA states: BOLA is missing a check on WHICH OBJECT a caller can reach; BFLA is missing a check on WHICH FUNCTION a caller can reach at all — the object being fetched (or the absence of any object) is not the issue.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Vulnerable — Authenticated, Not Authorized',
    language: 'typescript',
    code: `// requireAuth confirms the caller has a VALID token -- it says
// nothing about whether they're allowed to call THIS function.
app.get('/api/admin/users', requireAuth, async (req, res) => {
  const users = await db.users.findAll();
  res.json(users);
});

app.delete('/api/admin/users/:id', requireAuth, async (req, res) => {
  await db.users.delete(req.params.id);
  res.json({ message: 'User deleted' });
});

// A REGULAR user, with a perfectly valid JWT (roles: ['user']), calls
// GET /api/admin/users -- requireAuth passes (the token IS valid),
// and the handler runs, returning every user's record to someone who
// was never supposed to reach this function at all.`,
  },
  {
    label: 'Fixed — Function-Level Role Check',
    language: 'typescript',
    code: `// The same requireRole()/requirePermission() style middleware the
// main page's own theory names ("enforce role/permission checks on
// every function") -- applied here specifically to FUNCTION access,
// independent of any object ID at all.
function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

app.get('/api/admin/users', requireAuth, requireRole('admin'), async (req, res) => {
  const users = await db.users.findAll();
  res.json(users);
});

app.delete('/api/admin/users/:id', requireAuth, requireRole('admin'), async (req, res) => {
  await db.users.delete(req.params.id);
  res.json({ message: 'User deleted' });
});

// The SAME regular user now gets 403 before the handler body ever
// runs at all -- requireRole() checks WHICH FUNCTION they're allowed
// to reach, completely independent of any specific object ID, which
// is exactly the distinction that separates this fix from BOLA's
// per-object ownership check.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A regular user calls <code>DELETE /api/admin/users/507</code> — user ID 507 happens to be THEIR OWN account. Using the fixed <code>requireRole(\'admin\')</code> middleware above, does this request succeed, and is that the correct outcome for a BFLA-style check specifically?',
  hint: 'requireRole() never reads <code>req.params.id</code> at all — trace exactly which value it inspects to make its decision.',
  solution: `// The request is REJECTED with 403 -- and this is the correct,
// intended outcome for requireRole(), even though the target ID
// happens to belong to the caller themselves.

// requireRole('admin') checks ONLY req.user.roles -- it never reads
// req.params.id, and has no concept of "is this caller deleting
// THEIR OWN account" at all. This is deliberate: /api/admin/users/:id
// is modeled as an admin-only FUNCTION, not a self-service one -- the
// fact that the target ID happens to match the caller's own ID is
// pure coincidence from this middleware's point of view, and BFLA
// checks are specifically NOT supposed to reason about object identity
// at all (that would make this a BOLA-style check instead).

// If "a user can delete their OWN account, but not others'" were the
// actual intended business rule, that would need a COMPLETELY
// SEPARATE endpoint or check (e.g. a self-service DELETE
// /api/account route with an ownership check, matching the main
// page's own BOLA pattern) -- conflating the two would blur exactly
// the distinction the QnA draws between BOLA and BFLA.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since the main page\'s own BOLA fix already checks <code>order.userId !== req.user.sub</code> on every object request, a similar per-object check would also protect the admin endpoints in this subtopic.',
    reality: 'The vulnerable admin endpoints above have no relevant object to check ownership OF at all — <code>GET /api/admin/users</code> returns EVERY user, not one specific object a caller might or might not own. A BOLA-style ownership check has literally nothing to compare against here; the missing control is a FUNCTION-level gate (can this caller reach this endpoint AT ALL), which is a structurally different check, not a variant of the same one.',
  },
  {
    thought: '<code>requireAuth</code> failing to catch a BFLA vulnerability means <code>requireAuth</code> itself is broken or insufficient.',
    reality: '<code>requireAuth</code> is working exactly as designed in both codeTabs above — it correctly confirms the caller holds a valid, signed token. The QnA\'s own authn-vs-authz distinction is precise: authentication and authorization are two SEPARATE questions, and a BFLA vulnerability exists specifically in the gap BETWEEN them — when a valid answer to "who is this?" gets treated as if it also answered "what are they allowed to call?" without ever actually checking the second question at all.',
  },
];

@Component({
  selector: 'app-sec-api-bfla',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './bfla-demonstrated-and-fixed.html',
  styleUrl: './bfla-demonstrated-and-fixed.scss',
})
export class BflaDemonstratedAndFixedSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
