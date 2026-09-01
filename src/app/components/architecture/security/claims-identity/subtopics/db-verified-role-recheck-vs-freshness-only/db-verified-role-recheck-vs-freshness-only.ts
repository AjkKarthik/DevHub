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
    heading: 'A Named Alternative the Main Page Never Builds',
    points: [
      'The main page\'s own "Not re-verifying identity for sensitive operations" mistake fix checks FRESHNESS — <code>requireRecentAuth(5 * 60)</code>, based on <code>iat</code> (issued-at). The QnA lists a SEPARATE strategy for a different problem (mid-session role changes): "database check on sensitive operations: for critical operations, verify current role from DB rather than trusting the token claim." Freshness and a DB-verified role check solve two DIFFERENT problems, and only the first ever appears in code.',
      'This subtopic builds the second — a check that queries the CURRENT role from the database at the moment of a destructive action, specifically for the case the QnA names: "user is demoted from admin" mid-session, where the token itself still, technically, carries the old (now-stale) role claim.',
    ],
  },
  {
    heading: 'Why Freshness Alone Doesn\'t Catch a Demotion',
    points: [
      '<code>requireRecentAuth</code> only asks "was this token issued recently?" — it says nothing about whether the CLAIMS inside that token are still accurate. A token issued 2 minutes ago is genuinely "fresh" by any freshness check\'s definition, even if the user was demoted from admin 90 seconds ago, AFTER the token was issued but still well within the freshness window.',
      'The QnA\'s own framing makes the distinction precise: freshness checks are about WHEN the token was issued; a DB-verified role check is about WHETHER the claim is still TRUE right now. A demoted admin holding a technically-fresh token is exactly the gap a freshness-only check cannot close, because the demotion happened AFTER issuance — the very thing freshness alone has no way to detect.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Freshness Alone — Doesn\'t Catch a Demotion',
    language: 'typescript',
    code: `// The main page's own approach: reject tokens issued more than 5
// minutes ago. This defends against a STOLEN, OLD token -- but says
// nothing about whether the token's OWN claims are still accurate.
function requireRecentAuth(maxAgeSeconds: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const claims = (req as any).claims;
    const age = Math.floor(Date.now() / 1000) - claims.iat;
    if (age > maxAgeSeconds) return res.status(401).json({ error: 'Re-authentication required' });
    next();
  };
}

app.delete('/api/admin/purge-tenant', requireAuth, requireRecentAuth(5 * 60), async (req, res) => {
  // req.claims.roles still says ['admin'] -- because that's what was
  // TRUE when the token was issued, 2 minutes ago. Freshness alone has
  // no way to know the user was demoted 90 seconds ago, well AFTER
  // issuance but still comfortably inside the 5-minute freshness window.
  if (!req.claims.roles.includes('admin')) return res.status(403).json({ error: 'Forbidden' });
  await purgeTenant(req.claims.tenantId);
  res.json({ message: 'Tenant purged' });
});`,
  },
  {
    label: 'DB-Verified Role Recheck — Catches It',
    language: 'typescript',
    code: `// The QnA's own named alternative: for the highest-risk operations,
// don't trust the token's role claim at all -- ask the database for
// the CURRENT role, right now, at the moment of the destructive action.
function requireCurrentRole(requiredRole: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const currentRoles = await db.users.getRolesById(req.claims.sub);   // fresh DB read, not the token
    if (!currentRoles.includes(requiredRole)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

app.delete('/api/admin/purge-tenant', requireAuth, requireCurrentRole('admin'), async (req, res) => {
  // By the time this handler runs, the admin role has just been
  // verified against the DATABASE'S current state -- a demotion that
  // happened 90 seconds ago is reflected here immediately, regardless
  // of what the token's own (now-stale) roles claim still says.
  await purgeTenant(req.claims.tenantId);
  res.json({ message: 'Tenant purged' });
});

// Combining both is the strongest posture for the highest-risk
// operations: requireRecentAuth() still defends against a STOLEN OLD
// token being replayed at all, while requireCurrentRole() defends
// against a genuinely fresh token whose claims have simply gone stale
// since issuance -- two different failure modes, each needing its own check.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A user is PROMOTED to admin at 2:00:00pm (they previously had no admin role). Their existing token, issued at 1:58:00pm (before the promotion), still only carries <code>roles: [\'viewer\']</code>. At 2:00:30pm, they try to call the purge endpoint using <code>requireCurrentRole(\'admin\')</code>. Does the check let them through, even though their TOKEN itself never mentions the admin role at all?',
  hint: 'requireCurrentRole() never reads <code>req.claims.roles</code> for its actual decision — trace exactly which value it compares against <code>requiredRole</code>.',
  solution: `// Yes -- requireCurrentRole() lets them through, correctly, DESPITE
// the token's own roles claim never having been updated to include
// 'admin' at all.

// requireCurrentRole() calls db.users.getRolesById(req.claims.sub) --
// it uses the token ONLY to get a stable identifier (sub), then reads
// the CURRENT roles directly from the database, completely ignoring
// whatever req.claims.roles itself says. Since the promotion at
// 2:00:00pm already updated the database record, the DB read at
// 2:00:30pm correctly returns roles including 'admin', and the check
// passes -- even though the token was issued BEFORE the promotion and
// its own roles claim still says ['viewer'].

// This is the same mechanism working in BOTH directions: a promotion
// takes effect immediately (as shown here), and a demotion takes
// effect immediately too (as the main codeTab's own scenario shows) --
// because the check never actually consults the token's role claim at
// all, only uses the token to establish WHO is asking, then asks the
// database what's true about them RIGHT NOW.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'requireCurrentRole() should be used on every protected endpoint instead of the token\'s own role claims — it\'s strictly more accurate, so why not use it everywhere?',
    reality: 'The whole POINT of claims-based identity, as the main page\'s own theory states directly, is avoiding "look up this user in the DB on every request" — a database read on every single protected endpoint reintroduces exactly the per-request DB dependency and latency that stateless, signed tokens exist to eliminate. requireCurrentRole() is a deliberate, narrow exception reserved for the HIGHEST-risk operations (the QnA\'s own examples: account deletion, payment, tenant purges) — not a blanket replacement for trusting token claims on ordinary reads and writes, where the small staleness window is an acceptable, well-understood tradeoff.',
  },
  {
    thought: 'requireRecentAuth (freshness) and requireCurrentRole (DB-verified) are two competing solutions to the same problem — a team picks one or the other.',
    reality: 'The codeTabs above show they defend against genuinely DIFFERENT threats: requireRecentAuth defends against a STOLEN, OLD token still being replayed long after it should have been forgotten — a token-age problem. requireCurrentRole defends against a perfectly FRESH, legitimately-held token whose claims have simply gone stale relative to a very recent database change — a claims-staleness problem, independent of the token\'s age. A token can fail either check without failing the other, which is exactly why the highest-risk operations combine both rather than treating them as alternatives.',
  },
];

@Component({
  selector: 'app-sec-claims-dbcheck',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './db-verified-role-recheck-vs-freshness-only.html',
  styleUrl: './db-verified-role-recheck-vs-freshness-only.scss',
})
export class DbVerifiedRoleRecheckVsFreshnessOnlySubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
