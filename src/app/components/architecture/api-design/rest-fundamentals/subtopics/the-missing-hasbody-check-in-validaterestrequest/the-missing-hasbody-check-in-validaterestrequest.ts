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
    heading: 'The Challenge Promised Three Checks — Its Own Signature Could Only Ever Do One',
    points: [
      'The main page’s own Challenge description lists three checks: (1) reject verb-shaped paths, (2) GET/DELETE/HEAD must not carry a request body, (3) PUT/POST/PATCH paths must also avoid query verbs. The original <code>validateRestRequest(method: string, path: string)</code> signature had no way to represent "does this request have a body" at all — there was no parameter for it.',
      'Check (2) was not just unimplemented — it was UNIMPLEMENTABLE with that signature. A function can only validate information it actually receives as a parameter; there was no <code>body</code>/<code>hasBody</code> argument anywhere for it to inspect.',
      'This has been fixed on the main page by adding a <code>hasBody: boolean</code> parameter and a real check for it — this subtopic traces exactly why a Challenge’s own DESCRIPTION and its FUNCTION SIGNATURE need to agree before any implementation can possibly satisfy the description.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Before: A Signature That Could Never Satisfy Its Own Spec',
    language: 'typescript',
    code: `// The ORIGINAL signature -- reproduced here to trace exactly why
// check (2) from the Challenge's own description was impossible.
function validateRestRequestBROKEN(method: string, path: string): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const VERBS = ['/get', '/create', '/delete', '/update', '/fetch'];
  const lowerPath = path.toLowerCase();

  for (const verb of VERBS) {
    if (lowerPath.includes(verb)) {
      issues.push(\`Path contains verb "\${verb}"\`);
    }
  }

  // Check (2) from the description: "GET/DELETE/HEAD do not have a
  // request body" -- there is NO WAY to write this check here. The
  // function was never told whether the caller's request actually
  // had a body -- "method" and "path" carry zero information about
  // the request BODY at all.

  return { valid: issues.length === 0, issues };
}

// A GET request WITH a body -- a real REST anti-pattern the spec
// explicitly asked to catch -- passes cleanly, because the function
// has no data to even attempt catching it with:
console.log(validateRestRequestBROKEN('GET', '/users/42'));
// { valid: true, issues: [] } -- wrong by the spec's OWN definition,
// but not really a "bug" in the check logic itself -- the check was
// never given the information it would need to run at all.`,
  },
  {
    label: 'After: The Signature Actually Carries What the Spec Needs',
    language: 'typescript',
    code: `function validateRestRequest(method: string, path: string, hasBody: boolean): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const VERBS = ['/get', '/create', '/delete', '/update', '/fetch'];
  const lowerPath = path.toLowerCase();
  const upperMethod = method.toUpperCase();

  for (const verb of VERBS) {
    if (lowerPath.includes(verb)) {
      issues.push(\`Path contains verb "\${verb}" -- use a noun resource URI instead\`);
    }
  }

  // NOW check (2) is actually expressible -- hasBody is real
  // information the caller provides, not something inferred or
  // guessed at from method/path alone.
  if (['GET', 'DELETE', 'HEAD'].includes(upperMethod) && hasBody) {
    issues.push(\`\${upperMethod} requests should not carry a request body -- pass parameters in the URL instead\`);
  }

  return { valid: issues.length === 0, issues };
}

console.log(validateRestRequest('GET', '/users/42', true));
// { valid: false, issues: ['GET requests should not carry a request
// body -- pass parameters in the URL instead'] } -- now genuinely
// catches the exact anti-pattern the spec described.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate proposes a DIFFERENT fix: keep the original two-parameter signature, and instead have <code>validateRestRequest</code> check <code>process.env.REQUEST_HAS_BODY</code> — a global environment variable the caller sets before calling the function. Why is this a worse fix than adding a real parameter, even though it technically "works"?',
  hint: 'What happens if two different requests — one with a body, one without — are being validated concurrently, or if a caller simply forgets to set the environment variable before calling?',
  solution: `// A global (env var, module-level mutable variable, etc.) turns a
// PURE function -- one whose output depends only on its own
// arguments -- into an IMPURE one whose output depends on hidden,
// external, mutable state.

// Concretely: two requests validated back-to-back (or concurrently,
// in any environment with real parallelism) would silently
// interfere with each other if the environment variable isn't reset
// between calls -- request A's "has a body" state could leak into
// request B's validation. A caller could also simply forget to set
// it, silently defaulting to whatever the LAST call happened to
// leave it as.

// A real parameter makes the function's behavior fully determined
// by its own arguments -- call it with the same three arguments
// twice, get the same result twice, guaranteed, regardless of what
// any other code anywhere in the process did in between. This is
// also why the fix in the codeTab above is preferable to bolting on
// a THIRD, awkward workaround (a mutable field on some shared
// "request context" object) -- the cleanest fix for "a function
// needs information" is almost always "give it the information as a
// parameter," not "make it reach out and find the information
// itself."`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A Challenge’s own description and its starter/solution code will always agree with each other — they’re written together.',
    reality: 'The original REST Fundamentals Challenge is a real, published counter-example: its description named three checks, but its <code>starterCode</code>/<code>solution</code> signature only had two parameters — enough for exactly one of the three. Reading a Challenge description carefully enough to ask "does the given function signature even have access to the information this check needs?" is a genuinely useful habit, not a purely theoretical concern.',
  },
  {
    thought: 'If a function’s logic is internally correct — no syntax errors, no crashes — it satisfies whatever spec it was written against.',
    reality: 'The original <code>validateRestRequestBROKEN</code> had zero bugs in the code it DID write — every line executed exactly as intended. The problem was a MISSING capability, not a wrong one: the function simply had no way to represent information (whether the request had a body) that its own spec required it to check.',
  },
  {
    thought: 'Adding a new parameter to a function is a "breaking change" that should be avoided if at all possible — better to infer the missing information some other way.',
    reality: 'For a small, purpose-built validation helper like this one, a new parameter is the most correct and most testable fix — every call site becomes explicit about what it’s asserting, and the function’s output stays a pure function of its own inputs. The alternative (inferring "has a body" from a global, a side channel, or an ambient request-context object) trades a one-time signature update for an ongoing source of the exact hidden-state bugs the Try It above traces.',
  },
];

@Component({
  selector: 'app-api-rest-fundamentals-hasbody',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './the-missing-hasbody-check-in-validaterestrequest.html',
  styleUrl: './the-missing-hasbody-check-in-validaterestrequest.scss',
})
export class TheMissingHasbodyCheckInValidaterestrequestSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
