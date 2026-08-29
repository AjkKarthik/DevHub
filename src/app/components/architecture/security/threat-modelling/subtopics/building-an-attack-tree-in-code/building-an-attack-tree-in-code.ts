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
    heading: 'A Precisely-Defined Model, Never Built',
    points: [
      'The QnA describes an attack tree precisely: "Root: the attack goal. Branches: ways to achieve the goal. Sub-branches: steps to achieve each branch goal. AND/OR nodes: some branches require all sub-steps (AND); some require any one sub-step (OR)." That is a complete, buildable specification — but nothing on the main page ever builds one.',
      'Where STRIDE (the main page\'s own worked example) is component-oriented — walk every element of the Payment Processing API and ask "what could go wrong here?" — an attack tree is goal-oriented: start from a single attacker objective and work OUTWARD to every path that could achieve it.',
    ],
  },
  {
    heading: 'Why the AND/OR Distinction Actually Matters',
    points: [
      'An OR node means the attacker only needs to succeed at ONE of several sub-branches — each one independently reaches the parent goal, so the EASIEST sub-branch sets the real-world difficulty of the whole branch, no matter how hard the others are.',
      'An AND node means every sub-step must ALL succeed — the HARDEST sub-step is the bottleneck, and defeating just one of them (not all of them) is enough to block that entire branch. This is the concrete, buildable difference the QnA\'s one-line "AND/OR" mention doesn\'t show: the two node types combine costs completely differently when you actually try to compute an overall likelihood.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Attack Tree — Steal Customer Payment Data',
    language: 'typescript',
    code: `// Root goal reuses the exact system from the main page's own STRIDE
// codeTab: the Payment Processing API. Each leaf gets a rough
// difficulty estimate (1 = trivial, 10 = extremely hard) -- the same
// spirit as the main page's own DREAD scoring, just applied to attack
// PATHS instead of individual threats.
type AttackNode = {
  goal: string;
  kind?: 'AND' | 'OR';   // only present on non-leaf nodes
  difficulty?: number;   // only present on leaf nodes
  children?: AttackNode[];
};

const attackTree: AttackNode = {
  goal: 'Steal customer payment data',
  kind: 'OR',   // ANY ONE of these three branches achieves the root goal
  children: [
    {
      goal: 'Compromise the API server directly',
      kind: 'AND',   // ALL steps below are required for THIS branch to succeed
      children: [
        { goal: 'Find an unpatched RCE vulnerability', difficulty: 8 },
        { goal: 'Exploit it to gain shell access', difficulty: 6 },
        { goal: 'Locate and exfiltrate the payment data store', difficulty: 4 },
      ],
    },
    {
      goal: 'Compromise the database directly (bypass the API)',
      kind: 'AND',
      children: [
        { goal: 'Discover the database is internet-reachable (misconfiguration)', difficulty: 7 },
        { goal: 'Obtain or brute-force valid credentials', difficulty: 6 },
      ],
    },
    {
      goal: 'Insider threat — a compromised employee credential',
      kind: 'OR',   // EITHER of these two sub-paths is sufficient on its own
      children: [
        { goal: 'Phish an employee with database access', difficulty: 3 },
        { goal: 'Bribe or coerce an employee with database access', difficulty: 9 },
      ],
    },
  ],
};

// Roll up an overall "easiest path" difficulty: an AND node's
// difficulty is bottlenecked by its HARDEST step (max); an OR node's
// difficulty is set by its EASIEST branch (min) -- because the
// attacker will always take whichever path is cheapest for them.
function rollUp(node: AttackNode): number {
  if (node.difficulty !== undefined) return node.difficulty;
  const childScores = node.children!.map(rollUp);
  return node.kind === 'AND' ? Math.max(...childScores) : Math.min(...childScores);
}

console.log('Overall attack difficulty:', rollUp(attackTree));
// -> the "Insider threat" branch's easiest leaf (phishing, difficulty
// 3) becomes the tree's OVERALL bottleneck -- meaning the single
// weakest path to the root goal is phishing an employee, NOT
// compromising the API server (which looks intimidating on paper but
// is irrelevant once an easier OR path exists).`,
  },
];

const exercise: TryItExercise = {
  prompt: 'The main page\'s own T3 threat is "Regular user calls <code>/admin/refund</code> endpoint" (Elevation of Privilege), mitigated by "role-based authorisation check on every endpoint." If this were added as a FOURTH branch under the root OR node above, would it likely raise or lower the tree\'s overall rolled-up difficulty score — and why?',
  hint: 'A missing authorization check on an endpoint the attacker already has legitimate access to requires no phishing, no RCE, no stolen credentials at all — just calling a URL.',
  solution: `// It would almost certainly LOWER the tree's overall difficulty --
// possibly to the lowest score in the whole tree.

// The T3 threat requires no exploit, no phishing, no stolen
// credentials -- the attacker is ALREADY an authenticated user, and
// the only "step" is calling an endpoint the server should have
// rejected. As a single leaf node, this would likely score a
// difficulty of 1 or 2 (trivial), well below the "phishing an
// employee" leaf (3) that was previously the tree's bottleneck.

// This is exactly the point of building the rolled-up score: it isn't
// an abstract exercise, it directly identifies WHERE to spend
// mitigation effort first. A tree correctly built from the main
// page's own three threats would show that fixing the missing
// authorization check (T3) is a bigger overall risk-reduction win than
// hardening the API server against RCE (the AND-branch with several
// hard steps) -- the same conclusion the DREAD score on the main
// page's own codeTab reaches independently (T3 has the highest DREAD
// total of the three threats), now confirmed from a completely
// different modelling angle.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'An attack tree and a STRIDE analysis of the same system should produce roughly the same list of "top" threats, just organized differently.',
    reality: 'They can converge (as the Try It above shows — both models flag T3, the missing authorization check, as the highest-priority issue), but they don\'t have to, and that is precisely why the QnA recommends using both: STRIDE guarantees you asked "what could go wrong" about every COMPONENT, but can miss a creative multi-step PATH that spans several components; an attack tree guarantees you traced every PATH to one specific goal, but only for the goals you thought to model as tree roots in the first place. A component you never threat-modelled with STRIDE, and a goal you never built a tree for, are both blind spots — just different ones.',
  },
  {
    thought: 'A branch with a high individual difficulty score (like the RCE-based server compromise above, difficulty 8 at its hardest step) can be safely deprioritised.',
    reality: 'Only if it isn\'t sitting under an OR node alongside an easier alternative — which is exactly the case in the tree above. The rolled-up score for the WHOLE root goal is set by the single EASIEST path across every branch, not by how hard any individual branch looks in isolation. Hardening the API server against RCE is still worth doing, but it does nothing to reduce the OVERALL difficulty of reaching the root goal as long as the phishing branch remains easier — the min() at an OR node means the weakest link, not the average, determines real-world risk.',
  },
];

@Component({
  selector: 'app-sec-tm-attack-tree',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './building-an-attack-tree-in-code.html',
  styleUrl: './building-an-attack-tree-in-code.scss',
})
export class BuildingAnAttackTreeInCodeSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
