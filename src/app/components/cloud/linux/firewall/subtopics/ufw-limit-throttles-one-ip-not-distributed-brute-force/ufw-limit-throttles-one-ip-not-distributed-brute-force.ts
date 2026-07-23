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
  templateUrl: './ufw-limit-throttles-one-ip-not-distributed-brute-force.html',
  styleUrl: './ufw-limit-throttles-one-ip-not-distributed-brute-force.scss'
})
export class UfwLimitThrottlesOneIpNotDistributedBruteForceSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page states the threshold as a fact, without explaining the mechanism or what it actually protects against',
      points: [
        'The main page\'s own quiz answer states plainly: "ufw limit... blocks IPs that attempt more than 6 connections in 30 seconds. Useful to slow brute-force SSH attacks." That is accurate as far as it goes, but "slow brute-force SSH attacks" is a much narrower claim than it sounds — nothing on the page explains WHICH brute-force pattern this actually stops, and which pattern it does nothing at all against.',
      ]
    },
    {
      heading: 'What ufw limit actually does under the hood: per-source-IP tracking',
      points: [
        'ufw limit is implemented by generating iptables rules that use the kernel\'s <code>recent</code> module with <code>--seconds 30 --hitcount 6</code> — it maintains a list of recent connection timestamps keyed by SOURCE IP ADDRESS, and blocks a specific source IP once it crosses 6 attempts within the trailing 30-second window.',
        'This threshold (6 connections / 30 seconds) is a fixed default baked into UFW\'s own command — UFW\'s own interface provides no option to customize those numbers. Reaching for a different threshold requires writing the underlying iptables <code>recent</code> rule (or the more flexible <code>hashlimit</code> module) directly, bypassing UFW\'s simplified syntax entirely.',
      ]
    },
    {
      heading: 'The gap: because tracking is per-source-IP, a distributed attack is completely unaffected',
      points: [
        'Because the counter is scoped to a single source IP, an attacker using ONE machine hammering SSH will hit the 6-in-30-seconds threshold quickly and get blocked — exactly the scenario the main page describes. But a distributed brute-force attack (a botnet, or any attack spread across many different source IPs, each individually staying under 6 attempts per 30 seconds) sails through completely unaffected, because no single IP ever crosses the per-IP threshold that ufw limit is watching.',
        'This is not a flaw in the configuration — it is the fundamental scope of what ufw limit was designed to do: slow down one noisy attacking machine, not defend against a coordinated, distributed campaign. Treating "ufw limit 22/tcp" as comprehensive SSH brute-force protection, rather than one layer of it, is the actual gap the main page leaves unaddressed.',
        'Real defense against distributed brute force needs a different tool entirely: <code>fail2ban</code> (which can aggregate and ban based on authentication LOG failures rather than raw connection counts, and can be tuned far more flexibly), and — the strongest single mitigation — disabling SSH password authentication entirely in favor of key-only auth, which removes the password-guessing attack surface regardless of how many source IPs are involved.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What ufw limit actually generates',
      language: 'bash',
      code: `# The main page's own command:
sudo ufw limit 22/tcp

# What this actually generates under the hood -- iptables rules
# using the "recent" module, tracked per SOURCE IP:
sudo iptables -L -n -v | grep -A2 "state NEW"
# ... recent: UPDATE seconds: 30 hit_count: 6 ...
# ...          tcp dpt:22 ... REJECT ...

# Confirm: UFW's own limit command has NO flag to change these
# numbers -- 6 connections / 30 seconds is fixed
ufw limit 22/tcp --help 2>&1 | grep -i seconds
# (no output -- there is no such option)

# Direct iptables equivalent, for comparison -- this IS
# customizable if you bypass UFW's simplified syntax:
sudo iptables -A INPUT -p tcp --dport 22 -m state --state NEW \\
  -m recent --set
sudo iptables -A INPUT -p tcp --dport 22 -m state --state NEW \\
  -m recent --update --seconds 60 --hitcount 3 -j DROP`,
    },
    {
      label: 'Why a distributed attack sails through unaffected',
      language: 'bash',
      code: `# Single-source attack -- ufw limit stops this quickly:
# Attacker at 198.51.100.7 tries SSH 10 times in 20 seconds
# -> after attempt #6, that IP is blocked for the remainder
#    of the 30-second window. Exactly what the main page
#    describes.

# Distributed attack -- ufw limit does NOT stop this:
# 50 different botnet IPs, each trying SSH just 3 times in
# 30 seconds (well under the per-IP threshold of 6)
# -> every single one of those 150 total attempts is
#    evaluated against ITS OWN source IP's counter, which
#    never crosses 6 -- ufw limit never triggers for any
#    of them, even though 150 password guesses were made.

# What actually stops this: log-based, cross-IP awareness
# (fail2ban watching auth.log, not raw connection counts)
sudo fail2ban-client status sshd
# Status for the jail: sshd
# |- Currently banned: <list spans MANY distinct source IPs,
# |                      each individually below any single
# |                      per-IP connection-rate threshold>

# The strongest single fix -- removes password guessing
# as an attack surface entirely, regardless of source IP:
# /etc/ssh/sshd_config
#   PasswordAuthentication no`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team enables `ufw limit 22/tcp` on a public-facing server, following the main page\'s own guidance that it "rate-limits SSH — block IPs with >6 connections in 30s." A month later, the auth.log still shows thousands of failed SSH login attempts from many different IP addresses. The team is confused: shouldn\'t ufw limit have blocked this? What is actually happening, and what would you recommend adding on top of ufw limit?',
    hint: 'Check exactly what value ufw limit\'s counter is scoped to — is it counting attempts globally across the whole server, or separately per individual source IP address?',
    solution: 'ufw limit is working exactly as designed — it just was never designed to stop this specific attack pattern. Its counter is scoped per SOURCE IP: it only blocks an individual IP once THAT IP crosses 6 connection attempts within 30 seconds. If the failed logins are coming from "many different IP addresses" (a distributed/botnet-style attack), each individual attacking IP can easily stay under that per-IP threshold — say, 3-4 attempts each before moving to the next IP — and ufw limit will never trigger for any single one of them, even though the server as a whole is absorbing thousands of guesses. The recommended fix is to add a tool that aggregates across IPs based on actual authentication outcomes rather than raw per-IP connection counts — fail2ban, watching sshd\'s own log for repeated failed logins and banning offending IPs regardless of how the traffic is distributed — combined with disabling SSH password authentication entirely (key-only auth), which removes password guessing as a viable attack in the first place, no matter how many source IPs are involved.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`ufw limit 22/tcp` is a comprehensive defense against SSH brute-force attacks.',
      reality: 'Per this subtopic\'s theory, it specifically throttles ONE source IP at a time (more than 6 connections in 30 seconds from that IP) — a distributed attack spread across many IPs, each individually staying under that threshold, is completely unaffected.'
    },
    {
      thought: 'The "6 connections in 30 seconds" threshold can be tuned through UFW\'s own commands if a different limit is needed.',
      reality: 'Per this subtopic\'s theory, UFW\'s own `limit` command has no option to change those numbers — they are a fixed default. Reaching a different threshold requires writing the underlying iptables `recent` (or `hashlimit`) rule directly, bypassing UFW\'s simplified interface.'
    },
    {
      thought: 'If ufw limit is enabled and auth.log still shows many failed login attempts, something is misconfigured.',
      reality: 'Per this subtopic\'s theory, this is expected behavior when the attempts come from many different source IPs rather than one — ufw limit is working correctly for its actual, narrower scope (one noisy IP), not failing at a broader job it was never designed to do.'
    }
  ];
}
