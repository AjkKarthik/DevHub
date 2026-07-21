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
  templateUrl: './pid-1-ignores-sigterm-by-default.html',
  styleUrl: './pid-1-ignores-sigterm-by-default.scss'
})
export class Pid1IgnoresSigtermByDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states two true facts that, combined, hide a very common failure mode',
      points: [
        'The main page\'s PID namespace theory says: "PID 1 in the container cannot see host processes. Sending SIGKILL to PID 1 stops the container." Its own mistakes section separately says: "docker stop sends SIGTERM and waits for the app to finish in-flight requests before forcing shutdown."',
        'Read together, this implies a clean story: docker stop sends SIGTERM to PID 1, the app gets a chance to shut down gracefully, and only an unresponsive app needs the SIGKILL fallback. Neither bullet mentions a case where SIGTERM never even reaches application code capable of acting on it.',
        'That gap is real and extremely common in practice: the Linux kernel gives PID 1 special treatment that neither bullet describes — signals with a DEFAULT disposition of "terminate the process" (SIGTERM among them) are silently IGNORED when delivered to PID 1, unless that specific process has explicitly installed its own handler for that signal.',
      ]
    },
    {
      heading: 'Why this is the default outcome for many real Dockerfiles, and what it looks like in practice',
      points: [
        'This kernel behavior exists to protect a real system\'s init process (traditionally PID 1) from being accidentally killed by a stray signal — but every container\'s first process inherits the exact same protection inside its own PID namespace, whether or not that process was ever written with "being an init system" in mind.',
        'A Dockerfile using shell-form CMD or ENTRYPOINT (e.g. `CMD node server.js` instead of `CMD ["node", "server.js"]`) makes the situation worse in a different way: Docker actually runs `/bin/sh -c "node server.js"` — meaning `/bin/sh` becomes PID 1, and the real application is a CHILD process. `/bin/sh` typically has no SIGTERM handler of its own, so `docker stop` sends SIGTERM to the shell, which ignores it, and the actual Node process underneath never even receives the signal at all — not because it lacks a handler, but because the signal never reaches it.',
        'The observable symptom matches exactly what the main page\'s own "docker stop vs docker kill" mistake describes as normal behavior for an unresponsive app: every `docker stop` on such a container takes the FULL grace period (the main page\'s own default: 10 seconds) before falling back to SIGKILL — but the cause isn\'t a slow shutdown, it\'s a signal that was silently discarded the instant it arrived.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two containers, two very different responses to docker stop',
      language: 'bash',
      code: `# ── Container A: exec-form CMD, app IS pid 1 ──────────────────────────────
# Dockerfile:
#   FROM node:20-alpine
#   COPY . .
#   CMD ["node", "server.js"]     # exec form -- node itself becomes PID 1

docker run -d --name app-a myapp-exec
docker exec app-a ps aux
#   PID   USER  COMMAND
#   1     node  node server.js        <- app IS pid 1

# If server.js has:  process.on('SIGTERM', () => server.close(...))
# then SIGTERM is delivered to PID 1 AND actually handled -- graceful
# shutdown works, container stops quickly.

# ── Container B: shell-form CMD, app is NOT pid 1 ─────────────────────────
# Dockerfile:
#   FROM node:20-alpine
#   COPY . .
#   CMD node server.js             # shell form -- /bin/sh runs the command

docker run -d --name app-b myapp-shell
docker exec app-b ps aux
#   PID   USER  COMMAND
#   1     root  /bin/sh -c node server.js
#   7     node  node server.js         <- app is PID 7, a CHILD of sh

docker stop app-b
# SIGTERM goes to PID 1 (/bin/sh). /bin/sh has no SIGTERM handler of
# its own -- per the kernel's PID-1 rule, the signal is silently
# ignored. The node process at PID 7 is never touched at all.
# Result: full 10-second grace period elapses, every time, then
# SIGKILL force-terminates everything.`,
    },
    {
      label: 'Fixing it -- exec form, an explicit handler, or a real init',
      language: 'bash',
      code: `# Option 1: exec-form CMD/ENTRYPOINT (app itself becomes PID 1)
# CMD ["node", "server.js"]
# Requires the app to install its own SIGTERM handler to shut down
# gracefully -- being PID 1 alone does not add default handling,
# it just means the signal reaches your code AT ALL if you ask for it.

# Option 2: explicit signal handling in the app (works once it IS pid 1)
# server.js:
#   process.on('SIGTERM', () => {
#     console.log('Received SIGTERM, closing gracefully');
#     server.close(() => process.exit(0));
#   });

# Option 3: a minimal init process that forwards signals correctly
# Dockerfile:
#   ENTRYPOINT ["/sbin/tini", "--"]
#   CMD ["node", "server.js"]
# -- or the equivalent built-in Docker flag:
docker run -d --init --name app-c myapp-shell
# --init injects tini as PID 1, which correctly forwards SIGTERM to
# its child (node) AND reaps zombie processes -- this fixes even a
# shell-form CMD without touching the Dockerfile at all.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team notices every `docker stop` on their production API container takes exactly 10 seconds, every single time, regardless of load — they assume the app is doing meaningful cleanup work during that window and consider it normal. Using this subtopic\'s theory, what is a fast way to determine whether the app is genuinely taking 10 seconds to shut down gracefully, or whether SIGTERM is being silently ignored the whole time?',
    hint: 'Per this subtopic\'s theory, does the process that RECEIVES the SIGTERM matter — specifically, is the actual application process running as PID 1 inside the container, or is something else (like a shell) PID 1?',
    solution: 'Per this subtopic\'s theory, the fastest check is `docker exec <container> ps aux` (or `docker top <container>`) to see what process is actually PID 1. If the application binary itself is PID 1, the 10-second delay could genuinely be real shutdown work (draining connections, flushing buffers) — worth checking the app\'s own logs for evidence of a SIGTERM handler actually running during that window. But if PID 1 is `/bin/sh` (or any other wrapper) with the real application as a child process further down the tree, the 10-second delay is almost certainly the kernel silently discarding SIGTERM at PID 1 with zero actual shutdown work ever happening — the app never even learns it should be stopping, and the container is only removed because SIGKILL eventually forces it. Confirming this further: add a temporary log line inside the app\'s SIGTERM handler and check whether it ever prints during a docker stop — if it never does, the signal never arrived, exactly as this subtopic\'s theory predicts for a shell-form CMD.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As long as an application has code that listens for SIGTERM (e.g. process.on(\'SIGTERM\', ...)), that handler will run whenever docker stop is called on its container.',
      reality: 'Per this subtopic\'s theory, the handler only runs if the application process itself is the one that actually RECEIVES the SIGTERM — a shell-form Dockerfile CMD makes /bin/sh the real PID 1, so SIGTERM goes to the shell (which ignores it, per the kernel\'s PID-1 rule) and the application\'s own handler, however correctly written, is never invoked at all.'
    },
    {
      thought: 'Every container consistently taking the full docker stop grace period before being killed just means the application is doing legitimate, if slow, cleanup work.',
      reality: 'Per this subtopic\'s exercise, an always-exactly-the-grace-period delay is a strong signal in the OPPOSITE direction — genuine graceful shutdown work usually finishes in a variable amount of time; a signal being silently ignored at PID 1 produces the exact same, maximal delay every time, since nothing ever happens until the fallback SIGKILL arrives.'
    },
    {
      thought: 'The kernel\'s special treatment of PID 1 (ignoring default-terminate signals with no explicit handler) only matters for a real system\'s actual init process, not for an ordinary application running inside a container.',
      reality: 'Per this subtopic\'s theory, the kernel applies this rule to whatever process happens to be PID 1 within its OWN pid namespace — a container\'s first process gets exactly the same protection a real init system does, whether or not the application was ever written with that responsibility in mind.'
    }
  ];
}
