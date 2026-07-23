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
  templateUrl: './ssh-r-binds-to-remote-loopback-only-without-gatewayports.html',
  styleUrl: './ssh-r-binds-to-remote-loopback-only-without-gatewayports.scss'
})
export class SshRBindsToRemoteLoopbackOnlyWithoutGatewayportsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page explains the direction of -R correctly, but never mentions which interface it binds to',
      points: [
        'The main page\'s own quiz answer for -R is thorough about DIRECTION: "the remote-host listens on its own port 9000, and connections TO that remote port are tunnelled back... to localhost:3000." What it never addresses is WHO on the remote side can actually reach that listening port — is it every machine on the remote network, or only the remote host itself?',
      ]
    },
    {
      heading: 'The default: remote forwards bind to the remote host\'s OWN loopback interface only',
      points: [
        'By default, an SSH remote forward (<code>-R</code>) binds the forwarded port to 127.0.0.1 on the REMOTE host — meaning only processes running ON that remote machine itself can connect to it. A colleague on the same office or cloud network, trying to reach that port from a DIFFERENT machine, gets connection refused, even though the port genuinely is open and listening on the remote host.',
        'This produces a specific, confusing symptom that matches the main page\'s own -R example almost exactly: run <code>ssh -R 9000:localhost:3000 alice@remote-host</code>, and <code>curl localhost:9000</code> works perfectly when run FROM a shell on remote-host itself — but the exact same request from any other machine on that network fails outright, even with no firewall involved at all.',
      ]
    },
    {
      heading: 'Exposing it beyond loopback: the GatewayPorts directive',
      points: [
        'The remote sshd\'s <code>GatewayPorts</code> directive (in <code>/etc/ssh/sshd_config</code>, alongside the main page\'s own hardening settings like PermitRootLogin) controls this. <code>GatewayPorts yes</code> forces every remote forward on that server to bind to the wildcard address (0.0.0.0) instead of loopback, making it reachable from anywhere that can route to the remote host\'s IP.',
        '<code>GatewayPorts clientspecified</code> is the more targeted middle ground — it lets the CLIENT choose the bind address per connection, rather than opening every future -R forward to the world by server-wide default: <code>ssh -R 0.0.0.0:9000:localhost:3000 alice@remote-host</code> explicitly requests the wildcard bind for just that one tunnel, while a plain <code>-R 9000:...</code> on the same server still defaults to loopback-only.',
        'The security tradeoff is real and matters: because -R defaults to loopback-only specifically to avoid accidentally exposing a locally-forwarded service to an entire network, enabling GatewayPorts (either mode) should be a deliberate choice on a per-server basis, not a blanket default — the main page\'s own hardening theory (default-deny, minimal exposure) applies here just as much as it does to inbound firewall rules.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the "works locally, unreachable from the network" symptom',
      language: 'bash',
      code: `# From your laptop, using the main page's own -R example:
ssh -R 9000:localhost:3000 alice@remote-host.example.com

# On remote-host ITSELF (e.g. in a second SSH session, or the
# same one), this works exactly as expected:
curl localhost:9000
# <-- reaches your laptop's port 3000 through the tunnel, fine

# But from ANY OTHER machine on the same network as remote-host:
curl remote-host.example.com:9000
# curl: (7) Failed to connect to remote-host.example.com port 9000:
#        Connection refused
# -- NOT a firewall issue -- the port is only bound to 127.0.0.1
#    on remote-host, so it was never reachable from outside that
#    single machine in the first place.

# Confirm the actual bind address on remote-host:
ss -tlnp | grep 9000
# LISTEN  0  128  127.0.0.1:9000  0.0.0.0:*   users:(("sshd",...))
# -- 127.0.0.1, not 0.0.0.0 -- this is the loopback-only default.`,
    },
    {
      label: 'Exposing the forward beyond loopback with GatewayPorts',
      language: 'bash',
      code: `# Option 1: server-wide -- every future -R forward on this host
# binds to the wildcard address by default (broadest exposure,
# apply deliberately, matching the main page's own default-deny
# hardening principle)
# /etc/ssh/sshd_config:
#   GatewayPorts yes
sudo systemctl reload ssh

# Option 2: client-specified -- server allows the CLIENT to
# choose the bind address per connection, so only tunnels that
# explicitly ask for it get exposed
# /etc/ssh/sshd_config:
#   GatewayPorts clientspecified
sudo systemctl reload ssh

# ...then, from the client, explicitly request the wildcard bind
# for just this one tunnel:
ssh -R 0.0.0.0:9000:localhost:3000 alice@remote-host.example.com

# Confirm the bind address changed:
ss -tlnp | grep 9000
# LISTEN  0  128  0.0.0.0:9000  0.0.0.0:*   users:(("sshd",...))
# -- now reachable from other machines on the network too.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own quiz example, a developer runs `ssh -R 9000:localhost:3000 alice@remote-host` to demo a local dev server to a colleague who has their own separate machine on the same office network. The developer confirms `curl localhost:9000` works perfectly when they SSH into remote-host and test it themselves — but the colleague, hitting `remote-host:9000` from their own machine, gets "connection refused." No firewall changes were made recently. What is actually happening, and what specific change (naming the exact directive) would let the colleague reach it?',
    hint: 'The developer\'s own test worked FROM a shell on remote-host itself — think about what interface a remote forward binds to by default, and whether that interface is reachable from OTHER machines on the network at all.',
    solution: 'This is not a firewall problem — SSH remote forwards (`-R`) bind to the remote host\'s own loopback interface (127.0.0.1) by default, meaning the forwarded port is only reachable from processes running ON remote-host itself. That is exactly why the developer\'s own test (SSH\'d into remote-host, then curling localhost:9000 from there) succeeded, while the colleague\'s request from a genuinely different machine on the network hits a port that was never bound to anything reachable from outside remote-host in the first place — "connection refused," not a timeout, which is consistent with nothing listening on the externally-reachable interface at all. The fix is the `GatewayPorts` directive in remote-host\'s `/etc/ssh/sshd_config`: setting `GatewayPorts clientspecified` (the more targeted option) and then re-running the tunnel with an explicit wildcard bind — `ssh -R 0.0.0.0:9000:localhost:3000 alice@remote-host` — makes that specific forward reachable from other machines on the network, without changing the default (loopback-only) behavior for every other -R tunnel on that server.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '`ssh -R remote_port:localhost:local_port` makes that port reachable from anywhere on the remote network, the same way a normal listening service would be.',
      reality: 'Per this subtopic\'s theory, a remote forward binds to the remote host\'s OWN loopback interface (127.0.0.1) by default — only processes running on that exact machine can reach it, not other machines on the same network, regardless of any firewall configuration.'
    },
    {
      thought: 'If -R sets up a tunnel and testing from the remote host itself works, the tunnel is fully working and reachable.',
      reality: 'Per this subtopic\'s theory, a successful test FROM the remote host itself only confirms the loopback-bound default is working — it says nothing about reachability from other machines, which requires GatewayPorts to be explicitly enabled.'
    },
    {
      thought: 'GatewayPorts yes is a safe, low-impact setting to leave enabled by default on a server.',
      reality: 'Per this subtopic\'s theory, GatewayPorts changes the default bind for EVERY future -R forward on that server from loopback-only to the wildcard address — a real, broad exposure increase that should be a deliberate per-server decision (or scoped via clientspecified) rather than a blanket default.'
    }
  ];
}
