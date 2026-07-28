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
  templateUrl: './consistenthash-defaults-to-ring-hash-with-a-1024-node-ring.html',
  styleUrl: './consistenthash-defaults-to-ring-hash-with-a-1024-node-ring.scss'
})
export class ConsistentHashDefaultsToRingHashWithA1024NodeRingSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A gap on the main page: consistentHash is described in terms of its behavior, never its underlying algorithm',
      points: [
        'The main page\'s theory and code examples show <code>consistentHash.httpHeaderName</code> / <code>httpCookie</code> / <code>useSourceIp</code> as ways to pick a HASH KEY, and states "~1/N of sessions are remapped" when the endpoint count changes. Neither the main page\'s theory nor its "Consistent Hash" codeTab specifies WHICH consistent-hashing ALGORITHM actually backs this behavior, or why the ~1/N figure holds.',
      ]
    },
    {
      heading: 'The reality: consistentHash defaults to ring hash with a 1024-node ring',
      points: [
        'DestinationRule\'s <code>ConsistentHashLB</code> actually offers TWO distinct algorithms as nested sub-fields: <code>ringHash</code> and <code>maglev</code> — both directly configurable, no EnvoyFilter needed for either. When a DestinationRule sets a hash key (like <code>httpHeaderName</code>) WITHOUT explicitly nesting it under <code>ringHash</code> or <code>maglev</code>, Istio\'s control plane defaults the underlying Envoy cluster to <strong>RING_HASH</strong>.',
        'Ring hash\'s own default <code>minimumRingSize</code> is <strong>1024</strong> virtual nodes. Envoy\'s own documentation explains why the ring size matters directly: "Larger ring sizes result in more granular load distributions" — a larger ring means each real endpoint\'s virtual-node footprint on the ring is finer-grained, so removing or adding one endpoint disturbs a smaller, more precisely-bounded slice of the hash space.',
      ]
    },
    {
      heading: 'Why the ring size explains the "~1/N remapping" claim\'s actual precision',
      points: [
        'Ring hash\'s minimal-disruption property (approximately 1/N of keys remap when the pool changes) is only APPROXIMATELY true, and its precision depends directly on ring size relative to N. With the default 1024-node ring, a service with a handful to a few dozen endpoints gets very close to the ideal 1/N bound. But if endpoint count N grows large relative to the ring size, "each host will be assigned a single virtual node" (per Envoy\'s own docs) — coarser granularity, and remapping deviates further from the ideal 1/N.',
        'Practical takeaway: for services with a very large pod count where session-affinity precision matters (e.g. a sharded cache with hundreds of pods), explicitly raising <code>ringHash.minimumRingSize</code> above the 1024 default restores tighter 1/N-remapping behavior — the main page\'s "~1/N" claim is not automatically guaranteed at every scale, it is a consequence of a specific, tunable configuration value.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Implicit ring hash (main page\'s example — no algorithm specified)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-cache
spec:
  host: user-cache
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpHeaderName: x-user-id
        # No "ringHash" or "maglev" sub-field given --
        # Istio's control plane defaults this to RING_HASH
        # with minimumRingSize: 1024 (Envoy's own default).
EOF`,
    },
    {
      label: 'Explicit ring hash with a larger ring (for high pod counts)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-cache
spec:
  host: user-cache
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpHeaderName: x-user-id
        ringHash:
          minimumRingSize: 65536   # finer granularity than the
                                     # 1024 default -- tighter
                                     # ~1/N remapping guarantee
                                     # for a large pod count
EOF`,
    },
    {
      label: 'Explicit Maglev (also a native field -- no EnvoyFilter needed)',
      language: 'bash',
      code: `cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: user-cache
spec:
  host: user-cache
  trafficPolicy:
    loadBalancer:
      consistentHash:
        httpHeaderName: x-user-id
        maglev:
          tableSize: 65537   # Maglev's own lookup table size
                               # (must be prime for best distribution)
EOF
# Maglev generally gives faster lookups and more even
# distribution than ring hash, at the cost of slightly
# more disruption on pool changes than a well-tuned ring.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service scales from 20 pods to 500 pods over several months, using consistentHash.httpHeaderName with no ringHash or maglev sub-field ever added. The team originally relied on the "~1/N remapping" guarantee for cache-affinity purposes, and it worked well at 20 pods. At 500 pods, they start noticing noticeably MORE cache misses than the 1/N formula would predict whenever a pod restarts. What changed?',
    hint: 'What is the default minimumRingSize, and what happens to ring granularity as the number of real endpoints approaches or exceeds that number?',
    solution: 'The default minimumRingSize is 1024 virtual nodes. At 20 pods, the ring easily provides many virtual nodes per real endpoint, so remapping stays very close to the ideal 1/N. As pod count grows toward and past several hundred, each real pod is assigned progressively fewer virtual nodes on a fixed-size 1024-node ring — per Envoy\'s own docs, if the number of hosts exceeds the ring size, each host gets just a single virtual node, at which point the minimal-disruption guarantee degrades significantly. The fix is to explicitly configure ringHash.minimumRingSize to a much larger value (e.g. 65536) once pod count grows large enough that the default ring granularity is no longer fine enough to keep remapping close to 1/N.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Istio\'s consistentHash is a single, generic mechanism — there\'s no meaningful choice of underlying algorithm involved, just a hash key.',
      reality: 'Per this subtopic\'s theory, DestinationRule\'s ConsistentHashLB actually offers two distinct, natively-configurable algorithms — ringHash and maglev — and defaults to ring hash (with a 1024-node ring) when neither is explicitly specified.'
    },
    {
      thought: 'The main page\'s "~1/N of sessions are remapped" claim for consistent hashing holds true at any scale, regardless of pod count.',
      reality: 'Per this subtopic\'s theory, that guarantee\'s precision depends on ring size relative to endpoint count — with the default 1024-node ring, precision degrades as pod count grows large, since Envoy assigns each host progressively fewer virtual nodes, eventually just one per host once pod count exceeds the ring size.'
    },
    {
      thought: 'Maglev requires extra configuration outside of DestinationRule (like an EnvoyFilter) to use in Istio, since it\'s a more specialized algorithm than ring hash.',
      reality: 'Per this subtopic\'s theory, Maglev is a fully native DestinationRule field (ConsistentHashLB.maglev, with its own tableSize parameter) — no EnvoyFilter is needed for either ring hash or Maglev; both are directly configurable in the standard Istio API.'
    }
  ];
}
