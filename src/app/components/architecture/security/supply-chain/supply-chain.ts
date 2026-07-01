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
  {
    heading: 'Software Bill of Materials (SBOM)',
    points: [
      'A Software Bill of Materials is a formal, machine-readable inventory of every component (direct and transitive dependencies, their exact versions) that makes up a software artifact — analogous to an ingredients list, enabling rapid impact assessment when a new vulnerability is disclosed.',
      'Without an SBOM, answering "are we affected by this newly disclosed CVE" requires manually auditing every project\'s dependency tree — with one, the same question is answered by a simple automated query against the recorded component inventory.',
      'SBOM generation is increasingly a compliance requirement (U.S. Executive Order 14028 mandates SBOMs for software sold to federal agencies) and is generated automatically by tools like Syft, CycloneDX, or npm/pip native tooling as part of the build pipeline.',
      'SBOMs are most valuable when combined with continuous vulnerability scanning — a static SBOM generated once at release time becomes stale as new CVEs are discovered for already-shipped dependencies, so ongoing monitoring against the SBOM is what provides lasting value.',
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
    q: 'Why does using scoped packages (@myorg/package-name) reduce dependency confusion risk more effectively than just choosing an obscure internal package name?',
    options: [
      'Scoped packages are automatically private and can never be published publicly by anyone',
      'A scope can be explicitly claimed on the public registry (even with no published packages under it) or explicitly routed in .npmrc to always resolve from a specific registry — closing off the ambiguity of "which registry does this exact name belong to" that unscoped internal package names are exposed to',
      'Scoped packages use a different version numbering scheme that public attackers cannot replicate',
      'Scoping has no actual security effect — it is purely an organizational naming convention',
    ],
    answer: 1,
    explanation: 'An unscoped internal package name (utils) is just a bare string that could plausibly exist on either the private registry or the public one — the package manager has to guess or follow a resolution order, which is exactly the ambiguity dependency confusion exploits. A scope (@myorg/utils) can be explicitly configured in .npmrc to ALWAYS resolve from your private registry regardless of what a public package with the same scoped name claims to be, and organizations can additionally claim their scope on the public registry defensively (publishing empty placeholder packages) so an attacker cannot even register that scope publicly in the first place.',
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
  { q: 'What is a software supply chain attack and what famous example occurred in 2020?', options: ['An attack targeting the physical distribution of server hardware', 'An attack that compromises software at the build or distribution stage; the SolarWinds attack (2020) inserted malicious code into Orion software updates, compromising thousands of organizations', 'An attack that exploits vulnerabilities in package management networks', 'A ransomware attack targeting enterprise software vendors'], answer: 1, explanation: 'Software supply chain attack: instead of attacking the target organization directly (which has defenses), the attacker compromises a trusted third-party supplier. SolarWinds 2020: attackers compromised the build pipeline of SolarWinds Orion network monitoring software. Malicious code (Sunburst backdoor) was inserted into Orion updates. 18,000+ organizations installed the malicious update, including US government agencies. The attack was trusted because it came from a legitimate vendor certificate. Log4Shell 2021: Apache Log4j, a ubiquitous Java logging library, had a critical remote code execution vulnerability. Millions of applications were vulnerable through a transitive dependency many developers did not know they had.' },
  { q: 'What is an SBOM (Software Bill of Materials) and why is it required for supply chain security?', options: ['A security audit report covering all software components in a system', 'A formal inventory of all components and dependencies in a software product, enabling organizations to quickly identify which systems are affected when a vulnerability is discovered in a component', 'A software signing certificate issued by a trusted certificate authority', 'A compliance framework for software procurement in regulated industries'], answer: 1, explanation: 'SBOM: a machine-readable inventory of all software components: direct dependencies, transitive dependencies, their versions, licenses, and known vulnerabilities. Why required: when Log4Shell was disclosed, organizations with SBOMs could immediately query: which of our products use Log4j? Organizations without SBOMs had to manually audit all applications. SBOM formats: SPDX (Linux Foundation standard). CycloneDX (OWASP standard). NTIA minimum elements. Generation tools: Syft (container and filesystem SBOM). Trivy. GitHub Dependency Graph. US Executive Order 14028 (2021) mandated SBOM for software sold to the federal government. SBOM enables: vulnerability scanning against known CVEs, license compliance auditing, and emergency patching decisions.' },
  { q: 'What is dependency confusion and how does it exploit package manager resolution?', options: ['A typosquatting attack using package names similar to popular libraries', 'An attack that publishes malicious packages to public registries using the same name as private internal packages, causing package managers to download the public (malicious) version instead', 'A supply chain attack that confuses software vendors about which version of a dependency to use', 'An attack that modifies package.json lock files to point to attacker-controlled mirrors'], answer: 1, explanation: 'Dependency confusion (Alex Birsan, 2021): organizations use private package registries for internal libraries (internal-auth, company-utils). These names exist in the private registry but not in npm/PyPI. The package manager checks public registries first and finds no match, so falls back to the private registry. Attack: the attacker publishes a package named internal-auth to npm with a higher version number (99.0.0). npm resolves dependencies by highest version, so pulls 99.0.0 from npm instead of the internal version. Prevention: use scoped packages (@acme/internal-auth — scoped packages are less susceptible). Configure the private registry as the exclusive source. Use registry override rules to pin internal package names to the private registry. Use lockfiles to lock exact versions.' },
  { q: 'What is code signing and how does sigstore simplify it?', options: ['A browser-based code review system integrated into GitHub and GitLab', 'Attaching a cryptographic signature to code artifacts so recipients can verify origin and integrity; Sigstore provides free, keyless signing via OIDC identity tokens with a transparency log', 'A supply chain tool that automatically patches dependencies when vulnerabilities are discovered', 'A runtime code integrity check that prevents unsigned code from executing in containers'], answer: 1, explanation: 'Code signing: the publisher uses a private key to sign the artifact. Recipients verify with the corresponding public key. Problems with traditional signing: managing long-lived private keys is operationally complex. Keys expire or are compromised. Who vouches for the public key? Sigstore: Cosign (the signing tool) + Fulcio (ephemeral certificate authority) + Rekor (transparency log). Keyless signing flow: the CI system authenticates with an OIDC token (from GitHub Actions, etc.). Fulcio issues a short-lived certificate binding the signing key to the OIDC identity. Cosign signs the artifact and publishes the signature and certificate to Rekor (append-only transparency log). Verification: verify the signature, confirm the certificate from Fulcio, check it is in Rekor. No long-lived keys needed. Mandatory for signed Kubernetes admission control.' },
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
  { q: 'What is typosquatting in package ecosystems and how do you protect against it?', a: 'Typosquatting: publishing malicious packages with names that are common typing mistakes of popular packages. Examples: colourama (vs colorama for Python). lodahs vs lodash. requets vs requests. The malicious package executes code on install (npm install scripts, pip setup.py). Protection: pin exact versions in lockfiles (package-lock.json, Pipfile.lock). Use registry allowlists that restrict which packages can be installed. Before adding a dependency, verify the correct package name and publisher. Audit npm install scripts: disable postinstall scripts in CI or use --ignore-scripts. Check download counts and publish dates: a legitimate popular package has millions of downloads. A typosquat has thousands. Tools: npm audit, pip audit, Renovate Bot, Dependabot scan for known malicious packages by name.' },
  { q: 'How do you secure a CI/CD pipeline against supply chain attacks?', a: 'CI/CD pipeline hardening: secret management: store secrets in a secrets manager, not in environment variables or pipeline config files. Use OIDC federation (GitHub Actions OIDC to AWS IAM) to avoid long-lived AWS credentials. Pinned dependencies: pin action versions by commit SHA (not by tag): uses: actions/checkout@a81bbbf8298c0fa03ea29cdc473d45769f953501. Tags can be moved; SHAs are immutable. Minimal permissions: use minimum required GitHub token permissions. Each job should have only the permissions it needs. Artifact integrity: sign build artifacts with Sigstore/Cosign after build. Verify signatures before deployment. Build environment isolation: do not cache build environments between builds that could leave malicious artifacts. Review third-party actions before use: check source code, verify publisher, use the minimal set of permissions.' },
  { q: 'What is a compromised dependency update and how do event-stream and colors incidents illustrate the risk?', a: 'Compromised dependency update: a malicious actor gains control of a legitimate package (via maintainer account compromise or transfer) and pushes a malicious update. event-stream (npm, 2018): a new maintainer was added to the popular event-stream package. They added a malicious dependency (flatmap-stream) that stole cryptocurrency wallets from a specific application. Downloaded 8 million times before detection. colors.js (2022): the original author sabotaged their own package to protest unpaid open source work. Added an infinite loop, breaking thousands of dependent projects. Mitigations: lock exact versions in production (npm ci, pip install -r requirements.txt with locked versions). Treat all dependency updates as potentially breaking. Review changelogs for unexpected dependencies being added. Use Renovate Bot or Dependabot for automatic PR-based updates with review.' },
  { q: 'What is the slsa.dev (Supply-chain Levels for Software Artifacts) framework?', a: 'SLSA (Supply-chain Levels for Software Artifacts, pronounced salsa): a security framework from Google for evaluating the integrity of the software supply chain. Four levels of assurance: SLSA Level 1: documentation of the build process. Provenance is generated (who built it, from what source, with what build system). SLSA Level 2: hosted build service (GitHub Actions, Google Cloud Build). Signed provenance. SLSA Level 3: tamper-resistant build service with audit logs. Source reviewed (two-person approval for changes). Build scripts not modifiable by single person. SLSA Level 4: two-person review of all code. Hermetic build (all inputs declared, reproducible). The provenance is a cryptographically signed statement about how an artifact was built. Consumers can verify an artifact was produced by an authorized build system, from the correct source commit, without unauthorized modifications.' },
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
