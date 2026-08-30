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
    heading: 'JIT Is Already There. Its Gap Isn\'t.',
    points: [
      'The main page\'s own OIDC and SAML codeTabs both call <code>db.users.findOrCreate(...)</code> on every successful login — this IS Just-In-Time provisioning, already implemented, just never named as such. The QnA explains the pattern this implicitly follows AND its limitation in the same breath: "JIT provisioning... without requiring a separate invitation... [but] JIT cannot deactivate accounts; you only learn a user logged in, not that they left the company." Nothing on the page shows what closes that specific gap.',
      'This subtopic builds the QnA\'s own named alternative — a SCIM (System for Cross-domain Identity Management) endpoint the IdP calls directly, independent of any user ever logging in again, specifically to handle the deactivation case JIT structurally cannot.',
    ],
  },
  {
    heading: 'Why JIT Can Never Learn About a Departure on Its Own',
    points: [
      'JIT provisioning is entirely reactive to LOGIN events — the application only learns anything about a user at the moment that user authenticates. A departed employee, by definition, never logs in again after leaving — there is no login event for the JIT flow to react to, and so no code path in the entire OIDC/SAML flow ever runs for that user again at all.',
      'SCIM inverts this: instead of waiting for the USER to show up, the IdP proactively PUSHES a notification to the application the moment HR (or the IdP admin) deactivates the employee — completely independent of whether that user ever attempts to log in again. This is a fundamentally different trigger (an IdP-initiated push vs. a user-initiated login), not just a more thorough version of the same mechanism.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Existing JIT Flow (Already on the Main Page)',
    language: 'typescript',
    code: `// From the main page's own OIDC codeTab -- this runs ONLY when the
// user themselves successfully authenticates.
async (issuer, profile, done) => {
  const user = await db.users.findOrCreate({
    ssoProvider: 'google',
    ssoSub:      profile.id,
    email:       profile.emails?.[0]?.value,
    displayName: profile.displayName,
  });
  return done(null, user);
}
// If this user is deactivated at the IdP tomorrow, NOTHING in this
// flow ever runs again for them -- there's no future login event to
// trigger it, so the application has no way to find out.`,
  },
  {
    label: 'SCIM Endpoint — IdP-Pushed Deactivation',
    language: 'typescript',
    code: `// A minimal SCIM 2.0-style endpoint the IdP calls DIRECTLY,
// authenticated with its own bearer token -- entirely independent of
// any user's own login activity.
app.patch('/scim/v2/Users/:externalId', requireScimAuth, async (req, res) => {
  const { externalId } = req.params;   // the IdP's own stable user identifier
  const { Operations } = req.body;     // SCIM PatchOp format

  const user = await db.users.findBySsoSub(externalId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  for (const op of Operations) {
    if (op.path === 'active' && op.value === false) {
      // THIS is the deactivation JIT alone could never trigger --
      // fired by the IdP itself, the moment HR deactivates the
      // employee record, with no dependency on the user logging in.
      await db.users.deactivate(user.id);
      await db.sessions.revokeAllForUser(user.id);   // kill any still-active session immediately
    }
  }

  res.json({ id: user.id, active: !(await db.users.isDeactivated(user.id)) });
});

// The SAME endpoint also handles the OPPOSITE case JIT can't cleanly
// express either -- reactivating a user who was previously deactivated
// but whose account record (created by an earlier JIT login) still exists:
// an Operations entry with { path: 'active', value: true } simply
// reverses the deactivation, with no need to re-provision anything.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'An employee is deactivated via SCIM at 9:00am. At 9:05am, before their old session cookie expires on its own, they try to load the application in a browser tab that was already open and logged in from yesterday. Does <code>db.sessions.revokeAllForUser(user.id)</code> in the SCIM handler above actually stop this specific request from succeeding?',
  hint: 'The SCIM call and the 9:05am page load are two SEPARATE requests, seconds apart. What does the 9:05am request actually check, and when was that check\'s answer last updated?',
  solution: `// Yes -- as long as the ALREADY-OPEN tab's request is authenticated
// by looking up the session server-side (not just trusting a
// self-contained token the browser already has), the 9:05am request
// fails, because revokeAllForUser() already deleted/invalidated that
// session's server-side record at 9:00am, five minutes earlier.

// The key mechanical point: the deactivation and the page load are
// two INDEPENDENT requests, and the 9:05am request's OUTCOME depends
// entirely on what state the SESSION STORE holds at 9:05am, not on
// what the browser's own tab happened to be doing since yesterday.
// Since revokeAllForUser() already ran (at 9:00am, before 9:05am),
// the session lookup at 9:05am finds nothing valid, and the request
// is rejected -- regardless of how long that browser tab had
// genuinely, legitimately been open before the deactivation happened.

// This ALSO reveals a real limitation worth naming: this specific
// defence only works because the application checks session validity
// SERVER-SIDE on every request. If the application instead trusted a
// long-lived, self-contained JWT stored client-side (with no
// server-side revocation check at all), revokeAllForUser() would have
// nothing to actually revoke -- the stolen or still-valid token would
// keep working until its own expiry, completely unaffected by the
// SCIM deactivation. Combining SCIM deprovisioning with short-lived,
// server-checked sessions (or the token revocation techniques covered
// elsewhere) is what makes deactivation take effect immediately rather
// than only "eventually, once existing tokens expire."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'SCIM and JIT provisioning are two competing approaches — a team picks one or the other.',
    reality: 'The main page\'s own codeTabs are already doing JIT (via <code>findOrCreate</code> on every login), and this subtopic adds SCIM on TOP of it, not instead of it — they solve two different halves of the same lifecycle problem. JIT handles account CREATION cheaply (no separate provisioning step needed before a new employee\'s first login); SCIM handles DEACTIVATION reliably (no dependency on the departing employee ever logging in again). Real systems commonly use both together, exactly as the QnA\'s own phrasing ("the alternative is SCIM") could be misread to suggest a choice, when it\'s really describing a complementary capability.',
  },
  {
    thought: 'Calling <code>db.users.deactivate(user.id)</code> is sufficient on its own — an already-logged-in user with a still-valid session naturally loses access once their account is marked inactive.',
    reality: 'The Try It above shows this is only true if EVERY subsequent request actually re-checks the user\'s active status server-side — a still-valid session token or cookie, by itself, doesn\'t automatically know the underlying account was just deactivated. This is why the SCIM handler explicitly calls <code>db.sessions.revokeAllForUser(user.id)</code> as a SEPARATE step alongside the deactivation — without it, a user\'s EXISTING session could keep working until it separately expires or is separately checked against account status, even though their account is already marked inactive.',
  },
];

@Component({
  selector: 'app-sec-sso-scim',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './scim-deprovisioning-the-jit-gap-scim-closes.html',
  styleUrl: './scim-deprovisioning-the-jit-gap-scim-closes.scss',
})
export class ScimDeprovisioningTheJitGapScimClosesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
