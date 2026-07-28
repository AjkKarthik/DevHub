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
  templateUrl: './default-redirection-is-iptables-geneve-not-ebpf.html',
  styleUrl: './default-redirection-is-iptables-geneve-not-ebpf.scss'
})
export class DefaultRedirectionIsIptablesGeneveNotEbpfSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A genuine overstatement caught during this batch: eBPF was framed as a co-equal default',
      points: [
        'The main page originally stated Ambient "requires Kubernetes 1.26+ and iptables-nft or eBPF (for node-level traffic capture)" — phrasing that presents both mechanisms as equally-likely paths, and separately claimed a blanket "kernels < 5.10" dealbreaker for choosing sidecar mode instead. Verified against Istio\'s own ambient CNI documentation, this overstates eBPF\'s role and cites an unconfirmed kernel version. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: iptables + GENEVE overlay tunnels is the DEFAULT — eBPF is opt-in',
      points: [
        'Per Istio\'s own documentation on ambient traffic redirection: "By default it relies on iptables and Generic Network Virtualization Encapsulation (Geneve) overlay tunnels to achieve this redirection." eBPF-based redirection is a SEPARATE, explicitly opt-in mode, enabled only by setting `values.cni.ambient.redirectMode: "ebpf"` at install time.',
        'The kernel version genuinely tied to eBPF redirection, per Istio\'s own blog on the topic, is <strong>4.20 or later</strong> — not the 5.10 figure the main page originally cited (which does not appear anywhere in Istio\'s own eBPF-redirection documentation). More importantly, this kernel requirement is scoped SPECIFICALLY to the opt-in eBPF path — the default iptables+GENEVE path has no comparable kernel floor at all.',
      ]
    },
    {
      heading: 'Why conflating "an alternative exists" with "it\'s the default" matters for planning',
      points: [
        'A team evaluating whether their fleet\'s kernel versions are new enough for Ambient, based on the main page\'s original framing, might unnecessarily rule out Ambient entirely for nodes on an older kernel — when in fact the DEFAULT redirection path (iptables+GENEVE) would work fine on those same nodes, since the kernel requirement only applies if they deliberately opt into eBPF mode.',
        'Conversely, a team that assumes eBPF is automatically active (since it was presented as a coequal default) might misattribute a genuinely different set of operational characteristics (eBPF vs. iptables have different debugging tools, different failure modes, different performance profiles) to their actual, unmodified default installation.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What actually runs by default: iptables + GENEVE, no special kernel floor',
      language: 'bash',
      code: `# Default Ambient installation -- traffic redirection mode
# is NOT specified, so it defaults to iptables + GENEVE:
istioctl install --set profile=ambient -y

# Confirm the actual redirect mode in use:
kubectl get configmap istio-cni-config -n istio-system -o yaml \\
  | grep -i redirectMode
# (absent/default = iptables + GENEVE overlay tunnels)

# No kernel-4.20+ requirement applies to THIS default path --
# only to the opt-in eBPF alternative below.`,
    },
    {
      label: 'Opting into eBPF redirection (a deliberate, separate choice)',
      language: 'bash',
      code: `# Explicitly opt into eBPF-based redirection instead of the
# default iptables+GENEVE path:
istioctl install --set profile=ambient \\
  --set values.cni.ambient.redirectMode=ebpf -y

# This mode requires a modern kernel: 4.20 or later
# (per Istio's own eBPF-redirection documentation) --
# a requirement that does NOT apply to the default path.
uname -r   # verify kernel version before choosing this mode`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team runs nodes on kernel 4.15 (older than both the 5.10 figure the main page originally cited AND the real 4.20 eBPF requirement). Based on the main page\'s original framing ("requires... iptables-nft or eBPF"), they conclude Ambient Mesh is entirely unusable on their fleet and abandon the evaluation. Was this the right call?',
    hint: 'Is eBPF the ONLY way ambient mode captures traffic, or is there a default mechanism with a different (or no) kernel requirement?',
    solution: 'This was very likely the wrong call. Ambient Mesh\'s DEFAULT traffic redirection mechanism is iptables plus GENEVE overlay tunnels, which has no comparable kernel-version floor — the 4.20+ kernel requirement (and the main page\'s originally-cited, unconfirmed 5.10 figure) applies specifically to the OPT-IN eBPF redirection mode, not the default installation. The team should re-evaluate Ambient using the default iptables+GENEVE path, which their kernel 4.15 nodes can likely support fine, rather than assuming eBPF (an alternative they were never required to choose) is a hard prerequisite for using Ambient at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Ambient Mesh uses either iptables-nft or eBPF for traffic capture, with both being roughly equally-likely default paths depending on the cluster.',
      reality: 'Per this subtopic\'s theory (a genuine overstatement caught and corrected on the main page during this batch), iptables + GENEVE overlay tunnels is THE default — eBPF is a distinct, explicitly opt-in alternative requiring a separate install-time flag.'
    },
    {
      thought: 'Ambient Mesh has a hard kernel version requirement (5.10, per the main page\'s original claim) that applies to any cluster wanting to use Ambient at all.',
      reality: 'Per this subtopic\'s theory, no such blanket requirement exists for the default installation — the real, confirmed kernel requirement (4.20+) applies specifically and only to the opt-in eBPF redirection mode.'
    },
    {
      thought: 'A cluster running an older kernel that can\'t support eBPF-based traffic redirection is automatically ineligible for Ambient Mesh entirely.',
      reality: 'Per this subtopic\'s theory, such a cluster can still use Ambient Mesh via its default iptables+GENEVE redirection path, which carries no comparable kernel floor — eBPF is opt-in, not a prerequisite.'
    }
  ];
}
