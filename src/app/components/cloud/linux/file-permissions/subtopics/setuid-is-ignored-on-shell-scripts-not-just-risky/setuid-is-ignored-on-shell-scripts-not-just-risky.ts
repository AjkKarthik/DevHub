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
  templateUrl: './setuid-is-ignored-on-shell-scripts-not-just-risky.html',
  styleUrl: './setuid-is-ignored-on-shell-scripts-not-just-risky.scss'
})
export class SetuidIsIgnoredOnShellScriptsNotJustRiskySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page frames setuid as "risky if misconfigured" — never as "silently does nothing" for scripts',
      points: [
        'The main page\'s own theory states: "setuid executables are a well-known security risk if misconfigured — a setuid root binary with a vulnerability effectively grants an attacker root-level code execution, which is why setuid usage should be minimized." Every example on the page — passwd, chmod u+s mybinary — is a COMPILED binary.',
        'Nothing on the main page distinguishes what happens when someone tries the exact same chmod u+s on a SHELL SCRIPT instead of a compiled binary. A learner following the page\'s own "chmod u+s mybinary" pattern against a .sh file would have no reason to expect anything different.',
      ]
    },
    {
      heading: 'Confirmed: the Linux kernel simply ignores setuid/setgid on scripts, by design',
      points: [
        'Per longstanding, well-documented Unix/Linux security guidance: "many Unix-like systems, in particular Linux, simply ignore the setuid and setgid bits on scripts" entirely — the bit can be SET on the file (chmod u+s script.sh succeeds, and ls -l even shows the s), but the kernel does not honor it at execution time for anything with a #!interpreter shebang line.',
        'The reason is a specific, historically real security hole: "many kernels suffer from a race condition which can allow you to exchange the shellscript for another executable of your choice between the times that the newly exec()ed process goes setuid, and when the command interpreter gets started up." Between the kernel reading the shebang line and the interpreter actually opening the script file a second time, an attacker with write access to the path (or a symlink swap) could substitute a different file — one that then runs with the elevated setuid privilege instead of the intended script.',
        'This is stated as a deliberate, permanent mitigation, not a bug to be fixed later: ignoring setuid/setgid on any file that begins with a shebang line sidesteps the entire class of race-condition exploit, rather than trying to close the specific timing window.',
      ]
    },
    {
      heading: 'Why this makes setuid scripts a worse trap than setuid binaries',
      points: [
        'A misconfigured setuid BINARY is a real, working security risk exactly as the main page describes — the elevated privilege genuinely takes effect, and the risk is entirely about what the binary\'s own code does with it. A setuid SCRIPT is a different, more confusing failure mode: the permission bit is visibly set (ls -l shows the s), giving every outward appearance of being configured correctly, while the kernel quietly runs it with the CALLING user\'s normal privileges instead — the setuid effect never happens at all.',
        'This produces a specific, disorienting debugging experience: a script that "needs" elevated privileges to do its job (write to a root-owned file, restart a privileged service) will fail partway through with a permission error, even though chmod u+s and ls -l both show setuid is set — because the visible permission bit and the actual runtime behavior have silently diverged.',
        'The documented, safe workaround for genuinely needing script-like logic to run setuid is to compile a small, minimal wrapper BINARY (in C or similar) that itself is setuid and simply invokes the actual script as a fixed, hardcoded, non-attacker-controllable path — the wrapper binary gets the real kernel-honored setuid behavior, while the script it calls never needs (and never gets) the bit itself.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Setting setuid on a script — the bit is visible, but ignored at runtime',
      language: 'bash',
      code: `# A script that needs to write to a root-owned log file:
cat > /usr/local/bin/logwrite.sh << 'EOF'
#!/bin/bash
echo "$(date): $1" >> /var/log/privileged.log
EOF
chmod +x /usr/local/bin/logwrite.sh

# Set setuid, following the EXACT pattern the main page's own
# "chmod u+s mybinary" example demonstrates:
sudo chown root:root /usr/local/bin/logwrite.sh
sudo chmod u+s /usr/local/bin/logwrite.sh

# The permission bit LOOKS correctly set:
ls -l /usr/local/bin/logwrite.sh
# -rwsr-xr-x 1 root root ... /usr/local/bin/logwrite.sh
#     ^ setuid bit visibly present, exactly like the main page's
#       own /usr/bin/passwd example

# Run it as a normal (non-root) user:
whoami
# alice
/usr/local/bin/logwrite.sh "test entry"
# bash: /var/log/privileged.log: Permission denied
#
# Per documented Linux kernel behavior: "many Unix-like systems, in
# particular Linux, simply ignore the setuid and setgid bits on
# scripts" -- the script actually ran as alice, NOT as root, despite
# every visible indicator (ls -l, chown root, chmod u+s all correct)
# suggesting it should have.`,
    },
    {
      label: 'The real reason, and the actual safe fix',
      language: 'bash',
      code: `# Why the kernel does this: a documented historical race condition.
# "Many kernels suffer from a race condition which can allow you to
# exchange the shellscript for another executable of your choice
# between the times that the newly exec()ed process goes setuid,
# and when the command interpreter gets started up." Ignoring
# setuid/setgid on ANY file starting with a #!shebang line closes
# this entire exploit class permanently, rather than patching the
# specific timing window.

# The documented, actually-working fix: compile a minimal SETUID
# WRAPPER BINARY that calls the script via a fixed, hardcoded path
# (not attacker-influenceable, e.g. via PATH or argv):

cat > wrapper.c << 'EOF'
#include <unistd.h>
int main(void) {
    // Fixed, hardcoded path -- not derived from argv/environment
    execl("/usr/local/bin/logwrite.sh", "logwrite.sh", NULL);
    return 1;
}
EOF
gcc -o /usr/local/bin/logwrite wrapper.c
sudo chown root:root /usr/local/bin/logwrite
sudo chmod u+s /usr/local/bin/logwrite

# The BINARY (not the script) carries the setuid bit -- the kernel
# DOES honor setuid on a real compiled executable, exactly as the
# main page's own passwd example describes. The script itself keeps
# running with only the privileges the wrapper's own execution
# environment grants it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer writes a Bash script meant to let regular users restart a specific system service, sets it up with sudo chown root:root fixservice.sh && sudo chmod u+s fixservice.sh — mirroring the main page\'s own chmod u+s mybinary example exactly. ls -l fixservice.sh confirms the setuid bit is present (-rwsr-xr-x). When a regular user runs it, the script still fails with a permission error trying to restart the service, exactly as if setuid were never applied at all. The developer double- and triple-checks the ownership and permission bits — everything matches the documented setuid pattern. What\'s actually going on?',
    hint: 'Check whether the file being made setuid is a compiled binary or a script starting with a #!shebang line, and whether the Linux kernel treats those two cases identically for setuid purposes.',
    solution: 'The permission bits are configured exactly right — the problem is that fixservice.sh is a SCRIPT, and the Linux kernel simply does not honor the setuid bit on scripts at all, regardless of how correctly chown and chmod were applied. This is documented, deliberate kernel behavior: "many Unix-like systems, in particular Linux, simply ignore the setuid and setgid bits on scripts," specifically to close a historical race-condition vulnerability where the file being executed could be swapped out between the kernel reading the shebang line and the interpreter reopening the script. ls -l showing -rwsr-xr-x is genuinely accurate — the bit IS set on the file — but that\'s a filesystem-level fact that the kernel ignores at execve() time for anything starting with #!. The main page\'s own chmod u+s mybinary example works because it\'s implicitly about a compiled binary (like /usr/bin/passwd) — the same command applied to a script looks identical but has zero runtime effect. The documented fix is compiling a small setuid WRAPPER binary that execs the script via a fixed, hardcoded path — the binary genuinely gets kernel-honored setuid behavior; the script it calls never needs the bit itself.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Setting setuid with chmod u+s (or the 4xxx octal prefix) works identically on a shell script and a compiled binary — both run with the file owner\'s privileges once the bit is set.',
      reality: 'Per this subtopic\'s theory, the Linux kernel deliberately ignores the setuid bit on any file starting with a #!shebang line — the bit can be set and will display correctly in ls -l, but has zero effect on a script\'s actual runtime privileges.'
    },
    {
      thought: 'If ls -l shows the setuid bit (the "s" in the owner execute position) on a file, that confirms setuid is actually in effect when the file runs.',
      reality: 'Per this subtopic\'s theory, ls -l reports a genuine filesystem-level fact about the permission bits, but for a script this can silently diverge from actual runtime behavior — the kernel ignores the bit at execution time regardless of what the listing shows.'
    },
    {
      thought: 'The security risk the main page describes for setuid executables — "a setuid root binary with a vulnerability... grants an attacker root-level code execution" — applies equally whether the setuid file is a compiled binary or a script.',
      reality: 'Per this subtopic\'s theory, this specific risk requires the setuid bit to actually take effect at runtime, which only happens for compiled binaries — a setuid script poses a DIFFERENT problem (silent, confusing failure to gain the intended privilege at all), not the same privilege-escalation risk the main page describes.'
    }
  ];
}
