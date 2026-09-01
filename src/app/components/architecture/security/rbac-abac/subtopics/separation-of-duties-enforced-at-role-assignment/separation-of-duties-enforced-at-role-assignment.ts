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
    heading: 'A Compliance Rule Named, Never Enforced in Code',
    points: [
      'The QnA states the rule and where it must be enforced precisely: "no single person should have enough access to commit and conceal fraud... the person who can approve a payment should not also be the person who can submit a payment request... Role assignment system enforces SoD constraints AT ASSIGNMENT TIME." Every RBAC codeTab on the main page checks WHAT a user is allowed to do — none of them checks whether a proposed role ASSIGNMENT itself would violate anything.',
      'This subtopic builds exactly that: a table of mutually-exclusive role pairs, and a check that runs specifically when an admin tries to GRANT a new role to a user — before the grant is applied, not after.',
    ],
  },
  {
    heading: 'Why This Check Belongs at Assignment Time, Not Permission-Check Time',
    points: [
      'A permission check (like the main page\'s own <code>hasPermission()</code>) answers "can this user, RIGHT NOW, do this specific action?" — it runs on every request, and by the time it runs, the user already holds whatever roles they hold. Checking SoD at THIS point would mean the violation already happened; the best a request-time check could do is refuse to let the conflicting roles be USED together, which is a much weaker, more error-prone guarantee than never letting the conflict exist in the first place.',
      'The QnA\'s own phrase — "enforces SoD constraints at assignment time" — is precise: the check needs to run at the ONE moment the conflict can still be PREVENTED, which is before the second, conflicting role is ever actually granted, not afterward.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Mutually Exclusive Role Pairs',
    language: 'typescript',
    code: `// Each pair is a role combination NO SINGLE USER should ever hold
// simultaneously -- the exact "requestor cannot also be approver"
// example the QnA names, generalised to a table of such pairs.
const MUTUALLY_EXCLUSIVE_ROLES: [string, string][] = [
  ['payment-requestor', 'payment-approver'],
  ['invoice-creator', 'invoice-approver'],
  ['code-author', 'code-deployer'],   // a common SoD pair in engineering orgs too
];

function isMutuallyExclusive(roleA: string, roleB: string): boolean {
  return MUTUALLY_EXCLUSIVE_ROLES.some(
    ([a, b]) => (a === roleA && b === roleB) || (a === roleB && b === roleA)
  );
}`,
  },
  {
    label: 'Enforcement at Grant Time',
    language: 'typescript',
    code: `async function grantRole(userId: string, newRole: string): Promise<{ granted: boolean; reason?: string }> {
  const existingRoles = await db.users.getRoles(userId);

  // Check the PROPOSED role against every role the user ALREADY has --
  // this runs BEFORE the grant is written, so a conflict is prevented,
  // not merely detected after the fact.
  for (const existingRole of existingRoles) {
    if (isMutuallyExclusive(existingRole, newRole)) {
      return {
        granted: false,
        reason: \`Cannot grant '\${newRole}' -- conflicts with existing role '\${existingRole}' (separation of duties)\`,
      };
    }
  }

  await db.users.addRole(userId, newRole);
  return { granted: true };
}

// ── Wired into the admin endpoint ─────────────────────────────────────────
app.post('/admin/users/:id/roles', requirePermission('users:manage'), async (req, res) => {
  const result = await grantRole(req.params.id, req.body.role);
  if (!result.granted) return res.status(409).json({ error: result.reason });
  res.json({ message: 'Role granted' });
});

// Usage:
console.log(await grantRole('u1', 'payment-requestor'));   // { granted: true }
console.log(await grantRole('u1', 'payment-approver'));    // blocked -- u1 already has payment-requestor
console.log(await grantRole('u2', 'payment-approver'));    // { granted: true } -- u2 has no conflicting role yet`,
  },
];

const exercise: TryItExercise = {
  prompt: 'Alice already has BOTH <code>invoice-creator</code> AND <code>code-author</code> roles (granted before this SoD system existed, in the wrong order relative to each other — but neither of THOSE two roles is actually a mutually-exclusive pair with each other). An admin now tries to grant her <code>invoice-approver</code>. Does <code>grantRole</code> block this, and specifically because of which existing role?',
  hint: 'The loop checks the NEW role against EVERY role the user currently has, one at a time — it doesn\'t matter how many roles the user holds in total, only whether ANY of them conflicts with the one being added.',
  solution: `// Yes, grantRole is blocked -- specifically because of Alice's
// EXISTING invoice-creator role, not her code-author role at all.

// The for loop iterates over ALL of Alice's existing roles
// (invoice-creator, code-author) and checks each one against the
// PROPOSED new role (invoice-approver) using isMutuallyExclusive().
// invoice-creator and invoice-approver ARE listed as a mutually
// exclusive pair in MUTUALLY_EXCLUSIVE_ROLES -- so this specific
// comparison returns true, and grantRole() returns
// { granted: false, reason: "...conflicts with existing role
// 'invoice-creator'..." } immediately, without even checking whether
// code-author conflicts with anything (it doesn't, but the function
// never needs to find that out once an earlier role in the loop
// already triggered a block).

// The general lesson: grantRole() doesn't care HOW MANY roles a user
// already has, or in what order they were granted historically -- it
// only asks "does the NEW role conflict with ANY currently-held role,
// checked one at a time." A user's other, unrelated roles (like
// code-author here) are simply irrelevant to this particular grant
// decision.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Since <code>grantRole()</code> already prevents FUTURE conflicting grants, a system that adopts this check is automatically safe from separation-of-duties violations.',
    reality: 'The Try It\'s own setup names the real gap directly: Alice\'s conflicting roles in a DIFFERENT scenario could just as easily have been granted BEFORE this SoD system existed, or through some OTHER code path that doesn\'t call <code>grantRole()</code> at all (a direct database edit, a bulk import script, a different, older admin panel). Enforcing the check at ONE grant-time code path prevents NEW violations through that path — it does nothing to detect or fix violations that already exist from before the check was added, or from any code path that bypasses it. A real deployment needs BOTH the assignment-time check AND a periodic audit query scanning for existing users who already hold a mutually-exclusive pair.',
  },
  {
    thought: 'Separation of duties is really just a special case of role explosion — you\'re just creating more granular roles to avoid conflicts.',
    reality: 'SoD is a constraint about COMBINATIONS of roles a single user may hold, not about how granular any individual role is — <code>payment-requestor</code> and <code>payment-approver</code> can each be as simple or as complex as any other role in the system; the SoD rule adds a SEPARATE, independent check ("not both, on the same person") layered on top of whatever role granularity already exists. Making roles MORE granular doesn\'t inherently prevent SoD violations at all — you could still assign one person both of two very narrow, very specific roles unless something explicitly checks that combination.',
  },
];

@Component({
  selector: 'app-sec-rbac-sod',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './separation-of-duties-enforced-at-role-assignment.html',
  styleUrl: './separation-of-duties-enforced-at-role-assignment.scss',
})
export class SeparationOfDutiesEnforcedAtRoleAssignmentSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
