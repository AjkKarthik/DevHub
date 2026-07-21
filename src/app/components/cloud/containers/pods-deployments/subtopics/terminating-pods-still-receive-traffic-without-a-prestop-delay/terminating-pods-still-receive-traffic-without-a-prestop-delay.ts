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
  templateUrl: './terminating-pods-still-receive-traffic-without-a-prestop-delay.html',
  styleUrl: './terminating-pods-still-receive-traffic-without-a-prestop-delay.scss'
})
export class TerminatingPodsStillReceiveTrafficWithoutAPrestopDelaySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quickRef treats terminationGracePeriodSeconds as a clean, single timeline',
      points: [
        'The main page\'s own quickRef entry says terminationGracePeriodSeconds is "time kubelet waits after SIGTERM before sending SIGKILL (default 30s)" — framed as a single, self-contained countdown owned entirely by the kubelet on the Pod\'s own node.',
        'What that framing leaves out is that Pod deletion also kicks off a COMPLETELY SEPARATE, asynchronous process: the endpoints controller removing the Pod from the Service\'s Endpoints/EndpointSlice, then every OTHER node\'s kube-proxy needing to observe that removal and reprogram its own local iptables/IPVS rules — the exact kube-proxy mechanism this hub\'s own Kubernetes Architecture topic already covers as kernel-only packet forwarding, not central routing.',
        'These two processes — the kubelet\'s SIGTERM countdown on the Pod\'s node, and the Endpoints-removal propagation to every OTHER node — start at roughly the same moment but are not synchronized with each other at all, since they run on different components with no shared clock.',
      ]
    },
    {
      heading: 'What this actually causes: a real window where SIGTERM has fired but traffic keeps arriving',
      points: [
        'Per Kubernetes\' own documented termination flow, when a Pod is deleted the API server marks it "Terminating" and the kubelet begins the grace-period countdown (sending SIGTERM, or running a preStop hook first) AT THE SAME TIME the endpoints controller starts removing it from Endpoints objects — but kube-proxy on every node that was routing to this Pod has to separately receive that update and reprogram its own rules, which is not instantaneous.',
        'The result: for a real, sometimes multi-second window, a Pod can have already received SIGTERM (and even be mid-shutdown) while some node\'s kube-proxy has not yet stopped forwarding new connections to it — producing "connection refused" errors during an otherwise ordinary rolling update, even though the main page\'s own readinessProbe (which only gates NEW Pods becoming available) has nothing to do with removing an OLD, already-Running Pod from rotation.',
        'The standard, documented fix is a preStop hook that simply sleeps for a few seconds BEFORE the application actually starts shutting down — this delays the process exit just long enough for the asynchronous Endpoints-removal-to-kube-proxy-reprogramming propagation to catch up, so by the time the app actually stops accepting connections, no node is routing new traffic to it anymore.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Two independent timelines from one kubectl delete',
      language: 'bash',
      code: `# The main page's own quickRef only describes ONE of these two timelines:

# TIMELINE A -- kubelet, on the Pod's own node (what the main page covers):
#   t=0s   Pod marked Terminating, kubelet sends SIGTERM
#          (or runs preStop hook first, if one is defined)
#   t=30s  terminationGracePeriodSeconds elapses -> kubelet sends SIGKILL
#          (the main page's own quickRef entry, accurately described)

# TIMELINE B -- Endpoints propagation, across EVERY OTHER node (not
# mentioned by the main page at all):
#   t=0s   API server marks Pod Terminating; endpoints controller
#          removes it from the Service's Endpoints/EndpointSlice
#   t=0s+  Every node's kube-proxy watching that Service must observe
#          the update and reprogram its OWN local iptables/IPVS rules
#          -- this has real, non-zero propagation latency across a
#          cluster, unrelated to terminationGracePeriodSeconds entirely

# Both timelines start together, but nothing keeps them in lockstep:
kubectl delete pod web-7d9f8c6b8-x2k4p
# -> SIGTERM fires immediately on that Pod's own node (Timeline A)
# -> Endpoints removal + kube-proxy reprogramming happens in parallel,
#    on a DIFFERENT set of nodes, on its own schedule (Timeline B)

# If Timeline A's app stops accepting connections before Timeline B
# finishes propagating everywhere, some in-flight new connections
# land on a process that has already stopped listening.`,
    },
    {
      label: 'The fix: preStop delay bridges the propagation gap',
      language: 'bash',
      code: `# Without a preStop hook, the app may start refusing connections
# the instant SIGTERM arrives -- right when some nodes' kube-proxy
# rules may still be routing traffic to this Pod (Timeline B above).

# apiVersion: apps/v1
# kind: Deployment
# spec:
#   template:
#     spec:
#       terminationGracePeriodSeconds: 60   # main page's own field --
#                                            # gives room for the delay below
#       containers:
#         - name: web
#           lifecycle:
#             preStop:
#               exec:
#                 command: ["sh", "-c", "sleep 5"]
#           # The app keeps accepting connections normally during
#           # this 5s sleep -- SIGTERM isn't sent to the main process
#           # until the preStop hook itself returns.

# This does NOT make the race disappear -- it just buys enough time
# for Timeline B (Endpoints removal + kube-proxy reprogramming) to
# very likely finish BEFORE the app actually stops listening, turning
# a real race into a comfortable, one-sided margin instead.

# The main page's own terminationGracePeriodSeconds: 60 must stay
# LARGER than the preStop sleep -- the grace period clock includes
# the preStop hook's own runtime, so a 60s grace period comfortably
# covers a 5s sleep plus the app's actual in-flight-request drain time.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team\'s rolling update occasionally produces a handful of "connection refused" errors from their load balancer, even though every new Pod passes its readinessProbe before old Pods are removed (maxUnavailable: 0, exactly like the main page\'s own manifest). They assume the readinessProbe on the NEW Pods must somehow be misconfigured, since that\'s the only probe-related mechanism the main page describes. Using this subtopic\'s theory, is the readinessProbe the right place to look?',
    hint: 'The readinessProbe only gates whether a NEW Pod is added to Endpoints. The errors described happen on the way OUT — when an OLD, already-healthy Pod is being removed. Which of this subtopic\'s two timelines governs that side of a rolling update?',
    solution: 'No — per this subtopic\'s theory, the readinessProbe is very unlikely to be the cause, since it only controls whether a NEW Pod gets ADDED to a Service\'s Endpoints once it passes; it has no role at all in removing an OLD Pod from rotation. The described symptom — occasional connection-refused errors during otherwise-successful rolling updates — is the classic signature of the OTHER, undocumented-on-the-main-page timeline: the old Pod\'s own SIGTERM/shutdown sequence racing against the asynchronous Endpoints-removal-and-kube-proxy-reprogramming propagation across the cluster. If the old Pod stops accepting connections (either by exiting immediately, or because the application itself refuses new connections as soon as it sees SIGTERM) before every node\'s kube-proxy has finished reprogramming its own rules to stop routing to it, some in-flight new connections land on a Pod that already closed its listening socket. The fix is not a readinessProbe change at all — it\'s adding a `preStop` hook with a short sleep (a few seconds) on the OLD Pod\'s own container, giving the Endpoints-removal propagation time to catch up cluster-wide before the application actually stops listening, exactly as this subtopic\'s theory describes.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Once a Pod is marked Terminating and receives SIGTERM, Kubernetes has already stopped routing any new traffic to it — the countdown described in the main page\'s own <code>terminationGracePeriodSeconds</code> entry is the only timeline that matters during shutdown.',
      reality: 'Per this subtopic\'s theory, SIGTERM delivery and Endpoints/Service-routing removal are two separate, asynchronous processes running on different components (the local kubelet vs. every node\'s own kube-proxy) that merely START at the same moment — there is a real, sometimes multi-second window where a Pod has already received SIGTERM but some nodes are still routing new connections to it.'
    },
    {
      thought: 'The main page\'s own readinessProbe is what protects a rolling update from dropped connections on BOTH ends — new Pods becoming available AND old Pods being safely removed.',
      reality: 'Per this subtopic\'s exercise, readinessProbe only governs whether a Pod is ADDED to Endpoints when it becomes ready — it plays no role in the removal side of the lifecycle. Safely removing an old, already-healthy Pod from rotation is a completely different mechanism, addressed with a preStop delay, not a probe.'
    },
    {
      thought: 'Adding a preStop sleep hook eliminates the race between SIGTERM and Endpoints-removal propagation entirely, guaranteeing zero dropped connections during every rolling update.',
      reality: 'Per this subtopic\'s theory, a preStop delay only buys MORE TIME for the asynchronous propagation to likely finish first — it converts a tight race into a comfortable margin, it does not eliminate the underlying asynchrony. On a very large or network-degraded cluster, propagation could in principle still outlast even a generous preStop delay.'
    }
  ];
}
