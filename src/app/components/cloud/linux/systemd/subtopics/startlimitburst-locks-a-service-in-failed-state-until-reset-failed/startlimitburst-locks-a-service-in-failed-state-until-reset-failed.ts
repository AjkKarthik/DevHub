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
  templateUrl: './startlimitburst-locks-a-service-in-failed-state-until-reset-failed.html',
  styleUrl: './startlimitburst-locks-a-service-in-failed-state-until-reset-failed.scss'
})
export class StartlimitburstLocksAServiceInFailedStateUntilResetFailedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page shows StartLimitIntervalSec and StartLimitBurst with zero explanation',
      points: [
        'The main page\'s own unit-file example includes <code>StartLimitIntervalSec=60</code> and <code>StartLimitBurst=3</code> right alongside <code>Restart=on-failure</code> and <code>RestartSec=5s</code> — but nowhere on the page is either directive explained. A reader could reasonably assume these are just extra tuning knobs for HOW OFTEN restarts happen, when they actually define a hard CEILING after which systemd stops trying entirely.',
      ]
    },
    {
      heading: 'What these directives actually enforce, and what happens when the limit is hit',
      points: [
        'Together, <code>StartLimitIntervalSec=60</code> and <code>StartLimitBurst=3</code> mean: if the service is restarted (by <code>Restart=on-failure</code>) more than 3 times within any rolling 60-second window, systemd gives up. The service is placed into a genuine FAILED state and systemd stops attempting any further automatic restarts — even if <code>Restart=on-failure</code> is still configured and would otherwise keep trying.',
        'This exists specifically to prevent a crash-looping service from consuming CPU and I/O indefinitely in a tight restart cycle — a deliberate circuit breaker, not a bug or a misconfiguration when it triggers.',
        'The concrete consequence that catches people off guard: once this limit trips, the service STAYS in the failed state even after whatever caused the original crash loop is fixed. A plain <code>systemctl start myapp</code> after fixing the underlying bug can still fail or do nothing useful, because the start-limit counter itself hasn\'t been cleared — the fix and the restart-limit reset are two SEPARATE things.',
      ]
    },
    {
      heading: 'The fix: systemctl reset-failed, and sizing the limits correctly',
      points: [
        '<code>systemctl reset-failed myapp</code> (or the bare <code>systemctl reset-failed</code> to clear every failed unit at once) explicitly clears BOTH the failed state AND the internal start-limit counter — this is the step people who don\'t know about it are missing when a service "won\'t come back up" after they\'ve already fixed the actual problem.',
        'A recommended sizing rule, worth applying to the main page\'s own example values: <code>StartLimitIntervalSec</code> should be comfortably greater than <code>RestartSec × StartLimitBurst</code> — with <code>RestartSec=5s</code> and <code>StartLimitBurst=3</code> (the main page\'s own numbers), 3 restarts spaced 5 seconds apart take at least 15 seconds, so a 60-second window (also the main page\'s own value) is generous and correctly configured; a window set too tight relative to RestartSec×Burst can trip the limit faster than intended, or never meaningfully constrain a fast-failing loop at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the failed-state lockout',
      language: 'bash',
      code: `# The main page's own limits:
#   Restart=on-failure
#   RestartSec=5s
#   StartLimitIntervalSec=60
#   StartLimitBurst=3

# A bug causes myapp to crash immediately on every start (e.g. a
# missing required environment variable). systemd, per
# Restart=on-failure, keeps trying:
journalctl -u myapp -n 20
# Started myapp.service.
# myapp.service: Main process exited, code=exited, status=1
# myapp.service: Scheduled restart job, restart counter is at 1.
# Started myapp.service.
# myapp.service: Main process exited, code=exited, status=1
# myapp.service: Scheduled restart job, restart counter is at 2.
# Started myapp.service.
# myapp.service: Main process exited, code=exited, status=1
# myapp.service: Scheduled restart job, restart counter is at 3.
# myapp.service: Start request repeated too quickly.
# myapp.service: Failed with result 'exit-code'.
# Failed to start myapp.service.
# -- exactly 3 restarts within the 60s window (StartLimitBurst=3),
#    then systemd stops trying entirely -- this is the CIRCUIT
#    BREAKER working exactly as designed, not a bug.

systemctl status myapp
# ● myapp.service - My Application Server
#      Loaded: loaded (...)
#      Active: failed (Result: exit-code) since ...`,
    },
    {
      label: 'The fix -- and why a plain restart isn\'t enough after fixing the bug',
      language: 'bash',
      code: `# The underlying bug is fixed (the missing env var is added)...
cat /etc/myapp/env
# NODE_ENV=production
# PORT=3000                    <-- the missing var, now present

# ...but a plain restart attempt right after fixing it can still
# fail or appear to do nothing, because the START-LIMIT COUNTER
# itself is a SEPARATE piece of state from the actual bug:
sudo systemctl start myapp
# Failed to start myapp.service: Unit myapp.service not found.
# (or, depending on version: silently returns without starting)

# The actual fix: clear the failed state AND the counter together
sudo systemctl reset-failed myapp

# NOW start works correctly, since the counter is back to zero:
sudo systemctl start myapp
systemctl status myapp
# Active: active (running) since ...

# Clear every failed unit on the system at once (useful after a
# broader incident affecting several services):
sudo systemctl reset-failed`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service crash-loops overnight due to a bad deploy, tripping the main page\'s own `StartLimitBurst=3` / `StartLimitIntervalSec=60` limits and landing in the failed state. The next morning, an engineer reverts the bad deploy (fixing the actual root cause) and runs `systemctl start myapp` — but the service still won\'t come up, with no obvious error explaining why. What is actually going on, and what single command resolves it?',
    hint: 'The bug causing the crash loop and the mechanism that stopped systemd from RETRYING after 3 failures are two separate pieces of state — fixing the bug doesn\'t automatically reset the second one.',
    solution: 'Reverting the bad deploy fixes the underlying crash, but it does nothing to reset the START-LIMIT COUNTER that systemd tripped overnight when the service hit `StartLimitBurst=3` restarts within the `StartLimitIntervalSec=60` window — that counter and the failed state it produced are separate, persistent pieces of systemd\'s own state, unrelated to whether the actual bug is now fixed. A plain `systemctl start myapp` after fixing the bug can still fail (or behave unexpectedly) because the unit is still sitting in that tripped, failed state. The command that resolves it is `sudo systemctl reset-failed myapp` — this explicitly clears both the failed state and the internal start-limit counter together, after which a normal `systemctl start myapp` (or simply waiting for the next Restart=on-failure attempt, if one is still pending) works correctly again.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'StartLimitIntervalSec and StartLimitBurst just control HOW OFTEN systemd retries a failing service, similar to RestartSec.',
      reality: 'Per this subtopic\'s theory, these two directives together define a hard CEILING — once a service is restarted more times than StartLimitBurst allows within StartLimitIntervalSec, systemd stops trying entirely and marks the unit failed, regardless of the Restart= setting.'
    },
    {
      thought: 'Once the actual bug causing a crash loop is fixed, the service will automatically come back up on its own (or with a plain systemctl start).',
      reality: 'Per this subtopic\'s theory, hitting the start-limit ceiling leaves the unit in a failed state with a tripped internal counter — fixing the underlying bug does not clear that state; systemctl reset-failed is required before the service can start normally again.'
    },
    {
      thought: 'A service landing in the "failed" state with "Start request repeated too quickly" indicates something is wrong with systemd itself or the unit file\'s configuration.',
      reality: 'Per this subtopic\'s theory, this is the StartLimitBurst circuit breaker working exactly as designed — it exists specifically to stop a crash-looping service from consuming resources indefinitely, and tripping it is expected behavior for a service that is genuinely crash-looping.'
    }
  ];
}
