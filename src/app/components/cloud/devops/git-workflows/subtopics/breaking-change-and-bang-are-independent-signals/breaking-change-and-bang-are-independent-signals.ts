import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../../shared/page-meta/page-meta';
import { TheoryBlockComponent, TheoryPoint } from '../../../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../../shared/code-block/code-block';
import { TryItComponent, TryItExercise } from '../../../../../shared/try-it/try-it';
import { MisconceptionsComponent, Misconception } from '../../../../../shared/misconceptions/misconceptions';
import { SubtopicNavComponent } from '../../../../../shared/subtopic-nav/subtopic-nav';
import { SubtopicEyebrowComponent } from '../../../../../shared/subtopic-eyebrow/subtopic-eyebrow';

@Component({
  standalone: true,
  imports: [PageMetaComponent, TheoryBlockComponent, CodeBlockComponent, TryItComponent, MisconceptionsComponent, SubtopicNavComponent, SubtopicEyebrowComponent],
  templateUrl: './breaking-change-and-bang-are-independent-signals.html',
  styleUrl: './breaking-change-and-bang-are-independent-signals.scss'
})
export class BreakingChangeAndBangAreIndependentSignalsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own breaking-change example shows BOTH signals together, as if that were the required form',
      points: [
        'The main page\'s own Conventional Commits + Release code tab shows exactly one breaking-change example: feat(api)!: remove deprecated v1 endpoints, followed by a body containing BREAKING CHANGE: /api/v1/* routes removed. Migrate to /api/v2/*. Every reader sees the ! and the BREAKING CHANGE: footer used TOGETHER, with no indication that either one alone is sufficient on its own.',
        'The Conventional Commits specification\'s own rules describe these as two INDEPENDENT signals, not a paired requirement: "If included in the type/scope prefix, breaking changes MUST be indicated by a ! immediately before the :." Separately: "If included as a footer, a breaking change MUST consist of the uppercase text BREAKING CHANGE, followed by a colon, space, and description."',
        'The spec is explicit that using one makes the other optional, not mandatory: "If ! is used, BREAKING CHANGE: MAY be omitted from the footer section, and the commit description SHALL be used to describe the breaking change." A bare feat(api)!: remove deprecated v1 endpoints, with no footer at all, is a fully spec-compliant breaking-change commit on its own.',
      ]
    },
    {
      heading: 'Why this distinction matters for the main page\'s own semantic-release pipeline',
      points: [
        'The main page\'s own theory ties breaking changes directly to automated version bumping: "breaking! (major bump)" and its .releaserc.json code tab shows semantic-release consuming these commits automatically. Since ! alone is spec-compliant, a team writing feat(api)!: some change with no footer at all still correctly triggers a MAJOR version bump under semantic-release\'s own commit-analyzer — the main page\'s own example just never demonstrates this minimal, equally valid form.',
        'The two forms serve genuinely different communication purposes even though both are valid on their own: ! is a compact, always-scannable signal visible in a one-line git log output (git log --oneline immediately shows which commits are breaking, without needing to open the full commit body). A BREAKING CHANGE: footer, without a !, is easy to miss in a one-line log but allows a longer, detailed migration description in the commit body — useful when the ! alone would be too terse to explain WHAT specifically breaks and how to migrate.',
        'A team relying on git log --oneline scans to spot breaking changes at a glance (a common workflow before a release) would systematically MISS any breaking change signaled only via a BREAKING CHANGE: footer with no ! — since the one-line summary would show only the type/scope/description, giving no visual indication anything breaking is inside. This is a real, practical reason to prefer using ! even when a full footer is also included, rather than treating the footer alone as sufficient.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three equally spec-compliant ways to signal the SAME breaking change',
      language: 'bash',
      code: `# Per the Conventional Commits spec's own rules, all three of these
# are fully valid, and semantic-release treats all three identically
# as a MAJOR-version-bump-triggering commit:

# --- Form 1: the main page's own example -- BOTH signals together ---
git commit -m "feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: /api/v1/* routes removed. Migrate to /api/v2/*."

# --- Form 2: "!" alone -- the spec's own minimal valid form ---
# Per the spec: "If ! is used, BREAKING CHANGE: MAY be omitted from
# the footer section, and the commit description SHALL be used to
# describe the breaking change."
git commit -m "feat(api)!: remove deprecated v1 endpoints"
# No footer needed -- the description itself IS the breaking-change
# explanation, and "!" alone is sufficient to trigger a major bump.

# --- Form 3: footer alone, no "!" -- also spec-compliant ---
git commit -m "feat(api): remove deprecated v1 endpoints

BREAKING CHANGE: /api/v1/* routes removed. Migrate to /api/v2/*."
# The type/scope prefix has NO "!" -- but the footer alone is per
# the spec's own separate rule for footer-based signaling, and this
# is STILL a valid, MAJOR-bump-triggering breaking change commit.`,
    },
    {
      label: 'Why "!" matters even when you also write a footer',
      language: 'bash',
      code: `# git log --oneline over the last few commits, comparing Form 1
# (with "!") against Form 3 (footer only, no "!"):

# Form 1 (main page's own example) -- "!" visible at a glance:
# a3f9c21 feat(api)!: remove deprecated v1 endpoints
# 9b2e410 fix(cart): prevent duplicate items
# 7c1a880 feat(search): add debounced search

# Form 3 -- footer-only breaking change -- INDISTINGUISHABLE from a
# normal feat commit in the one-line log:
# b4e7f32 feat(api): remove deprecated v1 endpoints    <- looks routine!
# 9b2e410 fix(cart): prevent duplicate items
# 7c1a880 feat(search): add debounced search

# A release manager scanning "git log --oneline" before cutting a
# release to spot anything breaking would catch Form 1 instantly,
# but would need to open EVERY commit's full body to catch Form 3 --
# even though semantic-release itself parses both identically and
# triggers the correct major bump either way.
#
# Practical takeaway: always include "!" for human scannability,
# even on commits that also carry a full BREAKING CHANGE: footer
# for the detailed migration description -- the two signals solve
# different problems (machine-parseable trigger vs. human-readable
# detail), and using only the footer sacrifices the human-scannable
# one.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a commit with the summary line "feat(payments): switch to Stripe\'s new PaymentIntents API" and a footer reading "BREAKING CHANGE: The legacy Charges API integration is removed; callers must migrate to createPaymentIntent()." — no "!" anywhere in the type/scope prefix. A teammate reviewing the PR says "this isn\'t a valid breaking change commit, you need the ! for semantic-release to pick it up." Using this subtopic\'s theory, evaluate whether the teammate is correct, and explain what — if anything — should actually be fixed before merging.',
    hint: 'Per this subtopic\'s theory, does the Conventional Commits spec require BOTH the "!" and the "BREAKING CHANGE:" footer together, or does either one alone satisfy the spec\'s own breaking-change rule? Will semantic-release\'s commit-analyzer still correctly trigger a major version bump from the footer alone?',
    solution: 'The teammate is technically incorrect about validity, but has a reasonable practical point. Per this subtopic\'s theory, the Conventional Commits spec defines the "!" and the "BREAKING CHANGE:" footer as two INDEPENDENT signals — the footer rule states a breaking change "MUST consist of the uppercase text BREAKING CHANGE, followed by a colon, space, and description," with no requirement that "!" also be present. semantic-release\'s commit-analyzer parses both forms and will correctly trigger a MAJOR version bump from the footer alone, exactly as it would from "!" alone — so the commit is fully spec-compliant and will version-bump correctly as written; nothing needs to change for automation to work. However, per this subtopic\'s theory, the footer-only form has a real practical downside the teammate may be gesturing at without naming precisely: it is invisible in a git log --oneline scan, unlike a commit with "!" in the prefix. The genuinely useful fix before merging is not "this is invalid" but "add ! to the prefix for human scannability too" — changing feat(payments): to feat(payments)!: while keeping the existing footer, so the commit is both machine-correct (already true) and easily spotted by a human scanning commit history before a release (not yet true).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Conventional Commits breaking change requires BOTH the "!" in the type/scope prefix AND a BREAKING CHANGE: footer to be valid — using only one or the other is incomplete or non-compliant.',
      reality: 'This subtopic\'s theory quotes the specification directly: "If ! is used, BREAKING CHANGE: MAY be omitted from the footer section" — the two are independent, alternative signals. Either one alone is fully spec-compliant, and both semantic-release and other Conventional Commits tooling correctly parse either form as a breaking change on its own.'
    },
    {
      thought: 'Since "!" alone and a "BREAKING CHANGE:" footer alone are both fully valid and trigger identical automated version bumps, it doesn\'t matter in practice which one a team uses — they are functionally interchangeable.',
      reality: 'This subtopic\'s second code example shows a real practical difference: "!" is visible in a compact git log --oneline scan, while a footer-only breaking change is indistinguishable from an ordinary commit at that same glance — a release manager scanning commit history for anything breaking would miss footer-only signals without opening every commit\'s full body.'
    },
    {
      thought: 'The main page\'s own single example (feat(api)!: ... with a BREAKING CHANGE: footer) represents the one correct, complete way to write a breaking-change commit under Conventional Commits.',
      reality: 'This subtopic\'s theory and first code example show the main page\'s own example is one of at least three equally spec-compliant forms — "!" with a footer, "!" alone with no footer, and a footer alone with no "!" — all three are parsed identically by semantic-release\'s commit-analyzer and trigger the same major version bump.'
    }
  ];
}
