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
    heading: 'A Third Model Named, Never Built',
    points: [
      'The theory and QnA both describe ReBAC precisely: "authorization is derived from relationships in a graph... User A is a member of Group B which is an editor of Document C... the relationship chain: user -> member_of -> group -> editor_of -> document." Every codeTab on the page is RBAC or ABAC — neither a relationship graph nor a resolver that walks one ever appears.',
      'This subtopic builds exactly that: a small relationship-tuple store (the same shape Google Zanzibar, OpenFGA, and SpiceDB all use — a set of <code>(object, relation, subject)</code> triples) and a resolver that recursively follows GROUP MEMBERSHIP chains to answer "can this user access this document?"',
    ],
  },
  {
    heading: 'Why This Needs Recursion and Neither RBAC nor ABAC Does',
    points: [
      'The QnA\'s own example names a SPECIFIC problem RBAC and ABAC both struggle with: "nested groups: a user inherits permissions from being a member of a group that is a member of another group." An RBAC permission check is a flat set lookup — no chain-following involved. An ABAC policy evaluates a fixed set of attributes on the CURRENT request — also no graph traversal.',
      'ReBAC is different because the relationship chain can be ARBITRARILY deep — a user in a group, in a parent group, in a grandparent group, each potentially holding an editor relationship to the document. Answering "can access?" requires walking that chain until either an access-granting relationship is found or every branch is exhausted, which is fundamentally a graph-traversal problem, not a lookup.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'A Relationship-Tuple Store',
    language: 'typescript',
    code: `// The same (object, relation, subject) tuple shape Zanzibar/OpenFGA
// use -- each tuple is one edge in the relationship graph.
interface Tuple { object: string; relation: string; subject: string; }

const tuples: Tuple[] = [
  // Alice is a MEMBER of "engineering" group
  { object: 'group:engineering', relation: 'member', subject: 'user:alice' },
  // "engineering" group is a MEMBER of "all-staff" group (nested group)
  { object: 'group:all-staff', relation: 'member', subject: 'group:engineering' },
  // "all-staff" group has EDITOR access to the roadmap document
  { object: 'doc:roadmap', relation: 'editor', subject: 'group:all-staff' },
  // Bob has DIRECT editor access to a different document -- no group involved
  { object: 'doc:budget', relation: 'editor', subject: 'user:bob' },
];`,
  },
  {
    label: 'The Recursive Resolver',
    language: 'typescript',
    code: `function hasRelation(
  object: string,
  relation: string,
  subject: string,
  visited: Set<string> = new Set(),
): boolean {
  // Direct tuple match -- the base case.
  const direct = tuples.some(t => t.object === object && t.relation === relation && t.subject === subject);
  if (direct) return true;

  // Otherwise, does the SUBJECT belong to some GROUP that itself
  // holds this relation to the object? Follow every "member of"
  // edge the subject has, recursively.
  const groupsSubjectBelongsTo = tuples
    .filter(t => t.relation === 'member' && t.subject === subject)
    .map(t => t.object);

  for (const group of groupsSubjectBelongsTo) {
    if (visited.has(group)) continue;   // cycle guard
    visited.add(group);
    if (hasRelation(object, relation, group, visited)) return true;
  }
  return false;
}

function canEdit(userId: string, docId: string): boolean {
  return hasRelation(\`doc:\${docId}\`, 'editor', \`user:\${userId}\`);
}

console.log(canEdit('alice', 'roadmap'));   // -> true  (resolved through 2 levels of group nesting)
console.log(canEdit('bob', 'budget'));      // -> true  (direct relationship, no groups involved)
console.log(canEdit('alice', 'budget'));    // -> false (no relationship exists at all)`,
  },
];

const exercise: TryItExercise = {
  prompt: 'A new tuple is added: <code>{ object: \'group:engineering\', relation: \'member\', subject: \'group:backend-team\' }</code> (the backend-team group is itself nested inside engineering), and Carol is added as a member of backend-team. Does <code>canEdit(\'carol\', \'roadmap\')</code> return true, and if so, how many levels of recursion does it take?',
  hint: 'Trace the chain: carol -> backend-team -> engineering -> all-staff -> roadmap (editor). Count how many "member of" hops that actually is.',
  solution: `// Yes -- canEdit('carol', 'roadmap') returns true, resolved through
// THREE levels of group nesting (one more than Alice's own two-level
// chain).

// The chain: carol is a member of backend-team (1st hop). backend-team
// is a member of engineering (2nd hop). engineering is a member of
// all-staff (3rd hop). all-staff has editor access to doc:roadmap
// (the terminal relationship). hasRelation() finds no DIRECT tuple for
// carol on doc:roadmap, so it looks up which groups carol belongs to
// (backend-team), recurses into hasRelation() for backend-team --
// which ALSO has no direct tuple, so it looks up backend-team's own
// groups (engineering), recurses again -- which ALSO has no direct
// tuple, looks up engineering's groups (all-staff), recurses a THIRD
// time -- and THIS call finds the direct tuple
// { object: 'doc:roadmap', relation: 'editor', subject: 'group:all-staff' },
// returning true all the way back up the call stack.

// This demonstrates exactly why the QnA calls nested groups a genuine
// problem for RBAC/ABAC: adding one more layer of group nesting
// required ZERO changes to the resolver function itself -- the same
// recursive hasRelation() correctly handles chains of any depth,
// which neither a flat RBAC permission set nor a fixed-attribute ABAC
// policy could express without being restructured for each new
// nesting level.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A relationship-tuple store is really just a more complicated, roundabout way of expressing RBAC roles — groups are basically roles with extra steps.',
    reality: 'The Try It above shows a capability RBAC roles genuinely cannot express at all: arbitrary-depth group NESTING resolved by a SINGLE, unchanged recursive function. RBAC roles are FLAT — a user either has a role or doesn\'t, with no concept of "this role inherits from that role inherits from a third role," unless the RBAC system is extended with a separate role-hierarchy feature bolted on. ReBAC\'s graph model makes nesting a NATURAL consequence of the same tuple representation, not a special case requiring new machinery.',
  },
  {
    thought: 'The <code>visited</code> cycle guard in <code>hasRelation()</code> is a minor defensive touch that rarely matters in practice.',
    reality: 'Without it, a relationship graph containing a genuine cycle (e.g. group A is a member of group B, and group B is ALSO, by some data error or intentional structure, a member of group A) would cause <code>hasRelation()</code> to recurse infinitely, crashing the request with a stack overflow. Real-world permission graphs, especially ones built from data imported across multiple systems or edited by many administrators over time, are exactly the kind of structure where an accidental cycle is a realistic, not merely theoretical, risk — the guard is load-bearing, not decorative.',
  },
];

@Component({
  selector: 'app-sec-rbac-rebac',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './rebac-a-zanzibar-style-relationship-resolver.html',
  styleUrl: './rebac-a-zanzibar-style-relationship-resolver.scss',
})
export class RebacAZanzibarStyleRelationshipResolverSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
