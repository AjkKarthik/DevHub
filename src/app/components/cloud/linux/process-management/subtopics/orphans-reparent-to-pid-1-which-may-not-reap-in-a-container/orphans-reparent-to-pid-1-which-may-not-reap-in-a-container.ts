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
  templateUrl: './orphans-reparent-to-pid-1-which-may-not-reap-in-a-container.html',
  styleUrl: './orphans-reparent-to-pid-1-which-may-not-reap-in-a-container.scss'
})
export class OrphansReparentToPid1WhichMayNotReapInAContainerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states orphan reparenting as a universal, always-safe fact',
      points: [
        'The main page\'s own theory states plainly: "Orphan processes whose parent exits are reparented to PID 1 (systemd/init), which reaps them." Written this way, PID 1 and "reaps them" are presented as a package deal — reparenting to PID 1 is described as automatically solving the zombie problem.',
        'The main page\'s own quiz question on zombies reinforces the same assumption from the other direction: it explains that a zombie is only cleared once "the PARENT calls wait()... or killing/fixing the parent so it does" — with no acknowledgment that WHO ends up as a process\'s effective "parent" (after reparenting) can vary, and that the new parent isn\'t guaranteed to call wait() at all.',
      ]
    },
    {
      heading: 'Confirmed: PID 1 is a role, and whoever fills it must specifically implement reaping — it isn\'t automatic',
      points: [
        'Per documented container/init research: "PID 1 does not receive default signal handlers from the kernel" and, separately, it "must reap orphaned child processes" — this is a RESPONSIBILITY the process occupying PID 1 has to actively fulfill, not a kernel-provided guarantee that comes free with the position. On a normal desktop or server boot, PID 1 is genuinely systemd, which does implement this correctly — but "PID 1" and "systemd" are not the same thing everywhere.',
        'Inside a container, PID 1 is very often the application\'s own entrypoint process — a plain script, a Node.js process, a Python interpreter — NOT systemd or any dedicated init system at all. Per the same research: "if PID 1 doesn\'t wait on child processes, those become zombies — still consuming system resources even though they\'ve exited... Zombies consume slots in the kernel process table which fills and prevents the creation of further processes."',
        'This directly contradicts the main page\'s own implied universality — "reparented to PID 1... which reaps them" is true when PID 1 happens to be systemd or a real init system, and silently FALSE when PID 1 is an application process with no reaping logic of its own, which describes an enormous share of real-world container deployments.',
      ]
    },
    {
      heading: 'The documented fix, and the subtler "subreaper" alternative',
      points: [
        'The standard, documented fix is running a minimal init process as the container\'s actual PID 1 — tini is the specific tool Docker ships built-in support for: "tini reaps dead child processes so they don\'t become zombies," and "Docker even includes it natively if you use the --init flag." This adds a tiny, purpose-built reaper in front of the real application, which then runs as a CHILD of tini rather than as PID 1 itself.',
        'A second, more targeted option exists for cases where the main application genuinely needs to BE PID 1 for some other reason: Linux\'s own subreaper mechanism. Per the same documentation: "the -s flag enables subreaper mode. Use it when [the init process] cannot run as PID 1 but still needs orphaned processes to be re-parented to it" — a subreaper doesn\'t have to literally occupy PID 1 to catch reparented orphans; it registers itself via prctl(PR_SET_CHILD_SUBREAPER) instead.',
        'The practical diagnostic signal worth knowing: tini itself "will issue a warning if it detects that it isn\'t running as PID 1 and isn\'t registered as a subreaper" — a genuinely useful early warning that a container\'s process-reaping setup is misconfigured, well before zombies have had time to accumulate and fill the process table.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing zombie accumulation with an app running directly as PID 1',
      language: 'bash',
      code: `# A minimal container image running the app directly, with no
# init process -- a very common (and broken) pattern:
#
#   Dockerfile:
#     FROM node:20
#     COPY server.js .
#     CMD ["node", "server.js"]     <-- node becomes PID 1 directly

# Inside the running container, node.js (PID 1) spawns child
# processes for something (a subprocess call, a worker) that later
# exit -- but node's own code never calls wait()/waitpid() on them,
# because handling reaping duties isn't something app code is
# usually written to do:

docker exec mycontainer ps aux
# PID   USER  STAT  COMMAND
# 1     root  Ss    node server.js
# 47    root  Z     [worker] <defunct>     <-- zombie, accumulating
# 52    root  Z     [worker] <defunct>     <-- another one
# 58    root  Z     [worker] <defunct>     <-- and another...

# Per documented container research: "if PID 1 doesn't wait on
# child processes, those become zombies... Zombies consume slots in
# the kernel process table which fills and prevents the creation of
# further processes" -- this keeps accumulating for as long as the
# container runs, unlike a normal host where systemd (genuinely
# PID 1 there) reaps orphans correctly by design.`,
    },
    {
      label: 'The documented fix: a real init process (tini) in front of the app',
      language: 'bash',
      code: `# Fix 1 -- Docker's own built-in --init flag, using tini
# specifically as documented: "Docker even includes it natively if
# you use the --init flag":
docker run --init mynode-image
# tini now runs AS PID 1, with node.js as ITS child instead --
# tini "reaps dead child processes so they don't become zombies."

docker exec mycontainer ps aux
# PID   USER  STAT  COMMAND
# 1     root  Ss    /sbin/docker-init -- node server.js
# 7     root  Sl    node server.js          <-- app is now PID 7,
#                                                not PID 1
# (no zombie entries accumulate, even as the app spawns and exits
#  its own child processes over time)

# Fix 2 -- for cases where the app genuinely needs to BE PID 1,
# register a subreaper instead of replacing PID 1 entirely:
# (conceptual -- exact registration depends on the init tool)
# tini -s -- node server.js
# Per documented guidance: "use it when [the init process] cannot
# run as PID 1 but still needs orphaned processes to be
# re-parented to it" -- via prctl(PR_SET_CHILD_SUBREAPER).

# Diagnostic tini provides for free: it "will issue a warning if it
# detects that it isn't running as PID 1 and isn't registered as a
# subreaper" -- a good early signal something is misconfigured.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team deploys a Python application in a minimal Docker container built with CMD ["python3", "worker.py"] — no init system, following a pattern they copied from an old internal template. The app itself works fine for weeks, but after a few days of uptime, docker exec ... ps aux inside the container shows a growing list of Z-state (defunct) entries, and eventually new subprocess spawns inside the app start failing outright. The main page\'s own theory states orphans "are reparented to PID 1 (systemd/init), which reaps them" — so why isn\'t that happening here?',
    hint: 'Check exactly WHAT process is occupying PID 1 inside this specific container, and whether that specific process actually implements the reaping responsibility the main page\'s theory assumes PID 1 always fulfills.',
    solution: 'The main page\'s theory is describing what happens when PID 1 is genuinely systemd or a real init system — which is true on a normal host, but not automatically true inside a container. Because the Dockerfile\'s CMD runs python3 worker.py directly with no init process in front of it, python3 itself is occupying PID 1 inside this container — not systemd, and not any dedicated reaper. Per documented container research, "PID 1... must reap orphaned child processes" as an active RESPONSIBILITY of whatever process holds that role, not a kernel-provided guarantee — and application code (like this worker.py) is essentially never written to call wait()/waitpid() on its own orphaned children, since that isn\'t normally an application\'s job. Each subprocess the app spawns and doesn\'t explicitly wait on becomes a permanent zombie entry, accumulating in the kernel\'s process table until, per the same research, the table "fills and prevents the creation of further processes" — exactly the failure mode observed. The fix is adding a real init process in front of the app — either Docker\'s own docker run --init flag (which uses tini, documented to reap dead children automatically), or rebuilding the image\'s ENTRYPOINT/CMD to invoke tini explicitly ahead of the Python process.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Reparenting an orphaned process to PID 1 automatically reaps it — this is a kernel-level guarantee that applies wherever a process runs, containers included.',
      reality: 'Per this subtopic\'s theory, reaping is a responsibility that whatever process occupies PID 1 must actively implement (by calling wait()) — the kernel reparents orphans to PID 1, but does nothing to force that process to actually collect their exit status.'
    },
    {
      thought: 'PID 1 always refers to systemd (or an equivalent real init system), the same way it does on a normal Linux host.',
      reality: 'Per this subtopic\'s theory, inside a container PID 1 is commonly the application\'s own entrypoint process — a plain script or app binary — unless a dedicated init tool like tini is deliberately placed in front of it.'
    },
    {
      thought: 'Zombie processes accumulating inside a container is primarily an application bug — something wrong with how the app itself spawns or manages subprocesses.',
      reality: 'Per this subtopic\'s theory, this is typically a container CONFIGURATION issue, not an application bug — most application code was never written with reaping responsibilities in mind, which is exactly why a dedicated init process (tini, or Docker\'s own --init flag) exists to handle it instead.'
    }
  ];
}
