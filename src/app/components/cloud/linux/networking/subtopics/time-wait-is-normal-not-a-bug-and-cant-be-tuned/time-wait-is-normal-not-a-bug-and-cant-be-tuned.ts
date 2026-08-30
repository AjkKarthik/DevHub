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
  templateUrl: './time-wait-is-normal-not-a-bug-and-cant-be-tuned.html',
  styleUrl: './time-wait-is-normal-not-a-bug-and-cant-be-tuned.scss'
})
export class TimeWaitIsNormalNotABugAndCantBeTunedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions TIME_WAIT in one line, without explaining what it is or why it exists',
      points: [
        'The main page\'s own DNS & Ports code tab includes a single line: "ss -o state time-wait # TIME_WAIT connections (indicates fast open/close)" — the only mention of TIME_WAIT anywhere on the page. Nothing explains WHY a closed connection lingers in this state, HOW LONG it lasts, or whether seeing a large number of them is something to worry about.',
        'That single-line description ("indicates fast open/close") is also imprecise — TIME_WAIT is not really a signal about connection SPEED at all. It is the mandatory final step of a clean TCP close, and every properly-closed connection produces one, regardless of whether the connection was open for 50 milliseconds or 50 minutes.',
      ]
    },
    {
      heading: 'What TIME_WAIT actually is, and why it is hardcoded, not tunable',
      points: [
        'TIME_WAIT is held by whichever side sends the FINAL ACK of the four-way TCP close handshake (the "active closer"). It exists so that side can retransmit that final ACK if it turns out the peer never received it and resent its own FIN — without TIME_WAIT, a lost final ACK could leave the peer stuck waiting forever.',
        'RFC 9293 specifies the TIME_WAIT duration as 2×MSL (Maximum Segment Lifetime). On Linux, this is not read from a config file or sysctl at all — it is a hardcoded kernel constant, <code>TCP_TIMEWAIT_LEN</code>, defined in <code>include/net/tcp.h</code> as exactly 60 seconds. There is no sysctl knob to shorten or lengthen it.',
        'This is easy to confuse with <code>net.ipv4.tcp_fin_timeout</code>, which IS a tunable sysctl — but it controls a completely different state (FIN_WAIT_2, how long to wait for the peer\'s FIN after this side has already sent its own). Adjusting tcp_fin_timeout has zero effect on how long TIME_WAIT sockets stick around.',
      ]
    },
    {
      heading: 'When a lot of TIME_WAIT sockets actually becomes a real problem',
      points: [
        'A high TIME_WAIT count on a busy server is completely normal and expected — it simply means connections are closing cleanly and often. It only becomes an operational problem when a machine opens a very large number of short-lived OUTBOUND connections to the SAME destination (IP, port) in a short window, since each closed connection\'s local (source IP, source port) pair stays reserved in TIME_WAIT for the full 60 seconds.',
        'If new outbound connections are opened faster than old ones exit TIME_WAIT, the pool of available ephemeral source ports (governed by <code>net.ipv4.ip_local_port_range</code>, typically around 28,000 ports) can be exhausted — new connection attempts then fail immediately with <code>EADDRNOTAVAIL</code> ("Cannot assign requested address"), even though nothing is actually wrong with the network.',
        'The correct fixes are NOT reducing TIME_WAIT\'s duration (which isn\'t tunable anyway): enable <code>net.ipv4.tcp_tw_reuse</code> (safe — allows a TIME_WAIT socket\'s port to be reused for a NEW outgoing connection once TCP timestamps confirm it is safe), widen <code>ip_local_port_range</code>, or — the real architectural fix — use connection pooling/keep-alive so far fewer short-lived connections are opened in the first place. The older <code>tcp_tw_recycle</code> sysctl is NOT a safe alternative: it was removed from the kernel entirely (as of 4.12) because it silently broke connections from multiple clients sharing one NAT\'d IP.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Diagnosing TIME_WAIT — and why tcp_fin_timeout is the wrong knob',
      language: 'bash',
      code: `# Count sockets currently sitting in TIME_WAIT
ss -tan state time-wait | wc -l

# Watch the trend over a few seconds
watch -n1 'ss -tan state time-wait | wc -l'

# The main page's own code tab already showed this filtered view:
ss -o state time-wait
# Every row here is a CLOSED connection whose active-closer side
# is holding state -- not a stuck/slow connection.

# Common mistake: trying to shorten TIME_WAIT with the wrong sysctl
sysctl net.ipv4.tcp_fin_timeout
# net.ipv4.tcp_fin_timeout = 60
# This looks related (same "60") but it governs FIN_WAIT_2, a
# DIFFERENT state entirely -- it has no effect on TIME_WAIT duration.

# TIME_WAIT's real duration is hardcoded in the kernel, not exposed
# as a sysctl at all -- there is nothing to read or set for it:
# include/net/tcp.h -> #define TCP_TIMEWAIT_LEN (60*HZ)`,
    },
    {
      label: 'When it is actually a problem, and the real fix',
      language: 'bash',
      code: `# Symptom of real ephemeral-port exhaustion from TIME_WAIT churn:
# a client hammering the same destination with short-lived
# connections starts seeing:
#   connect: Cannot assign requested address (EADDRNOTAVAIL)

# Check the available ephemeral port range
cat /proc/sys/net/ipv4/ip_local_port_range
# 32768 60999   -- about 28,000 ports available

# Safe fix #1: allow TIME_WAIT sockets to be reused for new
# OUTGOING connections once TCP timestamps confirm it's safe
sudo sysctl -w net.ipv4.tcp_tw_reuse=1

# Safe fix #2: widen the ephemeral port range
sudo sysctl -w net.ipv4.ip_local_port_range="1024 65535"

# NOT a safe fix -- tcp_tw_recycle was REMOVED from the kernel
# (4.12+) because it broke connections from clients behind NAT:
# sysctl -w net.ipv4.tcp_tw_recycle=1   # <-- does not exist anymore

# The actual architectural fix: stop opening so many short-lived
# connections in the first place -- reuse connections instead:
curl --keepalive-time 60 https://api.example.com/one
curl --keepalive-time 60 https://api.example.com/two   # same TCP conn`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A monitoring script on a busy API server reports "4,200 sockets in TIME_WAIT" and pages an on-call engineer with the alert "possible connection leak." Following the main page\'s own hint that TIME_WAIT "indicates fast open/close," the engineer initially assumes something is wrong. What would you check before treating this as an incident, and under what specific condition would 4,200 TIME_WAIT sockets actually indicate a real problem rather than normal server behavior?',
    hint: 'A high raw count of TIME_WAIT sockets by itself is not meaningful — think about what resource TIME_WAIT sockets actually consume (a local port reserved for 60 seconds) and under what usage pattern that resource could run out.',
    solution: 'A raw TIME_WAIT count alone is not evidence of a problem — every cleanly-closed TCP connection produces one, so a busy server handling thousands of short requests per minute will always show a large, steady TIME_WAIT count as completely normal background behavior. Before treating it as an incident, the engineer should check whether it is actually causing failures: is <code>ip_local_port_range</code> anywhere close to being exhausted, and are new connection attempts actually failing with <code>EADDRNOTAVAIL</code> ("Cannot assign requested address")? If connections are succeeding normally and the count is just a steady baseline proportional to request volume, there is no incident — it is simply what a healthy, busy server\'s connection churn looks like. It would only become a real problem if the server (or a client on it) is opening a very large number of short-lived OUTBOUND connections to the same destination faster than the 60-second TIME_WAIT window clears them, exhausting the roughly 28,000 available ephemeral source ports and causing genuine connection failures — at which point the fix is <code>tcp_tw_reuse</code>, a wider port range, or connection pooling, never trying to shorten TIME_WAIT itself (which has no sysctl to begin with).'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A large number of sockets in TIME_WAIT means connections are leaking or something is broken.',
      reality: 'Per this subtopic\'s theory, TIME_WAIT is the normal, expected final step of every clean TCP close — the side that sends the last ACK holds it briefly in case that ACK was lost. A busy server handling lots of short connections will always show many TIME_WAIT sockets; that alone is not evidence of a leak.'
    },
    {
      thought: 'Lowering net.ipv4.tcp_fin_timeout will reduce how long sockets sit in TIME_WAIT.',
      reality: 'Per this subtopic\'s theory, tcp_fin_timeout controls the FIN_WAIT_2 timeout, a different state entirely. TIME_WAIT\'s duration is hardcoded in the Linux kernel as <code>TCP_TIMEWAIT_LEN</code> (60 seconds) with no sysctl to change it at all.'
    },
    {
      thought: 'Enabling tcp_tw_recycle is a safe way to fix TIME_WAIT-related port exhaustion.',
      reality: 'Per this subtopic\'s theory, tcp_tw_recycle was removed from the Linux kernel (4.12+) because it silently broke connections from multiple clients sharing one NAT\'d IP address. The safe alternative for outgoing connections is tcp_tw_reuse, combined with a wider ephemeral port range or connection pooling.'
    }
  ];
}
