import { Component } from '@angular/core';
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
  { name: 'docker pull', type: 'method', desc: 'Download an image from a registry: docker pull nginx:1.27-alpine (omit tag → :latest)' },
  { name: 'docker push', type: 'method', desc: 'Upload a tagged image to a registry: docker push ghcr.io/myorg/myapp:1.0.0' },
  { name: 'docker tag', type: 'method', desc: 'Create an alias tag for an existing image: docker tag myapp:build ghcr.io/myorg/myapp:1.0.0' },
  { name: 'docker login', type: 'method', desc: 'Authenticate to a registry (default: Docker Hub); use docker login ghcr.io for GHCR' },
  { name: 'docker image ls', type: 'method', desc: 'List local images with name, tag, image ID, and size; add -a to include intermediate layers' },
  { name: 'docker image inspect', type: 'method', desc: 'JSON metadata: layers, digest, env, labels, exposed ports — use --format for specific fields' },
  { name: 'docker image prune', type: 'method', desc: 'Remove dangling images (no tag, not referenced by a container); add -a to remove all unused images' },
  { name: 'image digest', type: 'keyword', desc: 'Immutable sha256 hash of the image manifest — pin with @sha256:... for fully reproducible pulls' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Image Naming and Tagging Conventions',
    points: [
      'Full image reference: [registry/][namespace/]name[:tag][@digest]. Examples: nginx:1.27-alpine, ghcr.io/myorg/api:2.3.1, myregistry.internal:5000/app@sha256:abc.',
      'If no registry is specified, Docker defaults to docker.io (Docker Hub). If no tag, Docker defaults to :latest.',
      'Semantic versioning tags (1.0.0, 1.0, 1) provide different levels of mutability. 1.0.0 is the most specific; 1 just means "latest 1.x". Production should use the full version.',
      'Immutable references use a digest: @sha256:abc123... A digest is a content hash of the manifest — it never changes even if someone force-pushes to the same tag.',
      'Common tag patterns in CI/CD: :latest (dev branch), :sha-<git-commit> (immutable for tracing), :v1.2.3 (release), :pr-42 (pull request preview builds).',
    ],
  },
  {
    heading: 'Registries: Docker Hub, GHCR, and Private',
    points: [
      'Docker Hub (docker.io): the default public registry. Free tier has pull rate limits (100/6h anonymous, 200/6h free auth). Ideal for public open-source images.',
      'GitHub Container Registry (ghcr.io): tightly integrated with GitHub Actions; inherits repo permissions; free for public repos. Login with a GitHub PAT or GITHUB_TOKEN in Actions.',
      'AWS ECR, Azure ACR, Google Artifact Registry: managed private registries with built-in IAM authentication (no long-lived passwords). Integrate with their respective cloud CI/CD systems.',
      'Self-hosted options: Harbor (open-source, adds vulnerability scanning, RBAC, replication), Docker Distribution (reference implementation). Useful for air-gapped environments.',
      'Registry mirror / pull-through cache: configure Docker daemon with a mirror URL to cache frequently pulled base images locally and avoid rate limits.',
    ],
  },
  {
    heading: 'Image Management — Pull, Tag, Push, Prune',
    points: [
      'docker pull downloads all missing layers for an image. Layers already present locally are reused — content-addressable, so identical layers across images are stored once.',
      'docker tag creates a new reference pointing to the same image ID. No data is copied. Use it to rename an image before pushing: docker tag myapp:build ghcr.io/org/myapp:1.2.3.',
      'docker push uploads only layers not yet present in the remote registry. Large builds push quickly if the base image layers are already there.',
      'docker image prune removes "dangling" images — untagged images no longer referenced by any container. Use -a to also remove tagged images not referenced by any container.',
      'docker image inspect returns the layer digests, environment variables, entrypoint, and labels defined in the image. Use --format to extract individual fields.',
    ],
  },
  {
    heading: 'Image Security: Scanning and Signing',
    points: [
      'Image scanning analyses every layer for known CVEs using databases like NVD, OSV, and vendor advisories. Trivy is the most popular open-source scanner; integrates into CI pipelines.',
      'Scan before push in CI: `trivy image --exit-code 1 --severity CRITICAL myapp:build` fails the pipeline if any CRITICAL CVE is found.',
      'Image signing with Cosign (Sigstore): after push, sign the digest with `cosign sign ghcr.io/org/myapp:1.2.3`. Verify in deployment: `cosign verify ...`. Policy enforcers (Kyverno, OPA Gatekeeper) can require a valid signature before allowing a pod to run.',
      'Software Bill of Materials (SBOM): an inventory of every package in the image. Generate with `syft image myapp:1.2.3 -o cyclonedx-json`. Attach to the registry alongside the image.',
      'Use minimal base images (Alpine, distroless) to reduce the attack surface — fewer installed packages means fewer potential CVEs. Distroless images have no shell, package manager, or OS utilities.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Pull / Tag / Push',
    language: 'bash',
    code:
      '# Pull a specific version from Docker Hub\n' +
      'docker pull nginx:1.27-alpine\n' +
      '\n' +
      '# Pull from GHCR (GitHub Container Registry)\n' +
      'docker pull ghcr.io/myorg/myapp:2.3.1\n' +
      '\n' +
      '# Login to GHCR with a GitHub PAT\n' +
      'echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin\n' +
      '\n' +
      '# Build and tag for GHCR in one step\n' +
      'docker build -t ghcr.io/myorg/myapp:2.3.1 .\n' +
      '\n' +
      '# Tag an existing image for a new registry\n' +
      'docker tag myapp:build ghcr.io/myorg/myapp:2.3.1\n' +
      'docker tag myapp:build ghcr.io/myorg/myapp:2.3\n' +
      'docker tag myapp:build ghcr.io/myorg/myapp:latest\n' +
      '\n' +
      '# Push all tags at once\n' +
      'docker push ghcr.io/myorg/myapp --all-tags\n' +
      '\n' +
      '# Pull by digest (immutable — survives tag changes)\n' +
      'docker pull nginx@sha256:a4c0cfb7a0c0dac2025ec3d4f38b8eb5f4c97c16a1b8ef3e2d7b1a4f3c2b5e6f',
  },
  {
    label: 'Manage & Inspect',
    language: 'bash',
    code:
      '# List local images\n' +
      'docker image ls\n' +
      'docker image ls ghcr.io/myorg/myapp  # filter by name\n' +
      '\n' +
      '# Show image ID, digest, and size\n' +
      'docker image ls --digests\n' +
      '\n' +
      '# Inspect: layers, env, entrypoint, labels\n' +
      'docker image inspect nginx:1.27-alpine\n' +
      '\n' +
      '# Extract the image digest\n' +
      'docker image inspect --format \'{{index .RepoDigests 0}}\' nginx:1.27-alpine\n' +
      '\n' +
      '# See layer history (what Dockerfile command created each layer)\n' +
      'docker history nginx:1.27-alpine\n' +
      '\n' +
      '# Remove a specific image\n' +
      'docker image rm nginx:1.27-alpine\n' +
      '\n' +
      '# Remove dangling images (no tag, not in use)\n' +
      'docker image prune -f\n' +
      '\n' +
      '# Remove ALL unused images (not just dangling)\n' +
      'docker image prune -a -f',
  },
  {
    label: 'Scan & Sign',
    language: 'bash',
    code:
      '# Install Trivy (on macOS via brew)\n' +
      'brew install aquasecurity/trivy/trivy\n' +
      '\n' +
      '# Scan an image for CVEs\n' +
      'trivy image nginx:1.27-alpine\n' +
      '\n' +
      '# Fail CI pipeline on any CRITICAL vulnerability\n' +
      'trivy image --exit-code 1 --severity CRITICAL myapp:build\n' +
      '\n' +
      '# Scan and output as SARIF (upload to GitHub Security tab)\n' +
      'trivy image --format sarif --output trivy-results.sarif myapp:build\n' +
      '\n' +
      '# Generate an SBOM with Syft\n' +
      'syft ghcr.io/myorg/myapp:2.3.1 -o cyclonedx-json > sbom.json\n' +
      '\n' +
      '# Sign the image with Cosign (keyless via OIDC in CI)\n' +
      'cosign sign ghcr.io/myorg/myapp:2.3.1\n' +
      '\n' +
      '# Verify the signature\n' +
      'cosign verify \\\n' +
      '  --certificate-identity=https://github.com/myorg/myapp/.github/workflows/release.yml@refs/heads/main \\\n' +
      '  --certificate-oidc-issuer=https://token.actions.githubusercontent.com \\\n' +
      '  ghcr.io/myorg/myapp:2.3.1',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Using :latest in production',
    wrong: 'FROM node:latest\n# In docker-compose.yml:\nimage: myapp:latest',
    right: 'FROM node:20.18-alpine3.20\n# In docker-compose.yml:\nimage: myapp:2.3.1\n# Or pin to digest for maximum reproducibility:\nimage: myapp@sha256:abc123ef...',
    explanation: ':latest is a mutable pointer — a rebuild replaces it silently. Months later you redeploy the same compose file and get a different image. Always pin to a specific version tag or digest.',
  },
  {
    title: 'Leaving registry credentials in the environment after a push',
    wrong: 'docker login -u $USER -p $PASSWORD ghcr.io\ndocker push ghcr.io/myorg/myapp:1.0\n# Credentials stored in ~/.docker/config.json — leaked if env is shared',
    right: 'echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin\ndocker push ghcr.io/myorg/myapp:1.0\ndocker logout ghcr.io   # remove stored credential',
    explanation: 'Always pipe the password via stdin (not -p flag) to avoid shell history exposure. In CI, use short-lived OIDC tokens instead of long-lived PATs. Always docker logout after pushing.',
  },
  {
    title: 'Pushing unscanned images to production registries',
    wrong: 'docker build -t myapp:1.0 . && docker push myapp:1.0\n# No vulnerability check performed',
    right: 'docker build -t myapp:1.0 .\ntrivy image --exit-code 1 --severity CRITICAL myapp:1.0\ndocker push myapp:1.0   # only reached if scan passes',
    explanation: 'Without scanning, you may ship images with known critical vulnerabilities. Add Trivy (or Grype/Snyk) as a pipeline gate that fails the build before push on CRITICAL findings.',
  },
  {
    title: 'Forgetting to prune unused images on CI runners',
    wrong: '# CI agent pulls a new image on every build\n# Old images accumulate — runner disk fills up over days',
    right: '# After build/push step in CI pipeline:\ndocker image prune -a -f --filter "until=24h"\n# Or add a scheduled cleanup job:\ndocker system prune -a -f',
    explanation: 'Each CI build may pull a new base image or create build-cache layers. Without pruning, runner disk fills up and builds start failing with "no space left on device".',
  },
  {
    title: 'Tagging with only one tag before pushing',
    wrong: '# Only tag and push :latest\ndocker tag myapp:build myapp:latest\ndocker push myapp:latest',
    right: '# Tag with both version and :latest\ndocker tag myapp:build ghcr.io/org/myapp:2.3.1\ndocker tag myapp:build ghcr.io/org/myapp:latest\ndocker push ghcr.io/org/myapp:2.3.1\ndocker push ghcr.io/org/myapp:latest',
    explanation: 'Push a versioned tag (2.3.1) AND :latest so new users get the latest without needing to know the current version. The versioned tag is what you reference in deployment manifests.',
  },
];

const challenge: Challenge = {
  title: 'Image Tag Validator',
  language: 'typescript',
  description:
    'Write `validateImageRef(ref)` that validates a Docker image reference and returns a structured result.\n\n' +
    'Valid format: `[registry/][namespace/]name[:tag]` where:\n' +
    '- registry (optional): hostname with optional port, e.g. `ghcr.io`, `myregistry.internal:5000`\n' +
    '- namespace (optional): alphanumeric + hyphens/underscores, e.g. `myorg`\n' +
    '- name: required, alphanumeric + hyphens/underscores, 1-128 chars\n' +
    '- tag (optional): alphanumeric + `.`, `-`, `_`, max 128 chars; defaults to `latest` if absent\n\n' +
    'Return:\n' +
    '```\n' +
    'interface ValidationResult {\n' +
    '  valid: boolean;\n' +
    '  tag: string;         // resolved tag (\'latest\' if not specified)\n' +
    '  isPinned: boolean;   // true if tag looks like a semver (e.g. 1.2.3)\n' +
    '  warning?: string;    // present if valid but tag is \'latest\'\n' +
    '}\n' +
    '```',
  hints: [
    'Split on : to separate the name part from the tag',
    'Use a regex to check if the tag matches semver: /^\\d+\\.\\d+\\.\\d+/',
    'The tag defaults to "latest" when absent — set isPinned to false and add a warning',
    'For simplicity, assume the input is already in valid structural form — only check the tag logic',
  ],
  starterCode:
    'interface ValidationResult {\n' +
    '  valid: boolean;\n' +
    '  tag: string;\n' +
    '  isPinned: boolean;\n' +
    '  warning?: string;\n' +
    '}\n\n' +
    'function validateImageRef(ref: string): ValidationResult {\n' +
    '  // TODO: implement\n' +
    '  return { valid: false, tag: \'\', isPinned: false };\n' +
    '}\n\n' +
    'console.log(validateImageRef(\'nginx:1.27.0\'));\n' +
    '// { valid: true, tag: \'1.27.0\', isPinned: true }\n\n' +
    'console.log(validateImageRef(\'myapp\'));\n' +
    '// { valid: true, tag: \'latest\', isPinned: false, warning: \'Tag defaults to :latest — pin to a version for production\' }',
  solution:
    'interface ValidationResult {\n' +
    '  valid: boolean;\n' +
    '  tag: string;\n' +
    '  isPinned: boolean;\n' +
    '  warning?: string;\n' +
    '}\n\n' +
    'function validateImageRef(ref: string): ValidationResult {\n' +
    '  if (!ref || ref.trim() === \'\') {\n' +
    '    return { valid: false, tag: \'\', isPinned: false, warning: \'Empty image reference\' };\n' +
    '  }\n\n' +
    '  // Split name from tag on the last colon (after the registry part)\n' +
    '  const colonIdx = ref.lastIndexOf(\':\');\n' +
    '  const tag = colonIdx === -1 ? \'latest\' : ref.slice(colonIdx + 1);\n\n' +
    '  if (tag.length === 0 || tag.length > 128) {\n' +
    '    return { valid: false, tag, isPinned: false, warning: \'Tag is empty or too long (max 128 chars)\' };\n' +
    '  }\n\n' +
    '  const validTagPattern = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;\n' +
    '  if (!validTagPattern.test(tag)) {\n' +
    '    return { valid: false, tag, isPinned: false, warning: \'Tag contains invalid characters\' };\n' +
    '  }\n\n' +
    '  const semverPattern = /^\\d+\\.\\d+\\.\\d+/;\n' +
    '  const isPinned = semverPattern.test(tag);\n\n' +
    '  const warning = tag === \'latest\'\n' +
    '    ? \'Tag defaults to :latest — pin to a version for production\'\n' +
    '    : undefined;\n\n' +
    '  return { valid: true, tag, isPinned, warning };\n' +
    '}\n\n' +
    'console.log(validateImageRef(\'nginx:1.27.0\'));\n' +
    '// { valid: true, tag: \'1.27.0\', isPinned: true }\n\n' +
    'console.log(validateImageRef(\'myapp\'));\n' +
    '// { valid: true, tag: \'latest\', isPinned: false, warning: \'Tag defaults to :latest...\' }\n\n' +
    'console.log(validateImageRef(\'ghcr.io/myorg/api:sha-abc1234\'));\n' +
    '// { valid: true, tag: \'sha-abc1234\', isPinned: false }',
};

const quiz: QuizQuestion[] = [
  {
    q: 'What does docker pull nginx:1.27-alpine download if the alpine layer is already local?',
    options: [
      'It re-downloads all layers',
      'It skips layers already present by comparing sha256 digests',
      'It throws an error about duplicate layers',
      'It downloads only the manifest, not the layers',
    ],
    answer: 1,
    explanation: 'Docker images use content-addressable storage. Each layer has a sha256 digest. docker pull compares digests with what is already on disk and skips layers already present — regardless of which image they came from.',
  },
  {
    q: 'Which image reference is fully reproducible even if someone force-pushes to the same tag?',
    options: [
      'nginx:latest',
      'nginx:1.27',
      'nginx:1.27-alpine',
      'nginx@sha256:a4c0cfb7...',
    ],
    answer: 3,
    explanation: 'A digest (@sha256:...) is a cryptographic hash of the image manifest content. It cannot change — if the manifest changes, the digest changes. Tags like :latest or :1.27 can be overwritten by a force push.',
  },
  {
    q: 'You want to push to GHCR. What is the correct authentication command?',
    options: [
      'docker login -u $USER -p $GITHUB_TOKEN',
      'echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin',
      'docker auth ghcr.io --token $GITHUB_TOKEN',
      'export DOCKER_PASSWORD=$GITHUB_TOKEN && docker login ghcr.io',
    ],
    answer: 1,
    explanation: 'The --password-stdin flag reads the token from stdin, keeping it out of shell history and process listings. Passing -p directly exposes the token in ps output and ~/.bash_history.',
  },
  {
    q: 'What does docker image prune (without -a) remove?',
    options: [
      'All local images regardless of containers using them',
      'Images not referenced by any container, including tagged ones',
      'Only dangling images: untagged images not referenced by any container',
      'Stopped containers and their images',
    ],
    answer: 2,
    explanation: 'Dangling images are intermediate build layers that have no tag and are not referenced by any container. docker image prune -a additionally removes tagged images not currently referenced by any container — much more aggressive.',
  },
  {
    q: 'You run trivy image --exit-code 1 --severity CRITICAL myapp:build in CI. What happens if a CRITICAL CVE is found?',
    options: [
      'Trivy prints a warning but the pipeline continues',
      'Trivy prompts you to confirm before continuing',
      'The trivy command exits with code 1, failing the CI pipeline step',
      'The image is automatically deleted from the local daemon',
    ],
    answer: 2,
    explanation: '--exit-code 1 makes Trivy exit with code 1 when vulnerabilities matching the severity filter are found. CI systems treat a non-zero exit code as a failed step, blocking the push.',
  },
  { q: 'What is the relationship between image layers and the container layer?', options: ['Images have no layers; only running containers have layers', 'Image layers are read-only and shared across containers; the container adds a writable copy-on-write layer at runtime', 'Image layers are temporary per build; container layers are permanent across restarts', 'All layers are read-write in both images and containers'], answer: 1, explanation: 'Docker images consist of stacked read-only layers: each FROM, RUN, and COPY instruction adds one. When a container starts, Docker adds a thin writable layer on top using copy-on-write. Reading a file from a lower layer is fast; modifying it copies it up to the writable layer first. This writable layer is discarded when the container is removed. Use named volumes for data that must persist beyond container removal.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between a Docker image tag and a digest?',
    a: 'A tag (e.g. :1.27) is a mutable label — someone can push a new image to the same tag. A digest (@sha256:abc...) is a content hash of the image manifest — it is immutable. If the manifest changes, the digest changes. For fully reproducible production deployments, pin images to their digest rather than a tag.',
  },
  {
    q: 'What are the key differences between Docker Hub, GHCR, and a private registry like ECR?',
    a: 'Docker Hub is the public default registry with free pull rate limits. GHCR integrates with GitHub repos and GitHub Actions using GITHUB_TOKEN — no separate credentials needed in workflows. ECR (AWS), ACR (Azure), and GAR (GCP) are cloud-managed private registries with IAM-based auth (no long-lived passwords), automatic scanning, and replication. Choose based on your cloud provider and team workflow.',
  },
  {
    q: 'How does docker push avoid uploading layers that already exist in the registry?',
    a: 'Before uploading, the Docker client asks the registry which layer digests it already has. Layers are identified by sha256 content hash — if the registry already has a layer, the client skips it. This is why pushing a new version of an app image is fast: only the top application layer typically changes; the OS and dependency layers are already in the registry.',
  },
  {
    q: 'What is image signing with Cosign and why does it matter?',
    a: 'Cosign (from Sigstore) creates a cryptographic signature of the image digest and stores it in the registry alongside the image. The signature proves the image was built by a trusted pipeline (via OIDC keyless signing). Policy engines like Kyverno or OPA Gatekeeper can enforce that only signed images are allowed to run in a Kubernetes cluster, preventing supply-chain attacks where a malicious image replaces a legitimate one.',
  },
  {
    q: 'What is a dangling image and why should you prune them?',
    a: 'A dangling image is an image layer that has no tag and is not referenced by any container. They accumulate during repeated builds when the same tag is rebuilt — the old manifest becomes untagged. They consume disk space but cannot be pulled or run. `docker image prune` removes them; `docker image prune -a` also removes tagged images not currently in use by any container.',
  },
  { q: 'How do you reduce Docker image size effectively?', a: 'Key techniques: use minimal base images such as alpine, distroless, or scratch. Use multi-stage builds to compile in a full SDK image and copy only built artifacts to a minimal runtime image. Combine RUN commands with && to minimize the number of layers. Use .dockerignore to exclude node_modules, .git, and test files from the build context. Remove package manager caches in the same RUN step as installation so they do not persist in a layer. Use docker image history and docker image inspect to identify large layers before optimizing.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Docker images are layer stacks identified by content-hash digests; tags are mutable aliases — always pin to version tags or digests in production.',
  mustKnow: [
    'Full image ref: [registry/][namespace/]name[:tag][@digest]; default registry = docker.io, default tag = :latest',
    'Layers are content-addressed (sha256) — identical layers shared across images, only pulled/pushed once',
    'docker tag creates an alias (no data copied); docker push uploads only missing layers',
    'Tags are mutable; digests (@sha256:...) are immutable — pin production to digests',
    'docker image prune removes dangling images; -a removes all unused tagged images',
    'Scan with Trivy before push; sign with Cosign for supply-chain integrity',
  ],
  interviewFocus: [
    'Why :latest is dangerous in production — mutable, no traceability, rebuild changes it silently',
    'Tag vs digest — a digest is a content hash that cannot change even if the tag is overwritten',
    'How docker push avoids re-uploading layers — content-addressed, registry already has matching digests',
    'GHCR vs ECR vs Docker Hub — auth mechanism, rate limits, cloud integration',
    'Supply-chain security: image scanning (Trivy) + signing (Cosign) + SBOM (Syft)',
  ],
};

@Component({
  selector: 'app-k8s-docker-images',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent,
  ],
  templateUrl: './docker-images.html',
  styleUrl: './docker-images.scss',
})
export class K8sDockerImages {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
