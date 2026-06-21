import { Component } from '@angular/core';
import { PageMetaComponent } from '../../../../components/shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../../components/shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../../components/shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../../components/shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../../components/shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../../components/shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../../components/shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../../components/shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../../components/shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../../components/shared/page-complete/page-complete';

@Component({
  selector: 'app-devops-release-management',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './release-management.html',
  styleUrl: './release-management.scss'
})
export class DevopsReleaseManagement {

  quickRef: QuickRefItem[] = [
    { name: 'SemVer', type: 'keyword', desc: 'Semantic Versioning 2.0 — MAJOR.MINOR.PATCH; breaking.feature.fix; increment MAJOR for breaking changes' },
    { name: 'CalVer', type: 'keyword', desc: 'Calendar Versioning — version derived from release date e.g. 2024.06.21; useful for time-based release trains' },
    { name: 'Conventional commits', type: 'keyword', desc: 'Commit message format: feat:, fix:, chore:, BREAKING CHANGE: — machine-readable; drives automated changelog + version bump' },
    { name: 'Changelog', type: 'keyword', desc: 'Human-readable log of notable changes per version; keep-a-changelog format or automated from conventional commits' },
    { name: 'Feature flag', type: 'keyword', desc: 'Toggle that enables/disables a feature at runtime without a code deploy; decouples deployment from release' },
    { name: 'Dark launch', type: 'keyword', desc: 'Deploy new code to production but keep it hidden behind a flag; test with real traffic before a public release' },
    { name: 'Progressive rollout', type: 'keyword', desc: 'Gradually increase the % of users seeing a new feature; roll back instantly if error rate spikes' },
    { name: 'Release train', type: 'keyword', desc: 'Fixed-cadence release schedule (weekly, bi-weekly); whatever is ready ships; unfinished work waits for next train' },
    { name: 'Hotfix', type: 'keyword', desc: 'Emergency fix branched from the production tag, not from main; patched, tagged, and merged back into main + development' },
    { name: 'Release candidate (RC)', type: 'keyword', desc: 'Pre-release version labelled -rc.1 that is feature-complete; only bug fixes allowed before final release' },
    { name: 'LaunchDarkly / Unleash', type: 'keyword', desc: 'Feature flag platforms — real-time flag evaluation, targeting rules, rollout percentages, kill switches' },
    { name: 'Release notes', type: 'keyword', desc: 'User-facing summary of changes in a release; extracted from changelog, reviewed by product/marketing before publish' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Semantic Versioning (SemVer 2.0)',
      points: [
        'SemVer format: MAJOR.MINOR.PATCH — e.g. 2.4.1. Each segment has a precise meaning that communicates compatibility to consumers.',
        'MAJOR bump: breaking change — API consumers MUST update their code. MINOR bump: backwards-compatible new feature. PATCH bump: backwards-compatible bug fix.',
        'Pre-release labels: 2.0.0-alpha.1, 2.0.0-beta.3, 2.0.0-rc.1 — ordered alpha < beta < rc < release. Build metadata: 2.0.0+build.42 (informational, ignored in version precedence).',
        'When should you bump MAJOR? When you remove a public API, change a function signature in a breaking way, change the serialisation format, or require callers to handle errors differently.',
        'SemVer 0.x.y: anything below 1.0.0 is considered unstable — breaking changes may happen in minor/patch. 1.0.0 marks a stable, production-ready API contract.',
      ]
    },
    {
      heading: 'Conventional commits and automated releases',
      points: [
        'Conventional commits format: <type>(<scope>): <description>. Types: feat (new feature -> MINOR bump), fix (bug fix -> PATCH bump), chore/ci/docs/refactor/test (no release bump).',
        'BREAKING CHANGE footer or ! suffix (e.g. feat!: rename endpoint) -> MAJOR bump. Example: "feat!: remove deprecated /v1/users endpoint".',
        'Tooling: standard-version, semantic-release, release-please (Google). These tools parse commit history, determine the next version, update package.json/CHANGELOG.md, create a git tag, and publish — fully automated.',
        'release-please (GitHub Action): creates a "Release PR" after each merged commit that updates changelog + version; merge the PR to trigger a release. Supports Node, Python, Java, Go, and more.',
        'Tip: enforce conventional commits in CI with commitlint + husky pre-commit hook. Reject malformed commit messages before they pollute the release history.',
      ]
    },
    {
      heading: 'Changelogs',
      points: [
        'A changelog is a curated, human-readable file (CHANGELOG.md) listing notable changes per version — what changed and why it matters to users.',
        'Keep a Changelog format: sections per version, each with Added, Changed, Deprecated, Removed, Fixed, Security sub-sections. Versions link to GitHub diff URLs.',
        'Automated vs hand-crafted: automated changelogs (from conventional commits) are fast but terse; hand-crafted release notes are more readable for end-users. Hybrid: auto-generate then have PM review.',
        'Unreleased section: keep a running [Unreleased] section at the top that accumulates changes. On release, rename it to the version. Tools do this automatically.',
        'Never delete old changelog entries — they are a historical record. Archive them with their version and date. Users often need to understand what changed between any two arbitrary versions.',
      ]
    },
    {
      heading: 'Feature flags and dark launches',
      points: [
        'Feature flags (also: feature toggles, feature switches) decouple deployment from release. You ship code to production hidden behind a flag, then enable it for users when ready.',
        'Types of flags: Release toggle (new feature in progress — temporary), Experiment toggle (A/B test — temporary), Ops toggle (kill switch for risky feature — may be permanent), Permission toggle (feature per user tier).',
        'Dark launch: enable a feature for 0% of users but route shadow traffic through the new code path to validate performance/correctness with real data before anyone sees it.',
        'Progressive rollout: start at 1% -> 5% -> 25% -> 50% -> 100%. Monitor error rate and latency at each step; automated rollback triggers if a threshold is breached.',
        'Platforms: LaunchDarkly (enterprise, real-time SDKs, targeting rules), Unleash (open-source, self-hosted), Flagsmith, Azure App Configuration (feature management), OpenFeature (CNCF standard SDK — vendor-agnostic).',
      ]
    },
    {
      heading: 'Release process and hotfixes',
      points: [
        'Release train: on a fixed cadence (e.g. every two weeks), whatever is merged into main ships. Features not ready stay behind flags. Predictability helps QA, stakeholders, and operations.',
        'Hotfix process: branch from the production tag (not from development), apply the fix, tag it (e.g. v2.4.2), deploy to production, then merge the fix back into development and main to keep history in sync.',
        'Release checklist: update CHANGELOG, bump version, tag the release, create GitHub Release with notes, notify the team, update status page if applicable, monitor metrics for 30 minutes post-deploy.',
        'Release freeze: a window before a major launch where only critical fixes are merged; feature work is blocked. Communicate the freeze window clearly and enforce it with branch protection rules.',
        'Rollback strategy: always maintain a deployable previous version. Immutable artefacts (Docker images, NuGet packages) tagged by version mean rollback is re-deploying the last good tag — not rebuilding.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Conventional Commits & Release Automation',
      language: 'bash',
      code: `# ── Conventional commit examples ─────────────────────────────────────────
# New feature → bumps MINOR
git commit -m "feat(auth): add OAuth2 PKCE flow"

# Bug fix → bumps PATCH
git commit -m "fix(api): handle null response from upstream service"

# Breaking change → bumps MAJOR
git commit -m "feat!: rename POST /users to POST /accounts

BREAKING CHANGE: /users endpoint removed; update all API clients"

# Non-release commit types (no version bump)
git commit -m "docs: update API authentication guide"
git commit -m "chore(deps): upgrade Axios to 1.6.0"
git commit -m "ci: add CodeQL SAST step to pipeline"

# ── release-please GitHub Action ──────────────────────────────────────────
# .github/workflows/release-please.yml
# on:
#   push:
#     branches: [main]
# jobs:
#   release-please:
#     runs-on: ubuntu-latest
#     steps:
#       - uses: google-github-actions/release-please-action@v4
#         with:
#           release-type: node
#           package-name: my-app
# → Creates a "Release PR" after every merged commit
# → Merge the PR to tag + publish

# ── semantic-release config (.releaserc.json) ─────────────────────────────
# {
#   "branches": ["main"],
#   "plugins": [
#     "@semantic-release/commit-analyzer",
#     "@semantic-release/release-notes-generator",
#     "@semantic-release/changelog",
#     "@semantic-release/npm",
#     "@semantic-release/github"
#   ]
# }

# ── Tag and GitHub Release manually ──────────────────────────────────────
git tag -a v2.5.0 -m "Release v2.5.0 — OAuth2 PKCE support"
git push origin v2.5.0

gh release create v2.5.0 \\
  --title "v2.5.0 — OAuth2 PKCE" \\
  --notes-file CHANGELOG_FRAGMENT.md \\
  --latest`,
    },
    {
      label: 'Feature Flags (OpenFeature + LaunchDarkly)',
      language: 'typescript',
      code: `// ── OpenFeature SDK (vendor-agnostic standard) ───────────────────────────
import { OpenFeature } from '@openfeature/server-sdk';
import { LaunchDarklyProvider } from '@openfeature/launchdarkly-provider';

// Initialise once at app startup
await OpenFeature.setProviderAndWait(
  new LaunchDarklyProvider(process.env['LD_SDK_KEY']!)
);

const client = OpenFeature.getClient();

// ── Evaluate a boolean flag ───────────────────────────────────────────────
async function getCheckoutPage(userId: string, userTier: string) {
  const ctx = { targetingKey: userId, tier: userTier };

  const newCheckoutEnabled = await client.getBooleanValue(
    'new-checkout-flow',   // flag key
    false,                  // default (safe fallback)
    ctx
  );

  return newCheckoutEnabled
    ? renderNewCheckout()
    : renderLegacyCheckout();
}

// ── Kill switch pattern ───────────────────────────────────────────────────
async function processPayment(order: Order) {
  const useNewProcessor = await client.getBooleanValue(
    'payment-processor-v2',
    false,
    { targetingKey: order.userId }
  );

  return useNewProcessor
    ? processWithV2Processor(order)
    : processWithLegacyProcessor(order);
  // Flip flag to false in LD dashboard — takes effect in milliseconds
}

// ── Self-hosted Unleash (open-source) ────────────────────────────────────
import { initialize } from 'unleash-client';

const unleash = initialize({
  url: 'https://unleash.internal/api',
  appName: 'my-service',
  customHeaders: { Authorization: '*:default.secret' },
});
await unleash.start();

function isEnabled(flag: string, userId: string): boolean {
  return unleash.isEnabled(flag, { userId });
}

interface Order { userId: string; }
declare function renderNewCheckout(): void;
declare function renderLegacyCheckout(): void;
declare function processWithV2Processor(o: Order): void;
declare function processWithLegacyProcessor(o: Order): void;`,
    },
    {
      label: 'CHANGELOG & Hotfix Process',
      language: 'bash',
      code: `# ── CHANGELOG.md format (keep-a-changelog) ───────────────────────────────
# # Changelog
# All notable changes to this project are documented here.
# Format: https://keepachangelog.com/en/1.1.0/
# Versioning: https://semver.org/
#
# ## [Unreleased]
# ### Added
# - OAuth2 PKCE flow for public clients
#
# ## [2.4.1] - 2024-06-21
# ### Fixed
# - Handle null response from upstream payment service (#342)
#
# ## [2.4.0] - 2024-06-10
# ### Added
# - Dark mode toggle persisted to localStorage
# ### Changed
# - Dashboard loads metrics 40% faster via caching layer
# ### Deprecated
# - GET /v1/users endpoint — use GET /v2/accounts instead
#
# [Unreleased]: https://github.com/org/repo/compare/v2.4.1...HEAD
# [2.4.1]: https://github.com/org/repo/compare/v2.4.0...v2.4.1
# [2.4.0]: https://github.com/org/repo/compare/v2.3.0...v2.4.0

# ── Hotfix process ────────────────────────────────────────────────────────
# 1. Branch from the production tag (NOT from development)
git checkout v2.4.0
git checkout -b hotfix/payment-null-crash

# 2. Apply the fix
git commit -m "fix(payment): handle null upstream response in processOrder"

# 3. Tag the hotfix release
git tag -a v2.4.1 -m "Hotfix: payment null crash"
git push origin v2.4.1

# 4. Deploy v2.4.1 to production

# 5. Merge hotfix back into BOTH main and development
git checkout main
git merge hotfix/payment-null-crash
git push origin main

git checkout development
git merge hotfix/payment-null-crash
git push origin development

# 6. Clean up
git branch -d hotfix/payment-null-crash
git push origin --delete hotfix/payment-null-crash

# ── Release workflow on tag push ──────────────────────────────────────────
# .github/workflows/release.yml
# on:
#   push:
#     tags: ['v*.*.*']
# steps:
#   - run: npm test
#   - run: npm run build
#   - run: npm publish --access public
#   - uses: softprops/action-gh-release@v2
#     with:
#       body_path: CHANGELOG_FRAGMENT.md
#       files: dist/**/*`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Bumping MINOR for breaking changes',
      wrong: `// v1.4.0 -> renaming a required field
interface User { username: string; }  // old
interface User { displayName: string; }  // new — BREAKING`,
      right: `// Breaking change = MAJOR bump: v1.4.0 -> v2.0.0
// Use feat! or add BREAKING CHANGE footer in the commit
// Automated tools will bump MAJOR automatically`,
      explanation: 'Breaking changes are MAJOR bumps regardless of how small the change seems. Consumer code will break — they must opt in by updating their dependency and testing the upgrade.'
    },
    {
      title: 'Committing directly to main instead of a hotfix branch',
      wrong: `git checkout main
git commit -m "fix: urgent payment crash"
git push origin main
# main is now ahead of the production tag with unreleased features`,
      right: `git checkout v2.4.0          # branch from production tag
git checkout -b hotfix/payment-crash
# fix, test, tag v2.4.1, deploy
# then merge back into main AND development`,
      explanation: 'Main may contain unreleased features not ready for production. Always hotfix from the production tag to ship only the fix, not half-finished work.'
    },
    {
      title: 'Feature flags that never get cleaned up',
      wrong: `// Flag created in 2022 for "new checkout" launch
// New checkout is now the ONLY checkout — flag is 100% on
if (unleash.isEnabled('new-checkout-flow-2022', ctx)) {
  return renderNewCheckout(); // dead branch if disabled
}`,
      right: `// TODO: remove flag after 2024-07-01 (fully rolled out)
// Type: release toggle | Owner: payments-team | Created: 2024-06-01
if (isNewCheckoutEnabled(ctx)) { return renderNewCheckout(); }`,
      explanation: 'Stale flags accumulate into unmaintainable dead code. Add a type, owner, and expiry at creation. Audit quarterly; archive flags that are permanently on or permanently off.'
    },
    {
      title: 'Using `git tag -f` to move a published tag',
      wrong: `# "oops, forgot to update version in package.json"
git add package.json
git commit --amend
git tag -f v2.4.0      # force-moves the published tag — DANGEROUS`,
      right: `# Create a new patch release instead
git add package.json
git commit -m "chore: fix missing version bump in package.json"
git tag v2.4.1
git push origin v2.4.1`,
      explanation: 'Published tags are immutable. Other teams, CI systems, and registries cache the old tag — moving it silently changes what they receive and breaks reproducibility. Create v2.4.1 instead.'
    },
    {
      title: 'Forgetting to merge the hotfix back into development',
      wrong: `# Hotfix deployed from hotfix branch
# hotfix branch deleted
# Next release cut from development — the fix is MISSING in the next release`,
      right: `# After tagging and deploying:
git checkout development
git merge hotfix/payment-crash
git push origin development
# development now contains the fix; future releases include it`,
      explanation: 'A hotfix applied only to the release tag will be lost when the next regular release is cut from development. Always merge hotfixes into all long-lived branches immediately after deploying.'
    },
    {
      title: 'Writing changelog entries from the developer perspective',
      wrong: `## [2.5.0]
### Changed
- Refactored PaymentService to use Strategy pattern
- Extracted retry logic into RetryHelper class`,
      right: `## [2.5.0]
### Changed
- Payment retries are now more reliable — transient network errors
  automatically retry up to 3 times with exponential back-off`,
      explanation: 'Changelogs are read by users and stakeholders, not internal developers. Write entries that describe impact ("what does this mean for me?") not implementation details ("how did we do it?").'
    },
  ];

  challenge: Challenge = {
    title: 'SemVer Version Bumper',
    language: 'typescript',
    description: `Write a function \`determineNextVersion(current: string, commits: string[]): string\` that:
- Parses the current SemVer version (e.g. "1.4.2")
- Analyses commit messages in conventional commits format
- Returns the next version string following SemVer rules:
  - Any commit containing "BREAKING CHANGE" or with a "!" suffix (e.g. "feat!:") → MAJOR bump
  - Any "feat:" commit (no breaking change) → MINOR bump
  - Any "fix:", "perf:", or "revert:" commit (no feat, no breaking) → PATCH bump
  - All other types (chore, docs, ci, etc.) → no version change; return current version
- MAJOR bump resets MINOR and PATCH to 0; MINOR bump resets PATCH to 0`,
    hints: [
      'Parse major, minor, patch from the current string using split(".")',
      'Check for BREAKING CHANGE footer or "!" suffix before checking for feat/fix',
      'Process all commits to find the highest-priority bump type (MAJOR > MINOR > PATCH)',
      'Return the version string as "major.minor.patch"',
    ],
    starterCode: `function determineNextVersion(current: string, commits: string[]): string {
  const [major, minor, patch] = current.split('.').map(Number);

  // TODO: determine bump type from commits
  // TODO: return the bumped version string

  return current;
}

// Test cases:
console.log(determineNextVersion("1.4.2", [
  "feat: add dark mode",
  "fix: correct typo in error message"
])); // "1.5.0"

console.log(determineNextVersion("1.4.2", [
  "feat!: rename /users to /accounts",
  "fix: correct typo"
])); // "2.0.0"

console.log(determineNextVersion("1.4.2", [
  "chore: update dependencies",
  "docs: improve README"
])); // "1.4.2"

console.log(determineNextVersion("1.4.2", [
  "fix: handle null response",
  "perf: cache database results"
])); // "1.4.3"`,
    solution: `function determineNextVersion(current: string, commits: string[]): string {
  const [major, minor, patch] = current.split('.').map(Number);

  let bumpType: 'none' | 'patch' | 'minor' | 'major' = 'none';

  for (const commit of commits) {
    const isBreaking =
      commit.includes('BREAKING CHANGE') ||
      /^[a-z]+!:/.test(commit);

    if (isBreaking) {
      bumpType = 'major';
      break; // Can't go higher
    }

    if (/^feat[:(]/.test(commit) && bumpType !== 'major') {
      bumpType = 'minor';
    } else if (/^(fix|perf|revert)[:(]/.test(commit) && bumpType === 'none') {
      bumpType = 'patch';
    }
  }

  if (bumpType === 'major') return \`\${major + 1}.0.0\`;
  if (bumpType === 'minor') return \`\${major}.\${minor + 1}.0\`;
  if (bumpType === 'patch') return \`\${major}.\${minor}.\${patch + 1}\`;
  return current;
}`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'You add a new optional parameter with a backward-compatible default to a public function. Which SemVer segment do you bump?',
      options: ['MAJOR — any API change is breaking', 'MINOR — new backwards-compatible feature', 'PATCH — only internal change', 'No bump needed'],
      answer: 1,
      explanation: 'Adding an optional parameter with a default is a backwards-compatible new feature → MINOR bump. Existing callers still work without changing their code.'
    },
    {
      q: 'What does a "dark launch" mean in the context of release management?',
      options: [
        'Deploying a release at night to reduce user impact',
        'Deploying code to production behind a flag enabled for 0% of users to test with real infrastructure',
        'A release that is kept secret from the public until a marketing announcement',
        'Deploying only to the dark mode version of the UI',
      ],
      answer: 1,
      explanation: 'A dark launch deploys the new code path to production but with the feature flag enabled for 0% of users. It validates performance and correctness with real traffic before anyone sees the feature.'
    },
    {
      q: 'What is the correct hotfix branching strategy?',
      options: [
        'Branch from main, fix, merge back to development',
        'Branch from development, fix, tag, merge to main',
        'Branch from the production tag, fix, tag, merge into both main and development',
        'Commit directly to main with a hotfix label',
      ],
      answer: 2,
      explanation: 'Hotfixes must branch from the production tag to avoid shipping unreleased features. After deploying, the fix must be merged back into BOTH main and development so future releases include it.'
    },
    {
      q: 'A commit message reads: "feat!: remove deprecated POST /v1/login". What version bump does this trigger?',
      options: ['PATCH', 'MINOR', 'MAJOR', 'No bump — chore commits are excluded'],
      answer: 2,
      explanation: 'The "!" after the type (feat!) signals a breaking change → MAJOR bump. semantic-release and release-please both parse this pattern and increment the major version, resetting minor and patch to 0.'
    },
    {
      q: 'Which flag type is designed to be permanent (not temporary)?',
      options: [
        'Release toggle — enables a feature while it is in development',
        'Experiment toggle — A/B test variant selection',
        'Ops toggle (kill switch) — disables a feature if it causes production problems',
        'Permission toggle — grants feature access to specific user tiers',
      ],
      answer: 2,
      explanation: 'Ops toggles (kill switches) are designed to be permanent circuit breakers. Release and experiment toggles should be removed after the feature ships or the experiment concludes.'
    },
    {
      q: 'Your team ships every two weeks on a fixed schedule. Which release model is this?',
      options: ['Hotfix cadence', 'Continuous deployment', 'Release train', 'Progressive rollout'],
      answer: 2,
      explanation: 'A release train ships on a fixed cadence (e.g. every two weeks). Features that miss the train wait for the next one. This gives stakeholders predictability and lets QA plan around a known release window.'
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you handle a dependency that breaks SemVer — publishes a breaking change in a PATCH release?',
      a: 'Pin the dependency to an exact version or a narrow range (e.g. "axios": "1.6.3" not "^1.6.3"). Add the dependency to your Renovate/Dependabot config for manual review on updates rather than auto-merge. If the breakage is severe, open an issue with the upstream maintainer and consider a fork or a lightweight wrapper that absorbs the break.'
    },
    {
      q: 'When should you use CalVer instead of SemVer?',
      a: 'CalVer is a natural fit when the release cadence IS the signal — for example, a quarterly report tool (2024.Q2), a data pipeline with dated snapshots (20240621.1), or a platform release on a fixed calendar (Ubuntu 24.04). SemVer is better when consumers need to understand compatibility from the version number alone, such as libraries and APIs. Many projects use a hybrid: 2024.6.0 where the last segment is a SemVer PATCH counter.'
    },
    {
      q: 'How do you avoid stale feature flags accumulating in the codebase?',
      a: 'Treat flags like technical debt: assign an owner, type, and expiry date at creation. Add a lint rule or custom test that fails if a flag is older than 4 weeks (release toggles) or 12 weeks (experiment toggles) without an explicit extension. In LaunchDarkly/Unleash, archive flags when they are retired. Run a quarterly "flag audit" to remove flags that are permanently enabled or permanently disabled.'
    },
    {
      q: 'Should 0.x.y releases follow SemVer?',
      a: 'SemVer 2.0 explicitly says that below 1.0.0, anything MAY change and the spec does not apply strictly. In practice, most teams use 0.x.y as a signal that the API is unstable. When you reach 1.0.0, you commit to the compatibility promise. During 0.x.y development, treat MINOR bumps as potentially breaking so consumers pin tightly and always review the diff before upgrading.'
    },
    {
      q: 'What is the difference between release notes and a changelog?',
      a: 'A changelog (CHANGELOG.md) is a comprehensive, cumulative, developer-oriented record of all changes in every version — machine-parseable, every commit type included. Release notes are a curated, user-facing summary for a specific release — written in plain language, highlighting features that matter to end users, reviewed by product/marketing before publishing. Many teams auto-generate a changelog and then hand-write release notes from it for major versions.'
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Release management covers SemVer versioning, conventional commit-driven automation, feature flags for decoupled rollouts, hotfix branching from production tags, and changelog discipline.',
    mustKnow: [
      'SemVer MAJOR.MINOR.PATCH: breaking.feature.fix — MAJOR resets MINOR+PATCH to 0',
      'Conventional commits (feat:, fix:, feat!:) drive automated version bumps and changelog generation',
      'Feature flags decouple deployment (code goes to prod) from release (users see it)',
      'Progressive rollout: gradually increase % with automated rollback on error spike',
      'Hotfix: always branch from the production tag, not from development',
      'Merge hotfixes back into ALL long-lived branches (main AND development)',
      'Changelog entries are user-facing — write impact, not implementation detail',
    ],
    interviewFocus: [
      'Explain SemVer and when to use each bump type — give examples of what is and is not a MAJOR change',
      'What is a feature flag and how does it differ from a deployment? Give a real use case',
      'Walk through the hotfix process: where do you branch, how do you tag, where do you merge?',
      'How would you automate versioning and changelog generation from commit messages?',
      'What are the risks of stale feature flags and how do you prevent them?',
    ],
  };
}
