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
  templateUrl: './controlmaster-multiplexing-hits-the-maxsessions-limit.html',
  styleUrl: './controlmaster-multiplexing-hits-the-maxsessions-limit.scss'
})
export class ControlmasterMultiplexingHitsTheMaxsessionsLimitSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes multiplexing as a pure speed win, with no mention of a ceiling',
      points: [
        'The main page\'s own Config File code tab presents <code>ControlMaster auto</code> / <code>ControlPath</code> / <code>ControlPersist 10m</code> with the single comment "subsequent ssh to the same host reuses the socket (very fast)." Nothing on the page mentions that reusing one TCP connection for many sessions has a hard, server-enforced limit, or what happens once that limit is hit.',
      ]
    },
    {
      heading: 'What multiplexing actually does, and the server-side limit it runs into',
      points: [
        'With ControlMaster active, the FIRST connection to a host opens a real TCP connection and completes the full SSH handshake — every SUBSequent <code>ssh</code>, <code>scp</code>, <code>rsync</code>, or <code>git</code>-over-SSH command to that same host, instead of repeating the handshake, opens a new logical CHANNEL over that one already-established TCP connection. This is exactly why it is fast — no repeated TCP/crypto negotiation per command.',
        'The remote sshd caps how many of these channels a single TCP connection may carry, via <code>MaxSessions</code> in <code>/etc/ssh/sshd_config</code> — the OpenSSH default is 10. This limit exists per underlying multiplexed connection, not per user or per client machine overall.',
        'Running many of the main page\'s own commands (scp, rsync, git operations) IN PARALLEL against the same host, while ControlMaster is active, funnels every one of them through that same single connection\'s channel budget — once more than 10 are open simultaneously, the 11th and beyond fail immediately rather than simply queuing, typically with an error resembling "channel N: open failed: administratively prohibited: open failed."',
      ]
    },
    {
      heading: 'A second, subtler gotcha: an already-open master connection keeps using the OLD MaxSessions value even after the server config changes',
      points: [
        'Because <code>ControlPersist 10m</code> (from the main page\'s own example) keeps the underlying master connection alive in the background for 10 minutes after your last interactive session ends, that connection is a long-lived process running against whatever <code>MaxSessions</code> value was in effect WHEN IT WAS CREATED. If an administrator later edits sshd_config to raise MaxSessions and reloads sshd, that change has no effect on connections that were already established before the reload — only brand-new connections pick up the new limit.',
        'The fix for both symptoms is the same: force a fresh master connection by deleting the stale control socket file (the exact path configured by <code>ControlPath</code> in the main page\'s own example, e.g. <code>/tmp/ssh-%r@%h:%p</code> with the real host/user/port substituted in) — the next SSH command to that host then establishes a brand-new master connection, picking up the server\'s current MaxSessions value and resetting the channel count back to zero.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the MaxSessions ceiling with parallel operations',
      language: 'bash',
      code: `# Using the main page's own multiplexing config:
#   ControlMaster auto
#   ControlPath /tmp/ssh-%r@%h:%p
#   ControlPersist 10m

# First connection establishes the real TCP + handshake (the master):
ssh alice@deploy-host echo "master connection established"

# Now fire off 15 PARALLEL scp/rsync jobs to the SAME host --
# each one, per the main page's own claim, should reuse the
# existing socket for speed:
for i in $(seq 1 15); do
  scp "file\${i}.tar.gz" alice@deploy-host:/tmp/ &
done
wait

# Sessions 1-10 (the server's default MaxSessions) succeed fine.
# Sessions 11-15 fail immediately, NOT with a timeout:
# channel 3: open failed: administratively prohibited: open failed
# -- this is the exact symptom of hitting the per-connection
#    channel ceiling, not a network or auth problem.

# Confirm the server's actual configured limit:
ssh alice@deploy-host "sudo sshd -T | grep -i maxsessions"
# maxsessions 10`,
    },
    {
      label: 'Recovering when the limit was raised but an old master connection is still active',
      language: 'bash',
      code: `# Administrator raises the limit on the server:
# /etc/ssh/sshd_config:
#   MaxSessions 20
sudo systemctl reload sshd

# ...but the CLIENT's already-running master connection (kept
# alive by ControlPersist 10m) was created BEFORE this reload,
# and keeps enforcing the OLD limit of 10 -- reloading sshd does
# not affect already-established connections at all.

# Confirm a master connection is still active for this host:
ssh -O check alice@deploy-host
# Master running (pid=48213)

# Fix: force a fresh master connection by removing the stale
# control socket (the ControlPath from the main page's own
# example, with %r/%h/%p substituted for the real values):
rm -f /tmp/ssh-alice@deploy-host:22

# Or, more directly, ask the existing master to exit cleanly:
ssh -O exit alice@deploy-host

# The NEXT ssh/scp/rsync command to this host now establishes a
# brand-new master connection, which picks up the server's
# CURRENT MaxSessions value (20) from this point forward.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI pipeline uses the main page\'s own recommended `ControlMaster auto` / `ControlPersist 10m` config to speed up deployments, then runs 12 `scp` commands in parallel to push build artifacts to the same deploy host. Most succeed, but a few fail immediately with `channel N: open failed: administratively prohibited: open failed` — not a timeout, not an auth error. What is the actual cause, and what would you check on the server to confirm it before assuming the pipeline itself is broken?',
    hint: 'Think about what "reusing the same socket for speed" actually means for 12 commands running at the exact same time — are they all sharing one underlying connection, and does that connection have a limit on how many things it can carry simultaneously?',
    solution: 'The cause is the server\'s `MaxSessions` limit on the SSH daemon, which caps how many multiplexed channels a single underlying TCP connection may carry — the OpenSSH default is 10. With `ControlMaster auto` active, all 12 parallel scp commands to the same host share that ONE already-established master connection instead of opening 12 separate ones, so only the first 10 (the default ceiling) succeed as channels on that connection — the 11th and 12th are rejected immediately by the server with exactly this "administratively prohibited" error, since the connection has no more channel capacity to grant. To confirm before assuming the pipeline itself is broken, check the deploy host\'s effective server-side setting directly with `sshd -T | grep -i maxsessions` (or read `/etc/ssh/sshd_config`) — a value of 10 (or lower than the number of parallel operations attempted) confirms this exact cause. The fix is either raising MaxSessions on the server (with a fresh master connection afterward, since already-running ones keep the old limit) or reducing the pipeline\'s parallelism to stay under the ceiling.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ControlMaster/ControlPersist multiplexing is purely a speed optimization with no capacity limit — any number of parallel commands to the same host will simply all benefit from the reused connection.',
      reality: 'Per this subtopic\'s theory, the remote sshd enforces a hard cap (MaxSessions, default 10) on how many multiplexed channels ONE underlying connection may carry — enough parallel commands to the same host will start failing outright once that ceiling is hit, rather than simply running a bit slower.'
    },
    {
      thought: 'A "channel open failed: administratively prohibited" error while using SSH multiplexing indicates a permissions or authentication problem.',
      reality: 'Per this subtopic\'s theory, this specific error is the signature of exceeding the server\'s MaxSessions channel limit on an already-established multiplexed connection — it has nothing to do with user permissions or authentication, which already succeeded for the underlying master connection.'
    },
    {
      thought: 'Raising MaxSessions on the server and reloading sshd immediately fixes multiplexing capacity for all active SSH sessions.',
      reality: 'Per this subtopic\'s theory, an already-established master connection (kept alive by ControlPersist) continues enforcing whatever MaxSessions value was in effect when IT was created — reloading sshd has no retroactive effect on it. A fresh master connection (forced by removing the stale control socket, or ssh -O exit) is required to pick up the new value.'
    }
  ];
}
