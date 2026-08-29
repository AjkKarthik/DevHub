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
    heading: 'A Distinction Explained in Prose, Never Shown in Code',
    points: [
      'The QnA explains the distinction precisely: "Fail safe: when a system fails, it defaults to an open or accessible state... Fail secure: when a system fails, it defaults to a denied or restricted state." It even gives concrete examples ("Authorization middleware that throws an exception should return HTTP 403, not 200") — but no codeTab on the page ever shows the actual middleware code that gets this wrong, or the fix.',
      'This subtopic builds exactly the scenario the QnA describes: authorization middleware whose error-handling path accidentally does the opposite of what it should.',
    ],
  },
  {
    heading: 'Why This Bug Class Is Easy to Introduce by Accident',
    points: [
      'A fail-open bug rarely LOOKS like a security bug — it usually looks like defensive error handling ("if something goes wrong checking permissions, don\'t crash the request"). The mistake is in what happens NEXT: swallowing the error and letting the request continue is defensive for AVAILABILITY, but catastrophic for AUTHORIZATION, where "continue" means "grant access."',
      'The main page\'s own theory names the general principle this connects to: least privilege and defence-in-depth both assume access is denied by DEFAULT — fail-open middleware silently inverts that default the moment something goes wrong, which is exactly when a system is under the most unusual (and potentially attacker-triggered) conditions.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Fail-Open — The Bug',
    language: 'typescript',
    code: `// Authorization middleware -- checks a permission service before
// letting the request through to the protected route.
async function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allowed = await permissionService.check(req.user.id, permission);
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });
      next();   // permission check passed -- proceed
    } catch (err) {
      // "Defensive" error handling -- but this is the fail-OPEN bug:
      // if permissionService itself throws (network blip, timeout,
      // the service being briefly down), the request proceeds
      // as if it HAD been checked and allowed.
      console.error('Permission check failed:', err);
      next();   // <- fails OPEN: access granted on error
    }
  };
}

// The exact scenario the main page's own QnA describes: "Authorization
// middleware that throws an exception should return HTTP 403, not 200."
// This code does the OPPOSITE -- it swallows the exception and grants
// access, precisely when the permission system is least reliable.`,
  },
  {
    label: 'Fail-Secure — The Fix',
    language: 'typescript',
    code: `async function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allowed = await permissionService.check(req.user.id, permission);
      if (!allowed) return res.status(403).json({ error: 'Forbidden' });
      next();
    } catch (err) {
      // Fail SECURE: any failure to positively confirm permission
      // results in denial, not access. The user sees a 503, not a
      // silent grant -- annoying, but never a security hole.
      console.error('Permission check failed:', err);
      res.status(503).json({ error: 'Unable to verify permissions, try again' });
      // deliberately NOT calling next() -- the request stops here.
    }
  };
}

// This trades a small AVAILABILITY cost (a legitimate user sees a
// 503 during a permissionService outage) for a much larger
// AUTHORIZATION guarantee (no request ever proceeds without a
// CONFIRMED "allowed" result) -- exactly the fail-secure default
// the main page's own QnA recommends for security systems.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A teammate proposes a "compromise": on <code>permissionService</code> failure, fall back to a CACHED result from the user\'s last successful permission check, rather than either granting or denying outright. Is this fail-secure, fail-open, or something else — and what new risk does it introduce?',
  hint: 'Think about what happens if the user\'s permissions were REVOKED since that last successful check, but the cache hasn\'t been invalidated yet.',
  solution: `// It's neither purely fail-secure nor purely fail-open -- it's a
// THIRD approach with its own distinct risk: STALE authorization.
// If the user's permission was revoked (role changed, account
// suspended, access explicitly removed) AFTER the last successful
// check but BEFORE the cache would normally expire, a
// permissionService outage during that window means the stale
// cached "allowed" result is served -- granting access the system
// no longer intends the user to have.

// This is a real, legitimate trade-off some systems accept
// deliberately (short cache TTLs, explicit cache invalidation on
// permission changes) -- but it is NOT automatically safer than
// fail-secure's simple "deny on any doubt" default, and it trades a
// simple, easy-to-reason-about guarantee for a more complex one that
// depends entirely on how aggressively the cache is invalidated.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The fail-open version is obviously wrong just from reading it — no experienced developer would ever write this.',
    reality: 'The fail-open version LOOKS like careful, defensive coding — it has a try/catch, it logs the error, it doesn\'t crash the server. That surface-level "this is being careful" appearance is exactly what makes this bug class genuinely common in real codebases: the mistake isn\'t missing error handling, it\'s error handling that resolves the failure in the wrong DIRECTION for a security-sensitive operation specifically.',
  },
  {
    thought: 'Fail-secure is always the objectively correct choice for any system, in any situation.',
    reality: 'The main page\'s own QnA is explicit that this depends on the THREAT MODEL: "some systems legitimately fail safe (e.g., physical safety exits)." An electronic door lock protecting a server room should fail secure (locked) during a power outage; the SAME lock on a fire exit should fail safe (unlocked), because the cost of trapping people during an emergency outweighs the security benefit. Authorization middleware for a typical web app leans fail-secure because the asymmetry (a security breach vs. a temporary 503) usually favors it — but "always fail secure" is not a universal rule independent of what\'s actually being protected.',
  },
];

@Component({
  selector: 'app-sec-fund-fail-secure',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './fail-secure-vs-fail-safe-made-concrete.html',
  styleUrl: './fail-secure-vs-fail-safe-made-concrete.scss',
})
export class FailSecureVsFailSafeMadeConcreteSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
