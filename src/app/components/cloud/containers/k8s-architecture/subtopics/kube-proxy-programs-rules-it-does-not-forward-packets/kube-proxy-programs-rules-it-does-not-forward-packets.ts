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
  templateUrl: './kube-proxy-programs-rules-it-does-not-forward-packets.html',
  styleUrl: './kube-proxy-programs-rules-it-does-not-forward-packets.scss'
})
export class KubeProxyProgramsRulesItDoesNotForwardPacketsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The name "kube-proxy," and the main page\'s own wording, both suggest traffic passes through it',
      points: [
        'The main page\'s own quick reference says: "kube-proxy: Implements Service networking on each node via iptables/IPVS rules." Its own theory bullet is similar: "kube-proxy: programs iptables/IPVS rules on each node to implement Service virtual IPs and load balancing."',
        'Both are technically accurate, but the component\'s own NAME — kube-proxy — actively suggests the opposite of what those two bullets already correctly describe: a "proxy," in the everyday networking sense, is something traffic flows THROUGH. Nothing on the page explicitly says traffic does NOT flow through kube-proxy in its default modes, leaving the name to do a lot of unaddressed, misleading work.',
        'This is not a pedantic distinction — it directly explains something the main page never mentions at all: why kube-proxy can sit on a node handling enormous volumes of Service traffic while itself staying nearly idle in CPU and memory usage, something a literal in-path proxy process could never do at scale.',
      ]
    },
    {
      heading: 'What actually forwards the packets: the kernel, not the kube-proxy process',
      points: [
        'In iptables mode (the long-standing default) and IPVS mode (the higher-throughput alternative for very large clusters), kube-proxy\'s job is to WATCH the API server for Service and EndpointSlice changes, and WRITE the corresponding netfilter (iptables) or IPVS rules into the Linux kernel — a control-plane-style responsibility, not a data-plane one.',
        'Once those rules are installed, actual packet forwarding — matching a Service\'s virtual IP, picking a backend Pod, rewriting the destination address (DNAT) — happens entirely inside the kernel\'s own netfilter/IPVS subsystem. No userspace process, including kube-proxy itself, sees or touches any individual packet as it flows through.',
        'This is a genuine architectural change from kube-proxy\'s ORIGINAL mode — the now-legacy "userspace" mode — where kube-proxy genuinely did function as a literal proxy: traffic was redirected into the kube-proxy process itself, which then opened a new connection to a chosen backend Pod and relayed data between the two, incurring a real per-packet context switch between kernel space and userspace on every single connection.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Tracing a Service request -- where kube-proxy is (and isn\'t) actually involved',
      language: 'bash',
      code: `# A client Pod connects to a Service's ClusterIP:
curl http://my-service.default.svc.cluster.local

# ── What happens, iptables mode ────────────────────────────────────────────
#
# 1. The packet leaves the client Pod's network namespace, destined
#    for the Service's virtual IP.
# 2. The kernel's netfilter subsystem, on the SAME node, matches
#    that packet against rules ALREADY INSTALLED by kube-proxy --
#    written minutes, hours, or days earlier, whenever the Service's
#    endpoints last changed.
# 3. netfilter picks a backend Pod IP (via a probabilistic chain of
#    rules kube-proxy generated) and rewrites the destination
#    address (DNAT) -- entirely inside the kernel.
# 4. The packet continues toward the chosen Pod.
#
# At NO point in steps 2-4 does the packet pass through, or get
# read by, the kube-proxy PROCESS. kube-proxy's only involvement
# was writing the rules ahead of time, not handling this request.

# Confirm kube-proxy's own resource usage stays flat regardless of
# Service traffic volume -- it scales with the NUMBER OF SERVICES/
# ENDPOINTS (rule count), not with REQUEST VOLUME:
kubectl top pod -n kube-system -l k8s-app=kube-proxy
# CPU/memory stay roughly constant whether the cluster is handling
# 10 requests/sec or 100,000 requests/sec across those same Services.`,
    },
    {
      label: 'The one mode where kube-proxy genuinely WAS a literal proxy',
      language: 'bash',
      code: `# Legacy "userspace" mode (kube-proxy --proxy-mode=userspace) --
# now deprecated, essentially never used in modern clusters, but
# instructive for contrast:
#
# 1. Traffic to a Service VIP is redirected (via a much simpler
#    iptables rule) into the kube-proxy PROCESS itself, on a random
#    local port it's listening on.
# 2. kube-proxy, running as an actual userspace proxy, picks a
#    backend Pod and opens its OWN new connection to it.
# 3. kube-proxy relays bytes between the client connection and the
#    backend connection -- genuinely acting as a man-in-the-middle
#    proxy process, exactly like the component's name implies.
#
# This mode incurs a real kernel<->userspace context switch on
# every connection (the client's packet has to leave the kernel,
# reach the kube-proxy process, get relayed via a NEW kernel-level
# connection back out) -- meaningfully slower and more resource-
# intensive than iptables/IPVS mode's kernel-only path, which is
# exactly why iptables mode replaced it as the default years ago,
# and why IPVS mode exists for even higher-throughput clusters.

# Check which mode a cluster is actually running:
kubectl get configmap kube-proxy -n kube-system -o yaml | grep mode
# mode: "iptables"    <- or "ipvs" -- "userspace" would be unusual
#                         to see on any current cluster`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team debugging a Service connectivity issue restarts the kube-proxy Pod on a node, expecting all currently-open, in-flight connections through that Service on that node to be briefly interrupted or dropped, the way restarting an in-path proxy normally would be. Using this subtopic\'s theory, is this expectation accurate for a cluster running iptables or IPVS mode?',
    hint: 'Per this subtopic\'s theory, once kube-proxy has already written its rules into the kernel, does actively-flowing traffic depend on the kube-proxy PROCESS continuing to run?',
    solution: 'Per this subtopic\'s theory, this expectation is not accurate for iptables or IPVS mode (the default on virtually every current cluster). Since kube-proxy\'s role is limited to WRITING netfilter/IPVS rules into the kernel — not handling any packet itself once those rules are installed — restarting the kube-proxy process does not interrupt already-flowing connections at all. The kernel continues forwarding traffic according to whatever rules are already in place, completely independent of whether the kube-proxy process that originally wrote them is currently running, restarting, or even temporarily down. The one real consequence of a kube-proxy restart is that the node stops picking up NEW Service/Endpoint changes until it comes back — existing rules keep working, but a Service scaling up or down, or a new Service being created, would not be reflected in that node\'s own kernel rules until kube-proxy resumes watching and reprogramming them. This expectation would only have been accurate on the legacy userspace mode, where traffic genuinely passed through the kube-proxy process itself, and restarting it really would interrupt every connection it was actively relaying.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'kube-proxy, true to its name, actively sits in the path of Service traffic — every packet destined for a Service passes through the kube-proxy process itself.',
      reality: 'Per this subtopic\'s theory, this is only true of the legacy, now-rarely-used "userspace" mode — in iptables and IPVS mode (the default on virtually every current cluster), kube-proxy only WRITES rules into the kernel ahead of time; actual packet forwarding happens entirely in kernel space with zero involvement from the kube-proxy process per packet.'
    },
    {
      thought: 'Restarting the kube-proxy Pod on a node would interrupt or drop currently-active connections flowing through Services on that node, the way restarting an in-path proxy normally would.',
      reality: 'Per this subtopic\'s exercise, in iptables/IPVS mode, already-installed kernel rules keep forwarding existing traffic completely independent of whether the kube-proxy process is running — a restart only pauses picking up NEW Service/Endpoint changes, not existing connections.'
    },
    {
      thought: 'kube-proxy\'s resource usage (CPU, memory) scales with the volume of Service traffic flowing through the cluster, the way a real in-path proxy\'s would.',
      reality: 'Per this subtopic\'s theory, kube-proxy\'s resource usage scales with the NUMBER of Services and endpoints (how many rules it has to maintain), not with request volume — since it never touches individual packets in iptables/IPVS mode, traffic volume has no direct bearing on its own resource consumption.'
    }
  ];
}
