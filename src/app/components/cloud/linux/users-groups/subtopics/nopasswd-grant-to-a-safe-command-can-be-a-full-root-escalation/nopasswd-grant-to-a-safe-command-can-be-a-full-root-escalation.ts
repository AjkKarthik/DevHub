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
  templateUrl: './nopasswd-grant-to-a-safe-command-can-be-a-full-root-escalation.html',
  styleUrl: './nopasswd-grant-to-a-safe-command-can-be-a-full-root-escalation.scss'
})
export class NopasswdGrantToASafeCommandCanBeAFullRootEscalationSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own NOPASSWD examples pick commands that look narrowly scoped',
      points: [
        'The main page\'s own theory shows: "NOPASSWD: alice ALL=(ALL) NOPASSWD: /usr/bin/apt" and, in its code examples, "alice ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx." Both read as tightly scoped grants — apt for package management, a single systemctl invocation for one specific service — the kind of narrow, task-specific access the principle of least privilege (which the main page\'s own theory elsewhere explicitly endorses) is supposed to achieve.',
        'Nothing on the main page checks whether the GRANTED COMMAND ITSELF has any way to spawn an arbitrary shell or edit arbitrary files once it\'s already running with root privileges via sudo — a gap that turns a seemingly narrow grant into the functional equivalent of unrestricted root access.',
      ]
    },
    {
      heading: 'Confirmed: dozens of common commands have a documented "sudo" escape to a root shell',
      points: [
        'Per current Linux privilege-escalation research: "a rule like (ALL) NOPASSWD: /usr/bin/vim reads as harmless administrative convenience until you check GTFOBins for vim, which can escape to a root shell, because vim runs as root under the sudo rule and can spawn a child process." GTFOBins is a curated, public catalog of exactly which common Unix binaries have a documented shell-escape technique.',
        'This is not a rare or obscure list — per the same research, commonly affected commands include "iftop, find, nano, vim, man, awk, less, ftp, nmap, and apache2" — ordinary tools that show up in real sudoers files constantly for genuinely reasonable-sounding administrative tasks (editing a config with vim, checking a man page, filtering with awk).',
        'The mechanism is consistent across most of these: "if the allowed commands are interactive or support system shell execution, users can escape into a root shell, bypassing restrictions and escalating privileges" — for example, vim\'s own :! command-execution feature (meant for running a shell command without leaving the editor) still works exactly the same way when vim itself is running as root via sudo, so :!/bin/bash spawns a root shell from inside a "just let alice edit this one file" grant.',
      ]
    },
    {
      heading: 'The systemctl and apt examples on the main page, checked specifically',
      points: [
        'The main page\'s own systemctl restart nginx example is scoped to the EXACT full command string, not just the binary — sudoers command matching compares the entire command line given, so a grant limited to systemctl restart nginx specifically does not, on its own, let alice run systemctl edit nginx or any other systemctl subcommand. This particular example is a reasonably safe pattern precisely because it pins the full argument list, not just the executable.',
        'The apt example is structurally riskier: granting the bare /usr/bin/apt (any arguments) is a documented escalation path in its own right, independent of GTFOBins — apt supports running arbitrary post-install hook scripts and has its own documented sudo-context entry, meaning a NOPASSWD grant to the unrestricted apt binary is generally treated as equivalent to a full root grant, not a narrow package-management convenience.',
        'The general, actionable discipline this implies: before adding ANY command to sudoers — even ones that look boring or purely administrative — cross-reference it against GTFOBins\'s own sudo-context entries; per the same research, "a hit means the grant is functionally equivalent to giving the user root," regardless of how narrow the grant\'s stated intent was.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A plausible, narrow-looking sudoers grant — and its actual escape hatch',
      language: 'bash',
      code: `# A plausible entry an admin might add, believing it's narrowly
# scoped -- "just let alice edit config files as root":
# /etc/sudoers.d/alice-configs
alice ALL=(ALL) NOPASSWD: /usr/bin/vim /etc/myapp/config.yml

# Alice runs it exactly as intended:
sudo vim /etc/myapp/config.yml
# vim opens, running as root (via sudo), editing the intended file.

# But vim's own built-in shell-command feature (":!", meant for
# running an external command without leaving the editor) still
# works, and it inherits vim's OWN current privilege level -- root,
# because that's what sudo just granted vim itself:
#
#   Inside vim, alice types:  :!/bin/bash
#
# Per documented Linux privilege-escalation research: "vim running
# as root via sudo can be used to execute system commands" this way
# -- alice now has an interactive ROOT SHELL, not just edit access
# to one config file. The sudoers restriction to a single filename
# never mattered, because it only restricted what vim was TOLD to
# open, not what vim itself is capable of doing once running.`,
    },
    {
      label: 'Checking a grant against GTFOBins before it goes in sudoers',
      language: 'bash',
      code: `# Per documented guidance: "cross-reference every grant against
# GTFOBins... before any binary or script reaches the sudoers file"
# -- this applies to dozens of common tools, not just vim:
#
#   Commonly affected (per current research): iftop, find, nano,
#   vim, man, awk, less, ftp, nmap, apache2 -- and many more.

# The main page's own two NOPASSWD examples, checked specifically:

# 1. systemctl restart nginx -- SAFER, because sudoers matches the
#    FULL command string, not just the binary:
alice ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx
# alice CANNOT run "sudo systemctl edit nginx" or any other
# subcommand -- the grant is pinned to this exact argument list.

# 2. Bare /usr/bin/apt (any arguments) -- RISKIER on its own merits,
#    independent of GTFOBins -- apt supports arbitrary hook scripts:
alice ALL=(ALL) NOPASSWD: /usr/bin/apt
# Treat an unrestricted apt grant as equivalent to a full root
# grant, not a narrow package-management convenience.

# Documented mitigations for cases where the tool itself IS needed
# broadly: replace editor grants with sudoedit (edits a temp copy
# with the USER's own privileges, then copies it back as root --
# never actually runs the editor process itself as root), pin full
# command strings wherever the tool allows it, and enable I/O
# logging to audit what commands actually ran under any surviving
# broad grant.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team lead wants to let a junior engineer, alice, check application logs without giving her full sudo access, and adds alice ALL=(ALL) NOPASSWD: /usr/bin/less /var/log/myapp/app.log to sudoers, reasoning that less is a read-only pager and can\'t possibly let her modify anything or gain broader access. A security audit later flags this exact line as equivalent to giving alice unrestricted root. Is the audit right, and if so, how?',
    hint: 'Check whether "read-only" tools like pagers have their own documented way to spawn a shell or execute arbitrary commands from within their interactive interface, the same way an editor like vim does.',
    solution: 'The audit is correct, and "read-only" is not the same as "safe" here. less has its own well-documented shell-escape feature (typically the ! key inside the pager, which runs an arbitrary shell command) — and because sudo already elevated less itself to root before alice ever opened the file, that shell-escape inherits root privileges too, exactly the same mechanism documented for vim\'s :! command. less genuinely never modifies the log file it\'s displaying — the "read-only" framing is accurate for the pager\'s OWN direct function — but that has nothing to do with whether the pager can be used to launch an unrelated, fully-privileged root shell from inside its interactive session. The sudoers restriction to one specific log file (/var/log/myapp/app.log) never actually limits what happens once that shell escape fires, since the escaped shell isn\'t restricted to that file at all — it\'s a normal root shell with access to everything. The fix is checking every planned sudoers grant, regardless of how "read-only" or narrow it sounds, against GTFOBins\'s sudo-context entries before adding it, and for log-viewing specifically, considering a genuinely restricted alternative (e.g. a small wrapper script with no interactive shell-escape capability at all) instead of granting the general-purpose pager directly.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A sudoers NOPASSWD grant restricted to a specific file argument (like a single log file or config path) limits what that grant can actually do to just that one file.',
      reality: 'Per this subtopic\'s theory, the file-path restriction only controls what the granted PROGRAM is told to open — if that program has its own documented shell-escape feature (like vim\'s :! or less\'s !), the escaped shell inherits the program\'s own root privileges and is not restricted to the originally-specified file at all.'
    },
    {
      thought: 'Read-only tools like pagers (less, more) are inherently safe to grant via NOPASSWD, since they can\'t modify anything and only display content.',
      reality: 'Per this subtopic\'s theory, "read-only with respect to the file being viewed" and "safe to run as root" are unrelated properties — a pager\'s own interactive shell-escape feature can spawn a fully-privileged root shell with no connection to the file it was originally opened to display.'
    },
    {
      thought: 'The main page\'s own two NOPASSWD examples (systemctl restart nginx and apt) carry the same level of risk, since both are described the same way in its theory.',
      reality: 'Per this subtopic\'s theory, these two examples are meaningfully different — systemctl restart nginx is pinned to a full, exact command string that sudoers matches literally, while a bare apt grant (any arguments) is independently documented as a serious escalation path via its own hook-script capability, regardless of GTFOBins.'
    }
  ];
}
