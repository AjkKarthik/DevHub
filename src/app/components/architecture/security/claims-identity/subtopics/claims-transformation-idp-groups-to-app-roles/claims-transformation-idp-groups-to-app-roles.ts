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
    heading: 'Named Precisely, Never Built',
    points: [
      'The quiz explains claims transformation with a concrete example: "the IdP sends <code>groups=[CORP-DEV-TEAM-A]</code>. The application transforms this to <code>roles=[developer, code-reviewer]</code> using a mapping table... this keeps application authorization logic out of the IdP while still using federated identity." The main page\'s own <code>extractClaims()</code> codeTab reads <code>roles</code> directly off the token as if the IdP already sent exactly the roles the application wants — no transformation step exists anywhere.',
      'This subtopic builds exactly the mapping the quiz describes: an IdP that only knows about ITS OWN organisational groups, and an application-side transformation step that converts those groups into the application\'s own role vocabulary, entirely independent of what the IdP calls anything.',
    ],
  },
  {
    heading: 'Why This Decoupling Is the Whole Point',
    points: [
      'The quiz\'s own reasoning is precise: "IdPs provide organizational claims; applications need domain-specific authorization claims." An IdP administrator manages groups named things like <code>CORP-DEV-TEAM-A</code> for THEIR OWN organisational reasons (which team, which office, which cost center) — names that have no inherent connection to what an application actually needs to know, like "can review code."',
      'Without a transformation step, the application would either have to hardcode its authorization logic around the IdP\'s own group-naming conventions (coupling the app tightly to one specific IdP\'s internal structure), or ask the IdP\'s administrators to rename groups to match the app\'s vocabulary (asking one system to reorganise itself for another system\'s convenience). A transformation layer lets each side keep its own natural vocabulary.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'The IdP\'s Own Groups (Untransformed)',
    language: 'typescript',
    code: `// What actually arrives in the token from the IdP -- organisational
// group names that mean nothing to the application's own authorization
// logic, exactly as the quiz's own example describes.
interface RawIdpClaims {
  sub: string;
  email: string;
  groups: string[];   // e.g. ['CORP-DEV-TEAM-A', 'CORP-ALL-STAFF']
}

const rawClaims: RawIdpClaims = {
  sub: 'u-482',
  email: 'alice@example.com',
  groups: ['CORP-DEV-TEAM-A', 'CORP-ALL-STAFF'],
};

// The main page's own extractClaims() would need roles: string[] --
// but nothing in rawClaims is called "roles" at all, and even if it
// were, 'CORP-DEV-TEAM-A' means nothing to any permission check.`,
  },
  {
    label: 'The Transformation Layer',
    language: 'typescript',
    code: `// A mapping table the APPLICATION owns and maintains -- entirely
// independent of the IdP's own group-naming conventions. Changing
// this table never requires touching the IdP configuration at all.
const GROUP_TO_ROLES: Record<string, string[]> = {
  'CORP-DEV-TEAM-A':  ['developer', 'code-reviewer'],
  'CORP-DEV-TEAM-B':  ['developer'],
  'CORP-ALL-STAFF':   ['employee'],
  'CORP-FINANCE-OPS': ['billing-reader', 'billing-approver'],
};

interface AppClaims {
  sub: string;
  email: string;
  roles: string[];   // the application's OWN vocabulary from here on
}

function transformClaims(raw: RawIdpClaims): AppClaims {
  // Every raw group can map to MULTIPLE application roles -- flatten
  // and de-duplicate, since a user can belong to several IdP groups
  // that each contribute overlapping application-level permissions.
  const roles = new Set<string>();
  for (const group of raw.groups) {
    const mapped = GROUP_TO_ROLES[group] ?? [];
    mapped.forEach(role => roles.add(role));
  }

  return { sub: raw.sub, email: raw.email, roles: Array.from(roles) };
}

const appClaims = transformClaims(rawClaims);
console.log(appClaims);
// -> { sub: 'u-482', email: 'alice@example.com', roles: ['developer', 'code-reviewer', 'employee'] }
// From here on, the REST of the application -- every hasPermission()
// check, every requirePermission() middleware -- works with roles it
// actually understands, having never once referenced 'CORP-DEV-TEAM-A'.`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A user belongs to BOTH <code>CORP-DEV-TEAM-A</code> AND <code>CORP-DEV-TEAM-B</code> at the IdP (perhaps they work across two teams). Using the <code>GROUP_TO_ROLES</code> table above, how many DISTINCT application roles does <code>transformClaims</code> assign them, and why not more?',
  hint: 'Trace what each group individually maps to, then think about what the <code>Set</code> does when the SAME role name appears in more than one group\'s mapped list.',
  solution: `// The user ends up with exactly 2 distinct roles: 'developer' and
// 'code-reviewer' -- not 3, even though 'developer' technically
// appears in BOTH groups' mapped lists.

// CORP-DEV-TEAM-A maps to ['developer', 'code-reviewer'].
// CORP-DEV-TEAM-B maps to ['developer'] alone. transformClaims()
// iterates over BOTH groups and adds every mapped role to a Set --
// and a Set, by definition, silently discards a duplicate insertion
// of a value it already contains. 'developer' gets added once from
// team A's mapping, then the SAME string 'developer' is added again
// from team B's mapping -- the Set already contains it, so nothing
// changes. 'code-reviewer' is only added once, from team A.

// The final role list is ['developer', 'code-reviewer'] -- exactly
// what you'd want: a user with overlapping team memberships doesn't
// end up with a role list containing accidental duplicates, which
// could otherwise cause subtle bugs in code that assumes each role
// name appears at most once (e.g. code that counts a user's roles,
// or displays them in a UI list).`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'Claims transformation means the IdP itself is configured to send application-specific role names instead of its own group names.',
    reality: 'The quiz\'s own example is explicit about where this happens: "the application transforms this... using a mapping table" — the TRANSFORMATION runs on the APPLICATION side, after the token arrives, not inside the IdP\'s own configuration. The IdP keeps sending whatever organisational groups it already manages for its own purposes; the mapping table is entirely the application\'s own responsibility, maintainable without any coordination with (or changes to) the IdP at all.',
  },
  {
    thought: 'Since <code>transformClaims()</code> runs after the token is received, it needs to re-verify the token\'s signature or otherwise re-authenticate the user.',
    reality: 'Claims transformation operates purely on ALREADY-VALIDATED claims — by the time <code>transformClaims()</code> runs, the token\'s signature, issuer, and audience have already been checked (exactly as the main page\'s own <code>extractClaims()</code> does before this step would run). Transformation is a pure, trust-preserving RESHAPING of data that\'s already been established as authentic; it adds no new verification step and needs none, since it isn\'t making any new claim about identity — only about which application-level roles a given (already-trusted) set of IdP groups corresponds to.',
  },
];

@Component({
  selector: 'app-sec-claims-transformation',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './claims-transformation-idp-groups-to-app-roles.html',
  styleUrl: './claims-transformation-idp-groups-to-app-roles.scss',
})
export class ClaimsTransformationIdpGroupsToAppRolesSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
