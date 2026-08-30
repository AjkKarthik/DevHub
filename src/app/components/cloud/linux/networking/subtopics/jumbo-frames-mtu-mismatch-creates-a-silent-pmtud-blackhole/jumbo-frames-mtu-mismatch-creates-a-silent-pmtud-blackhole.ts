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
  templateUrl: './jumbo-frames-mtu-mismatch-creates-a-silent-pmtud-blackhole.html',
  styleUrl: './jumbo-frames-mtu-mismatch-creates-a-silent-pmtud-blackhole.scss'
})
export class JumboFramesMtuMismatchCreatesASilentPmtudBlackholeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions raising MTU for jumbo frames in one line, with no warning about what can go wrong',
      points: [
        'The main page\'s own Network Interface Management theory states only: "ip link set eth0 mtu 9000 sets jumbo frames" — presented as a simple, self-contained configuration step. Nothing on the page explains that this command always succeeds locally regardless of whether anything else on the path actually supports the new size, or what happens if it doesn\'t.',
      ]
    },
    {
      heading: 'What Path MTU Discovery is, and the specific ICMP message it depends on',
      points: [
        'Path MTU Discovery (PMTUD) is how a TCP sender automatically finds the largest packet size the entire path to a destination can carry without fragmentation, without needing a fragmentation round-trip on every single connection. It works by marking outgoing IP packets "Don\'t Fragment" (DF).',
        'If a DF-marked packet is too large for some link along the path, that router is supposed to drop it and send back a specific ICMP message — Type 3 ("Destination Unreachable"), Code 4 ("Fragmentation Needed") — which includes the actual next-hop MTU. The sender uses that number to shrink its packet size and retry, and PMTUD converges on the real usable MTU for that path.',
        'This entire mechanism depends on that one specific ICMP message successfully making the full round trip back to the original sender. Nothing else in the protocol notifies the sender that its packets are too large.',
      ]
    },
    {
      heading: 'The blackhole: why raising MTU (or any ICMP-filtering firewall) can cause silent, hard-to-diagnose hangs',
      points: [
        'Many firewalls and security policies broadly filter "unnecessary" ICMP as a blanket rule, without distinguishing the specific Fragmentation-Needed message PMTUD actually relies on. When that message is blocked anywhere along the path, PMTUD goes completely blind — oversized DF-marked packets are simply dropped with NO error returned to the sender at all.',
        'This produces a very specific and confusing symptom pattern: small transfers (an SSH login, a short curl request, a DNS query) work perfectly, because small packets genuinely fit under the real (but undiscovered) path MTU — while larger transfers (a big SCP copy, a page with large image responses, a big API payload) simply hang or stall, because the oversized packets vanish silently and the sender never learns to shrink them.',
        'The main page\'s own <code>ip link set eth0 mtu 9000</code> example is a direct, self-inflicted version of this risk: the command changes ONLY the local interface. It does not verify that the switch it connects to, the peer NIC on the other end of that link, or any router further down the path, is also configured for 9000-byte frames — a mismatch anywhere in that chain creates exactly the same silent blackhole for large packets on that segment, with no configuration-time error to warn you.',
      ]
    },
    {
      heading: 'Diagnosing a suspected PMTUD blackhole without depending on the (possibly blocked) ICMP feedback loop',
      points: [
        '<code>ping -M do -s SIZE host</code> sends a single DF-marked ICMP echo of an exact payload size, letting you binary-search for the real working MTU directly rather than waiting on a TCP connection to eventually stall. A reply of "Frag needed and DF set, mtu = N" confirms PMTUD\'s ICMP message IS getting through and tells you exactly what MTU to expect; total silence (no reply, no error, just a timeout) at a size that should trigger that response is the actual signature of a blackhole.',
        'Remember the ICMP header itself adds overhead: a 1500-byte Ethernet MTU allows a 1472-byte ICMP payload (1500 minus 20 bytes IP header minus 8 bytes ICMP header) before fragmentation would be needed — so <code>ping -M do -s 1472</code> is the correct boundary test for a standard 1500 link, and <code>-s 8972</code> is the equivalent boundary for a 9000-byte jumbo-frame link.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Where the risk comes from — the main page\'s own MTU command',
      language: 'bash',
      code: `# The main page's own example -- looks like a simple, safe change:
sudo ip link set eth0 mtu 9000

# This command succeeds locally no matter what -- it never checks:
#   - whether the switch port eth0 connects to allows 9000-byte
#     frames (many switches default to 1500 or 1518 unless jumbo
#     frames are explicitly enabled on that port)
#   - whether the device on the OTHER end of the link is also set
#     to 9000
#   - whether any router further along the path supports it

# Confirm the LOCAL setting took effect (this alone proves nothing
# about the rest of the path):
ip link show eth0 | grep mtu
# eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9000 ...`,
    },
    {
      label: 'Diagnosing a PMTUD blackhole directly with ping -M do',
      language: 'bash',
      code: `# Symptom: SSH and small curls work fine, but a large SCP transfer
# to the same host just hangs indefinitely with no error.

# Test the standard 1500-MTU boundary directly (1500 - 20 IP header
# - 8 ICMP header = 1472 max payload before fragmentation)
ping -M do -s 1472 -c 2 destination-host
# 2 packets transmitted, 2 received  -- 1500 MTU path is fine

# Now test the jumbo-frame boundary (9000 - 28 = 8972)
ping -M do -s 8972 -c 2 destination-host
# PING destination-host: 8972 data bytes
#   (nothing comes back at all -- no reply, no ICMP error, just
#    a silent timeout)
#
# Compare against a WORKING PMTUD path, which would instead show:
#   From 10.0.0.1 icmp_seq=1 Frag needed and DF set (mtu = 1500)
# -- that explicit error means PMTUD is working correctly and
#    would have let TCP shrink its own packets automatically.
# Silence instead of that message is the actual blackhole signature.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'After enabling jumbo frames (`ip link set eth0 mtu 9000`) on a database server to speed up backups, engineers notice SSH sessions and small health-check API calls to the server work perfectly — but the nightly backup job, which transfers large files, now hangs indefinitely partway through with no error message in any log. What is the most likely cause, and what single command would you run first to confirm it, without waiting for the backup job to fail again?',
    hint: 'Think about what is different between a small SSH/health-check packet and a large backup-transfer packet, and what specific ICMP message controls whether TCP can automatically discover it needs to shrink its packet size.',
    solution: 'The most likely cause is a Path MTU Discovery blackhole introduced by the jumbo-frame change: raising the interface to MTU 9000 only changes that one local interface, and if the switch, the peer NIC, or a router further along the backup destination\'s path is still at the standard 1500 MTU (or if a firewall on the path blocks the ICMP "Fragmentation Needed" message PMTUD depends on), large DF-marked packets are silently dropped with no error at all — while small packets (SSH, health checks) stay well under even the 1500-byte boundary and sail through completely normally. This exactly matches the symptom: small traffic fine, large traffic silently hangs. The fastest way to confirm it without waiting for the backup job is <code>ping -M do -s 8972 destination-host</code> (the jumbo-frame boundary, 9000 minus 28 bytes of IP+ICMP header) — if that hangs with no reply and no "Frag needed" ICMP error at all, it confirms a genuine PMTUD blackhole for large packets on this path, distinct from a working PMTUD path (which would instead return an explicit "Frag needed and DF set, mtu = 1500" message that TCP could act on automatically).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Running `ip link set eth0 mtu 9000` is safe as long as the command itself doesn\'t return an error.',
      reality: 'Per this subtopic\'s theory, the command always succeeds locally regardless of whether the connected switch, the peer NIC, or any router further along the path actually supports 9000-byte frames — a mismatch produces no configuration-time error, only a silent blackhole for oversized packets discovered later.'
    },
    {
      thought: 'If a connection hangs or times out, the network path must be down or unreachable — the same as if ping failed.',
      reality: 'Per this subtopic\'s theory, a PMTUD blackhole is specifically a case where small ICMP pings succeed completely normally while larger TCP payloads silently vanish — the path is fully reachable, just not for packets above the real (undiscovered) MTU.'
    },
    {
      thought: 'Path MTU Discovery works automatically and doesn\'t depend on anything being explicitly allowed through firewalls along the path.',
      reality: 'Per this subtopic\'s theory, PMTUD entirely depends on the ICMP "Fragmentation Needed" (Type 3, Code 4) message successfully reaching the sender — if any firewall blocks that specific ICMP type, which is common under blanket "block all ICMP" policies, PMTUD is blind and the blackhole occurs.'
    }
  ];
}
