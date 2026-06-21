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
  selector: 'app-devops-devsecops',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './devsecops.html',
  styleUrl: './devsecops.scss'
})
export class DevopsDevsecops {

  quickRef: QuickRefItem[] = [
    { name: 'SAST', type: 'keyword', desc: 'Static Application Security Testing — analyse source code for vulnerabilities without executing it' },
    { name: 'DAST', type: 'keyword', desc: 'Dynamic Application Security Testing — probe a running application for vulnerabilities' },
    { name: 'SCA / Dependency scanning', type: 'keyword', desc: 'Software Composition Analysis — identify CVEs in open-source libraries and transitive dependencies' },
    { name: 'Secrets scanning', type: 'keyword', desc: 'Detect API keys, tokens, and credentials committed to source code repositories' },
    { name: 'Gitleaks', type: 'keyword', desc: 'Open-source secrets scanner for Git repos and CI pipelines; catches commits before they hit remote' },
    { name: 'Semgrep', type: 'keyword', desc: 'Fast SAST tool using pattern rules; multi-language, easy custom rules, CI-friendly' },
    { name: 'Snyk', type: 'keyword', desc: 'SaaS security platform: dependency scanning, container scanning, IaC scanning in one tool' },
    { name: 'OWASP Top 10', type: 'keyword', desc: 'The ten most critical web security risks; the baseline for any SAST/DAST rule set' },
    { name: 'Supply chain attack', type: 'keyword', desc: 'Compromise of a dependency or build tool to inject malicious code into downstream projects' },
    { name: 'SBOM', type: 'keyword', desc: 'Software Bill of Materials — machine-readable inventory of all components; enables fast CVE triage' },
    { name: 'OPA / Conftest', type: 'keyword', desc: 'Policy as Code engine — enforce security policies on IaC plans, Kubernetes manifests, container configs' },
    { name: 'DORA / CVE', type: 'keyword', desc: 'CVE = Common Vulnerability and Exposure identifier; CVSS score = 0–10 severity rating for CVEs' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'Shift security left',
      points: [
        'DevSecOps integrates security into every stage of the software development lifecycle rather than treating it as a final gate before release.',
        'The later a vulnerability is found, the more expensive it is to fix: a bug found in code review costs 6× less to fix than one found in production.',
        'Shift left means: run security checks on every commit (SAST, secrets scan), on every dependency update (SCA), on every PR (IaC policy), and on every image build (container scan).',
        'Security as code: store security policies, rules, and configurations in Git alongside application code. Version-controlled, reviewable, auditable.',
        'The three pillars of DevSecOps: People (security awareness training), Process (mandatory review for security-sensitive changes), Technology (automated scanning in CI/CD).',
      ]
    },
    {
      heading: 'SAST — Static Application Security Testing',
      points: [
        'SAST tools analyse source code or compiled bytecode for security vulnerabilities without executing the application. Works at commit time — fast feedback.',
        'Common findings: SQL injection patterns, XSS-prone string concatenation, hardcoded credentials, insecure cryptography (MD5, SHA1), path traversal, use of deprecated unsafe APIs.',
        'Tools: Semgrep (open-source, multi-language, fast, custom rules), SonarQube (comprehensive, includes code quality), Checkmarx, Veracode (enterprise), CodeQL (GitHub Advanced Security).',
        'SAST has false positives — the tool flags patterns that look dangerous but are safe in context. Tune rules over time; suppress with inline annotations for confirmed false positives.',
        'GitHub Advanced Security: CodeQL runs SAST on every PR and posts findings as inline PR comments. Results appear in the Security tab and can block merges.',
      ]
    },
    {
      heading: 'Dependency scanning (SCA)',
      points: [
        'Most application code is third-party libraries. Dependency scanning (SCA — Software Composition Analysis) identifies known CVEs in direct and transitive dependencies.',
        'Tools: Snyk (SaaS, developer-friendly fix suggestions), OWASP Dependency-Check (open-source), Dependabot (GitHub-native, auto-creates PRs to update vulnerable packages), Renovate.',
        'Severity triage: not every CVE needs immediate action. Assess exploitability in your context: is the vulnerable function reachable? Is the attack vector network-accessible? Is a fix available?',
        'Dependabot security advisories auto-open PRs within hours of a CVE disclosure. Configure auto-merge for patch updates with passing tests; require manual review for minor/major bumps.',
        'License scanning runs alongside SCA: GPL or AGPL dependencies may have copyleft requirements incompatible with proprietary software. Tools: FOSSA, license-checker (npm), License Finder.',
      ]
    },
    {
      heading: 'Secrets detection',
      points: [
        'Committed secrets (API keys, database passwords, AWS access keys, JWT secrets) are one of the most common causes of breaches. Once committed, they are in Git history forever — even if the file is deleted.',
        'Gitleaks: open-source tool that scans Git history and new commits for secrets using regex patterns. Runs as a pre-commit hook or in CI to block secret commits.',
        'GitHub Secret Scanning: automatically scans every push for known secret patterns (AWS keys, GitHub tokens, Azure credentials, Stripe keys, etc.) and notifies immediately.',
        'Pre-commit hooks: install gitleaks as a pre-commit hook so secrets are caught before they ever reach the remote. Use the pre-commit framework for consistent hook management.',
        'If a secret is committed: rotate it immediately (the secret is compromised regardless of whether it was accessed), rewrite Git history with git filter-repo or BFG Repo Cleaner, and audit access logs for unauthorised use.',
      ]
    },
    {
      heading: 'Container and IaC security',
      points: [
        'Container image scanning (Trivy, Snyk, Docker Scout): scan every image for OS package CVEs and application dependency CVEs before pushing to the registry.',
        'Dockerfile best practices: run as non-root user, use minimal base images (distroless, alpine), scan in CI, sign with Cosign, enforce admission control in Kubernetes.',
        'IaC security scanning (Checkov, tfsec, KICS): detect misconfigurations in Terraform, Bicep, Kubernetes manifests before apply — e.g. public S3 buckets, overly permissive security groups, missing encryption.',
        'Kubernetes security: Network Policies restrict pod-to-pod traffic; PodSecurity admission enforces runAsNonRoot, read-only filesystems; Kyverno policies enforce image signing and resource limits.',
        'Open Policy Agent (OPA) / Conftest: evaluate IaC plans, Kubernetes manifests, or API requests against Rego policies. Use in CI to fail the pipeline on policy violations.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'SAST + Secrets Scan in CI',
      language: 'bash',
      code: `# ─── GitHub Actions: security pipeline ────────────────────────────────────────

# .github/workflows/security.yml
# name: Security Scan
# on: [push, pull_request]
#
# jobs:
#   sast:
#     name: SAST — Semgrep
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#       - uses: semgrep/semgrep-action@v1
#         with:
#           config: >
#             p/default
#             p/owasp-top-ten
#             p/csharp
#             p/typescript
#         env:
#           SEMGREP_APP_TOKEN: \$\{\{ secrets.SEMGREP_APP_TOKEN }}

#   codeql:
#     name: SAST — CodeQL
#     runs-on: ubuntu-latest
#     permissions:
#       security-events: write
#     steps:
#       - uses: actions/checkout@v4
#       - uses: github/codeql-action/init@v3
#         with:
#           languages: csharp,javascript
#       - uses: github/codeql-action/autobuild@v3
#       - uses: github/codeql-action/analyze@v3
#         with:
#           output: codeql-results.sarif
#       - uses: github/codeql-action/upload-sarif@v3
#         with:
#           sarif_file: codeql-results.sarif

#   secrets:
#     name: Secrets Detection — Gitleaks
#     runs-on: ubuntu-latest
#     steps:
#       - uses: actions/checkout@v4
#         with:
#           fetch-depth: 0     # scan full history
#       - uses: gitleaks/gitleaks-action@v2
#         env:
#           GITHUB_TOKEN: \$\{\{ secrets.GITHUB_TOKEN }}

# ─── Gitleaks config (.gitleaks.toml) ────────────────────────────────────────

# [allowlist]
#   description = "Global allowlist"
#   paths = [
#     '''tests/fixtures''',      # test fixtures with fake secrets
#     '''docs/examples''',
#   ]
#   regexes = [
#     '''EXAMPLE_API_KEY''',     # explicitly fake/example values
#   ]
#
# [[rules]]
#   id = "internal-api-key"
#   description = "Internal API key pattern"
#   regex = '''INTERNAL_[A-Z0-9]{32}'''
#   tags = ["api-key", "internal"]

# ─── Pre-commit hook setup ────────────────────────────────────────────────────

# .pre-commit-config.yaml
# repos:
#   - repo: https://github.com/gitleaks/gitleaks
#     rev: v8.18.0
#     hooks:
#       - id: gitleaks
#
#   - repo: https://github.com/pre-commit/pre-commit-hooks
#     rev: v4.5.0
#     hooks:
#       - id: detect-private-key
#       - id: check-added-large-files
#         args: ['--maxkb=1024']
#
# Install:
# pip install pre-commit
# pre-commit install`,
    },
    {
      label: 'Dependency Scanning (SCA)',
      language: 'bash',
      code: `# ─── Snyk in GitHub Actions ──────────────────────────────────────────────────

# - name: Snyk — dependency scan
#   uses: snyk/actions/node@master
#   with:
#     args: --severity-threshold=high --all-projects
#   env:
#     SNYK_TOKEN: \$\{\{ secrets.SNYK_TOKEN }}

# - name: Snyk — container scan
#   uses: snyk/actions/docker@master
#   with:
#     image: ghcr.io/org/myapp:abc1234
#     args: --severity-threshold=high --file=Dockerfile
#   env:
#     SNYK_TOKEN: \$\{\{ secrets.SNYK_TOKEN }}

# ─── OWASP Dependency-Check (open-source) ────────────────────────────────────

# - name: OWASP Dependency-Check
#   uses: dependency-check/Dependency-Check_Action@main
#   with:
#     project: 'myapp'
#     path: '.'
#     format: 'HTML'
#     args: >
#       --enableRetired
#       --failOnCVSS 7
#
# - name: Upload report
#   uses: actions/upload-artifact@v4
#   with:
#     name: dependency-check-report
#     path: reports/

# ─── Dependabot config (.github/dependabot.yml) ───────────────────────────────

# version: 2
# updates:
#   - package-ecosystem: nuget
#     directory: /
#     schedule:
#       interval: weekly
#       day: monday
#     open-pull-requests-limit: 5
#     groups:
#       microsoft-packages:
#         patterns: ["Microsoft.*", "System.*"]
#     labels:
#       - "dependencies"
#       - "security"
#
#   - package-ecosystem: npm
#     directory: /frontend
#     schedule:
#       interval: daily
#     open-pull-requests-limit: 3
#
#   - package-ecosystem: docker
#     directory: /
#     schedule:
#       interval: weekly

# ─── npm audit in CI ──────────────────────────────────────────────────────────

# - name: npm audit
#   run: npm audit --audit-level=high
#   # exits non-zero if HIGH or CRITICAL vulns found

# .NET: NuGet vulnerability check
# - name: NuGet audit
#   run: dotnet list package --vulnerable --include-transitive
# (exits 0 even with vulns — parse output or use Snyk for gate)`,
    },
    {
      label: 'IaC & Container Security Scanning',
      language: 'bash',
      code: `# ─── Checkov — IaC static analysis ───────────────────────────────────────────

# Scan Terraform:
checkov -d infra/ --framework terraform --compact --quiet

# Scan Kubernetes manifests:
checkov -d k8s/ --framework kubernetes

# Scan Dockerfile:
checkov -f Dockerfile --framework dockerfile

# GitHub Actions step — fail on HIGH+CRITICAL:
# - name: Checkov IaC scan
#   uses: bridgecrewio/checkov-action@v12
#   with:
#     directory: infra/
#     framework: terraform
#     soft_fail: false
#     check: CKV_AZURE_1,CKV_AZURE_35,CKV_AZURE_36
#     output_format: sarif
#     output_file_path: checkov.sarif

# ─── Trivy — full-stack security scanner ─────────────────────────────────────

# Scan a container image
trivy image --exit-code 1 --severity HIGH,CRITICAL ghcr.io/org/myapp:abc1234

# Scan a Terraform directory for misconfigs
trivy config --exit-code 1 infra/

# Scan the filesystem (dependency files)
trivy fs --exit-code 1 --security-checks vuln,secret .

# Scan a running Kubernetes cluster
trivy k8s --report summary cluster

# ─── Kubernetes security: PodSecurity + Kyverno ───────────────────────────────

# Enforce restricted Pod Security Standard:
# kubectl label namespace production pod-security.kubernetes.io/enforce=restricted

# Kyverno policy — require non-root containers:
# apiVersion: kyverno.io/v1
# kind: ClusterPolicy
# metadata:
#   name: require-non-root
# spec:
#   validationFailureAction: Enforce
#   rules:
#   - name: check-runAsNonRoot
#     match:
#       resources:
#         kinds: [Pod]
#     validate:
#       message: "Containers must not run as root"
#       pattern:
#         spec:
#           containers:
#           - securityContext:
#               runAsNonRoot: true

# ─── OPA/Conftest policy for Terraform plan ───────────────────────────────────

# policies/no_public_storage.rego
# package main
# deny[msg] {
#   r := input.resource_changes[_]
#   r.type == "azurerm_storage_account"
#   r.change.after.allow_blob_public_access == true
#   msg := sprintf("Storage account '%v' must not allow public blob access", [r.address])
# }
#
# CI:
# terraform plan -out=tfplan
# terraform show -json tfplan > plan.json
# conftest test plan.json --policy policies/`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Only scanning direct dependencies',
      wrong: `# package.json audit — only checks direct deps
npm audit --depth=0
# lodash 4.17.20 is safe
# but lodash is used by a dependency of a dependency
# that transitive dep uses a vulnerable lodash function`,
      right: `# Scan all levels including transitive dependencies
npm audit
# Or use Snyk for richer context:
snyk test --all-projects
# Snyk shows: which transitive dep pulled in the vulnerability
# and whether the vulnerable code path is reachable`,
      explanation: 'Transitive (indirect) dependencies often make up 80% of your dependency tree. A vulnerability in a package you never imported directly can still be exploited if called by a package you do use. Always scan the full dependency tree, not just direct dependencies.',
    },
    {
      title: 'Treating all CVEs with the same urgency',
      wrong: `# Block deployment on any CVE including LOW
trivy image --exit-code 1 --severity LOW,MEDIUM,HIGH,CRITICAL myapp:latest
# Result: pipeline blocked by 47 informational CVEs in base OS
# None are exploitable in this context`,
      right: `# Only fail on HIGH/CRITICAL with no fix available
trivy image \\
  --exit-code 1 \\
  --severity HIGH,CRITICAL \\
  --ignore-unfixed \\
  myapp:latest
# Separately: create tickets for MEDIUM unfixed issues
# Review LOW issues quarterly`,
      explanation: 'A CVSS 2.0 "medium" CVE in a library function that your app never calls is not an emergency. Blocking pipelines on every CVE creates alert fatigue and teaches teams to suppress scanners. Use --ignore-unfixed for issues with no available fix, and tier your response: Critical = fix in 24h, High = fix in 7 days, Medium = fix in 30 days.',
    },
    {
      title: 'No pre-commit secrets detection',
      wrong: `# Developer accidentally commits:
git add config/settings.py
git commit -m "add config"
# settings.py contains: AWS_SECRET_KEY = "AKIAIOSFODNN7EXAMPLE..."
# Secret is now in remote Git history forever`,
      right: `# .pre-commit-config.yaml
# repos:
#   - repo: https://github.com/gitleaks/gitleaks
#     rev: v8.18.0
#     hooks:
#       - id: gitleaks
# Blocks the commit before it ever reaches remote.
# Rotate immediately if a secret is found in history.`,
      explanation: 'Once a secret is pushed to a remote repository, assume it is compromised — even if you delete it immediately. Git history is permanent and can be cloned before the fix. Pre-commit hooks using gitleaks catch secrets before they ever leave the developer\'s machine. Also enable GitHub Secret Scanning as a defence-in-depth layer.',
    },
    {
      title: 'Running containers as root',
      wrong: `FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm ci
# No USER instruction — runs as root (uid 0)
CMD ["node", "dist/main.js"]`,
      right: `FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node . .
RUN npm ci
USER node            # switch to the built-in non-root user
CMD ["node", "dist/main.js"]`,
      explanation: 'A container running as root that has a vulnerability exploited gives the attacker root inside the container. With container escape vulnerabilities, that can mean root on the host. The node:alpine image includes a pre-created "node" user (uid 1000) — switch to it with USER node. For custom images, create a dedicated user with addgroup/adduser.',
    },
    {
      title: 'SAST findings silenced with broad suppression',
      wrong: `// Suppress all Semgrep findings in this file
// nosemgrep
public string GetUser(string userId) {
    return db.Query("SELECT * FROM users WHERE id = '" + userId + "'");
}`,
      right: `// Only suppress a specific, justified false positive with explanation
public string GetUser(string userId) {
    // nosemgrep: sql-injection — userId is validated UUID by caller; parameterised below
    return db.Query("SELECT * FROM users WHERE id = @id", new { id = userId });
}`,
      explanation: 'Broad suppression annotations silence all SAST rules in a file or block, including real vulnerabilities that appear later. Always suppress the minimum scope (specific rule ID, specific line) and always document why it is a false positive. PR reviewers should question any new nosemgrep without an explanation.',
    },
  ];

  challenge: Challenge = {
    title: 'Vulnerability Risk Scorer',
    language: 'typescript',
    description: `Score a vulnerability report and decide whether to block the CI pipeline.

Given a list of vulnerabilities, each with:
- cvssScore: number (0–10)
- hasFixAvailable: boolean
- isReachable: boolean (can the vulnerable code path be reached by the app?)
- packageName: string

Return: { shouldBlock: boolean; criticalCount: number; highCount: number; summary: string }

Rules:
- CRITICAL: cvssScore >= 9.0 AND isReachable → always block
- HIGH: cvssScore >= 7.0 AND isReachable AND hasFixAvailable → block
- Count criticalCount = vulns that are CRITICAL
- Count highCount = vulns that are HIGH (not critical)
- shouldBlock = true if criticalCount > 0 OR highCount > 0
- summary = "BLOCKED: N critical, N high actionable vulns" or "PASS: no blocking vulnerabilities"`,
    hints: [
      'Classify each vulnerability into critical/high/other using the rules above.',
      'A vuln can only be CRITICAL or HIGH if isReachable is true.',
      'HIGH also requires hasFixAvailable — a HIGH with no fix is not actionable yet.',
      'Build the summary string based on shouldBlock.',
    ],
    starterCode: `interface Vulnerability {
  cvssScore: number;
  hasFixAvailable: boolean;
  isReachable: boolean;
  packageName: string;
}

interface ScanResult {
  shouldBlock: boolean;
  criticalCount: number;
  highCount: number;
  summary: string;
}

function scoreVulnerabilities(vulns: Vulnerability[]): ScanResult {
  // TODO: classify and score vulnerabilities
  return { shouldBlock: false, criticalCount: 0, highCount: 0, summary: 'PASS: no blocking vulnerabilities' };
}

// Test
const vulns: Vulnerability[] = [
  { cvssScore: 9.8, hasFixAvailable: true,  isReachable: true,  packageName: 'lodash' },
  { cvssScore: 8.1, hasFixAvailable: true,  isReachable: true,  packageName: 'axios' },
  { cvssScore: 7.5, hasFixAvailable: false, isReachable: true,  packageName: 'moment' },
  { cvssScore: 5.0, hasFixAvailable: true,  isReachable: false, packageName: 'chalk' },
  { cvssScore: 9.1, hasFixAvailable: true,  isReachable: false, packageName: 'colors' },
];

console.log(scoreVulnerabilities(vulns));
// { shouldBlock: true, criticalCount: 1, highCount: 1, summary: 'BLOCKED: 1 critical, 1 high actionable vulns' }`,
    solution: `interface Vulnerability {
  cvssScore: number;
  hasFixAvailable: boolean;
  isReachable: boolean;
  packageName: string;
}

interface ScanResult {
  shouldBlock: boolean;
  criticalCount: number;
  highCount: number;
  summary: string;
}

function scoreVulnerabilities(vulns: Vulnerability[]): ScanResult {
  let criticalCount = 0;
  let highCount = 0;

  for (const v of vulns) {
    if (v.cvssScore >= 9.0 && v.isReachable) {
      criticalCount++;
    } else if (v.cvssScore >= 7.0 && v.isReachable && v.hasFixAvailable) {
      highCount++;
    }
  }

  const shouldBlock = criticalCount > 0 || highCount > 0;
  const summary = shouldBlock
    ? \`BLOCKED: \${criticalCount} critical, \${highCount} high actionable vulns\`
    : 'PASS: no blocking vulnerabilities';

  return { shouldBlock, criticalCount, highCount, summary };
}

const vulns: Vulnerability[] = [
  { cvssScore: 9.8, hasFixAvailable: true,  isReachable: true,  packageName: 'lodash' },
  { cvssScore: 8.1, hasFixAvailable: true,  isReachable: true,  packageName: 'axios' },
  { cvssScore: 7.5, hasFixAvailable: false, isReachable: true,  packageName: 'moment' },
  { cvssScore: 5.0, hasFixAvailable: true,  isReachable: false, packageName: 'chalk' },
  { cvssScore: 9.1, hasFixAvailable: true,  isReachable: false, packageName: 'colors' },
];

console.log(scoreVulnerabilities(vulns));
// { shouldBlock: true, criticalCount: 1, highCount: 1, summary: 'BLOCKED: 1 critical, 1 high actionable vulns' }
// lodash (9.8, reachable) → critical
// axios  (8.1, reachable, fix available) → high
// moment (7.5, reachable, NO fix) → not actionable, skip
// chalk  (5.0, NOT reachable) → skip
// colors (9.1, NOT reachable) → skip (not reachable = no risk)`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the key difference between SAST and DAST?',
      options: [
        'SAST is manual; DAST is automated',
        'SAST analyses source code without running it; DAST probes a running application from the outside',
        'SAST scans dependencies; DAST scans infrastructure',
        'SAST finds secrets; DAST finds container vulnerabilities',
      ],
      answer: 1,
      explanation: 'SAST (Static) reads source code at rest — fast, no deployment needed, finds code-level issues like SQL injection patterns. DAST (Dynamic) sends real HTTP requests to a running app and observes responses — finds runtime issues like authentication bypasses, insecure redirects, and server-side logic flaws. Both have blind spots; use both for coverage.',
    },
    {
      q: 'What should you do immediately when a secret is discovered in Git history?',
      options: [
        'Delete the file containing the secret and force-push',
        'Rotate the secret immediately, then rewrite Git history and audit access logs',
        'Mark the commit as private to hide it from public view',
        'Wait to rotate until after Git history is cleaned up',
      ],
      answer: 1,
      explanation: 'Rotate first — assume the secret is already compromised the moment it was pushed, regardless of how quickly you act. Rotating invalidates it. Then rewrite history (git filter-repo or BFG) to prevent future clones from seeing it. Finally, audit access logs to check whether the key was used maliciously. Deleting the file without rotating is insufficient — the secret remains in Git history.',
    },
    {
      q: 'What does SCA (Software Composition Analysis) scan for?',
      options: [
        'Security misconfigurations in cloud infrastructure',
        'Known CVEs in open-source library dependencies, including transitive ones',
        'Hardcoded secrets in source code',
        'SQL injection patterns in application code',
      ],
      answer: 1,
      explanation: 'SCA identifies known vulnerabilities (CVEs) in the open-source packages your application depends on — both direct dependencies (listed in package.json, *.csproj) and transitive dependencies (dependencies of your dependencies). Tools: Snyk, Dependabot, OWASP Dependency-Check. It is distinct from SAST (which analyses your code) and secrets scanning.',
    },
    {
      q: 'Why is running containers as root a security risk?',
      options: [
        'Root containers cannot connect to external databases',
        'Container builds fail when running as root',
        'A compromised root container can escalate to host root via kernel vulnerabilities, and has full write access to the container filesystem',
        'Root containers are slower because they require elevated permission checks',
      ],
      answer: 2,
      explanation: 'If an attacker exploits a vulnerability in a root container, they have uid 0 inside the container — which maps to uid 0 on the host kernel in some kernel escape scenarios. Even without a kernel escape, a root container can write to any file, install tools, and access secrets mounted via volumes. Always specify USER in the Dockerfile and enforce runAsNonRoot in Kubernetes PodSecurity.',
    },
    {
      q: 'What is a supply chain attack?',
      options: [
        'An attack on a company\'s physical shipping infrastructure',
        'An attack that compromises a dependency, build tool, or CI/CD pipeline to inject malicious code into downstream projects',
        'An attack that floods a CI server with build requests to cause a denial of service',
        'An attack on the secrets vault used to store deployment credentials',
      ],
      answer: 1,
      explanation: 'The SolarWinds, Log4Shell (Log4j), and xz-utils attacks are famous supply chain examples. By compromising a widely-used library, tool, or build pipeline, attackers can inject malicious code into thousands of downstream applications without touching any of them directly. Defences: pin dependency versions, verify checksums/SBOMs, sign images, use private registries with scanning, monitor for unexpected dependency changes.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'What is the OWASP Top 10 and how does it relate to DevSecOps?',
      a: 'The OWASP Top 10 is a regularly updated list of the ten most critical web application security risks (e.g., Injection, Broken Authentication, IDOR, Security Misconfiguration, XSS). It is the baseline for any SAST rule set — tools like Semgrep and CodeQL ship rule packs mapped directly to OWASP categories. In DevSecOps, the Top 10 guides which vulnerabilities to prioritise in SAST rules, DAST scan coverage, and developer security training. It is not a compliance framework but a threat model starting point.',
    },
    {
      q: 'How do you implement "security as code" in practice?',
      a: 'Security as code means storing all security configurations in version-controlled files: SAST rule sets in .semgrepignore and semgrep.yml, OPA policies in .rego files alongside Terraform, Kyverno policies in k8s/ alongside Kubernetes manifests, gitleaks config in .gitleaks.toml, Dependabot config in .github/dependabot.yml. Changes to security policy go through PRs with review, just like application code. This makes security controls auditable, testable, and consistently applied across all environments.',
    },
    {
      q: 'What is CVSS and how do you use it to prioritise vulnerabilities?',
      a: 'CVSS (Common Vulnerability Scoring System) is a 0–10 numeric score for CVE severity: 0–3.9 Low, 4–6.9 Medium, 7–8.9 High, 9–10 Critical. The score incorporates attack vector (network vs local), attack complexity, privileges required, and impact on confidentiality/integrity/availability. In practice: use CVSS as a starting point, not a final verdict. A Critical-scored CVE in a library function your application never calls may be lower priority than a Medium that is directly reachable. Use Snyk\'s reachability analysis or manual assessment to contextualise.',
    },
    {
      q: 'How does GitHub Secret Scanning work and what does it cover?',
      a: 'GitHub Secret Scanning automatically scans every push (including force pushes and branch creations) against a database of known secret patterns from 200+ service providers (AWS, Azure, GitHub, Stripe, Twilio, etc.). When a match is found, GitHub notifies the repository administrators and, for participating providers, directly notifies the provider to invalidate the credential. It also scans historical commits when first enabled. On public repositories it is enabled by default; on private repositories it requires GitHub Advanced Security. It does not replace gitleaks pre-commit hooks — it is a defence-in-depth layer.',
    },
    {
      q: 'What is the difference between Checkov and Trivy for IaC security?',
      a: 'Checkov (Bridgecrew/Palo Alto) is a dedicated IaC security scanner: deep Terraform, Bicep, CloudFormation, Kubernetes manifest, Dockerfile analysis with 1000+ built-in checks. It has the richest IaC policy library and integrates with Prisma Cloud. Trivy (Aqua Security) is a multi-purpose scanner: container images, filesystems, Git repos, IaC configs, and Kubernetes cluster scanning in one tool. Its IaC coverage is good but less deep than Checkov. Use Trivy when you want one tool for containers + IaC in a simple pipeline; use Checkov when IaC security depth is the priority.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Embed security in every CI/CD stage — SAST on code, SCA on dependencies, secrets scan on commits, container/IaC scanning on builds, and policy-as-code gates before deploy.',
    mustKnow: [
      'Shift left: find vulnerabilities at commit time (cheapest), not in production (most expensive)',
      'SAST = code analysis at rest (Semgrep, CodeQL); DAST = live app testing; SCA = dependency CVEs (Snyk, Dependabot)',
      'Secrets: rotate immediately if found in history; use gitleaks pre-commit + GitHub Secret Scanning',
      'Container security: scan images with Trivy, run as non-root USER, use distroless/alpine base images',
      'IaC security: Checkov/tfsec scan Terraform before apply; fail pipeline on HIGH/CRITICAL misconfigs',
      'CVSS + reachability: a Critical CVE in an unreachable path is lower priority than a High in a hot path',
      'Supply chain: pin deps, verify SBOMs/checksums, sign images with Cosign, enforce admission control',
    ],
    interviewFocus: [
      'What is the difference between SAST, DAST, and SCA? When do you run each?',
      'A secret was committed to Git — what are the exact steps you take?',
      'How do you prevent CVE alert fatigue without missing real security issues?',
      'What is a supply chain attack and how do you defend against it in a CI/CD pipeline?',
    ],
  };
}
