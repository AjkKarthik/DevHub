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
  templateUrl: './traceroute-defaults-to-udp-which-firewalls-often-block.html',
  styleUrl: './traceroute-defaults-to-udp-which-firewalls-often-block.scss'
})
export class TracerouteDefaultsToUdpWhichFirewallsOftenBlockSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions -T and -I as options, without explaining what traceroute does by default or why those flags exist',
      points: [
        'The main page\'s own troubleshooting toolkit theory says only: "traceroute reveals the network path (and which specific hop, if any, is failing)." Its code tab lists <code>traceroute -T</code> for TCP and <code>-I</code> for ICMP as bare options with a one-line comment ("useful through firewalls", "icmp"), but never explains what protocol traceroute uses when you run it with NO flags at all, or why that default is the one most likely to get silently blocked.',
      ]
    },
    {
      heading: 'What plain traceroute actually sends, and how it reads the replies',
      points: [
        'Linux traceroute\'s default (no flags) probe is a UDP packet, not ICMP — sent to a deliberately unlikely destination port starting at 33434, incrementing by one for each subsequent probe. The destination port is chosen specifically because nothing should be listening there.',
        'Each intermediate router along the path decrements the packet\'s TTL to 0 and replies with an ICMP "Time Exceeded" message — that reply, arriving back from a router that never actually received the full packet, is how traceroute learns that hop\'s address and round-trip time. When the packet finally reaches the real destination, since nothing listens on port 33434+, the destination replies with ICMP "Port Unreachable" — a different ICMP type that traceroute recognizes as "you have arrived," ending the trace.',
        'This means a plain traceroute run genuinely depends on TWO different things surviving the network path unblocked: the original UDP probe reaching each hop, AND that hop\'s (or the destination\'s) ICMP reply making it all the way back to the sender.',
      ]
    },
    {
      heading: 'Why this specific default produces so many "* * *" rows in practice, and how the flags actually fix it',
      points: [
        'Firewalls and cloud security groups routinely drop unsolicited inbound UDP to high, unfamiliar ports and/or filter ICMP entirely as a blanket security policy — either behavior alone is enough to make a hop go completely silent, producing the classic <code>* * *</code> row. This is easy to misread as "the network is broken at this hop," when what actually happened is the hop forwards real application traffic completely normally, but drops or is never asked to respond to traceroute\'s specific probe/reply pattern.',
        '<code>-I</code> switches the probe itself to ICMP Echo Request (exactly what ping sends) instead of UDP — if plain <code>ping</code> already reaches the destination successfully, ICMP-mode traceroute is very likely to succeed too, since it reuses a protocol you already know gets through.',
        '<code>-T</code> switches to real TCP SYN probes, by default to port 80 — this is often the MOST effective option through strict firewalls specifically because it looks exactly like the ordinary web traffic those firewalls are actually configured to allow, and a SYN-ACK or RST response is a genuine Layer-4 answer rather than relying on an ICMP side-channel at all.',
        '<code>mtr</code>, mentioned briefly on the main page as an alternative, defaults to ICMP Echo probes rather than UDP — this is a different default protocol, not a "smarter" tool, which is part of why mtr sometimes succeeds against a path where plain traceroute shows asterisks, and can equally show its own asterisks where plain traceroute succeeds, depending on which protocol that specific firewall filters.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Default UDP probing and why the port numbers matter',
      language: 'bash',
      code: `# Plain traceroute -- no flags -- uses UDP by default
traceroute google.com
#  1  192.168.1.1        0.412 ms
#  2  10.20.0.1           4.203 ms
#  3  * * *                          <-- a hop that silently drops
#  4  * * *                              the UDP probe or its ICMP
#  5  142.250.80.14      12.918 ms       reply (but still forwards
#                                        real traffic fine)

# What's actually happening under the hood: each probe targets an
# increasing, deliberately-unused destination port, starting here
tcpdump -n udp portrange 33434-33444 -c 5
# 14:02:11 IP 10.0.0.5.52104 > 142.250.80.14.33434: UDP, length 32
# 14:02:11 IP 10.0.0.5.52105 > 142.250.80.14.33435: UDP, length 32
# 14:02:11 IP 10.0.0.5.52106 > 142.250.80.14.33436: UDP, length 32
# -- the destination port increments by one on every probe`,
    },
    {
      label: 'Switching probe protocol to get through a firewall',
      language: 'bash',
      code: `# -I: switch to ICMP Echo probes (same protocol as ping)
sudo traceroute -I google.com
# Works well here specifically because plain \`ping google.com\`
# already succeeds -- ICMP-mode traceroute reuses that same
# already-proven-open protocol.

# -T: switch to TCP SYN probes, default port 80
sudo traceroute -T google.com
# Often the MOST reliable option through strict corporate/cloud
# firewalls, since a SYN to port 80 looks like ordinary web
# traffic -- exactly what those firewalls are built to allow.

# -T with an explicit port (e.g. testing an HTTPS-only path)
sudo traceroute -T -p 443 google.com

# mtr's default probe is ICMP too (not UDP) -- a different default
# from plain traceroute, which is why results can differ:
mtr --report google.com`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Running plain `traceroute example.com` through your company\'s VPN shows real hop responses for the first three hops, then five rows of `* * *` in a row, all the way to the destination. Meanwhile `ping example.com` succeeds instantly with normal reply times, and the actual application (a web browser hitting the same host) loads pages just fine. What does the `* * *` pattern actually tell you here, and which traceroute flag would you try next, and why?',
    hint: 'Plain traceroute\'s probes are UDP by default. Think about what protocol ping uses instead, and what that tells you about which protocols this specific firewall is actually filtering.',
    solution: 'The `* * *` pattern does NOT mean those hops (or the path to the destination) are down or broken — the fact that both `ping` (ICMP) and the actual browser session (TCP, port 443) work completely normally proves the path is fully functional. What it actually shows is that this firewall is filtering the SPECIFIC combination plain traceroute depends on by default: unsolicited UDP probes to high, unfamiliar ports (33434+) and/or the ICMP replies needed to see them. Since `ping` already works, the next thing to try is `sudo traceroute -I example.com` — ICMP-mode probes reuse the exact protocol already proven to get through. An even more targeted option, given the browser traffic is HTTPS, is `sudo traceroute -T -p 443 example.com`, which sends real TCP SYN packets to port 443 — matching the actual traffic pattern already known to succeed. Either flag would very likely replace the asterisks with real hop data, confirming this was a probe-protocol mismatch with the firewall, not a genuine connectivity problem.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A row of `* * *` in traceroute output means that specific router or hop is down, broken, or the network path fails there.',
      reality: 'Per this subtopic\'s theory, it almost always means that hop (or a firewall along the path) is silently dropping traceroute\'s specific UDP probes or ICMP replies — while forwarding the real application traffic those probes are simulating completely normally. It is a probe-visibility gap, not a path failure.'
    },
    {
      thought: 'traceroute and mtr use the same underlying probe mechanism, so results between the two tools should always agree for the same path.',
      reality: 'Per this subtopic\'s theory, plain traceroute defaults to UDP probes while mtr defaults to ICMP Echo probes — genuinely different protocols. A firewall filtering one but not the other will produce different results between the two tools for the exact same network path.'
    },
    {
      thought: '-T (TCP mode) is a minor fallback option, roughly interchangeable with the plain UDP default.',
      reality: 'Per this subtopic\'s theory, -T sends real TCP SYN packets (default port 80) — traffic that closely resembles what firewalls are actually configured to allow — making it frequently the MOST reliable option through strict firewalls that block plain UDP/ICMP traceroute outright, not a rarely-needed fallback.'
    }
  ];
}
