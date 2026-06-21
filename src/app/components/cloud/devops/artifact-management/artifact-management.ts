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
  selector: 'app-devops-artifact-management',
  standalone: true,
  imports: [PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent, QnaBlockComponent,
    RevisionCardComponent, PageCompleteComponent],
  templateUrl: './artifact-management.html',
  styleUrl: './artifact-management.scss'
})
export class DevopsArtifactManagement {

  quickRef: QuickRefItem[] = [
    { name: 'Artifact',           type: 'keyword', desc: 'Immutable versioned build output — Docker image, npm package, NuGet package, binary zip' },
    { name: 'Registry',           type: 'keyword', desc: 'Storage and distribution system for artifacts: GHCR, ACR, ECR for Docker; npm, NuGet, PyPI for packages' },
    { name: 'Immutability',       type: 'keyword', desc: 'Published artifact tags must never be overwritten — ensures reproducibility across environments' },
    { name: 'SemVer',             type: 'keyword', desc: 'Semantic Versioning: MAJOR.MINOR.PATCH — breaking.feature.fix; the standard for library versioning' },
    { name: 'Digest',             type: 'keyword', desc: 'SHA256 hash of a Docker image — cryptographically identifies exact content regardless of tag' },
    { name: 'Promotion',          type: 'keyword', desc: 'Moving an artifact from dev → staging → prod registries, retagging without rebuilding' },
    { name: 'Retention Policy',   type: 'keyword', desc: 'Rules for auto-deleting old artifacts to control registry storage costs' },
    { name: 'SBOM',               type: 'keyword', desc: 'Software Bill of Materials — machine-readable inventory of all components in an artifact' },
    { name: 'Provenance',         type: 'keyword', desc: 'Signed attestation of where an artifact came from: which repo, branch, CI run produced it' },
    { name: 'Supply Chain',       type: 'keyword', desc: 'End-to-end chain of tools and processes producing software — a key attack surface (SolarWinds, Log4Shell)' },
  ];

  theory: TheoryPoint[] = [
    {
      heading: 'What is Artifact Management?',
      points: [
        'An artifact is a versioned, immutable build output produced by CI and consumed by CD. The artifact is the unit of deployment.',
        'Artifact management answers: what was deployed to production? When? From which commit? Can we reproduce this build?',
        'Types: Docker images (container workloads), npm/pip/NuGet packages (libraries), zip/tar binaries (legacy apps), Helm charts (Kubernetes apps).',
        'The central rule: build once, promote many. The artifact tested in staging must be the exact binary deployed to production — same bytes, not a rebuild.',
        'Artifact registries provide: versioned storage, access control, vulnerability scanning, retention policies, and distribution (CDN for large binary pulls).',
      ]
    },
    {
      heading: 'Versioning Strategies',
      points: [
        'Semantic Versioning (SemVer): MAJOR.MINOR.PATCH (e.g., 2.4.1). Breaking changes bump MAJOR, new features MINOR, fixes PATCH. Standard for libraries and published packages.',
        'CalVer (Calendar Versioning): YYYY.MM.DD or YYYY.0M (e.g., 2025.01.15). Used when release date is more meaningful than compatibility signals — Ubuntu, pip.',
        'Build-number + SHA tags for services: `1.2.3-b456-abc1234` or simply `main-abc1234`. Services are not consumed as dependencies, so SemVer compatibility semantics are less important.',
        'Git SHA tags: `myapp:a1b2c3d4` — immutable, traceable to exact commit. Combine with a human-readable tag for UX: tag both `myapp:1.2.3` AND `myapp:a1b2c3d4`.',
        'The `:latest` tag: mutable, dangerous for production — it changes silently. Use it only as a developer convenience tag; never pin deployments to `:latest`.',
      ]
    },
    {
      heading: 'Docker Image Registries',
      points: [
        'GHCR (GitHub Container Registry): free for public packages, integrated with GitHub Actions, token-based auth via `GITHUB_TOKEN`.',
        'ACR (Azure Container Registry): geo-replication, integrated with AKS, vulnerability scanning via Microsoft Defender for Containers.',
        'ECR (AWS Elastic Container Registry): integrated with ECS/EKS, lifecycle policies for retention, image scanning with Inspector.',
        'Docker Hub: the default public registry; free tier rate-limits anonymous pulls (100 pulls/6h). Private images require a paid plan.',
        'Image digest vs tag: `myapp:1.2.3` is a mutable pointer (can be retagged). `myapp@sha256:abc...` is an immutable content address. Pin production deployments to digests for reproducibility.',
      ]
    },
    {
      heading: 'Package Registries',
      points: [
        'npm: `npm publish` pushes to npmjs.com or a private registry (Verdaccio, Artifactory, GitHub Packages). Scoped packages `@org/name` are namespaced.',
        'NuGet: `dotnet nuget push` to nuget.org or Azure Artifacts. Private feeds support upstream proxies (pull from nuget.org through your org feed).',
        'PyPI: `python -m twine upload` to pypi.org or a private PyPI mirror (Nexus, Artifactory).',
        'Private registry pattern: internal packages → private feed; external packages → proxy cache through private feed (reduces external dependency, enables scanning).',
        'Azure Artifacts / JFrog Artifactory / Sonatype Nexus: universal artifact managers supporting Docker, npm, NuGet, Maven, PyPI, Helm charts in one tool.',
      ]
    },
    {
      heading: 'Artifact Promotion',
      points: [
        'Promotion: the same artifact moves from dev registry → staging registry → prod registry as it passes quality gates.',
        'For Docker: retag the image (`docker tag old-registry/img:tag new-registry/img:tag && docker push`) or copy using `crane copy` / `skopeo copy` (no local daemon needed).',
        'Promotion gate: integration tests pass in staging → automatic tag to prod registry; OR human approves via CD tool (ArgoCD, Azure Pipelines environment gate).',
        'Traceability: tag promoted images with additional metadata: `myapp:1.2.3-staging-passed`, or add OCI labels (`org.opencontainers.image.revision`, `build.source`).',
        'Never rebuild for production: rebuilding introduces the risk that the build environment, dependencies, or random elements changed. What was tested must be what ships.',
      ]
    },
    {
      heading: 'Supply Chain Security (SBOM & Provenance)',
      points: [
        'Software supply chain attacks (SolarWinds, XZ Utils, Log4Shell) compromise artifacts before or during build — not the running application.',
        'SBOM (Software Bill of Materials): a machine-readable list of all components, licenses, and versions in an artifact. Tools: Syft, Trivy, CycloneDX. Required by some regulations (US EO 14028).',
        'Provenance attestation (SLSA): signed metadata describing which repo/branch/CI run produced the artifact. Generated by GitHub Actions `attest-build-provenance` or Sigstore cosign.',
        'Image signing (Cosign + Sigstore): sign Docker images with a cryptographic key or keyless (OIDC-based). Kubernetes admission controllers (Kyverno, OPA) can reject unsigned images.',
        'Vulnerability scanning: Trivy, Snyk, Docker Scout, Grype scan images for known CVEs in OS packages and language libraries. Run in CI and on a schedule (new CVEs emerge daily).',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Docker Image Lifecycle',
      language: 'bash',
      code: `# Build, tag, push, and promote a Docker image

# Step 1: Build with multiple tags (SemVer + SHA + latest-for-branch)
IMAGE="ghcr.io/myorg/myapp"
VERSION="1.2.3"
SHA=$(git rev-parse --short HEAD)

docker build \\
  --label "org.opencontainers.image.version=\${VERSION}" \\
  --label "org.opencontainers.image.revision=\${SHA}" \\
  --label "org.opencontainers.image.source=https://github.com/myorg/myapp" \\
  -t "\${IMAGE}:\${VERSION}" \\
  -t "\${IMAGE}:\${SHA}" \\
  -t "\${IMAGE}:latest" \\
  .

# Step 2: Push all tags to registry
docker push "\${IMAGE}:\${VERSION}"
docker push "\${IMAGE}:\${SHA}"
docker push "\${IMAGE}:latest"

# Step 3: Get the digest for immutable reference
DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' "\${IMAGE}:\${VERSION}")
echo "Immutable reference: \${DIGEST}"
# ghcr.io/myorg/myapp@sha256:abc123...

# Step 4: Promote to production registry (no rebuild needed)
# Using skopeo — no Docker daemon required on CI runner:
skopeo copy \\
  "docker://ghcr.io/myorg/myapp:\${VERSION}" \\
  "docker://myacr.azurecr.io/myapp:\${VERSION}"

# Tag the image in prod registry as prod-validated:
docker buildx imagetools create \\
  --tag "myacr.azurecr.io/myapp:prod-\${VERSION}" \\
  "myacr.azurecr.io/myapp:\${VERSION}"`,
    },
    {
      label: 'npm Package Publishing',
      language: 'bash',
      code: `# npm package lifecycle — from build to publish

# package.json setup for scoped package:
# {
#   "name": "@myorg/my-library",
#   "version": "2.1.0",
#   "main": "dist/index.js",
#   "types": "dist/index.d.ts",
#   "files": ["dist"],
#   "publishConfig": {
#     "access": "public",
#     "registry": "https://npm.pkg.github.com"
#   }
# }

# Build the library:
npm run build   # compiles TypeScript, outputs to dist/

# Automated versioning with semantic-release (reads conventional commits):
npx semantic-release
# Reads commits since last tag:
# feat: ... -> minor bump (2.1.0 -> 2.2.0)
# fix: ...  -> patch bump (2.1.0 -> 2.1.1)
# feat!: BREAKING CHANGE -> major bump (2.1.0 -> 3.0.0)
# Creates Git tag, CHANGELOG.md entry, GitHub Release, publishes to npm

# Manual publish flow:
npm version patch    # 2.1.0 -> 2.1.1, creates git tag
npm publish          # build + publish to registry

# .npmrc for private registry authentication:
# //npm.pkg.github.com/:_authToken=\${NODE_AUTH_TOKEN}
# @myorg:registry=https://npm.pkg.github.com

# Check published package:
npm info @myorg/my-library versions
npm pack --dry-run    # shows what will be included in the package`,
    },
    {
      label: 'SBOM & Image Signing',
      language: 'bash',
      code: `# Generate SBOM and sign Docker image in CI

# Step 1: Generate SBOM with Syft
syft "ghcr.io/myorg/myapp:1.2.3" \\
  --output cyclonedx-json \\
  --file sbom.json

# Attach SBOM to image (as OCI artifact):
oras attach ghcr.io/myorg/myapp:1.2.3 \\
  --artifact-type application/vnd.cyclonedx \\
  sbom.json:application/json

# Step 2: Vulnerability scan with Trivy
trivy image "ghcr.io/myorg/myapp:1.2.3" \\
  --exit-code 1 \\                # fail if HIGH/CRITICAL found
  --severity HIGH,CRITICAL \\
  --format table

# Step 3: Sign image with Cosign (keyless via OIDC in GitHub Actions):
cosign sign --yes "ghcr.io/myorg/myapp:1.2.3"
# Signature stored in transparency log (Rekor)

# Step 4: Generate provenance attestation (GitHub Actions):
# uses: actions/attest-build-provenance@v1
# with:
#   subject-name: ghcr.io/myorg/myapp
#   subject-digest: sha256:abc123...

# Verify signature before deploying:
cosign verify \\
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \\
  --certificate-identity https://github.com/myorg/myapp/.github/workflows/build.yml@refs/heads/main \\
  "ghcr.io/myorg/myapp:1.2.3"`,
    },
  ];

  mistakes: CommonMistake[] = [
    {
      title: 'Using :latest tag for production deployments',
      wrong: `# Kubernetes deployment:
# spec:
#   containers:
#   - name: myapp
#     image: ghcr.io/myorg/myapp:latest  # mutable!
# Next CI run pushes a new :latest
# Kubernetes pulls it on pod restart — unknown version deployed
# No way to know what's running in production`,
      right: `# Pin to immutable reference:
# image: ghcr.io/myorg/myapp:1.2.3
# OR even better — pin to digest:
# image: ghcr.io/myorg/myapp@sha256:abc123...
# GitOps: image tag in Git = audit trail of what's deployed`,
      explanation: '`:latest` is a mutable pointer — it changes every time CI pushes. Pinning to a specific tag or SHA digest means you know exactly what is running in production, can reproduce the environment, and changes are deliberate (via a PR updating the tag). Never use `:latest` in staging or production deployments.',
    },
    {
      title: 'Overwriting published artifact versions',
      wrong: `# npm publish v1.2.3 to fix a bug
# Bug still present, so re-publish with same version:
npm publish   # version 1.2.3 again
# Consumers who already cached v1.2.3 have the old buggy version
# New consumers get the fixed version
# v1.2.3 means two different things to different consumers`,
      right: `# Never overwrite — bump the version:
npm version patch  # 1.2.3 -> 1.2.4
npm publish
# v1.2.3 remains immutable — consumers know exactly what they have
# v1.2.4 is the fix — clear, auditable, reproducible`,
      explanation: 'Overwriting a published artifact version breaks reproducibility — two developers referencing "v1.2.3" may have different bytes depending on when they installed. Every release must have a unique, immutable version. Most registries (npm, NuGet, PyPI) enforce this; configure your private registries to do the same.',
    },
    {
      title: 'No retention policy on artifact registries',
      wrong: `# CI builds and pushes a Docker image on every commit:
# 50 commits/day × 365 days = 18,250 images
# Each image: ~200MB = ~3.6 TB of storage
# $0.023/GB = $82/month and growing
# Registry queries become slow; disk fills on self-hosted registries`,
      right: `# ECR lifecycle policy — keep last 30 release images:
# {
#   "rules": [{
#     "rulePriority": 1,
#     "selection": { "tagStatus": "tagged",
#                   "tagPrefixList": ["v"],
#                   "countType": "imageCountMoreThan",
#                   "countNumber": 30 },
#     "action": { "type": "expire" }
#   }]
# }`,
      explanation: 'Without retention policies, artifact registries grow indefinitely. Set policies: keep the last N tagged releases, delete untagged images after 7 days, never delete images currently deployed to production. Most registries (ECR, GHCR, ACR) support lifecycle policies — configure them from day one.',
    },
    {
      title: 'No vulnerability scanning on published images',
      wrong: `# CI: build image → push to registry → deploy
# Image contains: Node 16 (EOL), openssl with CVE-2022-0778
# Running in production for 6 months
# Security team discovers it during a pen test
# Emergency patch required over a weekend`,
      right: `# Add scanning to CI pipeline:
# trivy image myapp:1.2.3 --exit-code 1 --severity HIGH,CRITICAL
# Fails the build if critical CVEs found
# ALSO: schedule weekly scans of production images
# (new CVEs emerge daily — scanning at build time is not enough)`,
      explanation: 'Vulnerability scanning at build time catches known CVEs at the moment of build. But new CVEs are published daily — a clean image today may be vulnerable next month. Set up scheduled scans of your registry (ECR Inspector, ACR Microsoft Defender, Trivy operator in Kubernetes) and alert on new findings.',
    },
    {
      title: 'Rebuilding the artifact for production',
      wrong: `# Staging pipeline: npm run build -- --configuration=staging → push staging-image
# Production pipeline: npm run build -- --configuration=production → push prod-image
# Two separate builds = two potentially different binaries
# "We tested staging, but deployed production" is meaningless
# build-time differences (npm package resolution, source maps) can cause prod-only bugs`,
      right: `# Build ONCE in CI:
# docker build -t myapp:1.2.3 .
# Push to dev registry
# Staging: promote dev image to staging registry → test
# Production: promote staging image to prod registry → deploy
# Configuration via ENV vars at runtime, not compile-time flags`,
      explanation: 'Building separate artifacts for each environment violates the "build once, promote many" principle. The artifact tested in staging must be bit-for-bit identical to what goes to production. Use runtime environment variables for config differences, and promote the same Docker image or binary through all environments.',
    },
    {
      title: 'No traceability from artifact to source commit',
      wrong: `# Docker image: myapp:1.2.3 deployed to production
# Production incident — what code is running?
# No OCI labels, no SHA tag, no SBOM
# Engineer must dig through CI logs from weeks ago
# Takes 45 minutes to determine the running commit`,
      right: `# Build with OCI labels:
# docker build \\
#   --label "org.opencontainers.image.revision=abc1234" \\
#   --label "org.opencontainers.image.source=https://github.com/myorg/myapp" \\
#   --label "org.opencontainers.image.created=2025-01-15T10:30:00Z" \\
#   -t myapp:1.2.3 .
#
# During incident: docker inspect myapp:1.2.3 | jq '.[].Config.Labels'`,
      explanation: 'When a production incident occurs, you need to know exactly which commit is running within seconds. OCI labels (`org.opencontainers.image.revision`, `source`, `created`) embedded at build time make this instant. Tag images with both version and SHA. The 30 seconds to add labels at build time saves 45 minutes during an incident.',
    },
  ];

  challenge: Challenge = {
    title: 'Artifact Version Resolver',
    language: 'typescript',
    description: `Build a function that resolves which artifact version to deploy to a given environment, given a list of available artifact versions and environment promotion rules.

Rules:
- "dev" can use any version
- "staging" can only use versions that passed "dev" (status: "passed" in dev)
- "production" can only use versions that passed "staging"

Each version has a deployments record tracking its status per environment.

Return the latest version eligible for the target environment, or null if none qualify.`,
    hints: [
      'Filter versions where the target environment\'s prerequisites are met',
      'For staging: dev must have status "passed"',
      'For production: staging must have status "passed"',
      'After filtering, sort by version descending and return the first',
      'Use semver comparison: split by "." and compare numerically',
    ],
    starterCode: `interface ArtifactVersion {
  version: string;   // e.g. "1.2.3"
  deployments: Partial<Record<'dev' | 'staging' | 'production', 'passed' | 'failed' | 'pending'>>;
}

function resolveDeployTarget(
  versions: ArtifactVersion[],
  targetEnv: 'dev' | 'staging' | 'production'
): string | null {
  // TODO: implement
  return null;
}`,
    solution: `function semverCompare(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function resolveDeployTarget(
  versions: ArtifactVersion[],
  targetEnv: 'dev' | 'staging' | 'production'
): string | null {
  const eligible = versions.filter(v => {
    if (targetEnv === 'dev') return true;
    if (targetEnv === 'staging') return v.deployments['dev'] === 'passed';
    if (targetEnv === 'production') return v.deployments['staging'] === 'passed';
    return false;
  });

  if (eligible.length === 0) return null;

  eligible.sort((a, b) => semverCompare(b.version, a.version));
  return eligible[0].version;
}

// Test:
const versions: ArtifactVersion[] = [
  { version: '1.3.0', deployments: { dev: 'passed', staging: 'failed' } },
  { version: '1.2.1', deployments: { dev: 'passed', staging: 'passed' } },
  { version: '1.2.0', deployments: { dev: 'passed', staging: 'passed', production: 'passed' } },
  { version: '1.1.0', deployments: { dev: 'failed' } },
];

console.log(resolveDeployTarget(versions, 'dev'));        // "1.3.0" (latest)
console.log(resolveDeployTarget(versions, 'staging'));    // "1.3.0" (latest with dev passed)
console.log(resolveDeployTarget(versions, 'production')); // "1.2.1" (latest with staging passed)`,
  };

  quiz: QuizQuestion[] = [
    {
      q: 'What is the difference between a Docker image tag and a digest?',
      options: [
        'Tags are for human use; digests are only used internally by Docker',
        'A tag is a mutable pointer that can be reassigned; a digest is an immutable SHA256 hash of the exact image content',
        'Digests are tags with longer names to prevent collisions',
        'Tags are used for local images; digests are used for remote registry images',
      ],
      answer: 1,
      explanation: 'A tag (`:1.2.3`, `:latest`) is a mutable pointer — it can be overwritten to point to a different image. A digest (`@sha256:abc...`) is the cryptographic hash of the image content — it uniquely and immutably identifies exact bytes. For reproducible production deployments, pin to digests: `image: myapp@sha256:abc123`.',
    },
    {
      q: 'What does "build once, promote many" mean in artifact management?',
      options: [
        'Run the build pipeline once per sprint and promote the result through multiple QA rounds',
        'Build a single artifact in CI and promote that exact artifact through dev → staging → production without rebuilding',
        'Build the artifact once on the developer\'s machine and upload it directly to production',
        'Use a build cache so the pipeline can build multiple artifacts from the same source simultaneously',
      ],
      answer: 1,
      explanation: '"Build once, promote many" means the artifact built and tested in CI (a specific Docker image or binary) is the exact artifact deployed to every environment. Rebuilding for staging or production introduces risk that build-time differences (dependency resolution, environment variables, random elements) produce different binaries. What was tested must be what ships.',
    },
    {
      q: 'What is a Software Bill of Materials (SBOM) and why is it important?',
      options: [
        'A cost estimate for purchasing software licenses used in the project',
        'A machine-readable inventory of all components, libraries, and their versions included in an artifact',
        'A checklist that developers complete before releasing software to production',
        'A Git tag that documents what changed between two software versions',
      ],
      answer: 1,
      explanation: 'An SBOM lists every component (OS packages, language libraries, transitive dependencies) in an artifact with versions and licenses. When a new CVE is published (like Log4Shell), an SBOM lets you instantly identify which of your artifacts are affected without rebuilding or scanning each one individually. Required by US Executive Order 14028 for software sold to the US government.',
    },
    {
      q: 'Why should you never use `:latest` to pin production Kubernetes deployments?',
      options: [
        'The `:latest` tag pulls the image every time, even if nothing changed, wasting bandwidth',
        '`:latest` is mutable — it points to a different image every CI run, making it impossible to know what is actually running in production',
        'Kubernetes does not support `:latest` in production namespaces',
        '`:latest` only works with Docker Hub, not with private registries like ACR or ECR',
      ],
      answer: 1,
      explanation: 'The `:latest` tag changes every time CI pushes a new image. A Kubernetes pod restarting on a node without the cached image will pull the new `:latest` — potentially deploying an untested or broken version without any deliberate deployment action. Pin to a specific version tag or digest so deployments are always deliberate and auditable.',
    },
    {
      q: 'What is artifact promotion and why is it preferred over rebuilding?',
      options: [
        'Promotion increases the artifact\'s version number before deploying to production',
        'Promotion moves the same artifact (same bytes) between registries as it passes quality gates, ensuring the tested binary is exactly what ships',
        'Promotion triggers a new build optimised for the target environment\'s hardware',
        'Promotion copies the artifact from the developer\'s machine to a shared network location',
      ],
      answer: 1,
      explanation: 'Artifact promotion retagging or copying the exact artifact (same Docker image digest, same binary file) from a dev registry to a staging registry, then to a prod registry as it passes tests at each stage. This guarantees that what was tested in staging is exactly what runs in production. Rebuilding risks subtle differences from changed dependencies, updated build tools, or non-deterministic build steps.',
    },
  ];

  qna: QnaItem[] = [
    {
      q: 'How do you implement artifact retention without deleting images that are currently deployed?',
      a: 'Two approaches: (1) **Tag-based protection** — before deleting old tags, query your deployment systems (Kubernetes namespaces, ECS task definitions) for all currently-used image references, and exclude them from the retention sweep. A script can `kubectl get pods -A -o jsonpath="{.items[*].spec.containers[*].image}"` to get live images. (2) **Registry features** — some registries (ACR, ECR) let you set lifecycle policies with exemptions for images tagged with specific prefixes (e.g., `prod-*`). Tag images with `prod-<version>` at promotion time and the lifecycle policy won\'t delete them.',
    },
    {
      q: 'What is Cosign and how does image signing work?',
      a: 'Cosign (part of Sigstore) signs container images so you can cryptographically verify who built them and from what source. Signing: after pushing `myapp:1.2.3`, run `cosign sign myapp:1.2.3` — this creates a signature stored alongside the image in the registry (as an OCI artifact). In keyless mode (recommended for CI), the signature is tied to an OIDC identity (the GitHub Actions workflow). Verification: `cosign verify --certificate-identity <workflow-URL> --certificate-oidc-issuer https://token.actions.githubusercontent.com myapp:1.2.3`. Kubernetes admission controllers (Kyverno, OPA/Gatekeeper) can enforce that only signed images from trusted sources are allowed to run in the cluster.',
    },
    {
      q: 'How do you handle transitive dependency vulnerabilities in Docker images?',
      a: 'Transitive vulnerabilities (CVEs in packages your packages depend on) are the hardest to manage. Strategy: (1) **Base image hygiene** — use minimal base images (`alpine`, `distroless`, `slim` variants) to reduce OS-level attack surface. Update base images regularly. (2) **Scheduled registry scans** — Trivy Operator, ECR Inspector, or ACR Defender scan all registry images on a schedule and alert on new CVEs. (3) **Automated base image updates** — Renovate or Dependabot can open PRs to update the `FROM` line in your Dockerfile when a new base image is available. (4) **SBOM + CVE mapping** — generate an SBOM at build time; when a new CVE is published, cross-reference against your SBOM to identify affected artifacts without rescanning.',
    },
    {
      q: 'What is the difference between a private registry and an upstream proxy cache?',
      a: 'A private registry stores your own internally-built artifacts. An upstream proxy cache (pull-through cache) forwards requests for public packages (from Docker Hub, npmjs.com, PyPI) through your registry, caching them locally. Benefits of a proxy cache: (1) Resilience — if Docker Hub is down or rate-limiting, your CI still works. (2) Security scanning — all external packages pass through your registry and get scanned before reaching CI. (3) Cost — reduces egress bandwidth from your CI runners. (4) Compliance — in air-gapped environments, only packages approved through the proxy can be used. Tools: Artifactory, Nexus, Harbor, and native features in ACR (connected registry) and ECR (pull-through cache) support this.',
    },
    {
      q: 'How do you version Docker images when using a monorepo with multiple services?',
      a: 'Two strategies: (1) **Per-service SemVer** — each service has its own version, bumped by conventional commits scoped to that service (`fix(auth-service): ...`). Tools like `nx affected` or `changesets` determine which services need new versions. Each service image is tagged independently: `auth-service:2.1.3`, `payment-service:1.4.0`. (2) **Monorepo build SHA** — all services use the same Git SHA tag for images from the same commit: `auth-service:main-abc1234`, `payment-service:main-abc1234`. Simple to implement; harder to communicate what changed in a given release. For teams that deploy services independently, per-service SemVer gives clearer change semantics; for teams that deploy together, the SHA approach is simpler.',
    },
  ];

  revision: RevisionSummary = {
    oneLiner: 'Artifacts are immutable versioned build outputs — build once (SHA/SemVer tag), promote the same bytes through environments, scan for CVEs, sign for provenance; never overwrite published versions or pin to :latest.',
    mustKnow: [
      'Build once, promote many: same artifact from CI all the way to production — never rebuild',
      ':latest is mutable and dangerous for production — pin to a specific tag or SHA digest',
      'Never overwrite a published version — bump the version number for every release',
      'OCI labels: embed git SHA and source URL at build time for instant incident traceability',
      'Retention policies: auto-delete old artifacts but protect currently-deployed images',
      'SBOM: machine-readable component inventory — enables rapid CVE impact assessment',
      'Cosign/Sigstore: sign images; admission controllers enforce only trusted images run in K8s',
    ],
    interviewFocus: [
      'What is "build once, promote many" and why does rebuilding for production break this?',
      'What is the difference between a Docker image tag and a digest?',
      'How would you implement artifact retention without deleting deployed images?',
      'What is an SBOM and when would you need one?',
    ],
  };
}
