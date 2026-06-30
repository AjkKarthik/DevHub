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
  { name: 'docker run', type: 'method', desc: 'Create and start a container: -d (detach), -it (interactive tty), --rm (auto-remove), -p host:container (port), -v (volume), -e (env var)' },
  { name: 'docker ps', type: 'method', desc: 'List running containers; -a includes stopped; -q returns only IDs; --format for custom output' },
  { name: 'docker exec', type: 'method', desc: 'Run a command inside a running container: -it for interactive shell, -e to set env vars' },
  { name: 'docker logs', type: 'method', desc: 'Print container stdout/stderr: -f follows in real time, --tail N shows last N lines, --since for time filter' },
  { name: 'docker inspect', type: 'method', desc: 'Return full JSON metadata: network settings, mounts, env vars, resource limits — pipe to python3 -m json.tool to pretty-print' },
  { name: 'docker stats', type: 'method', desc: 'Live resource usage (CPU%, MEM, NET I/O, BLOCK I/O): --no-stream for a single snapshot' },
  { name: 'docker stop', type: 'method', desc: 'Send SIGTERM then wait (default 10s) before SIGKILL; --time to extend the grace period' },
  { name: 'docker cp', type: 'method', desc: 'Copy files between host and container: docker cp myapp:/etc/nginx/nginx.conf ./nginx.conf' },
];

const theory: TheoryPoint[] = [
  {
    heading: 'docker run — Key Flags to Know',
    points: [
      '-d (detach): run container in the background. Combine with --name to reference it later instead of using the container ID.',
      '-it: -i keeps stdin open, -t allocates a pseudo-TTY. Together they give an interactive terminal session inside the container.',
      '--rm: automatically remove the container when it exits. Essential for one-off tasks and debugging to avoid orphaned containers.',
      '-p hostPort:containerPort: publish a container port to the host. Multiple -p flags are allowed. Use -P to auto-publish all EXPOSE\'d ports to random host ports.',
      '-v or --volume: mount a host path or named volume. Named volumes: -v mydata:/app/data. Bind mounts: -v $(pwd)/config:/app/config. Read-only: add :ro.',
      '-e KEY=VALUE or --env-file .env: inject environment variables. Prefer env files over individual -e flags for more than 2-3 variables.',
      '--restart unless-stopped: restart policy for production containers (also: no, on-failure, always). Use always for system daemons, unless-stopped for most services.',
      '--network name: connect to a named Docker network. Containers on the same network resolve each other by container name.',
    ],
  },
  {
    heading: 'Inspecting and Debugging Running Containers',
    points: [
      'docker logs -f: streams stdout/stderr in real time. Use --tail 100 to limit initial output. Add --since 10m to show last 10 minutes only.',
      'docker exec -it CONTAINER sh: open an interactive shell. Use bash if the image has it, sh (busybox) otherwise. For distroless images, use docker debug (Docker Desktop).',
      'docker inspect: returns the full container configuration as JSON — IP address, mounted volumes, environment variables, resource limits, restart count. Use --format to extract a specific field.',
      'docker stats: live CPU/memory/network/disk I/O per container. Add --no-stream for a snapshot instead of a live view. Use with docker ps -q to monitor all containers at once.',
      'docker cp: copy files in or out of a container without exec. Useful for extracting logs or config files from a container that has no shell.',
      'docker diff: shows filesystem changes (A=added, C=changed, D=deleted) since the container was created from its image — useful for debugging unexpected writes.',
    ],
  },
  {
    heading: 'Container Lifecycle and Restart Policies',
    points: [
      'Lifecycle: Created → Running → (Paused) → Stopped → Removed. `docker run` jumps to Running; `docker create` only creates.',
      'docker stop sends SIGTERM to PID 1 and waits up to --time seconds (default 10) before sending SIGKILL. This allows graceful shutdown.',
      'docker kill bypasses the grace period — useful when a container is stuck but should not be used routinely. Specify a signal with -s: docker kill -s SIGUSR1 myapp.',
      'Restart policies: `no` (default) never restarts; `always` restarts even after docker stop; `unless-stopped` restarts unless manually stopped; `on-failure[:N]` restarts on non-zero exit up to N times.',
      'docker pause / unpause uses Linux cgroups freezer to freeze all processes in a container without stopping it — useful for snapshotting state.',
      'docker rm -f force-removes a running container by sending SIGKILL first. docker container prune removes all stopped containers at once.',
    ],
  },
  {
    heading: 'Output Formatting and Batch Operations',
    points: [
      '--format with Go template syntax: docker ps --format "{{.Names}}\\t{{.Status}}" gives tab-separated name and status.',
      '-q (quiet) returns only IDs — compose with shell substitution: docker stop $(docker ps -q) stops all running containers.',
      'docker events: stream real-time events from the daemon (container start/stop, image pull, network connect).',
      'docker container ls (long form) vs docker ps (short form) — both work, the long form follows the `docker COMMAND` hierarchy introduced in Docker 1.13.',
      'Use docker system df for a storage overview and docker system prune to reclaim space (removes stopped containers, dangling images, unused networks and build cache).',
    ],
  },
];

const codeTabs: CodeTab[] = [
  {
    label: 'docker run Patterns',
    language: 'bash',
    code:
      '# Interactive shell, auto-remove when done\n' +
      'docker run -it --rm ubuntu:24.04 bash\n' +
      '\n' +
      '# Background service with name, port, restart policy\n' +
      'docker run -d \\\n' +
      '  --name postgres \\\n' +
      '  -p 5432:5432 \\\n' +
      '  -e POSTGRES_PASSWORD=secret \\\n' +
      '  -v pgdata:/var/lib/postgresql/data \\\n' +
      '  --restart unless-stopped \\\n' +
      '  postgres:16-alpine\n' +
      '\n' +
      '# Load env vars from file, bind-mount local config\n' +
      'docker run -d \\\n' +
      '  --name api \\\n' +
      '  --env-file .env \\\n' +
      '  -v $(pwd)/config:/app/config:ro \\\n' +
      '  --network mynet \\\n' +
      '  myapp:2.1.0\n' +
      '\n' +
      '# One-off task: run a migration script then exit\n' +
      'docker run --rm \\\n' +
      '  --env-file .env \\\n' +
      '  --network mynet \\\n' +
      '  myapp:2.1.0 node migrate.js\n' +
      '\n' +
      '# Override the default entrypoint\n' +
      'docker run --rm --entrypoint sh myapp:2.1.0 -c "echo hello"',
  },
  {
    label: 'Inspect & Debug',
    language: 'bash',
    code:
      '# Follow logs in real time (last 50 lines first)\n' +
      'docker logs -f --tail 50 api\n' +
      '\n' +
      '# Open interactive shell\n' +
      'docker exec -it api sh\n' +
      '\n' +
      '# Run a one-off command without interactive shell\n' +
      'docker exec api cat /app/config/settings.json\n' +
      '\n' +
      '# Extract the container IP address\n' +
      'docker inspect --format \'{{.NetworkSettings.IPAddress}}\' api\n' +
      '\n' +
      '# Extract all environment variables\n' +
      'docker inspect --format \'{{range .Config.Env}}{{println .}}{{end}}\' api\n' +
      '\n' +
      '# Live resource stats (single snapshot)\n' +
      'docker stats --no-stream\n' +
      '\n' +
      '# Copy a file out of the container\n' +
      'docker cp api:/app/logs/app.log ./app.log\n' +
      '\n' +
      '# Show filesystem changes since container start\n' +
      'docker diff api',
  },
  {
    label: 'Lifecycle & Batch',
    language: 'bash',
    code:
      '# Graceful stop with 30s grace period\n' +
      'docker stop --time=30 api\n' +
      '\n' +
      '# Immediate kill (SIGKILL)\n' +
      'docker kill api\n' +
      '\n' +
      '# Send a custom signal\n' +
      'docker kill -s SIGHUP api\n' +
      '\n' +
      '# Stop and remove in one command\n' +
      'docker rm -f api\n' +
      '\n' +
      '# Stop all running containers\n' +
      'docker stop $(docker ps -q)\n' +
      '\n' +
      '# Remove all stopped containers\n' +
      'docker container prune -f\n' +
      '\n' +
      '# Custom output format\n' +
      'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"\n' +
      '\n' +
      '# Storage usage breakdown\n' +
      'docker system df\n' +
      '\n' +
      '# Full cleanup (stopped containers, unused images, networks, cache)\n' +
      'docker system prune -f',
  },
];

const mistakes: CommonMistake[] = [
  {
    title: 'Forgetting --rm on interactive/one-off containers',
    wrong: 'docker run -it ubuntu bash\n# Container remains stopped after exit — accumulates over time',
    right: 'docker run -it --rm ubuntu bash\n# Container is automatically removed when the shell exits',
    explanation: 'Without --rm, every docker run creates a stopped container. These pile up and consume disk space. Use --rm for any container you don\'t need to restart or inspect after it exits.',
  },
  {
    title: 'Hard-coding secrets in -e flags',
    wrong: 'docker run -e DB_PASSWORD=mysecret123 myapp:1.0',
    right: '# Use env file (add .env to .gitignore)\ndocker run --env-file .env myapp:1.0\n\n# Or use Docker secrets (Swarm) / Kubernetes secrets',
    explanation: '-e flags with secrets appear in docker inspect output and shell history. Use --env-file with a file not committed to version control, or a secrets manager for production.',
  },
  {
    title: 'Using docker kill instead of docker stop',
    wrong: 'docker kill myapp   # always SIGKILL — no graceful shutdown',
    right: 'docker stop myapp              # SIGTERM, 10s grace, then SIGKILL\ndocker stop --time=30 myapp    # more time for slow-stopping apps',
    explanation: 'docker kill sends SIGKILL immediately, cutting off in-flight requests and possibly corrupting state. Use docker stop to allow the app to finish work. Reserve kill for unresponsive containers.',
  },
  {
    title: 'Not naming containers',
    wrong: 'docker run -d nginx:alpine\n# Results in random names like "happy_fermat"',
    right: 'docker run -d --name web nginx:alpine\n# docker logs web, docker exec -it web sh, docker stop web',
    explanation: 'Without a name, you must look up the auto-generated name or ID every time. Named containers make logs, exec, stop, and inspect commands predictable and scriptable.',
  },
  {
    title: 'Checking logs with a single docker logs instead of -f',
    wrong: 'docker logs api\n# Returns everything — often thousands of lines at once',
    right: 'docker logs -f --tail 50 api     # follow, start from last 50 lines\ndocker logs --since 5m api       # last 5 minutes only',
    explanation: 'Running docker logs without flags dumps the entire log history — potentially gigabytes. Use --tail to limit initial output and -f to follow in real time.',
  },
];

const challenge: Challenge = {
  title: 'Container Fleet Summariser',
  language: 'typescript',
  description:
    'Write `summariseFleet(containers)` that processes an array of container records and returns fleet statistics.\n\n' +
    'Input:\n' +
    '```\n' +
    'interface Container {\n' +
    '  name: string;\n' +
    '  status: \'running\' | \'stopped\' | \'exited\';\n' +
    '  cpuPercent: number;\n' +
    '  memoryMB: number;\n' +
    '  restartCount: number;\n' +
    '}\n' +
    '```\n\n' +
    'Return:\n' +
    '```\n' +
    'interface FleetSummary {\n' +
    '  totalContainers: number;\n' +
    '  runningCount: number;\n' +
    '  highCpuContainers: string[];  // names with cpuPercent > 80\n' +
    '  totalMemoryMB: number;        // sum of running containers only\n' +
    '  unstableContainers: string[]; // names with restartCount > 3\n' +
    '}\n' +
    '```',
  hints: [
    'Filter by status === \'running\' to get running containers',
    'Use .filter() to collect high-CPU and unstable container names',
    'Use .reduce() or a loop to sum memory for running containers only',
    'Map container objects to their names with .map(c => c.name)',
  ],
  starterCode:
    'interface Container {\n' +
    '  name: string;\n' +
    '  status: \'running\' | \'stopped\' | \'exited\';\n' +
    '  cpuPercent: number;\n' +
    '  memoryMB: number;\n' +
    '  restartCount: number;\n' +
    '}\n\n' +
    'interface FleetSummary {\n' +
    '  totalContainers: number;\n' +
    '  runningCount: number;\n' +
    '  highCpuContainers: string[];\n' +
    '  totalMemoryMB: number;\n' +
    '  unstableContainers: string[];\n' +
    '}\n\n' +
    'function summariseFleet(containers: Container[]): FleetSummary {\n' +
    '  // TODO: implement\n' +
    '  return { totalContainers: 0, runningCount: 0, highCpuContainers: [], totalMemoryMB: 0, unstableContainers: [] };\n' +
    '}\n\n' +
    'console.log(summariseFleet([\n' +
    '  { name: \'api\', status: \'running\', cpuPercent: 90, memoryMB: 256, restartCount: 5 },\n' +
    '  { name: \'db\', status: \'running\', cpuPercent: 30, memoryMB: 512, restartCount: 0 },\n' +
    '  { name: \'cache\', status: \'stopped\', cpuPercent: 0, memoryMB: 0, restartCount: 1 },\n' +
    ']));',
  solution:
    'interface Container {\n' +
    '  name: string;\n' +
    '  status: \'running\' | \'stopped\' | \'exited\';\n' +
    '  cpuPercent: number;\n' +
    '  memoryMB: number;\n' +
    '  restartCount: number;\n' +
    '}\n\n' +
    'interface FleetSummary {\n' +
    '  totalContainers: number;\n' +
    '  runningCount: number;\n' +
    '  highCpuContainers: string[];\n' +
    '  totalMemoryMB: number;\n' +
    '  unstableContainers: string[];\n' +
    '}\n\n' +
    'function summariseFleet(containers: Container[]): FleetSummary {\n' +
    '  const running = containers.filter(c => c.status === \'running\');\n\n' +
    '  return {\n' +
    '    totalContainers: containers.length,\n' +
    '    runningCount: running.length,\n' +
    '    highCpuContainers: containers\n' +
    '      .filter(c => c.cpuPercent > 80)\n' +
    '      .map(c => c.name),\n' +
    '    totalMemoryMB: running.reduce((sum, c) => sum + c.memoryMB, 0),\n' +
    '    unstableContainers: containers\n' +
    '      .filter(c => c.restartCount > 3)\n' +
    '      .map(c => c.name),\n' +
    '  };\n' +
    '}\n\n' +
    'console.log(summariseFleet([\n' +
    '  { name: \'api\', status: \'running\', cpuPercent: 90, memoryMB: 256, restartCount: 5 },\n' +
    '  { name: \'db\', status: \'running\', cpuPercent: 30, memoryMB: 512, restartCount: 0 },\n' +
    '  { name: \'cache\', status: \'stopped\', cpuPercent: 0, memoryMB: 0, restartCount: 1 },\n' +
    ']));\n' +
    '// { totalContainers: 3, runningCount: 2, highCpuContainers: [\'api\'],\n' +
    '//   totalMemoryMB: 768, unstableContainers: [\'api\'] }',
};

const quiz: QuizQuestion[] = [
  {
    q: 'Which flag combination gives you an interactive terminal session with docker run?',
    options: ['-d --name', '-it', '--rm -p', '-v --restart'],
    answer: 1,
    explanation: '-i keeps stdin open and -t allocates a pseudo-TTY. Together (-it) they give you an interactive shell. -d runs detached in the background — the opposite of interactive.',
  },
  {
    q: 'You want to see the last 100 log lines and follow new output in real time. Which command is correct?',
    options: ['docker logs myapp', 'docker logs --tail 100 myapp', 'docker logs -f --tail 100 myapp', 'docker exec myapp tail -100 /dev/stdout'],
    answer: 2,
    explanation: '-f follows new log output in real time and --tail 100 starts from the last 100 lines. Without -f, the command exits after printing history. Without --tail, it dumps all logs from the beginning.',
  },
  {
    q: 'Which restart policy restarts the container unless it was explicitly stopped with docker stop?',
    options: ['always', 'on-failure', 'unless-stopped', 'no'],
    answer: 2,
    explanation: 'unless-stopped restarts the container on crashes and after Docker daemon restarts, but NOT if you explicitly ran docker stop. `always` restarts even after docker stop; `on-failure` only restarts on non-zero exit codes.',
  },
  {
    q: 'You need to extract the container\'s IP address from docker inspect output. Which flag helps?',
    options: [
      '--ip',
      '--format \'{{.NetworkSettings.IPAddress}}\'',
      '--output json | grep IPAddress',
      '--network',
    ],
    answer: 1,
    explanation: 'docker inspect --format uses Go template syntax to extract specific fields. {{.NetworkSettings.IPAddress}} returns just the IP. Without --format, inspect returns the full JSON blob which you must grep or pipe to jq.',
  },
  {
    q: 'What does docker system prune -f remove?',
    options: [
      'All containers including running ones',
      'Stopped containers, dangling images, unused networks, and build cache',
      'Only unused Docker images',
      'All volumes and bind mounts',
    ],
    answer: 1,
    explanation: 'docker system prune -f removes: stopped containers, dangling images (no tag/no reference), unused networks, and build cache. It does NOT remove running containers or named volumes (use --volumes flag to include those).',
  },
  { q: 'What is the difference between docker stop and docker kill?', options: ['docker kill is deprecated and should always be replaced with docker stop', 'docker stop sends SIGTERM then waits a grace period before SIGKILL; docker kill sends SIGKILL immediately with no grace period', 'docker stop only works on running containers; docker kill works on any container state', 'docker stop uses more CPU resources than docker kill'], answer: 1, explanation: 'docker stop sends SIGTERM to the container, waits 10 seconds (configurable with -t) for graceful shutdown, then sends SIGKILL. This allows applications to catch SIGTERM and flush data or close connections cleanly. docker kill sends SIGKILL or any signal via --signal immediately with no grace period. Always prefer docker stop in production; use kill only when a container is unresponsive to SIGTERM.' },
];

const qna: QnaItem[] = [
  {
    q: 'What is the difference between docker run and docker exec?',
    a: '`docker run` creates a NEW container from an image and starts it. `docker exec` runs a command inside an ALREADY RUNNING container without creating a new one. Use docker run for starting services or one-off tasks. Use docker exec to inspect or debug a running container (open a shell, run a health check, read a file).',
  },
  {
    q: 'How do you pass configuration to a container securely?',
    a: 'Prefer --env-file over individual -e flags so secrets don\'t appear in the docker run command in shell history. Never bake secrets into the image itself. In production, use Docker secrets (Swarm) or Kubernetes Secrets (ideally backed by a secrets manager like Vault or AWS Secrets Manager) and inject them as mounted files rather than environment variables.',
  },
  {
    q: 'What are Docker restart policies and when do you use each?',
    a: '`no` (default) never auto-restarts. `on-failure[:N]` restarts on non-zero exit, up to N times. `always` restarts on any exit including docker stop — useful for critical system daemons. `unless-stopped` restarts like `always` but respects an explicit docker stop — the right choice for most production services that you manage with CI/CD deployments.',
  },
  {
    q: 'How would you debug a container that crashed immediately on startup?',
    a: 'Run `docker logs CONTAINER_ID` (even stopped containers retain logs). Check `docker inspect CONTAINER_ID` for the exit code in State.ExitCode and OOMKilled flag. Try overriding the entrypoint: `docker run --rm --entrypoint sh IMAGE -c "env; ls /app"` to inspect the environment without running the actual process.',
  },
  {
    q: 'How do you copy a file from a container to the host without using exec?',
    a: '`docker cp CONTAINER:/path/inside/container ./local/path` copies files from a running or stopped container to the host. The reverse works too: `docker cp ./local/file CONTAINER:/path/`. This is useful for extracting logs, config files, or generated artefacts from containers that have no shell (e.g., distroless images).',
  },
  { q: 'How do you debug a running container without installing tools into it?', a: 'Several approaches avoid modifying the production image: (1) docker exec -it <id> sh runs a shell inside the container if one is available. (2) Kubernetes ephemeral debug containers: kubectl debug -it <pod> --image=busybox --target=<container> attaches a new debug container sharing the same PID and network namespaces. (3) docker run --pid=container:<id> --net=container:<id> busybox sh starts a separate container sharing namespaces. (4) nsenter enters namespaces of a running process by PID. Use ephemeral containers for Kubernetes pods in production.' },
];

const revision: RevisionSummary = {
  oneLiner: 'docker run creates containers; docker exec enters them; docker logs/stats/inspect observe them; docker stop/rm manages their lifecycle.',
  mustKnow: [
    'docker run flags: -d (detach), -it (interactive), --rm (auto-remove), -p (port), -v (volume), -e/-env-file (env vars)',
    'docker logs -f --tail N follows live output; docker inspect --format extracts specific fields',
    'docker stop = SIGTERM + grace period; docker kill = immediate SIGKILL',
    'Restart policies: no, on-failure, always, unless-stopped (most production services use unless-stopped)',
    'docker ps -q returns IDs for batch operations: docker stop $(docker ps -q)',
    'docker system prune removes stopped containers, dangling images, unused networks, build cache',
  ],
  interviewFocus: [
    'docker run vs docker exec — create new vs enter existing',
    'Secure config: --env-file over -e; never secrets in the image',
    'unless-stopped vs always restart policy — respects manual docker stop',
    'Debugging a crashed container: docker logs + docker inspect ExitCode/OOMKilled + entrypoint override',
    'docker cp for extracting files from containers without a shell',
  ],
};

@Component({
  selector: 'app-k8s-docker-cli',
  standalone: true,
  imports: [
    PageMetaComponent, QuickRefComponent, TheoryBlockComponent, CodeBlockComponent,
    CommonMistakesComponent, ChallengeBlockComponent, QuizBlockComponent,
    QnaBlockComponent, RevisionCardComponent, PageCompleteComponent,
  ],
  templateUrl: './docker-cli.html',
  styleUrl: './docker-cli.scss',
})
export class K8sDockerCli {
  quickRef = quickRef;
  theory = theory;
  codeTabs = codeTabs;
  mistakes = mistakes;
  challenge = challenge;
  quiz = quiz;
  qna = qna;
  revision = revision;
}
