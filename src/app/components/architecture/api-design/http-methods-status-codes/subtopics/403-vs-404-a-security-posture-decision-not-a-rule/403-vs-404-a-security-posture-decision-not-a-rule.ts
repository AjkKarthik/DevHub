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
    heading: 'One Bullet Said "Do NOT" — Two Other Sections of the Same Page Said "It Depends"',
    points: [
      'The main page’s own 403 Forbidden theory bullet originally read: "Do NOT return 404 to hide existence of a resource from unauthorized users (that would be 403 or 404 based on your security posture)" — an absolute prohibition in its opening clause, contradicted by its own parenthetical one sentence later.',
      'The SAME page’s own 404 Not Found bullet, right below it, says the opposite: "Also use [404] when hiding an unauthorized resource for security (so attackers can\'t enumerate valid IDs)" — explicitly endorsing 404 for exactly the scenario the 403 bullet said not to use it for.',
      'The page’s own QnA agrees with the 404 bullet, not the 403 bullet: "Best practice: for resources that shouldn\'t be enumerable... return 404. For resources with known existence... return 403." This has been fixed on the main page to remove the contradictory "Do NOT" framing — this subtopic builds the actual decision the QnA describes as a function, not just prose.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The Decision, as Actual Code',
    language: 'typescript',
    code: `interface ResourceAccessCheck {
  resourceExists: boolean;
  userCanAccess: boolean;
  // Whether this resource TYPE is meant to be enumerable at all --
  // e.g. a public product listing (existence is not secret) vs. a
  // private document or another user's personal data (existence
  // itself should not be confirmable by a non-owner).
  isEnumerableResourceType: boolean;
}

function selectAccessStatusCode(check: ResourceAccessCheck): number {
  if (!check.resourceExists) return 404; // genuinely doesn't exist

  if (check.userCanAccess) return 200; // exists, and they're allowed

  // Exists, but this user isn't allowed -- THIS is where the QnA's
  // "depends on your security posture" decision actually happens:
  return check.isEnumerableResourceType
    ? 403  // reveal existence -- e.g. a public product a user hasn't purchased
    : 404; // hide existence -- e.g. someone else's private document
}

// A public product page a logged-out user isn't allowed to see the
// wholesale price on -- existence is not secret, 403 is appropriate:
console.log(selectAccessStatusCode({ resourceExists: true, userCanAccess: false, isEnumerableResourceType: true }));
// 403

// Another user's private document -- confirming it EXISTS is itself
// a leak, so hide it behind the same response a nonexistent ID gets:
console.log(selectAccessStatusCode({ resourceExists: true, userCanAccess: false, isEnumerableResourceType: false }));
// 404`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate points out that returning 404 for "exists but hidden" and 404 for "genuinely doesn’t exist" makes both cases LOOK identical to the client — doesn’t that defeat error handling? What would you tell them about whether that’s actually the problem it sounds like?',
  hint: 'What is the SPECIFIC threat this indistinguishability is meant to defend against — and does making the two cases distinguishable to the CLIENT help or hurt that specific goal?',
  solution: `// Making the two cases identical to the client IS the entire point,
// not an accidental side effect to fix. The threat model here is
// resource ENUMERATION -- an attacker trying IDs one at a time to
// discover which ones correspond to real, private resources they
// don't own. If "exists but you can't see it" and "doesn't exist at
// all" produced ANY distinguishable response (a different status
// code, a different error message, even a different response TIME),
// an attacker could use that difference as an oracle to enumerate
// real resource IDs one probe at a time.

// This is not a UX problem to "fix" for legitimate clients, either --
// a legitimate client asking for a resource that's either hidden or
// missing has the same correct next step either way: they don't have
// access to it, full stop. There's no meaningfully different action
// a legitimate client would take differently between "it doesn't
// exist" and "it exists but you can't see it" for a genuinely private
// resource -- which is exactly why the enumerable/non-enumerable
// distinction in selectAccessStatusCode only matters for resource
// TYPES where existence itself isn't meant to be a secret.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'The choice between 403 and 404 for an unauthorized request is a fixed rule — always use one or the other.',
    reality: 'It’s a deliberate, per-resource-TYPE security posture decision, not a universal rule — the codeTab above branches on <code>isEnumerableResourceType</code> specifically because different resource types in the SAME API can reasonably make different choices (a public product listing vs. another user’s private document).',
  },
  {
    thought: 'Using 404 to hide a resource’s existence is itself a security best practice that should always be preferred over 403.',
    reality: 'It is the RIGHT choice specifically for non-enumerable, private resources — but for a resource whose existence is already public knowledge (a product listing, a public profile), using 403 is more honest and more useful to a legitimate client, since hiding what’s already visible information provides no real security benefit.',
  },
  {
    thought: 'A resource being "hidden behind 404" for security reasons is the same underlying code path as a resource genuinely not existing.',
    reality: 'They are two DIFFERENT conditions inside <code>selectAccessStatusCode</code> that happen to map to the SAME status code deliberately — <code>!resourceExists</code> is one branch, <code>userCanAccess === false && !isEnumerableResourceType</code> is a completely separate branch. The server always knows internally which case actually happened; only the RESPONSE is made indistinguishable, on purpose.',
  },
];

@Component({
  selector: 'app-api-http-methods-403-404',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './403-vs-404-a-security-posture-decision-not-a-rule.html',
  styleUrl: './403-vs-404-a-security-posture-decision-not-a-rule.scss',
})
export class Http403Vs404ASecurityPostureDecisionNotARuleSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
