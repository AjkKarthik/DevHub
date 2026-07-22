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
  templateUrl: './vpc-cni-ip-exhaustion-pods-pending-despite-free-cpu-memory.html',
  styleUrl: './vpc-cni-ip-exhaustion-pods-pending-despite-free-cpu-memory.scss'
})
export class VpcCniIpExhaustionPodsPendingDespiteFreeCpuMemorySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page describes what the VPC CNI gives pods, but never its capacity limit',
      points: [
        'The main page\'s own QnA answer explains that "the AWS VPC CNI allocates real VPC IP addresses directly to pods using secondary IPs on node ENIs," contrasting this with overlay-network CNI plugins. This is presented as a pure benefit — pods are directly routable, no encapsulation overhead — without mentioning that this same mechanism creates a hard capacity ceiling that has nothing to do with a node\'s CPU or memory.',
        'A node scheduling decision in Kubernetes is normally thought of purely in terms of CPU and memory requests versus a node\'s allocatable capacity, per the main page\'s own "Not setting resource requests/limits on EKS pods" mistake entry — but on EKS specifically, there is a THIRD resource a node can run out of: IP addresses.',
      ]
    },
    {
      heading: 'Every Pod needs its own IP, and each node has a hard IP ceiling set by its EC2 instance type',
      points: [
        'Per AWS\'s own documentation, each EC2 instance type supports a maximum number of Elastic Network Interfaces (ENIs) and a maximum number of IP addresses per ENI. One IP is reserved for the node\'s own primary network interface — every other available IP on that node can be assigned to Pods, and each Pod requires exactly one IP address of its own.',
        'This means a node can have plenty of free CPU and memory, be well under its resource requests/limits — and still be completely unable to schedule one more Pod, because it has physically run out of IP addresses to hand out. AWS\'s own documentation states this plainly: "you might have nodes that have available compute and memory resources, but can\'t accommodate additional Pods because the node has run out of IP addresses to assign to Pods."',
        'Since this limit is tied to instance TYPE (not a configurable Kubernetes setting), switching to a larger instance type with more ENIs/IPs raises the ceiling — but the standard fix that avoids over-provisioning compute just to get more IPs is IP Prefix Delegation: instead of assigning individual secondary IPs one at a time, the VPC CNI assigns entire /28 IP prefixes (16 IPs each) to a network interface in a single API call, dramatically increasing the number of Pod IPs available per node without needing a larger instance.',
        'This has an operational consequence the main page\'s own EKS mistake entry (about resource requests/limits) doesn\'t anticipate: a Pod stuck in Pending due to IP exhaustion produces a scheduling failure event that looks, at a glance, like any other unschedulable-Pod problem — the actual cause (no free IPs on any node) requires checking ENI/IP allocation specifically, not just CPU/memory pressure.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Diagnosing a Pod stuck Pending due to IP exhaustion',
      language: 'bash',
      code: `# A Pod is stuck Pending -- the first instinct is to check CPU/memory,
# following the main page's own "Not setting resource requests/limits"
# framing:
kubectl describe pod my-app-7d9f8c-x2k4p -n production
# ...
# Events:
#   Type     Reason            Message
#   ----     ------            -------
#   Warning  FailedScheduling  0/4 nodes are available: 4 Insufficient
#                               pods. preemption: 0/4 nodes are
#                               available: 4 No preemption victims found.

# "Insufficient pods" -- NOT "Insufficient cpu" or "Insufficient
# memory" -- this is the actual signal that the limiting resource is
# the number of SCHEDULABLE pod slots (driven by IP availability),
# not compute capacity at all.

kubectl describe node ip-10-0-1-23.eu-west-1.compute.internal | grep -A5 "Allocated resources"
# Allocated resources:
#   Resource           Requests      Limits
#   --------           --------      ------
#   cpu                1200m (30%)   2400m (60%)
#   memory             2Gi (25%)     4Gi (50%)
#   pods               17            17
# -- CPU and memory are both well under 50% -- plenty of room -- but
# "pods 17" matches this node's own maximum pod count exactly, per
# its instance type's own ENI/IP limit.`,
    },
    {
      label: 'Checking the real ceiling and fixing it with prefix delegation',
      language: 'bash',
      code: `# Confirm the max-pods ceiling for the node's own instance type --
# this is calculated from ENI count x IPs-per-ENI, not CPU/memory:
kubectl get node ip-10-0-1-23.eu-west-1.compute.internal \\
  -o jsonpath='{.status.allocatable.pods}'
# 17
# -- a t3.medium's own IP-based pod limit, well below what its
# actual CPU (2 vCPU) and memory (4 GiB) could otherwise support.

# Check whether IP Prefix Delegation is already enabled on the CNI:
kubectl set env daemonset aws-node -n kube-system \\
  --list | grep ENABLE_PREFIX_DELEGATION
# ENABLE_PREFIX_DELEGATION=false   <- default; each Pod gets one
#                                     individually-assigned secondary IP

# Enable prefix delegation -- the CNI now assigns /28 prefixes
# (16 IPs each) per ENI slot instead of one IP at a time, raising
# the effective per-node pod ceiling substantially without changing
# instance type at all:
kubectl set env daemonset aws-node -n kube-system \\
  ENABLE_PREFIX_DELEGATION=true

# Existing nodes need to be replaced (not just updated in place) to
# pick up prefix-mode addressing cleanly -- AWS's own guidance
# recommends creating NEW node groups for the transition rather than
# a rolling update of existing nodes, since a node with a mix of
# individually-assigned IPs and prefixes can report an inconsistent
# advertised IP capacity.
eksctl create nodegroup --cluster my-cluster --name prefix-mode-ng \\
  --node-type t3.medium --nodes 2`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team scales a Deployment from 10 to 40 replicas ahead of an expected traffic spike. Several new Pods stay stuck in Pending. `kubectl top nodes` shows every node at well under 40% CPU and memory usage — nowhere close to resource pressure. Cluster Autoscaler / Karpenter is enabled and working (the main page\'s own "EKS nodes without the Cluster Autoscaler or Karpenter" mistake entry is already addressed), yet no new nodes are being added either. Using this subtopic\'s theory, what is the most likely actual bottleneck, and why wouldn\'t adding CPU/memory-based autoscaling alone fix it?',
    hint: 'If every existing node has spare CPU and memory but new Pods still won\'t schedule, what OTHER per-node resource — one the main page\'s own theory never mentions — might already be maxed out?',
    solution: 'The most likely bottleneck is IP address exhaustion, not CPU or memory pressure. Per this subtopic\'s theory, each EKS node has a hard ceiling on schedulable Pods determined by its instance type\'s ENI and per-ENI IP limits — completely independent of its actual CPU/memory capacity — and a node can be sitting at that pod-count ceiling while still having plenty of free compute, exactly matching the symptoms described (nodes well under 40% CPU/memory usage, yet new Pods still Pending). This also explains why Cluster Autoscaler/Karpenter isn\'t rescuing the situation: those tools scale based on PENDING pods\' resource requests versus available node capacity, and if the existing nodes still report available CPU/memory allocatable capacity (even though their pod-count ceiling is maxed), the autoscaler may not recognize IP exhaustion as a reason to add more nodes at all — its scaling signal is oriented around compute, not the separate IP/ENI ceiling. Checking `kubectl describe node` for each node\'s `pods` allocated-vs-capacity line (matching the instance type\'s own max-pods value) would confirm this, and the fix per this subtopic\'s theory is enabling IP Prefix Delegation on the VPC CNI to raise the per-node Pod ceiling without needing larger or more instances just to get more IP addresses.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A node scheduling failure on EKS is always caused by insufficient CPU or memory capacity, since that\'s what the main page\'s own resource-requests mistake entry focuses on.',
      reality: 'Per this subtopic\'s theory, EKS nodes have a THIRD schedulable-resource ceiling — the number of IP addresses available for Pods, determined by the node\'s EC2 instance type — and a node can be well under its CPU/memory capacity while still being completely unable to schedule another Pod.'
    },
    {
      thought: 'A node\'s maximum Pod count on EKS is a configurable Kubernetes setting, unrelated to the underlying EC2 instance type.',
      reality: 'Per this subtopic\'s theory, the default max-pods ceiling is calculated directly from the instance type\'s own ENI count and IPs-per-ENI limit — it is a property of the compute layer, not an independent Kubernetes scheduler setting, unless IP Prefix Delegation or a similar mechanism changes how those IPs are allocated.'
    },
    {
      thought: 'Cluster Autoscaler or Karpenter will automatically add nodes whenever any resource — including IP addresses — runs out on the existing fleet.',
      reality: 'Per this subtopic\'s exercise, autoscalers primarily react to pending Pods\' CPU/memory resource requests versus available node capacity — IP-exhaustion-driven scheduling failures are not guaranteed to trigger the same scale-out response, since the constrained resource isn\'t the one the autoscaler is watching.'
    }
  ];
}
