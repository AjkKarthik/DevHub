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
  templateUrl: './renice-is-a-one-way-ratchet-for-non-root-users.html',
  styleUrl: './renice-is-a-one-way-ratchet-for-non-root-users.scss'
})
export class ReniceIsAOneWayRatchetForNonRootUsersSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the non-root restriction as a simple floor, not a one-way door',
      points: [
        'The main page\'s own theory states: "Only root can lower niceness (raise priority) below 0. Any user can increase niceness (lower their own priority)." Read on its own, this describes a single restriction — a floor at 0 that non-root users can\'t cross going down, with free movement in the other direction.',
        'Nothing on the main page addresses what happens AFTER a non-root user has already raised a process\'s niceness — can they change their mind and bring it back down, even just back to where it started, still staying at or above 0 the whole time? The main page\'s own theory reads as if this should obviously be fine, since it never leaves the "any user can increase" territory at any point.',
      ]
    },
    {
      heading: 'Confirmed: for a non-root user, raising niceness is a one-way door, not just a floor at zero',
      points: [
        'Per documented renice/setpriority behavior: "unprivileged users may increase nice levels but cannot decrease them without root permissions." This is a stricter rule than "can\'t go below 0" — it specifically means a non-root user cannot decrease niceness AT ALL, even a decrease that stays entirely within positive territory and never approaches the 0 floor the main page\'s own theory describes.',
        'The confirmed, concrete consequence: "once a non-root user has increased the niceness value of their own process, if they try to change the nice value back to a lower value, they will get \'Permission denied\' error." A user who raises their own process from nice 0 to nice 10, then tries to bring it back down to nice 5 — still well above the 0 floor, still entirely in "friendly" territory — is denied, exactly as if they\'d tried to go negative.',
        'This is documented as consistent across the underlying system call too, not just the renice command-line tool: "this restriction applies to setpriority() as well — non-root users face the same limitation with this system call." A program using the system call directly hits the identical wall a shell user hits via renice.',
      ]
    },
    {
      heading: 'Why the rule exists, and the practical consequence for anyone reaching for renice',
      points: [
        'The documented rationale is a security measure: this restriction exists "to prevent unprivileged users from monopolizing system resources by increasing their process priority" — specifically, preventing a user from artificially LOWERING their own niceness back down (effectively raising their process\'s priority again) after having voluntarily stepped back, which would otherwise let a process game the scheduler by oscillating.',
        'The practical consequence directly contradicts an intuitive assumption: raising a process\'s niceness (making it more polite, using fewer scheduling resources) is not a safely reversible, "you can always undo this yourself" action for a non-root user — it is a one-time, one-directional commitment for that process\'s remaining lifetime, unless root steps in.',
        'The only way to actually reverse an over-eager niceness increase, once made by a non-root user, is root running renice on their behalf — there is no self-service undo available to the original user, regardless of how far below the 0 floor their intended correction would land, since even landing well above 0 is still blocked.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Raising niceness, then trying to partially undo it — as a non-root user',
      language: 'bash',
      code: `# Start a long-running job at the default niceness:
nice -n 0 ./long-running-report.sh &
PID=$!

# Decide it's using too much CPU relative to other work -- raise
# its niceness (lower its priority), exactly matching the main
# page's own guidance: "Any user can increase niceness":
renice -n 10 -p "$PID"
# 12345 (process ID) old priority 0, new priority 10   <-- succeeds

# Later, the situation changes -- other work has finished, and this
# job should get more CPU again. Try to bring it back down, but
# only PARTWAY -- still well above the 0 floor, nowhere near
# negative territory:
renice -n 5 -p "$PID"
# renice: failed to set priority for 12345 (process ID): Permission denied

# Confirm this isn't about crossing 0 -- even nice 9 (still above
# the current nice 10, technically a DECREASE from 10 but still
# positive) is denied the same way:
renice -n 9 -p "$PID"
# renice: failed to set priority for 12345 (process ID): Permission denied

# The current value is genuinely stuck at 10 (or higher) for this
# user, for the rest of the process's life.
ps -o pid,ni,cmd -p "$PID"
# PID   NI  CMD
# 12345 10  ./long-running-report.sh`,
    },
    {
      label: 'Why it fails, and the only real fix (root)',
      language: 'bash',
      code: `# Per documented renice/setpriority behavior: "unprivileged users
# may increase nice levels but cannot decrease them without root
# permissions" -- this is NOT "can't go below 0," it's "can't
# decrease at all," full stop, once already raised.

# The identical restriction applies to the underlying syscall, not
# just the renice command-line tool -- a program calling
# setpriority() directly hits the same wall:
cat << 'EOF' > /tmp/test_setpriority.c
#include <sys/resource.h>
#include <stdio.h>
int main() {
    setpriority(PRIO_PROCESS, 0, 10);  // raise own niceness first
    int result = setpriority(PRIO_PROCESS, 0, 5);  // try to lower it
    if (result == -1) perror("setpriority");
    return 0;
}
EOF
# Compiling and running this as a non-root user reproduces the
# identical "Permission denied" on the second call.

# The only working fix: root performs the correction on the user's
# behalf -- there is no self-service undo for the original user:
sudo renice -n 5 -p "$PID"
# 12345 (process ID) old priority 10, new priority 5   <-- succeeds,
#                                                            because
#                                                            root is
#                                                            exempt
#                                                            from the
#                                                            restriction`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer runs a data-processing job in the background and, noticing it\'s slowing down their interactive terminal, runs renice -n 15 -p $PID to be considerate to other work. An hour later, the interactive slowdown is gone (unrelated work finished), and they want to give the job a bit more priority back — not urgent, not negative, just renice -n 8 -p $PID, still solidly in "polite" positive territory. The command fails with Permission denied, even though 8 is still well above 0 and the developer only wants to partially undo their own earlier change. Why does this fail, and what are the developer\'s actual options?',
    hint: 'Check whether the non-root restriction on renice is specifically about crossing below 0, or whether it\'s a broader rule about the DIRECTION of any change a non-root user makes to a process\'s own niceness once it\'s already been raised.',
    solution: 'This fails because the restriction on non-root users isn\'t "you can\'t go below 0" — it\'s "you can\'t decrease niceness at all," once it has already been increased, regardless of how far above 0 the target value is. Per documented renice/setpriority behavior, "unprivileged users may increase nice levels but cannot decrease them without root permissions," and specifically, "once a non-root user has increased the niceness value of their own process, if they try to change the nice value back to a lower value, they will get \'Permission denied\' error." Going from nice 15 to nice 8 is still a DECREASE, even though both values are positive and neither approaches the 0 floor the developer might have assumed was the actual boundary — the direction of the change is what\'s restricted, not just the destination value. The developer\'s only real options are: leave the job at nice 15 for the rest of its run, kill it and restart it fresh at a lower niceness (a brand-new process isn\'t restricted by the OLD process\'s history), or ask someone with root access to run renice -n 8 -p $PID on their behalf, since root is exempt from this restriction entirely.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A non-root user can freely move a process\'s niceness up and down as many times as needed, as long as the value never goes below 0.',
      reality: 'Per this subtopic\'s theory, the actual restriction is about DIRECTION, not just the 0 floor — once a non-root user has raised a process\'s niceness, they cannot lower it again at all, even to a value still well above 0, and will get "Permission denied" trying.'
    },
    {
      thought: 'Raising a process\'s niceness as a non-root user is a safely reversible, considerate action — you can always dial it back yourself later if circumstances change.',
      reality: 'Per this subtopic\'s theory, this is a one-time, one-directional commitment for a non-root user — there is no self-service way to undo it once made; only root can subsequently lower that process\'s niceness back down.'
    },
    {
      thought: 'The renice restriction for non-root users is specific to the renice command-line tool — writing custom code that calls the underlying system call directly would bypass it.',
      reality: 'Per this subtopic\'s theory, the identical restriction is documented at the setpriority() system call level itself, not just in the renice command — a program calling the syscall directly hits the exact same "Permission denied" once it has already raised its own niceness as a non-root user.'
    }
  ];
}
