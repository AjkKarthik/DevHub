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
  templateUrl: './remotepilotaddress-belongs-to-primary-remote-not-multi-primary.html',
  styleUrl: './remotepilotaddress-belongs-to-primary-remote-not-multi-primary.scss'
})
export class RemotepilotaddressBelongsToPrimaryRemoteNotMultiPrimarySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A real config field, attached to the wrong topology',
      points: [
        'The previous subtopic established that <code>remotePilotAddress</code> does not participate in multi-primary\'s config exchange at all. This subtopic goes one step further: <code>remotePilotAddress</code> IS a real, documented Istio configuration field — it is simply scoped to the OTHER multi-cluster topology the main page describes, Primary-Remote, not Multi-Primary.',
      ]
    },
    {
      heading: 'Where `remotePilotAddress` actually belongs: Primary-Remote\'s remote clusters',
      points: [
        'In Primary-Remote mode, only ONE cluster runs a full Istiod. Every "remote" cluster runs no control plane of its own at all — instead, sidecars in the remote cluster need to know WHERE to send their xDS requests, since there is no local Istiod to answer them.',
        '<code>remotePilotAddress</code> is the field that tells a remote cluster\'s sidecar injector to point injected proxies\' xDS/discovery traffic at the PRIMARY cluster\'s Istiod (typically via the primary\'s east-west gateway IP), instead of a local (non-existent) one.',
        'This is a fundamentally different problem from multi-primary\'s SERVICE DISCOVERY (learning what services/endpoints exist in another cluster) — <code>remotePilotAddress</code> solves "where do MY sidecars get their xDS config from," which only arises when a cluster has no local control plane to answer that question in the first place. Multi-primary clusters never face this problem, since every cluster has its own full Istiod.',
      ]
    },
    {
      heading: 'Why this distinction matters when reading Istio config or troubleshooting',
      points: [
        'Seeing <code>remotePilotAddress</code> in a cluster\'s Istio configuration is a strong, reliable signal that cluster is a REMOTE in a Primary-Remote deployment, not a peer in a Multi-Primary mesh — useful for quickly orienting yourself in an unfamiliar multi-cluster setup\'s YAML without needing to ask which topology it uses.',
        'Conversely, if you are troubleshooting a genuinely multi-primary mesh and considering setting <code>remotePilotAddress</code> to "fix" cross-cluster discovery, this is very likely the wrong lever — the field it would actually need to touch is the remote-secret / API-server-watching mechanism covered in the previous subtopic, not sidecar xDS routing.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'remotePilotAddress in its real home: Primary-Remote install',
      language: 'bash',
      code: `# Primary-Remote: only the PRIMARY cluster runs Istiod.
# The REMOTE cluster's install uses the 'remote' profile and
# points its sidecar injector at the primary's control plane:
cat <<EOF | istioctl install --context="\${CTX_REMOTE}" -f -
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
spec:
  profile: remote
  values:
    istiodRemote:
      injectionPath: /inject/cluster/remote/net/network2
    global:
      remotePilotAddress: \${DISCOVERY_ADDRESS}
      # ^ points this cluster's sidecars at the PRIMARY's
      #   Istiod (via its east-west gateway) for xDS --
      #   this remote cluster runs NO Istiod of its own.
EOF

# Contrast: in MULTI-PRIMARY, this field is absent entirely --
# every cluster runs its own full Istiod, so no cluster's
# sidecars ever need to be pointed at a REMOTE control plane.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'While reading through an unfamiliar multi-cluster Istio deployment\'s IstioOperator YAML for two clusters, you notice cluster-B\'s config has a <code>remotePilotAddress</code> field pointing at cluster-A, while cluster-A\'s config has no such field and runs a full Istiod. What does this tell you about the deployment\'s topology, without needing to ask anyone?',
    hint: 'Which topology has some clusters running NO Istiod of their own — and what problem does <code>remotePilotAddress</code> solve for exactly those clusters?',
    solution: 'This is a Primary-Remote deployment, with cluster-A as the primary and cluster-B as a remote. `remotePilotAddress` only makes sense for a cluster whose sidecars have nowhere local to send xDS requests — which only happens when that cluster runs no Istiod of its own, the defining characteristic of a "remote" in Primary-Remote mode. A genuinely multi-primary deployment would show a full Istiod install (with its own `values.global.multiCluster.clusterName` and remote-secret setup) in BOTH clusters\' configs, and neither would need `remotePilotAddress` at all, since every cluster answers its own sidecars\' xDS requests locally.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '<code>remotePilotAddress</code> is a fabricated or non-existent Istio field, invented for the main page\'s original incorrect bullet.',
      reality: 'Per this subtopic\'s theory, <code>remotePilotAddress</code> is a real, documented Istio field — the main page\'s original error was attaching it to the wrong topology (Multi-Primary) rather than its real home (Primary-Remote\'s remote clusters).'
    },
    {
      thought: 'Since both Primary-Remote and Multi-Primary are "multi-cluster" topologies, config fields from one generally apply to the other too.',
      reality: 'Per this subtopic\'s theory, the two topologies solve structurally different problems (one control plane serving remote sidecars, vs. every cluster running its own independent control plane) — a field solving one topology\'s specific problem, like <code>remotePilotAddress</code>, has no role in the other.'
    },
    {
      thought: 'Seeing <code>remotePilotAddress</code> in a cluster\'s config doesn\'t tell you much about which multi-cluster topology is in use.',
      reality: 'Per this subtopic\'s theory, it is actually a strong, reliable signal — it only ever appears on a cluster with no local Istiod, meaning that cluster is a "remote" in Primary-Remote mode, not a peer in Multi-Primary.'
    }
  ];
}
