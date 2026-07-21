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
  templateUrl: './nlb-udp-quic-targets-use-non-udp-health-checks.html',
  styleUrl: './nlb-udp-quic-targets-use-non-udp-health-checks.scss'
})
export class NlbUdpQuicTargetsUseNonUdpHealthChecksSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own NLB theory lists UDP as a supported protocol but never says how a UDP target group is health-checked at all',
      points: [
        'The main page\'s own "NLB — Network Load Balancer" theory states: "Supports TCP, UDP, TLS (pass-through or terminate), and TCP_UDP protocols. Ideal for: gaming, IoT, financial trading, SIP/VoIP, MQTT." — it names UDP as a supported traffic protocol but says nothing about how the load balancer determines whether a UDP target is actually healthy.',
        'The main page\'s own "Target Groups & Health Checks" theory lists health-check protocol as one of "HTTP/HTTPS/TCP" — a list that conspicuously omits UDP, even though the NLB theory two sections earlier explicitly calls out UDP as a first-class supported protocol.',
      ]
    },
    {
      heading: 'UDP itself is connectionless with no reliable "are you there?" signal — so AWS deliberately does not offer a UDP health check at all',
      points: [
        'Per AWS\'s own NLB target-group health-check documentation: "For UDP and QUIC services, target availability can be tested using non-UDP health checks on your target group. You can use any available health check (TCP, HTTP, or HTTPS)." The traffic-serving protocol (UDP/QUIC) and the health-check protocol are deliberately decoupled — a target group forwarding real UDP traffic is still checked with TCP, HTTP, or HTTPS.',
        'This is not an arbitrary AWS limitation — UDP has no handshake and no built-in acknowledgment, so a load balancer sending a UDP probe packet has no reliable way to distinguish "target is down" from "the response packet was simply dropped in transit" (which is a normal, expected occurrence for UDP). A TCP/HTTP/HTTPS health check run alongside the UDP data path gives a connection-oriented, acknowledged signal that the underlying host and application process are actually alive — the health check does not need to speak the same protocol the target group forwards.',
        'The practical implication: a target running only a bare UDP service (say, a game server with no other open port) needs a SEPARATE lightweight TCP or HTTP endpoint added purely for health-check purposes — the health check cannot simply reuse the UDP port the real traffic flows through, because UDP itself is not an option in the health-check protocol dropdown at all.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Wrong assumption — trying to health-check the UDP port directly',
      language: 'bash',
      code: `# NLB target group forwarding real game-server traffic over UDP
aws elbv2 create-target-group \\
  --name game-servers-udp \\
  --protocol UDP --port 27015 \\
  --vpc-id vpc-0abc12345 \\
  --target-type instance \\
  --health-check-protocol UDP \\
  --health-check-port 27015
# Error: "1 validation error detected: Value 'UDP' at
# 'healthCheckProtocol' failed to satisfy constraint: Member must
# satisfy enum value set: [HTTP, HTTPS, TCP]"
# -- UDP is not, and has never been, a valid health-check protocol,
# regardless of what protocol the target group itself forwards.`,
    },
    {
      label: 'Correct pattern — TCP health check alongside the real UDP data path',
      language: 'bash',
      code: `# Add a lightweight TCP listener on the same instances purely for
# health-check purposes (e.g. the game server process itself opens
# a small TCP status port, or a sidecar does):
aws elbv2 create-target-group \\
  --name game-servers-udp \\
  --protocol UDP --port 27015 \\
  --vpc-id vpc-0abc12345 \\
  --target-type instance \\
  --health-check-protocol TCP \\
  --health-check-port 27016 \\
  --health-check-interval-seconds 10 \\
  --healthy-threshold-count 2 \\
  --unhealthy-threshold-count 2
# Per AWS's own docs: "For UDP and QUIC services, target
# availability can be tested using non-UDP health checks on your
# target group. You can use any available health check (TCP, HTTP,
# or HTTPS)." -- traffic flows over UDP:27015; health is judged by
# a completely separate TCP:27016 check on the same host.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is deploying a QUIC-based service behind an NLB and wants to configure a health check. Their first instinct is to search the AWS Console\'s health-check protocol dropdown for a "QUIC" option, assuming it must exist since the target group itself forwards QUIC traffic. Using this subtopic\'s theory, explain what they will actually find, and what they should configure instead.',
    hint: 'Per AWS\'s own documentation, is the health-check protocol required to match the target group\'s own traffic protocol?',
    solution: 'Per this subtopic\'s theory, the team will not find a QUIC (or UDP) option in the health-check protocol dropdown — AWS\'s own documentation states directly: "For UDP and QUIC services, target availability can be tested using non-UDP health checks on your target group. You can use any available health check (TCP, HTTP, or HTTPS)." The health-check protocol is deliberately decoupled from the traffic-serving protocol. The correct configuration is to pick TCP, HTTP, or HTTPS for the health check — typically TCP against a lightweight status port, or HTTP/HTTPS if the service already exposes a management endpoint — configured on the same targets that are also receiving the real QUIC traffic on a different port. There is no protocol mismatch error to work around; this decoupling is the intended, documented design, not a gap the team needs a workaround for.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since NLB target groups can forward UDP and QUIC traffic, the health check must also be configured as UDP to match.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation confirms the health-check protocol is independent of the traffic protocol — UDP and QUIC target groups are health-checked using TCP, HTTP, or HTTPS, never UDP itself, because UDP has no valid entry in the health-check protocol enum at all.'
    },
    {
      thought: 'A UDP-only service with no other open port simply cannot be health-checked by an NLB.',
      reality: 'Per this subtopic\'s theory, AWS\'s own documentation shows this is solvable by adding a separate TCP, HTTP, or HTTPS endpoint purely for health-check purposes on the same target — the health check does not need to exercise the actual UDP service logic to confirm the target is alive.'
    },
    {
      thought: 'A missing UDP health-check option is an AWS platform limitation that may be added in a future NLB feature release.',
      reality: 'Per this subtopic\'s theory, the absence is a deliberate design choice grounded in UDP\'s own connectionless nature (no handshake or acknowledgment to reliably distinguish "down" from "a dropped packet") — not a stopgap awaiting a future fix.'
    }
  ];
}
