import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageMetaComponent } from '../../../shared/page-meta/page-meta';
import { QuickRefComponent, QuickRefItem } from '../../../shared/quick-ref/quick-ref';
import { TheoryBlockComponent, TheoryPoint } from '../../../shared/theory-block/theory-block';
import { CodeBlockComponent, CodeTab } from '../../../shared/code-block/code-block';
import { CommonMistakesComponent, CommonMistake } from '../../../shared/common-mistakes/common-mistakes';
import { ChallengeBlockComponent, Challenge } from '../../../shared/challenge-block/challenge-block';
import { QuizBlockComponent, QuizQuestion } from '../../../shared/quiz-block/quiz-block';
import { QnaBlockComponent, QnaItem } from '../../../shared/qna-block/qna-block';
import { RevisionCardComponent, RevisionSummary } from '../../../shared/revision-card/revision-card';
import { PageCompleteComponent } from '../../../shared/page-complete/page-complete';

const quickRef: QuickRefItem[] = [
  { name: 'SCA',         type: 'keyword', desc: 'Software Composition Analysis — tools that audit third-party dependency CVEs (Snyk, Dependabot, npm audit).' },
  { name: 'SBOM',        type: 'keyword', desc: 'Software Bill of Materials — inventory of all components, versions, and licenses in your software.' },
  { name: 'Typosquatting', type: 'keyword', desc: 'Malicious packages named similarly to popular ones (lodahs vs lodash) — always double-check package names.' },
  { name: 'Lockfile',    type: 'keyword', desc: 'package-lock.json / yarn.lock — pins exact resolved versions and integrity hashes; always commit it.' },
  { name: 'Sigstore',    type: 'keyword', desc: 'Free signing infrastructure for npm packages and container images — verify signature before install.' },
  { name: 'SLSA',        type: 'keyword', desc: 'Supply-chain Levels for Software Artifacts — framework of build provenance requirements.' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'The Software Supply Chain Threat',
    points: [
      'Supply chain attacks compromise a trusted dependency, build tool, or CI pipeline rather than attacking the target directly. SolarWinds (2020), Log4Shell (2021), and the XZ Utils backdoor (2024) are landmark examples.',
      'Every npm install, pip install, or docker pull is a trust decision. You are executing code written by strangers. A single compromised package in your dependency tree can exfiltrate secrets, install a backdoor, or mine cryptocurrency.',
      'Transitive dependencies magnify risk: a project with 10 direct dependencies may have 500+ transitive dependencies. Auditing each is infeasible manually — automated tools are essential.',
      'Attack vectors: typosquatting, dependency confusion, compromised maintainer accounts, malicious PRs merged to popular packages, build tool compromise, CI/CD pipeline injection.',
    ],
  },
  {
    heading: 'Dependency Auditing',
    points: [
      '`npm audit` / `npm audit --production`: checks installed packages against the npm advisory database. Run in CI; fail build on HIGH severity.',
      'Dependabot / Renovate: automated PRs to update dependencies with known CVEs. Configure to auto-merge patch updates; require review for minor/major.',
      'Snyk, Socket, Mend: deeper analysis — malicious code detection, license compliance, transitive vulnerability graphs.',
      'Lock files: `package-lock.json` or `yarn.lock` pins exact versions and integrity hashes (SHA-512 of each package tarball). Always commit; `npm ci` (not `npm install`) in CI to use the lockfile exactly.',
    ],
  },
  {
    heading: 'Preventing Dependency Confusion',
    points: [
      'Dependency confusion: attacker publishes a public npm package with the same name as your internal private package at a higher version. npm resolves public over private — attacker code runs.',
      'Defences: use `publishConfig.access` to mark internal packages as restricted; use scoped packages (`@myorg/utils` — scoped packages can be private); configure `.npmrc` to route `@myorg/` to your private registry.',
      'Typosquatting: `lodahs`, `require`, `crossenv` (vs `cross-env`) — malicious packages named to catch typos. Check the actual package name before install; use `socket.dev` which detects suspicious new packages.',
      'Private registry (Artifactory, Nexus, AWS CodeArtifact): proxy all traffic through your registry. Vet packages before they enter your approved pool.',
    ],
  },
  {
    heading: 'Provenance and SBOM',
    points: [
      'SBOM (Software Bill of Materials): a machine-readable inventory of all components, versions, and licenses. Required by US Executive Order 14028 for government software suppliers.',
      'SLSA (Supply-chain Levels for Software Artifacts): build provenance standard. Level 3 requires signed build attestations — proving exactly what code, build tool, and environment produced an artifact.',
      'Sigstore / Cosign: free signing infrastructure for npm packages and container images. `npm publish --provenance` generates a Sigstore-signed attestation linked to the source commit.',
      'Verify before install: for containers, `cosign verify` confirms the image was signed by the expected identity. For npm, `npm audit signatures` (npm 9+) verifies package registry signatures.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Dependency Audit in CI',
    language: 'typescript',
    code: `# ── package.json scripts ─────────────────────────────────────────────────────
{
  "scripts": {
    "audit:prod": "npm audit --production --audit-level=high",
    "audit:all":  "npm audit --audit-level=moderate"
  }
}

# ── GitHub Actions: audit on every PR ────────────────────────────────────────
name: Security Audit
on: [pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci                    # uses lockfile exactly
      - run: npm audit --audit-level=high  # fail on HIGH+ CVEs
      # Optionally: run Snyk for deeper analysis
      - uses: snyk/actions/node@master
        env: { SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }} }
        with: { args: '--severity-threshold=high' }

# ── .npmrc — prevent dependency confusion ─────────────────────────────────────
# Route @myorg scoped packages to private registry
@myorg:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=\${NPM_TOKEN}

# Lock down which registry public packages come from
registry=https://registry.npmjs.org/

# ── Dependabot config (.github/dependabot.yml) ───────────────────────────────
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    open-pull-requests-limit: 10
    groups:
      patch-updates:
        update-types: [patch]
        auto-merge: true  # auto-merge safe patches`,
  },
  {
    label: 'SBOM Generation & Lockfile Integrity',
    language: 'typescript',
    code: `# ── Generate SBOM with CycloneDX ─────────────────────────────────────────────
# npm install -g @cyclonedx/cyclonedx-npm
cyclonedx-npm --output-file sbom.json --output-format JSON

# ── Verify lockfile integrity ─────────────────────────────────────────────────
# package-lock.json contains integrity hashes for every package:
# "integrity": "sha512-abc123..."
# npm ci verifies these hashes on install — tampering is detected

# ── Verify npm package signatures (npm 9+) ───────────────────────────────────
npm audit signatures
# Auditing signatures in your lockfile...
# ✓ Verified registry signatures for 312 packages

# ── Check a specific package before adding ────────────────────────────────────
# 1. Verify the package name is correct (typosquatting check)
npm view lodash --json | jq '{ name, description, downloads: .["dist-tags"] }'

# 2. Check Socket.dev for malicious code analysis
# socket info lodash  # needs Socket CLI

# 3. Check the GitHub repo linked in package.json
# Confirm maintainer, stars, recent activity, no suspicious commits

# ── Runtime dependency checks ────────────────────────────────────────────────
// TypeScript: audit your runtime deps at startup
import { execSync } from 'child_process';

function auditDependencies() {
  try {
    execSync('npm audit --production --audit-level=critical', { stdio: 'pipe' });
  } catch (err: any) {
    console.error('CRITICAL: Dependency vulnerability detected');
    console.error(err.stdout.toString());
    process.exit(1); // fail fast
  }
}

if (process.env['NODE_ENV'] === 'production') {
  auditDependencies();
}`,
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Not committing the lockfile',
    wrong: `# .gitignore
package-lock.json   # common mistake — teammates get different versions`,
    right: `# Always commit package-lock.json (or yarn.lock)
# Use 'npm ci' in CI — fails if lockfile is missing or outdated
# Never run 'npm install' in CI — it may update the lockfile`,
    explanation: 'The lockfile pins exact versions and integrity hashes. Without it, `npm install` resolves the latest version satisfying the semver range — different developers get different versions, and a malicious package update silently installs. `npm ci` uses the lockfile exactly and verifies integrity hashes.',
  },
  {
    title: 'Using `npm install` instead of `npm ci` in CI',
    wrong: `# CI pipeline
npm install   # may update lockfile, ignores integrity mismatch`,
    right: `npm ci   # strict: uses lockfile exactly, verifies integrity, fails if mismatch`,
    explanation: '`npm install` updates the lockfile if it is outdated and installs the latest matching version. `npm ci` is deterministic — it installs exactly what the lockfile specifies, verifies the SHA-512 integrity hash of each tarball, and fails if the lockfile is missing or mismatched.',
  },
  {
    title: 'Ignoring npm audit output',
    wrong: `# audit finds HIGH vulnerabilities but build continues
npm audit || true  # suppress exit code — vulnerabilities ignored`,
    right: `npm audit --audit-level=high  # fail CI if HIGH or CRITICAL found
# Or: npm audit --audit-level=critical for less aggressive CI gates`,
    explanation: '`|| true` suppresses the audit exit code, making it a no-op. High and Critical CVEs in production dependencies represent real risk — fail the build and address them. Treat security audit failures like test failures.',
  },
  {
    title: 'Installing packages without checking the source',
    wrong: `# Saw a package mentioned in a blog post — install immediately
npm install event-stream  # real 2018 supply chain attack package`,
    right: `# Before adding any new dependency:
# 1. Check npm page: maintainer, downloads, last publish date
# 2. Check GitHub repo: stars, open issues, recent commits
# 3. socket info <package>  # Socket.dev analysis
# 4. npm view <package> --json | jq .homepage`,
    explanation: 'The event-stream attack (2018): a malicious new maintainer was given ownership of a popular package and injected code to steal cryptocurrency wallet keys. Always verify: who published it, when, from where. Fewer dependencies is also better — consider implementing the functionality yourself if it is small.',
  },
];

const challenge: Challenge = {
  title: 'Dependency Risk Scorer',
  language: 'typescript',
  description: `Implement scoreDependency(pkg: Package): { risk: 'low' | 'medium' | 'high'; reasons: string[] } that:
- high risk if: hasKnownCVE = true OR weeksSinceLastPublish > 104 (2 years)
- medium risk if: downloadsPerWeek < 1000 OR maintainerCount < 2
- low risk otherwise
Multiple conditions can apply; take the highest risk level.`,
  hints: [
    'Check high conditions first',
    'Then check medium conditions',
    'Push reason strings for each flagged condition',
  ],
  starterCode: `interface Package { name: string; hasKnownCVE: boolean; weeksSinceLastPublish: number; downloadsPerWeek: number; maintainerCount: number; }
function scoreDependency(pkg: Package): { risk: 'low' | 'medium' | 'high'; reasons: string[] } {
  const reasons: string[] = [];
  let risk: 'low' | 'medium' | 'high' = 'low';
  // TODO
  return { risk, reasons };
}`,
  solution: `interface Package { name: string; hasKnownCVE: boolean; weeksSinceLastPublish: number; downloadsPerWeek: number; maintainerCount: number; }
function scoreDependency(pkg: Package): { risk: 'low' | 'medium' | 'high'; reasons: string[] } {
  const reasons: string[] = [];
  let risk: 'low' | 'medium' | 'high' = 'low';
  if (pkg.hasKnownCVE) { risk = 'high'; reasons.push('Known CVE'); }
  if (pkg.weeksSinceLastPublish > 104) { risk = 'high'; reasons.push('Not updated in 2+ years'); }
  if (risk !== 'high') {
    if (pkg.downloadsPerWeek < 1000) { risk = 'medium'; reasons.push('Low download count'); }
    if (pkg.maintainerCount < 2) { risk = 'medium'; reasons.push('Single maintainer'); }
  }
  return { risk, reasons };
}
console.log(scoreDependency({ name: 'risky-pkg', hasKnownCVE: true, weeksSinceLastPublish: 10, downloadsPerWeek: 5000, maintainerCount: 3 }));
// { risk: 'high', reasons: ['Known CVE'] }`,
};

const quiz: QuizQuestion[] = [
  {
    q: 'What is a dependency confusion attack?',
    options: [
      'Installing two packages with conflicting APIs',
      'Publishing a malicious public package with the same name as an internal private one at a higher version — npm resolves public over private',
      'A typo in a package name that installs the wrong library',
      'A circular dependency that causes infinite imports',
    ],
    answer: 1,
    explanation: 'If your org uses a private npm package `@myorg/utils` and an attacker publishes a public package named `@myorg/utils` at a higher version, npm\'s version resolution may prefer the public package — installing the attacker\'s code. Prevent with scoped packages routed to your private registry in `.npmrc`.',
  },
  {
    q: 'Why should `npm ci` be used in CI instead of `npm install`?',
    options: [
      'npm ci is faster because it skips some validations',
      'npm ci uses the lockfile exactly and verifies SHA-512 integrity hashes — deterministic, detects tampering',
      'npm ci skips optional peer dependencies',
      'npm ci supports monorepos; npm install does not',
    ],
    answer: 1,
    explanation: '`npm ci` requires a lockfile, uses it exactly (no version resolution), verifies the SHA-512 integrity hash of every downloaded tarball, and fails if anything mismatches. `npm install` may update the lockfile and does not enforce integrity as strictly.',
  },
];

const qna: QnaItem[] = [
  {
    q: 'What is SLSA and why does it matter for supply chain security?',
    a: '<strong>SLSA</strong> (Supply-chain Levels for Software Artifacts, pronounced "salsa") is a framework of incrementally stronger build provenance requirements: <ul><li><strong>Level 1</strong>: build process documented and automated</li><li><strong>Level 2</strong>: source and build platform authenticated; signed provenance</li><li><strong>Level 3</strong>: build platform is hardened against insider threats; hermetic builds</li><li><strong>Level 4</strong>: two-party review; hermetic reproducible builds</li></ul>SLSA attestations let consumers verify: what source commit produced this artifact, on what build platform, with what inputs. GitHub Actions and Google Cloud Build can produce SLSA Level 3 provenance attestations. <code>npm publish --provenance</code> generates a Sigstore-linked SLSA attestation for npm packages.',
  },
  {
    q: 'How do you safely evaluate a new npm package before adding it as a dependency?',
    a: '<ol><li><strong>npm page</strong>: weekly downloads, publish date, maintainer count, funding</li><li><strong>GitHub repo</strong>: stars, open issues, recent commits, contributors, suspicious recent PRs</li><li><strong>Socket.dev or Snyk</strong>: malicious code analysis, typosquatting detection, license risks</li><li><strong>npm audit</strong>: check for known CVEs before installing</li><li><strong>Package size</strong>: <code>bundlephobia.com</code> — large packages for trivial functions are red flags</li><li><strong>Dependency count</strong>: packages with hundreds of transitive deps multiply your risk surface</li><li><strong>Can you implement it yourself?</strong>: if it is a simple utility (pad-left, is-odd) — implement it in 5 lines instead</li></ol>',
  },
];

const revision: RevisionSummary = {
  oneLiner: 'Supply chain security: lock versions with lockfiles, run npm audit in CI, prevent dependency confusion with scoped private registries, verify package provenance before adding dependencies.',
  mustKnow: [
    'Lockfile (package-lock.json): pins versions + integrity hashes — always commit, use npm ci in CI',
    'npm audit --audit-level=high in CI: fail build on HIGH/CRITICAL CVEs',
    'Dependency confusion: attacker publishes public package matching your internal name — use scoped packages + .npmrc',
    'Typosquatting: lodahs, crross-env — verify package name before npm install',
    'SBOM: machine-readable dependency inventory (CycloneDX format)',
    'SLSA: build provenance attestations proving what code/build produced an artifact',
  ],
  interviewFocus: [
    'What is a dependency confusion attack and how do you prevent it?',
    'Why use npm ci instead of npm install in CI?',
    'How would you evaluate a new open-source dependency for security risk?',
  ],
};

@Component({
  selector: 'app-sec-supply-chain',
  standalone: true,
  imports: [CommonModule, PageMetaComponent, QuickRefComponent, TheoryBlockComponent,
    CodeBlockComponent, CommonMistakesComponent, ChallengeBlockComponent,
    QuizBlockComponent, QnaBlockComponent, RevisionCardComponent, PageCompleteComponent],
  templateUrl: './supply-chain.html',
  styleUrl: './supply-chain.scss',
})
export class SecSupplyChain {
  quickRef = quickRef; theory = theory; codeTabs = codeTabs;
  mistakes = mistakes; challenge = challenge; quiz = quiz; qna = qna; revision = revision;
}
