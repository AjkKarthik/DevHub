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
  { name: 'namespace', type: 'keyword', desc: 'Linux kernel feature that isolates processes — pid, net, mnt, uts, ipc, user' },
  { name: 'cgroup', type: 'keyword', desc: 'Control group — limits CPU, memory, and I/O resources for a process group' },
  { name: 'OCI', type: 'keyword', desc: 'Open Container Initiative — standard image/runtime spec; Docker, Podman, containerd all comply' },
  { name: 'containerd', type: 'keyword', desc: 'Industry-standard container runtime that manages the container lifecycle (used by Docker and Kubernetes)' },
  { name: 'runc', type: 'keyword', desc: 'Low-level OCI runtime that creates the container process via Linux namespaces and cgroups (clone() syscall)' },
  { name: 'image layer', type: 'keyword', desc: 'Read-only filesystem snapshot; layers stack to form an image; only changed layers are downloaded or stored' },
  { name: 'union mount', type: 'keyword', desc: 'Stacks read-only image layers + a writable container layer using OverlayFS (upperdir + lowerdir)' },
  { name: 'dockerd', type: 'keyword', desc: 'Docker daemon — manages images, containers, volumes; Docker CLI talks to it via /var/run/docker.sock' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'Containers vs Virtual Machines',
    points: [
      'A VM bundles a full guest OS (kernel + userspace) on a hypervisor. A container shares the host kernel and isolates only the userspace — no hypervisor, no hardware emulation.',
      'Containers start in milliseconds vs seconds for VMs. Image sizes are tens of MB vs gigabytes for VM disk images.',
      'The isolation trade-off: VMs give each workload its own kernel for stronger security. Containers share the kernel — a kernel exploit affects all containers on the host.',
      'Use containers for stateless, ephemeral app workloads. Use VMs when you need full OS-level isolation or must run a different OS (e.g., Windows workloads).',
    ],
  },
  {
    heading: 'Linux Namespaces — the Isolation Primitive',
    points: [
      'pid namespace: process IDs are scoped; PID 1 in the container cannot see host processes. Sending SIGKILL to PID 1 stops the container.',
      'net namespace: each container gets its own network stack (interfaces, routing table, iptables). Two containers can both bind port 80 without conflict.',
      'mnt namespace: isolates the mount table — the container sees its own root filesystem and cannot access host /proc or /sys by default.',
      'uts namespace: isolates hostname and domain name — `hostname` inside a container can differ from the host without changing the host hostname.',
      'ipc namespace: separates System V IPC objects and POSIX message queues — prevents cross-container IPC by default.',
      'user namespace: maps container UIDs to different host UIDs — enables rootless containers where container "root" (UID 0) maps to an unprivileged host UID.',
    ],
  },
  {
    heading: 'Control Groups (cgroups) — Resource Limits',
    points: [
      'cgroups is a Linux kernel feature that limits, accounts for, and isolates resource usage of process groups. Docker creates a cgroup per container.',
      'Memory: --memory=512m sets a hard limit. When a container hits the limit, the kernel OOM killer terminates its processes — it does NOT gracefully shut down.',
      'CPU: --cpus="1.5" limits to 1.5 cores via CFS bandwidth. --cpu-shares sets relative weight (default 1024) for CPU time when the host is contended.',
      'Block I/O: --device-read-bps and --device-write-bps throttle disk throughput rates per device.',
      'cgroups v2 (unified hierarchy at /sys/fs/cgroup) is the current standard — required by Kubernetes 1.25+ with the systemd cgroup driver.',
    ],
  },
  {
    heading: 'OCI Image Spec & Docker Engine Architecture',
    points: [
      'An OCI image is a set of tar-archive layers + a JSON manifest + a config blob. All compliant runtimes (Docker, Podman, containerd, nerdctl) can run OCI images interchangeably.',
      'Layers are content-addressed by sha256 digest. If two images share a base layer, only one copy is stored on disk. docker pull skips layers already present locally.',
      'Docker Engine stack: Docker CLI → dockerd (daemon) → containerd → runc. dockerd handles user API. containerd manages container state. runc calls clone() to create the process.',
      'The writable container layer (OverlayFS upperdir) captures all in-container writes. This layer is destroyed when you docker rm — volumes are the only way to persist data.',
      'Podman is a daemonless alternative: each container is a direct child of the calling process. No dockerd socket needed — better for rootless containers and systemd integration.',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'Container Lifecycle',
    language: 'bash',
    code:
      '# Pull and run interactively, auto-remove on exit\n' +
      'docker run -it --rm ubuntu:24.04 bash\n' +
      '\n' +
      '# Run detached with port mapping and a name\n' +
      'docker run -d --name myapp -p 8080:80 nginx:alpine\n' +
      '\n' +
      '# List running containers (all including stopped with -a)\n' +
      'docker ps\n' +
      'docker ps -a\n' +
      '\n' +
      '# Open a shell in a running container\n' +
      'docker exec -it myapp sh\n' +
      '\n' +
      '# Tail logs in real time\n' +
      'docker logs -f myapp\n' +
      '\n' +
      '# Graceful stop (SIGTERM → 10s wait → SIGKILL) then remove\n' +
      'docker stop myapp && docker rm myapp\n' +
      '\n' +
      '# Force-remove a running container (SIGKILL immediately)\n' +
      'docker rm -f myapp\n' +
      '\n' +
      '# Apply resource limits at runtime\n' +
      'docker run -d --memory=256m --cpus="0.5" --name limited nginx:alpine',
  },
  {
    label: 'Namespaces & cgroups',
    language: 'bash',
    code:
      '# Find the host PID of the container process\n' +
      'PID=$(docker inspect --format \'{{.State.Pid}}\' myapp)\n' +
      '\n' +
      '# See which namespaces the container uses (from the host)\n' +
      'ls -la /proc/$PID/ns/\n' +
      '# Shows: ipc  mnt  net  pid  uts  user ...\n' +
      '\n' +
      '# Container sees itself as PID 1\n' +
      'docker exec myapp ps aux\n' +
      '\n' +
      '# Container has its own private IP (net namespace)\n' +
      'docker exec myapp ip addr show eth0\n' +
      '\n' +
      '# View cgroup memory limit (host side, cgroups v1)\n' +
      'ID=$(docker inspect --format \'{{.Id}}\' myapp)\n' +
      'cat /sys/fs/cgroup/memory/docker/$ID/memory.limit_in_bytes\n' +
      '\n' +
      '# Live resource usage stats\n' +
      'docker stats myapp --no-stream\n' +
      '\n' +
      '# Full host config (limits, mounts, network mode)\n' +
      'docker inspect myapp',
  },
  {
    label: 'Image Layers',
    language: 'bash',
    code:
      '# See every layer and the Dockerfile command that created it\n' +
      'docker history nginx:alpine\n' +
      '\n' +
      '# Disk usage breakdown: images / containers / volumes / cache\n' +
      'docker system df\n' +
      '\n' +
      '# List containers with writable layer size\n' +
      '# SIZE = writable layer; VIRTUAL = image + writable\n' +
      'docker ps -s\n' +
      '\n' +
      '# Remove dangling images (untagged, no container refs)\n' +
      'docker image prune\n' +
      '\n' +
      '# Full cleanup: stopped containers, unused images, unused networks\n' +
      'docker system prune -f\n' +
      '\n' +
      '# Save image as tar for air-gapped transfer\n' +
      'docker save nginx:alpine | gzip > nginx-alpine.tar.gz\n' +
      'docker load < nginx-alpine.tar.gz\n' +
      '\n' +
      '# Export a running container filesystem (flattened — no layers)\n' +
      'docker export myapp > myapp-snapshot.tar',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Running multiple services in one container',
    wrong: 'FROM ubuntu\nRUN apt-get install -y nginx redis postgresql\n# Everything in a single container',
    right: 'FROM nginx:alpine\n# One service per container\n# Use Docker Compose to run nginx + redis + postgres separately',
    explanation: 'Containers should follow the single-responsibility principle. One process per container enables independent scaling, updating, and debugging without restarting every service.',
  },
  {
    title: 'Running as root inside the container',
    wrong: 'FROM node:20\nCOPY . .\nCMD ["node", "server.js"]\n# Runs as root by default',
    right: 'FROM node:20-alpine\nCOPY --chown=node:node . .\nUSER node\nCMD ["node", "server.js"]',
    explanation: 'A root process that escapes the container namespace via a kernel exploit becomes root on the host. Always use a non-root USER, especially for network-facing services.',
  },
  {
    title: 'Using :latest in production',
    wrong: 'docker pull myapp:latest\ndocker run myapp:latest',
    right: '# Pin to a specific version tag or immutable digest\ndocker run myapp:2.4.1\ndocker run myapp@sha256:abc123ef...',
    explanation: ':latest is mutable — a rebuild silently changes what it points to. In production always pin to a specific version tag or image digest for fully reproducible deployments.',
  },
  {
    title: 'Storing persistent data in the writable container layer',
    wrong: '# Writing files inside the container without a volume\nfs.writeFileSync("/data/uploads/file.pdf", buffer)',
    right: '# Mount a named volume so data survives container removal\ndocker run -v myapp-uploads:/data myapp:2.4.1',
    explanation: 'The writable container layer is destroyed when you docker rm. All persistent data — uploads, database files, logs — must live in a Docker named volume or a host bind mount.',
  },
  {
    title: 'Confusing docker stop with docker kill',
    wrong: 'docker kill myapp   # immediate SIGKILL — no graceful shutdown',
    right: 'docker stop myapp          # SIGTERM, 10s grace period, then SIGKILL\ndocker stop --time=30 myapp  # extend grace period to 30s',
    explanation: 'docker stop sends SIGTERM and waits for the app to finish in-flight requests before forcing shutdown. docker kill sends SIGKILL immediately. Only use kill when stop is unresponsive.',
  },
];

const challenge: Challenge = {
  title: 'Container Security Analyser',
  language: 'typescript',
  description:
    'Write `analyseContainer(config)` that scores a container config for security and resource hardening.\n\n' +
    'Input:\n' +
    '```\n' +
    'interface ContainerConfig {\n' +
    '  memoryMB: number | null;   // null = unlimited\n' +
    '  cpus: number | null;        // null = unlimited\n' +
    '  runAsRoot: boolean;\n' +
    '  readOnlyRootfs: boolean;\n' +
    '  networkMode: \'bridge\' | \'host\' | \'none\';\n' +
    '}\n' +
    '```\n\n' +
    'Return:\n' +
    '```\n' +
    'interface Analysis {\n' +
    '  securityScore: number;  // 0-100\n' +
    '  warnings: string[];\n' +
    '  recommendation: string;\n' +
    '}\n' +
    '```\n\n' +
    'Scoring rules (start at 100):\n' +
    '- -30 if runAsRoot\n' +
    '- -20 if readOnlyRootfs is false\n' +
    '- -15 if networkMode === \'host\'\n' +
    '- -10 if memoryMB is null\n' +
    '- -5 if cpus is null\n' +
    '- Clamp result to minimum 0',
  hints: [
    'Accumulate warnings in an array as you check each condition',
    'Apply deductions to a score variable initialised at 100',
    'Use Math.max(0, score) to prevent negative values',
    'Derive the recommendation string from score ranges (e.g. >=70 = mostly safe)',
  ],
  starterCode:
    'interface ContainerConfig {\n' +
    '  memoryMB: number | null;\n' +
    '  cpus: number | null;\n' +
    '  runAsRoot: boolean;\n' +
    '  readOnlyRootfs: boolean;\n' +
    '  networkMode: \'bridge\' | \'host\' | \'none\';\n' +
    '}\n\n' +
    'interface Analysis {\n' +
    '  securityScore: number;\n' +
    '  warnings: string[];\n' +
    '  recommendation: string;\n' +
    '}\n\n' +
    'function analyseContainer(config: ContainerConfig): Analysis {\n' +
    '  // TODO: implement\n' +
    '  return { securityScore: 0, warnings: [], recommendation: \'\' };\n' +
    '}\n\n' +
    '// Should return { securityScore: 100, warnings: [], recommendation: \'Container is well-hardened.\' }\n' +
    'console.log(analyseContainer({\n' +
    '  memoryMB: 512, cpus: 1,\n' +
    '  runAsRoot: false, readOnlyRootfs: true, networkMode: \'bridge\',\n' +
    '}));',
  solution:
    'interface ContainerConfig {\n' +
    '  memoryMB: number | null;\n' +
    '  cpus: number | null;\n' +
    '  runAsRoot: boolean;\n' +
    '  readOnlyRootfs: boolean;\n' +
    '  networkMode: \'bridge\' | \'host\' | \'none\';\n' +
    '}\n\n' +
    'interface Analysis {\n' +
    '  securityScore: number;\n' +
    '  warnings: string[];\n' +
    '  recommendation: string;\n' +
    '}\n\n' +
    'function analyseContainer(config: ContainerConfig): Analysis {\n' +
    '  let score = 100;\n' +
    '  const warnings: string[] = [];\n\n' +
    '  if (config.runAsRoot) {\n' +
    '    score -= 30;\n' +
    '    warnings.push(\'Running as root — add USER instruction in Dockerfile\');\n' +
    '  }\n' +
    '  if (!config.readOnlyRootfs) {\n' +
    '    score -= 20;\n' +
    '    warnings.push(\'Writable root filesystem — enable readOnlyRootFilesystem\');\n' +
    '  }\n' +
    '  if (config.networkMode === \'host\') {\n' +
    '    score -= 15;\n' +
    '    warnings.push(\'Host network mode bypasses net namespace isolation\');\n' +
    '  }\n' +
    '  if (config.memoryMB === null) {\n' +
    '    score -= 10;\n' +
    '    warnings.push(\'No memory limit — container can exhaust host RAM\');\n' +
    '  }\n' +
    '  if (config.cpus === null) {\n' +
    '    score -= 5;\n' +
    '    warnings.push(\'No CPU limit — container can monopolise host CPUs\');\n' +
    '  }\n\n' +
    '  score = Math.max(0, score);\n\n' +
    '  const recommendation =\n' +
    '    score === 100 ? \'Container is well-hardened.\' :\n' +
    '    score >= 70   ? \'Mostly safe — address the warnings.\' :\n' +
    '    score >= 40   ? \'Significant gaps — fix before production.\' :\n' +
    '                    \'Poorly configured — do not deploy as-is.\';\n\n' +
    '  return { securityScore: score, warnings, recommendation };\n' +
    '}\n\n' +
    'console.log(analyseContainer({\n' +
    '  memoryMB: 512, cpus: 1,\n' +
    '  runAsRoot: false, readOnlyRootfs: true, networkMode: \'bridge\',\n' +
    '}));\n' +
    '// { securityScore: 100, warnings: [], recommendation: \'Container is well-hardened.\' }',
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which Linux kernel feature isolates a container\'s process IDs from the host?',
    options: ['cgroups', 'pid namespace', 'OverlayFS', 'seccomp'],
    answer: 1,
    explanation: 'The pid namespace scopes process IDs so the container\'s first process appears as PID 1 and cannot see host processes. cgroups limit resources; OverlayFS stacks filesystem layers; seccomp filters syscalls.',
  },
  {
    q: 'Which component in the Docker stack calls clone() to create the container process?',
    options: ['dockerd', 'containerd', 'runc', 'BuildKit'],
    answer: 2,
    explanation: 'runc is the low-level OCI runtime that calls Linux\'s clone() syscall with namespace flags and configures cgroups. containerd orchestrates lifecycle; dockerd handles the high-level Docker API.',
  },
  {
    q: 'What happens to data written inside a container when it is removed with docker rm?',
    options: ['Copied to a volume automatically', 'Persists on the host filesystem', 'Permanently deleted', 'Committed to the image'],
    answer: 2,
    explanation: 'The writable container layer (OverlayFS upperdir) is deleted when you run docker rm. Use named volumes or bind mounts for data that must survive container removal.',
  },
  {
    q: 'A container hits its --memory=256m limit. What does the kernel do?',
    options: [
      'Gracefully shuts down the container',
      'Pauses the container until memory is free',
      'OOM killer terminates container processes',
      'Swaps the excess memory to disk automatically',
    ],
    answer: 2,
    explanation: 'The OOM (out-of-memory) killer terminates processes in the cgroup. The container does not shut down gracefully — processes are killed immediately. Always test your service\'s OOM behaviour.',
  },
  {
    q: 'What is the key difference between docker stop and docker kill?',
    options: [
      'docker stop removes the container; docker kill only pauses it',
      'docker stop sends SIGTERM then waits before SIGKILL; docker kill sends SIGKILL immediately',
      'docker stop only works on paused containers',
      'There is no difference — both send SIGKILL',
    ],
    answer: 1,
    explanation: 'docker stop sends SIGTERM and waits (default 10 seconds) for a graceful shutdown before sending SIGKILL. docker kill sends SIGKILL immediately. Always prefer docker stop in production to allow in-flight requests to finish.',
  },
  { q: 'What Linux kernel features make containers possible?', options: ['Virtual machines and type-2 hypervisors like VMware or KVM', 'Namespaces for process isolation and cgroups for resource limits', 'POSIX threads and shared memory segments', 'Swap space and NUMA memory topology'], answer: 1, explanation: 'Containers use Linux namespaces to isolate: PID (process trees), NET (network interfaces), MNT (filesystem mounts), UTS (hostname), IPC, and USER (user/group IDs). cgroups enforce resource limits: CPU, memory, I/O, and network bandwidth. Seccomp restricts syscalls. Union filesystems like overlayfs stack read-only image layers. No hypervisor is required because containers share the host kernel, which is why they start in milliseconds.' },
];

const qna: QnaItem[] = [
  {
    q: 'How do containers differ from virtual machines at the OS level?',
    a: 'VMs run a full guest OS on a hypervisor, each with its own kernel. Containers share the host kernel and use Linux namespaces to isolate process trees, network stacks, and filesystems. This makes containers far lighter (MB vs GB images, millisecond vs second startup) but a kernel vulnerability affects all containers on the host simultaneously.',
  },
  {
    q: 'What are Linux namespaces and which types does Docker use?',
    a: 'Namespaces wrap a global resource into an isolated instance per process group. Docker uses: pid (process isolation), net (private network stack), mnt (filesystem mount points), uts (hostname), ipc (IPC/semaphores), and user (UID/GID mapping for rootless containers). Each new container gets a fresh set of namespaces created via clone() syscall flags.',
  },
  {
    q: 'What is cgroups and how does Docker use it?',
    a: 'Control Groups (cgroups) is a Linux kernel feature that limits and accounts for resource usage of process groups. Docker maps --memory, --cpus, --device-read-bps etc. to cgroup subsystem settings. When a container exceeds its memory cgroup limit, the kernel OOM killer terminates its processes. Kubernetes 1.25+ uses cgroups v2 (unified hierarchy) via the systemd cgroup driver.',
  },
  {
    q: 'Describe the Docker Engine component chain from CLI to the running container process.',
    a: 'Docker CLI sends API calls to dockerd (the daemon) over a Unix socket (/var/run/docker.sock). dockerd delegates container lifecycle work to containerd, the industry-standard OCI supervisor. containerd invokes runc, the low-level OCI runtime, which calls clone() with the appropriate namespace flags and configures cgroups, creating the actual container process.',
  },
  {
    q: 'Why should containers run as non-root?',
    a: 'A root process (UID 0) inside a container that escapes the namespace boundary via a kernel exploit becomes root on the host. Best practices: add `USER nonroot` in the Dockerfile, set `runAsNonRoot: true` in Kubernetes securityContext, and enable user namespaces to map container root to an unprivileged host UID for rootless operation.',
  },
  { q: 'What is the fundamental difference between a container and a VM?', a: 'VMs: each has its own OS kernel with hardware virtualized by a hypervisor. Strong isolation, slow to start (seconds to minutes), large footprint (gigabytes per VM). Containers: share the host kernel, isolated via namespaces and cgroups, start in milliseconds, tiny footprint (megabytes). The tradeoff: containers offer weaker isolation because a kernel exploit affects all containers on the host; VMs provide stronger security boundaries. Use VMs for untrusted code or compliance requiring OS-level isolation. Use containers for microservices, fast scaling, and consistent dev and production environments.' },
];

const revision: RevisionSummary = {
  oneLiner: 'Containers = Linux namespaces (isolation) + cgroups (resource limits) + OCI image layers — sharing the host kernel, not running a full OS.',
  mustKnow: [
    'Namespaces isolate: pid, net, mnt, uts, ipc, user — one fresh set per container',
    'cgroups enforce CPU, memory, and I/O limits — OOM killer fires when memory limit is hit',
    'OCI images are stacked read-only layers; containers add an ephemeral writable layer on top',
    'Docker stack: CLI → dockerd → containerd → runc (clone() creates the process)',
    'Writable container layer is destroyed on docker rm — use volumes for persistence',
    'Run non-root (USER in Dockerfile), read-only root fs, no --network=host in production',
  ],
  interviewFocus: [
    'Containers vs VMs: shared kernel, namespaces/cgroups — lighter but weaker isolation boundary',
    'Memory limit hit → OOM killer terminates processes, not graceful shutdown',
    'Layer caching: unchanged layers reused on pull/build — order instructions to maximise cache hits',
    'docker stop (SIGTERM + grace period) vs docker kill (immediate SIGKILL)',
    'Security baseline: non-root user, readOnlyRootFilesystem, resource limits, no host network',
  ],
};

@Component({
  selector: 'app-k8s-fundamentals',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent,
  ],
  templateUrl: './fundamentals.html',
  styleUrl: './fundamentals.scss',
})
export class K8sFundamentals {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
