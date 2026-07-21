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
  templateUrl: './kill-sighup-is-reload-not-termination.html',
  styleUrl: './kill-sighup-is-reload-not-termination.scss'
})
export class KillSighupIsReloadNotTerminationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own code tab shows a command its own mistake entry seems to argue against',
      points: [
        'The main page\'s "Lifecycle & Batch" code tab includes `docker kill -s SIGHUP api` right next to `docker kill api` (plain SIGKILL) — presented as one more variation of the same command, with a one-line comment: "# Send a custom signal."',
        'The main page\'s own separate mistake entry, "Using docker kill instead of docker stop," argues: "docker kill sends SIGKILL immediately, cutting off in-flight requests and possibly corrupting state... Reserve kill for unresponsive containers." Read next to the SIGHUP example, this creates an unresolved tension — is sending SIGHUP via docker kill also something to avoid outside of unresponsive-container scenarios?',
        'It is not — and the reason is that "docker kill" is really "docker send-this-signal," with SIGKILL as only its DEFAULT signal, not its only purpose. The mistake entry\'s warning is specifically about the SIGKILL default (immediate termination); it does not apply the same way once a different, non-terminating signal is chosen.',
      ]
    },
    {
      heading: 'Why SIGHUP specifically, and what it actually does to the container',
      points: [
        'Many long-running server processes — nginx being the canonical example — treat SIGHUP not as "terminate" but as "reload configuration": on receiving SIGHUP, nginx\'s master process re-reads its config file, starts new worker processes with the updated config, and gracefully phases out the old workers, all without the master process itself exiting.',
        '`docker kill -s SIGHUP api` delivers exactly that signal to the container\'s PID 1, with none of `docker stop`\'s grace-period machinery involved (there is nothing to wait for — the process is not being asked to exit at all). The container never stops, never restarts, and (if the target application handles SIGHUP for reload, as nginx does) picks up new configuration with zero downtime and zero container lifecycle change.',
        'This means `docker kill -s SIGHUP api` and `docker kill api` (no `-s`, implying SIGKILL) are two commands that share a name but do fundamentally different things to the container\'s lifecycle: one asks a process to reconfigure itself in place; the other unconditionally ends it. The main page\'s own mistake entry warning against "using kill instead of stop" is really a warning about the SIGNAL (SIGKILL, no grace period), not about the `docker kill` COMMAND as a whole.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two docker kill invocations, two different outcomes',
      language: 'bash',
      code: `# ── docker kill with NO -s flag: defaults to SIGKILL ──────────────────────
docker kill api
# Sends SIGKILL. The container's PID 1 is terminated immediately, no
# grace period, no chance to clean up in-flight work. docker ps shows
# "api" as Exited right after this command returns.

# ── docker kill -s SIGHUP: an entirely different outcome ──────────────────
docker kill -s SIGHUP api
# Sends SIGHUP, not SIGKILL. If "api" runs nginx (or any app with its
# own SIGHUP handler for config reload), the master process reloads
# its configuration in place and keeps serving traffic throughout.

docker ps --filter name=api
# CONTAINER   STATUS
# api         Up 3 hours     <- STILL RUNNING, completely unaffected
#                               from a lifecycle standpoint

# Compare to what the same "-s SIGHUP" call does against an app with
# NO SIGHUP handler installed: per the kernel's default disposition
# table, SIGHUP's un-handled DEFAULT action is actually to terminate
# the process -- so the SAME command against a plain Node.js server
# with no signal handling at all would kill it, exactly like SIGKILL
# would. Whether "-s SIGHUP" reloads or terminates depends entirely
# on whether the target application chose to handle that signal.`,
    },
    {
      label: 'The nginx reload pattern this example is drawn from',
      language: 'bash',
      code: `# Typical production pattern: edit nginx config on the host (bind-
# mounted into the container), then reload without any container
# restart or connection drop:

# 1. Update the mounted config file
vim ./nginx-conf/default.conf

# 2. Reload nginx in place -- no downtime, no new container
docker kill -s SIGHUP nginx-proxy

# Equivalent, arguably clearer alternative using docker exec instead
# of a raw signal:
docker exec nginx-proxy nginx -s reload
# nginx's own -s reload subcommand internally sends itself the same
# SIGHUP -- both commands end up doing the identical thing, just
# from outside (docker kill) vs. inside (docker exec) the container.

# Neither of these commands appears anywhere near "docker stop" or
# "docker restart" in a deploy script for a good reason: restarting
# the container would drop the connection pool, cold-start the
# process, and briefly interrupt traffic -- none of which a config
# reload via SIGHUP needs to pay for.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate reads the main page\'s own "Using docker kill instead of docker stop" mistake entry and concludes the team should replace every `docker kill -s SIGHUP nginx-proxy` call in their deploy scripts with `docker stop nginx-proxy` followed by a fresh `docker run`, reasoning "the mistake entry says to prefer stop over kill." Using this subtopic\'s theory, is this a correct application of that mistake entry\'s advice?',
    hint: 'Per this subtopic\'s theory, is the main page\'s own mistake entry warning about the docker kill COMMAND in general, or specifically about the SIGKILL signal it defaults to sending?',
    solution: 'This is not a correct application of the advice, and following it would make the deploy process meaningfully worse. Per this subtopic\'s theory, the main page\'s own mistake entry is specifically about `docker kill`\'s DEFAULT behavior — sending SIGKILL with no grace period, "cutting off in-flight requests and possibly corrupting state" — not about the `docker kill` command as a general concept. `docker kill -s SIGHUP nginx-proxy` never sends SIGKILL at all; it sends SIGHUP, which nginx treats as "reload configuration in place," with the container never stopping and traffic never interrupted. Replacing it with `docker stop` + a fresh `docker run` would introduce exactly the disruption (dropped connections, a cold-started process, a brief gap in availability) the SIGHUP approach was specifically chosen to avoid — swapping a zero-downtime reload for a full container replacement based on a mistake entry that was never actually about this use case.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'docker kill always sends SIGKILL and always terminates the target container, regardless of what -s flag is passed.',
      reality: 'Per this subtopic\'s theory, SIGKILL is only docker kill\'s DEFAULT signal when no -s flag is given — docker kill -s <signal> sends whatever signal is specified, and many signals (SIGHUP being the canonical example) are commonly used by applications for something other than termination, like nginx\'s config reload.'
    },
    {
      thought: 'The main page\'s own advice to "reserve kill for unresponsive containers" applies to every docker kill invocation, including docker kill -s SIGHUP.',
      reality: 'Per this subtopic\'s exercise, that advice specifically addresses the risk of SIGKILL\'s no-grace-period termination — it does not apply to a docker kill call sending a non-terminating signal like SIGHUP to an application designed to handle it, which causes no container lifecycle disruption at all.'
    },
    {
      thought: 'Whether docker kill -s SIGHUP reloads an application\'s configuration or terminates it depends on some property of the docker kill command itself.',
      reality: 'Per this subtopic\'s theory, the outcome depends entirely on the TARGET APPLICATION — nginx explicitly installs a SIGHUP handler for reload, but an application with no SIGHUP handler falls back to the kernel\'s own default disposition for that signal, which is to terminate the process, exactly as if SIGKILL had been sent instead.'
    }
  ];
}
