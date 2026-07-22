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
  templateUrl: './kill-does-not-suppress-restart-policy-like-stop.html',
  styleUrl: './kill-does-not-suppress-restart-policy-like-stop.scss'
})
export class KillDoesNotSuppressRestartPolicyLikeStopSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats "stop the container" as a single concept, regardless of which command does it',
      points: [
        'The main page\'s own theory bullet says: "unless-stopped restarts unless manually stopped." Its own mistakes section separately explains docker stop vs. docker kill purely in terms of HOW GRACEFULLY the container\'s process exits — grace period vs. immediate SIGKILL.',
        'Neither bullet distinguishes between the two commands from the restart POLICY\'s point of view. Read together, they imply that once a container is no longer running — whichever command caused that — the same "manually stopped" bookkeeping applies, and the unless-stopped policy behaves identically either way.',
        'That is not reliably true. Per Docker\'s own documented behavior, `docker stop` marks a container as explicitly, intentionally stopped in a way the restart-policy engine specifically respects — but `docker kill` does not reliably register that same "this was an intentional stop" state, a distinction confirmed by a real, filed Docker engine issue describing exactly this gap.',
      ]
    },
    {
      heading: 'What this means for a container with --restart unless-stopped across a host or daemon reboot',
      points: [
        'Per Docker\'s own documentation, `unless-stopped` restarts a container after a daemon restart UNLESS that container was already in the Stopped state due to an explicit user stop — the intent being: if you deliberately stopped something, a routine daemon restart (say, after a Docker upgrade) should not silently bring it back.',
        'The mechanism that makes this work depends on Docker\'s bookkeeping correctly recording "a user explicitly asked to stop this." `docker stop` reliably does that recording. `docker kill`, confirmed by a documented Docker engine bug report ("docker kill prevents containers with unless-stopped restart policy to be started after reboot"), does not behave the same way — using kill instead of stop on an unless-stopped container can leave it in a state where it fails to come back after the NEXT daemon restart, the opposite of what a reader might assume ("I stopped it one way or another, so of course it won\'t auto-restart until I bring it back myself").',
        'The main page\'s own "Lifecycle & Batch" code tab includes both `docker kill api` and `docker rm -f api` as ways to forcibly end a container, right alongside `docker stop --time=30 api` — with nothing distinguishing them from a restart-policy perspective. For a container running with `--restart unless-stopped` in production, which of these three commands is used to take it down is not interchangeable, even though all three end the running process.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same restart policy, two different commands, two different outcomes after a daemon restart',
      language: 'bash',
      code: `# A production container with unless-stopped:
docker run -d --name api --restart unless-stopped myapp:2.1.0

# ── Path A: docker stop ────────────────────────────────────────────────────
docker stop api
# Docker records: "api was explicitly, intentionally stopped by the user."

sudo systemctl restart docker    # e.g. a routine Docker upgrade
docker ps -a --filter name=api
# STATUS: Exited     <- correctly stayed stopped, exactly as intended --
#                        unless-stopped is respecting the explicit stop

# ── Path B: docker kill (same container, same restart policy) ─────────────
docker run -d --name api2 --restart unless-stopped myapp:2.1.0
docker kill api2
# Per Docker's own documented behavior, this does NOT reliably record
# the same "explicitly stopped" state that docker stop does.

sudo systemctl restart docker
docker ps -a --filter name=api2
# STATUS: (behavior not guaranteed to match Path A) -- confirmed via
# a filed Docker engine issue (moby/moby #47792) describing exactly
# this: containers killed rather than stopped can fail to come back
# after reboot even under unless-stopped, an inconsistent outcome
# most operators do not expect from "I stopped it one way or another."`,
    },
    {
      label: 'The safe pattern for taking down an unless-stopped container',
      language: 'bash',
      code: `# For any container running a --restart unless-stopped (or always)
# policy, always prefer docker stop over docker kill or docker rm -f
# when the goal is "take this down and keep it down until I say
# otherwise" -- docker stop is the command Docker's own restart-
# policy bookkeeping is built to recognise reliably.

docker stop api                 # graceful, AND correctly recorded
                                 # for restart-policy purposes

# Reserve docker kill for what it's actually for: an unresponsive
# container that docker stop's grace period won't resolve, OR
# sending a non-terminating signal like SIGHUP for a config reload
# (see the sibling subtopic on docker kill -s SIGHUP) -- not as a
# routine, interchangeable substitute for docker stop in scripts
# managing containers with an active restart policy.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team runs a cleanup script that force-removes misbehaving containers with `docker rm -f <name>` (which sends SIGKILL before removing, per the main page\'s own theory) rather than `docker stop <name>` first. Several of the containers targeted by this script run with `--restart unless-stopped`. After the next scheduled Docker daemon upgrade (which restarts the daemon), some of those containers unexpectedly come back running, while others that were cleanly `docker stop`ped earlier the same week correctly stayed down. Using this subtopic\'s theory, explain the likely cause of this inconsistency.',
    hint: 'Per this subtopic\'s theory, does the restart-policy engine reliably record "this was an intentional stop" the same way regardless of whether the container was taken down via docker stop or via a forceful kill/removal?',
    solution: 'Per this subtopic\'s theory, the likely cause is exactly the distinction this subtopic identifies: containers that were cleanly `docker stop`ped had that stop reliably recorded by Docker\'s restart-policy bookkeeping, so `unless-stopped` correctly kept them down through the daemon restart. Containers taken down via `docker rm -f` (which the main page\'s own theory describes as "force-removes a running container by sending SIGKILL first") went through the same kind of forceful termination `docker kill` uses — and per the documented Docker engine behavior this subtopic\'s theory cites, that path does not reliably register the same "explicitly stopped" state `docker stop` does. The inconsistency the team observed — some containers correctly staying down, others unexpectedly coming back — lines up exactly with which command was used to take each one down, not with anything random or version-specific about the containers themselves. The fix is standardizing the cleanup script to use `docker stop` (with `docker rm` only AFTER the container has already exited cleanly) whenever a container carries an active restart policy and the intent is for it to stay down.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since docker stop, docker kill, and docker rm -f all end up with the container no longer running, a restart policy like unless-stopped treats all three the same way when deciding whether to restart the container later.',
      reality: 'Per this subtopic\'s theory, docker stop reliably records the container as intentionally, explicitly stopped in a way the restart-policy engine specifically respects — docker kill (and the SIGKILL docker rm -f sends before removing) does not reliably record that same state, confirmed by a real, filed Docker engine issue.'
    },
    {
      thought: 'A container that was forcefully killed is, if anything, MORE likely to stay stopped after a daemon restart than one that was gracefully stopped, since killing is the more forceful action.',
      reality: 'Per this subtopic\'s exercise, the opposite can happen — a killed container running under unless-stopped can unexpectedly come BACK after the next daemon restart, precisely because the forceful termination path does not reliably mark it as an intentional stop, while a routinely docker-stopped container reliably stays down.'
    },
    {
      thought: 'This distinction only matters for docker kill specifically — docker rm -f is a separate, unrelated command with no restart-policy implications.',
      reality: 'Per this subtopic\'s theory, docker rm -f forcibly removes a running container by sending SIGKILL first, per the main page\'s own description — since that is the same forceful-termination path as docker kill, it carries the same restart-policy-bookkeeping risk for any container running with an active restart policy.'
    }
  ];
}
