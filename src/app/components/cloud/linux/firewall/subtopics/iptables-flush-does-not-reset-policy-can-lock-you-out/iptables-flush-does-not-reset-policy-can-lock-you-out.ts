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
  templateUrl: './iptables-flush-does-not-reset-policy-can-lock-you-out.html',
  styleUrl: './iptables-flush-does-not-reset-policy-can-lock-you-out.scss'
})
export class IptablesFlushDoesNotResetPolicyCanLockYouOutSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page calls -F "dangerous" without explaining the specific mechanism that makes it dangerous',
      points: [
        'The main page\'s own code tab shows <code>sudo iptables -F</code> with only the comment "WARNING: removes all rules." Its QnA repeats this with a bare exclamation point: "iptables -F flushes all rules (removes ALL rules — dangerous on remote servers!)." Neither explanation says WHY it is specifically dangerous, or what the actual failure mode looks like when it goes wrong.',
      ]
    },
    {
      heading: 'The precise mechanism: -F removes rules, but never touches the chain\'s own default policy',
      points: [
        '<code>iptables -F</code> (flush) deletes every individual RULE inside the selected chain(s). It does not, under any circumstance, change that chain\'s own default POLICY — the action (ACCEPT or DROP) applied to any packet that doesn\'t match a remaining rule. Policy and rules are two entirely separate pieces of state, and -F only ever touches the second one.',
        'This matters enormously in combination with the main page\'s OWN earlier example: "-P INPUT DROP sets default drop." If a server\'s INPUT chain policy has already been set to DROP (a common, reasonable hardening baseline — the main page\'s own Common Mistakes section recommends exactly this pattern), running iptables -F to "reset everything" does not restore the previous open state at all — it removes the specific ACCEPT rules (including the ESTABLISHED/RELATED rule and the port-22 SSH rule) that were letting your current session through, while the DROP policy underneath keeps applying to everything, including your own SSH connection\'s return traffic.',
      ]
    },
    {
      heading: 'The concrete failure: this can sever your own SSH session instantly, with no way back in except console access',
      points: [
        'The result is one of the most common real-world "locked myself out of my own remote server" incidents: an administrator runs <code>iptables -F</code> intending a clean reset before rebuilding the ruleset, the flush executes successfully, and the very next packet on the existing SSH connection — including packets belonging to the session the administrator is typing the NEXT command into — gets silently dropped by the still-active DROP policy. The connection dies mid-session, and there is no rule left to allow a new one back in either.',
        'Recovering from this specific mistake generally requires out-of-band access — a cloud provider\'s serial/VNC console, or physical access — since the very mechanism that would let you SSH back in and fix it is the thing that just got cut off.',
        'The documented safe sequence reverses the order entirely: explicitly set every chain\'s policy to ACCEPT FIRST (<code>iptables -P INPUT ACCEPT</code>, <code>-P OUTPUT ACCEPT</code>, <code>-P FORWARD ACCEPT</code>), and only THEN run -F. With policies already open, a flush genuinely does return the system to a permissive, "allow everything" starting point — which is what most administrators actually intend when they reach for -F in the first place.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the lockout mechanism',
      language: 'bash',
      code: `# Starting state: a reasonably hardened server, matching the
# main page's own recommended pattern
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -i lo -j ACCEPT
sudo iptables -P INPUT DROP          # <-- default policy is now DROP

# Confirm the policy is DROP, not just "no matching rule = allow"
sudo iptables -L INPUT -n | head -1
# Chain INPUT (policy DROP)

# Now the mistake: flushing "to reset everything" over this same
# SSH session
sudo iptables -F
# This succeeds with NO error message.

# What actually happened:
sudo iptables -L INPUT -n | head -1
# Chain INPUT (policy DROP)     <-- STILL DROP -- -F never touched it
# (no rules listed below it at all -- they were all removed)

# The NEXT packet on this exact SSH session has nowhere to go --
# there is no ACCEPT rule left, and the policy is DROP.
# The session disconnects here. A new SSH attempt gets nothing
# but a timeout -- there is no rule to allow it in either.`,
    },
    {
      label: 'The safe sequence: open the policy BEFORE flushing',
      language: 'bash',
      code: `# Correct order: set every policy to ACCEPT first...
sudo iptables -P INPUT ACCEPT
sudo iptables -P OUTPUT ACCEPT
sudo iptables -P FORWARD ACCEPT

# ...THEN flush. With policies already permissive, a flush now
# genuinely restores an open, allow-everything baseline -- the
# behavior most people actually expect from "reset the firewall":
sudo iptables -F
sudo iptables -X            # also remove any custom (non-default) chains

# Verify -- INPUT now shows policy ACCEPT with zero rules, meaning
# nothing is blocked (a fully open state, ready to rebuild from):
sudo iptables -L INPUT -n
# Chain INPUT (policy ACCEPT)
# target  prot opt source  destination
# (empty -- no rules, but the policy itself now lets everything through)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A server has `iptables -P INPUT DROP` set as its default policy, with explicit ACCEPT rules for ESTABLISHED/RELATED traffic and port 22 (SSH) — exactly the hardened pattern the main page itself recommends. An administrator, connected over SSH, runs `sudo iptables -F` intending to clear the ruleset before rebuilding it from a new script. What happens to their SSH session, and what single command, if run BEFORE the flush, would have prevented the problem?',
    hint: 'Check what -F actually removes — does it only remove individual rules, or does it also reset the chain\'s own default policy back to something permissive?',
    solution: 'The SSH session disconnects, likely mid-command, and the administrator cannot reconnect afterward. `iptables -F` removes every individual rule from the INPUT chain — including the ESTABLISHED/RELATED rule and the port-22 ACCEPT rule that were allowing the SSH session through — but it does NOT touch the chain\'s own default POLICY, which remains DROP. With no rules left and the policy still DROP, every subsequent packet (including the SSH session\'s own return traffic) is silently dropped, and there is no rule left to allow a fresh connection back in either — recovery requires out-of-band console access. The single command that would have prevented this, run BEFORE the flush, is `sudo iptables -P INPUT ACCEPT` (ideally alongside `-P OUTPUT ACCEPT` and `-P FORWARD ACCEPT` for the other chains) — setting the policy to permissive FIRST means that once -F removes the rules, the chain falls back to ACCEPT rather than DROP, and the SSH session survives the flush uninterrupted.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`iptables -F` resets the firewall completely back to a default, open state.',
      reality: 'Per this subtopic\'s theory, -F only removes individual RULES — it never changes the chain\'s own default POLICY. If the policy was already DROP, flushing leaves that DROP policy fully in effect with no rules left to override it.'
    },
    {
      thought: 'If iptables -F is dangerous, it must be because it can accidentally leave the server WIDE OPEN to attackers.',
      reality: 'Per this subtopic\'s theory, the far more common real-world danger is the opposite: on a server whose policy is already DROP, flushing removes the very ACCEPT rules an administrator\'s own SSH session depends on, instantly locking them OUT rather than opening anything up.'
    },
    {
      thought: 'Running iptables -F and then rebuilding rules from a script is a safe, standard "start fresh" workflow regardless of order.',
      reality: 'Per this subtopic\'s theory, the order matters critically — flushing while the policy is still DROP can sever the very connection being used to run the rebuild script. The safe sequence sets every policy to ACCEPT first, flushes second, then rebuilds.'
    }
  ];
}
