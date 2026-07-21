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
  templateUrl: './ipblock-matches-raw-ips-a-cidr-overlapping-the-cluster-network-can-leak.html',
  styleUrl: './ipblock-matches-raw-ips-a-cidr-overlapping-the-cluster-network-can-leak.scss'
})
export class IpblockMatchesRawIpsACidrOverlappingTheClusterNetworkCanLeakSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quickRef and code tab present ipBlock as a purely "external" mechanism',
      points: [
        'The main page\'s own quickRef entry for ipBlock says: "Allow/deny a CIDR range — used for external IP ranges." The theory bullet on ipBlock repeats the same framing. Read together, this presents ipBlock as if it were inherently, automatically scoped to traffic outside the cluster.',
        'The main page\'s own "ipBlock for external services" code tab uses `cidr: 203.0.113.0/24` (a real, well-known documentation/example CIDR block reserved specifically for this kind of illustrative use, per RFC 5737) — a genuinely external range that could never overlap with a real cluster\'s own internal addressing. This choice of example, while correct and safe, never demonstrates or warns about what happens with a LESS carefully chosen CIDR.',
      ]
    },
    {
      heading: 'What actually happens: ipBlock matches raw IP addresses — nothing inherently distinguishes "external" from "happens to be a Pod IP"',
      points: [
        'Per Kubernetes\' own NetworkPolicy documentation, ipBlock is a plain CIDR-based IP matcher — it has no built-in concept of "internal" versus "external." If the CIDR range specified in an ipBlock rule happens to overlap with the cluster\'s OWN Pod network CIDR or Service CIDR (a real, if uncommon, misconfiguration risk — especially in clusters using a broad private range like `10.0.0.0/8` for BOTH the cluster network and an intended "external" allow rule), the rule will also match traffic to/from in-cluster Pods that happen to fall within that range, not just genuinely external destinations.',
        'This is precisely why Kubernetes\' own documentation stresses being as PRECISE as possible with ipBlock CIDR ranges, and why the main page\'s own example uses `except:` to carve a specific IP out of its allowed range — but `except:` only removes a sub-range from what\'s explicitly excluded; it does nothing to protect against the CIDR overlapping the cluster\'s own internal addressing in the first place, since that overlap is a completely separate, unrelated risk the `except:` field was never designed to address.',
        'Some specific CNI implementations (Cilium\'s eBPF datapath, notably) DO automatically exclude cluster-internal addresses from ipBlock matching as an implementation-level safeguard — but this is CNI-SPECIFIC behavior, not a guarantee from the core Kubernetes NetworkPolicy API itself. Relying on a specific CNI\'s own extra safeguard, rather than choosing genuinely non-overlapping CIDR ranges in the first place, is a portability risk if the cluster\'s CNI is ever changed.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'A poorly-chosen "external" CIDR can match in-cluster pods',
      language: 'bash',
      code: `# Check the cluster's own Pod network CIDR first (a real, necessary
# step the main page's own ipBlock example never mentions doing):
kubectl cluster-info dump | grep -m1 cluster-cidr
# --cluster-cidr=10.244.0.0/16

# A team wants to allow egress to a broad internal corporate network
# range that happens to OVERLAP with the cluster's own Pod CIDR --
# a real risk with common private-range choices:
# apiVersion: networking.k8s.io/v1
# kind: NetworkPolicy
# metadata: { name: allow-corp-network }
# spec:
#   podSelector: { matchLabels: { app: api } }
#   policyTypes: [Egress]
#   egress:
#     - to:
#         - ipBlock:
#             cidr: 10.0.0.0/8    # intended: corp network only
#             # NO except: for the cluster's own 10.244.0.0/16 range

# This rule's CIDR (10.0.0.0/8) fully CONTAINS the cluster's own Pod
# network (10.244.0.0/16) -- meaning it ALSO allows egress to every
# other Pod in the cluster, not just the intended external corp range:
kubectl exec api-pod -- nc -zv 10.244.5.12 5432   # some unrelated pod's IP
# Connection to 10.244.5.12 5432 port [tcp/postgresql] succeeded!
# -- succeeded, even though this specific Pod-to-Pod path was never
#    supposed to be part of an "external corp network" allow rule.`,
    },
    {
      label: 'The fix: exclude the cluster\'s own CIDR explicitly',
      language: 'bash',
      code: `# The correct version of the same rule -- using the main page's own
# except: pattern, but applied to the ACTUAL risk (the cluster's own
# overlapping range), not just an arbitrary single IP:
# apiVersion: networking.k8s.io/v1
# kind: NetworkPolicy
# metadata: { name: allow-corp-network }
# spec:
#   podSelector: { matchLabels: { app: api } }
#   policyTypes: [Egress]
#   egress:
#     - to:
#         - ipBlock:
#             cidr: 10.0.0.0/8
#             except:
#               - 10.244.0.0/16   # <- the cluster's own Pod CIDR, excluded

kubectl exec api-pod -- nc -zv 10.244.5.12 5432
# nc: connect to 10.244.5.12 port 5432 (tcp) failed: Connection timed out
# -- correctly blocked now; the corp-network rule no longer
#    accidentally grants in-cluster Pod-to-Pod access.

# General practice worth remembering: before writing ANY ipBlock rule
# with a broad private-range CIDR, check kubectl cluster-info dump
# (or your cloud provider's VPC/cluster network settings) for the
# cluster's own Pod and Service CIDRs, and explicitly except: them
# out if there's any overlap -- do not rely on a specific CNI's own
# extra safeguards (like Cilium's automatic exclusion) as a substitute
# for choosing precise, non-overlapping ranges in the policy itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team writes an egress <code>ipBlock</code> rule with <code>cidr: 10.0.0.0/8</code>, intending to allow their pods to reach a broad internal corporate network. They don\'t realize their Kubernetes cluster\'s own Pod network also happens to use a range inside <code>10.0.0.0/8</code>. Using this subtopic\'s theory, does this rule ALSO grant egress access to other pods within the cluster, and why doesn\'t the rule "know" to exclude them automatically?',
    hint: 'Does <code>ipBlock</code> have any built-in concept of "this IP happens to belong to a Pod in my own cluster" versus "this IP is genuinely external," or does it just match raw CIDR ranges?',
    solution: 'Yes — per this subtopic\'s theory, this rule does grant egress access to other in-cluster pods whose IPs happen to fall within the 10.0.0.0/8 range, because ipBlock is a plain CIDR matcher with no inherent concept of "internal" versus "external" traffic. Kubernetes\' core NetworkPolicy API doesn\'t automatically exclude a cluster\'s own Pod or Service CIDR from an ipBlock rule just because that rule was intended for external traffic — the CIDR is evaluated purely as a set of IP addresses, and if the cluster\'s own Pod network happens to be a subset of the specified range, traffic to those Pod IPs matches the rule exactly the same as traffic to the genuinely external addresses the team intended. (Some specific CNI implementations, like Cilium\'s eBPF datapath, do add their own automatic exclusion of cluster-internal addresses as an implementation-level safeguard — but this is CNI-specific behavior, not something the core Kubernetes API guarantees, so it shouldn\'t be relied on as a substitute for choosing precise ranges.) The fix is checking the cluster\'s own Pod and Service CIDRs (via kubectl cluster-info dump or the cloud provider\'s network configuration) before writing any broad-range ipBlock rule, and explicitly excluding any overlap using the except: field — the same mechanism the main page\'s own example already uses, just applied to the cluster\'s own CIDR rather than an arbitrary single IP.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'ipBlock rules in a NetworkPolicy automatically only match traffic to genuinely external IPs, since the main page\'s own quickRef describes ipBlock as being "used for external IP ranges."',
      reality: 'Per this subtopic\'s theory, ipBlock has no built-in concept of internal versus external at all in the core Kubernetes API — it is a raw CIDR matcher, and a range that happens to overlap the cluster\'s own Pod or Service network will also match in-cluster traffic, not just external destinations.'
    },
    {
      thought: 'The except: field in an ipBlock rule (as shown in the main page\'s own example) is a general-purpose safety mechanism that automatically protects against a CIDR accidentally overlapping the cluster\'s own network.',
      reality: 'Per this subtopic\'s exercise, except: only removes whatever specific sub-ranges are explicitly listed inside it — it provides zero protection against cluster-CIDR overlap unless the cluster\'s own CIDR is deliberately added to that except: list by the person writing the policy.'
    },
    {
      thought: 'Since some CNI implementations (like Cilium) automatically exclude cluster-internal addresses from ipBlock matching, this behavior can be relied on as a general safeguard across any Kubernetes cluster.',
      reality: 'Per this subtopic\'s theory, this exclusion is a CNI-specific implementation detail, not a guarantee from the core Kubernetes NetworkPolicy API — a cluster running a different CNI (or switching CNIs later) may not have this protection at all, making precise, explicitly-excluded CIDR ranges the only portable, reliable practice.'
    }
  ];
}
