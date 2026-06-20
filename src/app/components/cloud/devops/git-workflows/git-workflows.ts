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
  selector: 'app-devops-git-workflows',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './git-workflows.html',
  styleUrl: './git-workflows.scss'
})
export class DevopsGitWorkflows {

  quickRef: QuickRefItem[] = [
    { name: 'Trunk-Based Dev',    type: 'keyword', desc: 'All developers commit to one main branch; feature branches live < 1–2 days — enables CI' },
    { name: 'Gitflow',            type: 'keyword', desc: 'Long-lived develop + release + hotfix branches; higher overhead, good for versioned releases' },
    { name: 'GitHub Flow',        type: 'keyword', desc: 'Lightweight: feature branch → PR → merge to main → deploy; good for web apps with continuous delivery' },
    { name: 'Branch Protection',  type: 'keyword', desc: 'GitHub/GitLab rule requiring PR reviews + status checks before merging to main' },
    { name: 'Conventional Commits', type: 'keyword', desc: 'Commit message format: type(scope): description — enables automated changelogs and semantic versioning' },
    { name: 'Squash Merge',       type: 'keyword', desc: 'Collapses all PR commits into one on main — clean history; loses granular commit context' },
    { name: 'Rebase',             type: 'keyword', desc: 'Replays commits on top of a new base — linear history, but rewrites SHAs (avoid on shared branches)' },
    { name: 'Cherry-pick',        type: 'keyword', desc: 'Applies a specific commit to another branch — used for hotfixes backported to release branches' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Git Workflow Strategies',
      points: [
        'A git workflow defines how code moves from a developer\'s keyboard to production via branches, merges, and reviews.',
        'The right workflow depends on: team size, release cadence, whether you version releases, and CI/CD maturity.',
        'Core tradeoffs: trunk-based development maximises CI speed; Gitflow maximises release control. Most teams should trend toward TBD as CI/CD matures.',
        'No workflow survives contact with a team that doesn\'t agree on it — pick one, document it, and enforce it consistently.',
      ]
    },
    {
      heading: 'Trunk-Based Development (TBD)',
      points: [
        'All developers commit directly to main (trunk) or use short-lived feature branches (< 1–2 days) that are merged frequently.',
        'Requires: strong automated test suite, CI that runs on every commit, feature flags for incomplete features.',
        'Benefits: eliminates long-lived merge conflicts, forces small batch sizes, enables true continuous integration.',
        'Elite DORA performers predominantly use TBD — long-lived branches are inversely correlated with deployment frequency.',
        'The key discipline: if your branch lives more than 2 days, you are not doing trunk-based development — you are doing Gitflow with better intentions.',
      ]
    },
    {
      heading: 'Gitflow',
      points: [
        'Gitflow (Vincent Driessen, 2010): main + develop + feature/* + release/* + hotfix/* branches.',
        'Flow: features branch from develop → merge to develop → release branch cut → tested → merged to main + develop → tagged.',
        'Hotfixes branch from main, merged to main + develop.',
        'Best for: versioned software (npm packages, desktop apps, SDKs) where multiple versions must be maintained simultaneously.',
        'Problems: long-lived branches cause painful merge conflicts; slow feedback loop; release branches create integration theatre.',
      ]
    },
    {
      heading: 'GitHub Flow',
      points: [
        'Simplest model: main is always deployable → create feature branch → open PR → review → CI passes → merge → deploy.',
        'No develop or release branches — main IS the release branch.',
        'Best for: web applications with continuous delivery where "latest main" is always production.',
        'Variants: add environment branches (main → staging → prod) if deployment is not fully automated.',
      ]
    },
    {
      heading: 'Branch Protection & PR Reviews',
      points: [
        'Branch protection rules (GitHub/GitLab) prevent direct pushes to main, require PR reviews, and enforce status check passing.',
        'Minimum recommended rules for main: require at least 1 reviewer approval, require CI checks to pass, dismiss stale reviews on new pushes.',
        'CODEOWNERS file: auto-assigns reviewers based on file paths. Changes to /src/payments/ automatically request the payments team.',
        'PR size matters: PRs over 400 lines of change have significantly lower review effectiveness. Split large changes into stacked PRs.',
      ]
    },
    {
      heading: 'Conventional Commits & Semantic Versioning',
      points: [
        'Conventional Commits format: `type(scope): description` — e.g. `feat(auth): add OAuth2 login`, `fix(cart): prevent duplicate items`.',
        'Types: feat (new feature → minor bump), fix (bug fix → patch bump), breaking! (major bump), docs, chore, refactor, test, ci.',
        'Conventional commits enable automated changelog generation (semantic-release, release-please) and automatic version bumping.',
        'Semantic versioning (SemVer): MAJOR.MINOR.PATCH — breaking changes bump MAJOR, new features bump MINOR, fixes bump PATCH.',
        'Teams using conventional commits + semantic-release eliminate the manual step of deciding what version to tag before release.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Branch Protection (GitHub CLI)',
      language: 'bash',
      code: `# Configure branch protection rules via GitHub CLI

# Require PR review + CI before merging to main
gh api repos/OWNER/REPO/branches/main/protection \\
  --method PUT \\
  --field required_status_checks='{"strict":true,"contexts":["ci/build","ci/test"]}' \\
  --field enforce_admins=true \\
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \\
  --field restrictions=null

# CODEOWNERS — auto-assign reviewers by path
# .github/CODEOWNERS
cat > .github/CODEOWNERS << 'EOF'
# Global fallback — payments team reviews everything
*                       @acme/platform-team

# Payments module — payments team must review
/src/payments/          @acme/payments-team

# Infrastructure changes — infra team must review
/terraform/             @acme/infra-team
/.github/               @acme/platform-team
EOF

# Typical PR workflow
git checkout -b feat/add-oauth-login
# ... make changes ...
git add -p                           # stage hunks interactively
git commit -m "feat(auth): add OAuth2 Google login"
git push origin feat/add-oauth-login
gh pr create --title "feat(auth): add OAuth2 Google login" \\
             --body "Closes #123. Adds Google OAuth via passport-google-oauth20." \\
             --reviewer "@acme/auth-team"`,
    },
    {
      label: 'Conventional Commits + Release',
      language: 'bash',
      code: `# Conventional commit message format:
# <type>[optional scope]: <description>
# [optional body]
# [optional footer(s)]

# Examples:
git commit -m "feat(auth): add OAuth2 login with Google"
git commit -m "fix(cart): prevent duplicate items on rapid add"
git commit -m "perf(search): add index on products.name column"
git commit -m "docs(api): update authentication endpoint examples"
git commit -m "chore(deps): bump express from 4.18.1 to 4.19.2"

# Breaking change — bumps MAJOR version:
git commit -m "feat(api)!: remove deprecated v1 endpoints

BREAKING CHANGE: /api/v1/* routes removed. Migrate to /api/v2/*."

# semantic-release in CI (.releaserc.json):
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

# On merge to main, semantic-release:
# 1. Analyses commits since last tag
# 2. Determines version bump (feat→minor, fix→patch, BREAKING→major)
# 3. Generates CHANGELOG.md entry
# 4. Publishes npm package
# 5. Creates GitHub Release with release notes`,
    },
    {
      label: 'Trunk-Based Dev with Feature Flags',
      language: 'bash',
      code: `# Trunk-Based Development daily workflow

# 1. Always start from a fresh main
git checkout main && git pull origin main

# 2. Create a short-lived branch (MAX 1-2 days)
git checkout -b feat/payment-retry-logic

# 3. Make small, focused commits
git commit -m "feat(payments): add exponential backoff retry"
git commit -m "test(payments): add retry logic unit tests"

# 4. Rebase onto latest main frequently (not merge — keeps history linear)
git fetch origin
git rebase origin/main

# 5. Open PR, get review, merge same day
gh pr create --title "feat(payments): add retry logic"
# CI runs → review approved → squash merge

# For incomplete features: use a feature flag, not a long-lived branch
# feature-flags.ts:
# export const FLAGS = {
#   paymentRetryV2: process.env['FLAG_PAYMENT_RETRY_V2'] === 'true',
# };

# function processPayment(order: Order) {
#   if (FLAGS.paymentRetryV2) {
#     return processWithRetry(order);  // new path — deployed but disabled
#   }
#   return processLegacy(order);       // old path — still running
# }

# Ship to main with FLAG_PAYMENT_RETRY_V2=false
# Enable in prod when ready — no new deployment needed`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Long-lived feature branches (> 2 days)',
      wrong: `# Feature branch created January 1st
# Branch diverges for 3 weeks
# Merge to main January 22nd
# 200 files changed, 47 merge conflicts
# "Integration hell"`,
      right: `# Feature branch created Monday
# Commits pushed daily, PR opened Tuesday
# Merged Wednesday — 12 files changed, 0 conflicts
# Small batches = easy merges`,
      explanation: 'Every day a branch diverges from main, merge conflicts compound. Branches older than 2 days are the single strongest predictor of integration pain. Break large features into merge-able slices behind feature flags.',
    },
    {
      title: 'Committing directly to main',
      wrong: `# Developer pushes directly to main
# No review, no CI gate
# Broken code ships to production at 4:58 PM Friday`,
      right: `# Branch protection: main requires PR + CI
# All changes go through at least 1 reviewer
# CI must pass before merge button is enabled`,
      explanation: 'Direct commits to main bypass code review and CI. Branch protection rules are the guardrail — they cost nothing to configure and prevent entire categories of production incidents.',
    },
    {
      title: 'Non-descriptive commit messages',
      wrong: `git commit -m "fix"
git commit -m "wip"
git commit -m "final"
git commit -m "actually final this time"
git commit -m "reviewed"`,
      right: `git commit -m "fix(auth): resolve token expiry race condition on concurrent requests"
git commit -m "feat(search): add debounced full-text search with 300ms delay"
git commit -m "refactor(cart): extract price calculation to CartPricingService"`,
      explanation: 'Commit messages are communication to future maintainers (including yourself). Vague messages make git log, git blame, and git bisect useless. Use conventional commits: type(scope): description.',
    },
    {
      title: 'Merging without squashing WIP commits',
      wrong: `# PR history:
# "wip", "fix", "more fix", "review feedback", "lint"
# All 8 commits merged individually to main
# git log on main is unreadable`,
      right: `# Squash merge: entire PR = 1 commit on main
# "feat(cart): add quantity selector with +/- buttons"
# git log is a clean, readable feature history`,
      explanation: 'WIP commits are development scaffolding, not documentation. Squash merge collapses them into one meaningful commit on main. Use squash for feature work; use merge commits for long-lived branch integrations where individual commit history matters.',
    },
    {
      title: 'Force-pushing to shared branches',
      wrong: `# Developer rebases main locally
# git push --force origin main
# All other developers' local main history is now invalid
# 3 colleagues lose in-progress work`,
      right: `# Never force-push to shared branches (main, develop, release/*)
# Force-push only to your own feature branch, before PR is reviewed
# Use --force-with-lease instead of --force as a safety net`,
      explanation: 'Force-pushing rewrites history on the remote, orphaning any commits others have built on top of. It is permanently destructive to collaborative work on shared branches. Even on feature branches, use `--force-with-lease` to avoid overwriting someone else\'s push.',
    },
    {
      title: 'Using Gitflow for a web app with continuous delivery',
      wrong: `# Web app deployed continuously
# Using full Gitflow: develop + release branches
# 2-week release cycles despite daily deployments being possible
# Release branch freezes slow everyone down`,
      right: `# Web apps with CD: use GitHub Flow or TBD
# main is always deployable
# Feature branch → PR → merge → auto-deploy
# No release branch needed`,
      explanation: 'Gitflow was designed for versioned software with distinct release cycles. For web apps that can deploy any time, the develop/release overhead creates friction without benefit. GitHub Flow or TBD is simpler and faster.',
    },
  ];

  challenge: Challenge = {
    title: 'Commit Message Linter',
    language: 'typescript',
    description: `Build a commit message linter that validates messages against Conventional Commits format.

Rules:
1. Must match: \`type(scope): description\` or \`type: description\`
2. Valid types: feat, fix, docs, style, refactor, test, chore, ci, perf, build
3. Description must be at least 10 characters
4. Description must not end with a period
5. Breaking changes: type can have \`!\` suffix (e.g. \`feat!:\`)

Return a result with isValid and an array of violations.`,
    hints: [
      'Use a regex to parse the type, optional scope, optional !, and description',
      'Collect ALL violations — don\'t short-circuit on first failure',
      'The scope is optional — (scope) may or may not be present',
      'Breaking changes add ! before the colon: feat!: or feat(auth)!:',
    ],
    starterCode: `const VALID_TYPES = ['feat','fix','docs','style','refactor','test','chore','ci','perf','build'];

interface LintResult {
  isValid: boolean;
  violations: string[];
}

function lintCommitMessage(message: string): LintResult {
  // TODO: implement
  return { isValid: true, violations: [] };
}`,
    solution: `const VALID_TYPES = ['feat','fix','docs','style','refactor','test','chore','ci','perf','build'];
const COMMIT_REGEX = /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s(.+)$/;

function lintCommitMessage(message: string): LintResult {
  const violations: string[] = [];
  const match = message.trim().match(COMMIT_REGEX);

  if (!match) {
    return {
      isValid: false,
      violations: ['Commit message must follow format: type(scope): description or type: description'],
    };
  }

  const [, type, , , description] = match;

  if (!VALID_TYPES.includes(type)) {
    violations.push(\`Invalid type "\${type}". Valid types: \${VALID_TYPES.join(', ')}\`);
  }

  if (description.length < 10) {
    violations.push(\`Description too short (\${description.length} chars). Minimum 10 characters.\`);
  }

  if (description.endsWith('.')) {
    violations.push('Description should not end with a period');
  }

  return { isValid: violations.length === 0, violations };
}

// Tests:
console.log(lintCommitMessage('feat(auth): add OAuth2 Google login'));
// { isValid: true, violations: [] }

console.log(lintCommitMessage('WIP: stuff'));
// violations: ['Invalid type "WIP"', 'Description too short (5 chars)']

console.log(lintCommitMessage('feat!: remove deprecated v1 API endpoints'));
// { isValid: true, violations: [] }  — breaking change, valid`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the core principle of Trunk-Based Development?',
      options: [
        'All developers work on separate long-lived feature branches',
        'All developers commit to one main branch or use short-lived branches (< 1-2 days) merged frequently',
        'Releases are made from a dedicated release branch cut from develop',
        'Each developer maintains their own fork of the repository',
      ],
      answer: 1,
      explanation: 'Trunk-Based Development requires all developers to integrate with main at least once per day, using feature flags for incomplete work. This eliminates long-lived merge conflicts and enables true continuous integration.',
    },
    {
      q: 'In Conventional Commits, which type should you use for a change that introduces a new API endpoint?',
      options: [
        'fix',
        'chore',
        'feat',
        'refactor',
      ],
      answer: 2,
      explanation: '`feat` represents a new feature for the user — new API endpoints, new UI components, new capabilities. It triggers a MINOR version bump in semantic versioning. `fix` is for bug corrections, `refactor` is internal code change with no behaviour change.',
    },
    {
      q: 'What does `--force-with-lease` do differently from `--force` when pushing?',
      options: [
        'It only allows force pushes from the main branch',
        'It pushes only if your local ref matches the remote — fails if someone else has pushed since your last fetch',
        'It automatically creates a backup branch before force pushing',
        'It requires a PR review before the force push is applied',
      ],
      answer: 1,
      explanation: '`--force-with-lease` is a safer force push — it checks that the remote ref you last fetched is still the current remote ref. If someone else pushed in the meantime, it fails, preventing you from accidentally overwriting their work.',
    },
    {
      q: 'What is the main advantage of squash merging a PR?',
      options: [
        'It preserves all individual WIP commits in the main branch history',
        'It collapses all PR commits into one meaningful commit, keeping main\'s history clean',
        'It prevents merge conflicts by rewriting history',
        'It automatically resolves all merge conflicts in the PR',
      ],
      answer: 1,
      explanation: 'Squash merge collapses all commits in a PR (including "wip", "fix typo", "review feedback") into a single, meaningful commit on main. This keeps git log readable. The tradeoff: individual commit context within the PR is lost after merge.',
    },
    {
      q: 'When is Gitflow most appropriate compared to GitHub Flow?',
      options: [
        'Always — Gitflow is more rigorous and professional',
        'When deploying web applications with continuous delivery',
        'When maintaining versioned software (libraries, SDKs, desktop apps) where multiple versions must be supported',
        'When the team has fewer than 5 developers',
      ],
      answer: 2,
      explanation: 'Gitflow is designed for versioned software where multiple release versions are maintained simultaneously. For web apps with continuous delivery, the develop/release branch overhead adds friction without benefit — GitHub Flow or TBD is simpler and faster.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'Should I rebase or merge when updating my feature branch from main?',
      a: 'Rebase is generally preferred for feature branches: it replays your commits on top of the latest main, creating a linear history and making the eventual PR diff cleaner. The tradeoff: rebase rewrites SHAs, so if others have fetched your branch, they will need to reset. Use merge if multiple people are working on the same feature branch. Never rebase shared branches (main, develop).',
    },
    {
      q: 'How do I handle a hotfix in Trunk-Based Development?',
      a: 'In TBD, a hotfix is just a short-lived branch from main: `git checkout -b fix/critical-payment-bug` → fix → PR → expedited review → merge → deploy. No special hotfix branch type needed. If you need to backport to a previous release (uncommon in TBD), cherry-pick the commit to a release branch. The key: even hotfixes go through CI and at least a quick review.',
    },
    {
      q: 'What is "stacked PRs" and when should I use it?',
      a: 'Stacked PRs (or stacked diffs) are a series of small PRs where each builds on the previous one: PR1 (data model) → PR2 (service layer) → PR3 (API endpoint) → PR4 (frontend). They enable large features to be reviewed in reviewable chunks without one giant PR. Tools like Graphite, ghstack, or git-stack automate the rebasing and dependency management. Use when a feature genuinely cannot be hidden behind a feature flag.',
    },
    {
      q: 'What is a CODEOWNERS file and why is it valuable?',
      a: 'CODEOWNERS (`.github/CODEOWNERS` on GitHub) maps file paths to required reviewers. When a PR changes a file matching a pattern, the specified team is automatically added as a required reviewer. This ensures domain experts review changes to their areas without manual reviewer assignment. Example: `src/payments/` → `@acme/payments-team`, `/terraform/` → `@acme/infra-team`.',
    },
    {
      q: 'What is the difference between `git merge` and `git rebase` in terms of history?',
      a: '`git merge` creates a merge commit that preserves the full branching history — you can see exactly when branches diverged and rejoined. `git rebase` replays commits linearly on the target branch — no merge commits, cleaner `git log`, but the original branch topology is erased. Teams that value historical accuracy prefer merge; teams that value readability prefer rebase. Many projects use both: rebase to update feature branches, merge commits (or squash) for PR integration.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Git workflows define how code moves from developer to production — Trunk-Based Development maximises CI speed; Gitflow maximises release control; both depend on branch protection and conventional commits.',
    mustKnow: [
      'Trunk-Based Dev: commit to main daily, short-lived branches (< 2 days), feature flags for incomplete work',
      'Gitflow: main + develop + feature/* + release/* + hotfix/* — best for versioned software',
      'GitHub Flow: feature branch → PR → merge to main → deploy — simplest for web apps with CD',
      'Branch protection: require PR review + CI before merge to main',
      'Conventional commits: type(scope): description — enables automated changelog and SemVer bumping',
      'Squash merge: collapses PR WIP commits into one meaningful commit on main',
      'Never force-push to shared branches; use --force-with-lease on feature branches',
    ],
    interviewFocus: [
      'Compare Gitflow vs Trunk-Based Development — when would you choose each?',
      'What is the conventional commits format and how does it enable automation?',
      'What does --force-with-lease do and why use it over --force?',
      'What branch protection rules would you configure for a production codebase?',
    ],
  };
}
