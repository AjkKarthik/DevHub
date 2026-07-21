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
  templateUrl: './oom-killer-targets-a-process-not-the-container.html',
  styleUrl: './oom-killer-targets-a-process-not-the-container.scss'
})
export class OomKillerTargetsAProcessNotTheContainerSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own OOM bullet talks about "its processes" plural, without saying which ones get picked',
      points: [
        'The main page\'s cgroups theory says: "Memory: --memory=512m sets a hard limit. When a container hits the limit, the kernel OOM killer terminates its processes — it does NOT gracefully shut down." The phrase "its processes" (plural) reads as if hitting the limit takes down everything running in the container together.',
        'That is not how the cgroup OOM killer actually works. Within the cgroup a memory limit applies to, the kernel scores every candidate PROCESS individually and selects ONE victim to kill — not the whole set of processes in the cgroup, and not necessarily PID 1.',
        'The main page\'s own separate "Running multiple services in one container" mistake entry already argues for one process per container on different grounds (independent scaling, updating, and debugging) — this OOM behavior is a second, more concrete reason the same architectural choice matters, one the page never connects to the earlier advice.',
      ]
    },
    {
      heading: 'What actually happens to a multi-process container when the memory limit is hit',
      points: [
        'In a genuinely single-process container, this distinction barely matters — the OOM killer has only one real candidate to pick, killing that process necessarily kills PID 1, and Docker (which tracks whether PID 1 has exited to decide if the container has stopped) correctly reports the container as dead. The main page\'s own worked example (a single node.js server) fits this case exactly.',
        'In a container running multiple processes — despite the main page\'s own advice against it — the OOM killer\'s per-process scoring can select a CHILD worker process instead of PID 1, since a memory-heavy child can easily out-score the smaller parent. That child gets killed; PID 1 survives untouched. Docker sees PID 1 still running and reports the container as healthy and unchanged — an orchestrator or health check watching only "is the container running" has no way to notice that a real worker died.',
        'The Linux kernel does provide a way to force the WHOLE cgroup to be killed together when any process inside it triggers an OOM event — a `memory.oom.group` setting inside the cgroup\'s own cgroups v2 memory controller files — but Docker does not set this automatically for you as part of normal container creation, so it takes deliberately setting it (or running single-process containers, side-stepping the ambiguity entirely) to get all-or-nothing OOM behavior.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A multi-process container surviving with a dead worker',
      language: 'bash',
      code: `# A container running a small supervisor process PLUS a heavier
# memory-hungry worker (against the main page's own "one process per
# container" advice):

docker run -d --name multiproc --memory=256m myapp-with-worker
docker exec multiproc ps aux
#   PID   USER  MEM    COMMAND
#   1     app   4MB    node supervisor.js       <- small, stays alive
#   14    app   240MB  node worker.js           <- memory-heavy child

# Worker leaks memory, cgroup hits 256m limit. The OOM killer scores
# EACH process in the cgroup individually -- PID 14 (240MB) scores
# far higher than PID 1 (4MB) and is the one selected and killed.

docker exec multiproc ps aux
#   PID   USER  MEM    COMMAND
#   1     app   4MB    node supervisor.js       <- STILL running

docker ps
#   CONTAINER   STATUS
#   multiproc   Up 2 hours                       <- looks completely healthy

# Docker only tracks whether PID 1 has exited to decide the container
# is "Exited" -- since PID 1 (the supervisor) never died, the
# container shows as healthy the entire time the actual worker is gone.`,
    },
    {
      label: 'The single-process case, and the deliberate all-or-nothing fix',
      language: 'bash',
      code: `# A single-process container, matching the main page's own worked
# example architecture:

docker run -d --name singleproc --memory=256m myapp
docker exec singleproc ps aux
#   PID   USER  MEM    COMMAND
#   1     app   250MB  node server.js      <- the ONLY candidate

# Memory limit hit -> OOM killer has one real choice -> PID 1 dies ->
# Docker correctly sees PID 1 exit -> container reported as Exited
# (137) -- no ambiguity, because there was only ever one process to
# begin with. This is the main page's own "one process per container"
# advice paying off in a very concrete way here.

# ── Forcing all-or-nothing OOM behavior for a genuinely
#    multi-process container (cgroups v2 only) ──────────────────────
CGROUP=$(docker inspect --format '{{.Id}}' multiproc)
echo 1 > /sys/fs/cgroup/system.slice/docker-$CGROUP.scope/memory.oom.group
# Now ANY OOM event inside this cgroup kills EVERY process in it
# together -- Docker sees PID 1 die along with the worker, and
# correctly reports the container as Exited. Not set by Docker
# automatically -- this has to be applied by hand, per container.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s monitoring dashboard shows a container as "Up" and healthy for days, but customers intermittently report a background job feature silently not working. The container runs a small web server (PID 1) plus a separate background-job worker process launched from the same entrypoint script. Using this subtopic\'s theory, what is a plausible root cause connecting these two observations, and what is the fastest way to confirm it?',
    hint: 'Per this subtopic\'s theory, when a memory limit is hit in a multi-process container, does the OOM killer necessarily pick PID 1, or could it pick a different process entirely while PID 1 survives?',
    solution: 'Per this subtopic\'s theory, a very plausible root cause is that the background-job worker process is periodically hitting the container\'s memory limit and being selected by the OOM killer individually — since it likely uses more memory than the small web server at PID 1, the kernel\'s per-process scoring picks the worker as the victim, kills it, and leaves PID 1 (the web server) completely untouched. Docker, which only tracks whether PID 1 has exited to decide container health, has no way to notice the worker is gone — the container keeps showing "Up" the entire time, exactly matching the dashboard\'s report, while the background-job feature silently stops functioning because its process no longer exists. The fastest way to confirm this: check `dmesg` or the kernel log on the host for OOM killer log entries around the times jobs stopped processing (these log which specific PID and process name were killed), and separately run `docker exec <container> ps aux` during a "healthy" period to see whether the worker process is actually present — its absence, combined with a matching OOM kill log entry, would confirm the theory directly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When a container\'s cgroup memory limit is exceeded, the OOM killer terminates the whole container at once, ending every process it contains together.',
      reality: 'Per this subtopic\'s theory, the default cgroup OOM killer scores and kills individual PROCESSES, not the whole cgroup — in a multi-process container, one process (often not PID 1) can be killed while every other process, including PID 1, keeps running untouched.'
    },
    {
      thought: 'Since Docker reports a container as "Up" based on whether it is functioning correctly, a container staying "Up" after an OOM event means nothing important was actually lost.',
      reality: 'Per this subtopic\'s exercise, Docker\'s "Up" status only tracks whether PID 1 has exited — it has no visibility into whether other processes inside a multi-process container are still alive, so a container can show healthy indefinitely while a real, non-PID-1 worker process silently stays dead after being OOM-killed.'
    },
    {
      thought: 'Setting a Docker --memory limit automatically ensures that if the limit is ever hit, the entire container cleanly restarts as a unit.',
      reality: 'Per this subtopic\'s theory, Docker does not set memory.oom.group by default — achieving all-or-nothing OOM behavior for a multi-process container requires manually writing to that cgroup file per container, or (more simply) sticking to one process per container so there is never more than one OOM candidate to begin with.'
    }
  ];
}
