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
  templateUrl: './multi-primary-discovery-is-independent-api-watching-not-a-peer-protocol.html',
  styleUrl: './multi-primary-discovery-is-independent-api-watching-not-a-peer-protocol.scss'
})
export class MultiPrimaryDiscoveryIsIndependentApiWatchingNotAPeerProtocolSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A fabricated mechanism caught during this batch, contradicting the page\'s own correct bullet',
      points: [
        'The main page originally described multi-primary config exchange with a bullet naming "PILOT_PEERS" and claiming Istiod instances need to know each other\'s endpoint "via the <code>remotePilotAddress</code> or via secret-based peer discovery." This directly contradicts the page\'s OWN "Service discovery" bullet, written one line earlier, which correctly describes each Istiod independently watching the other cluster\'s API server. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: no Istiod-to-Istiod protocol exists — each control plane watches independently',
      points: [
        'Per Istio\'s own multi-primary multi-network installation guide, each cluster\'s Istiod is given a remote secret (via <code>istioctl create-remote-secret</code>) granting it API-server credentials for the OTHER cluster. From that point, "both cluster1 and cluster2 observe the API Servers in each cluster for endpoints" — this is plain Kubernetes API watching, the SAME mechanism Istiod already uses for its own local cluster, just pointed at a second API server.',
        'There is no dedicated Istiod-to-Istiod wire protocol, no "PILOT_PEERS" environment variable, and no peer-discovery handshake in multi-primary mode. Each control plane is independently and fully self-sufficient once it has API access to every cluster in the mesh — it does not need the OTHER Istiod to be healthy, reachable, or even running to build its own view of the mesh.',
      ]
    },
    {
      heading: 'Why "watches independently" vs. "syncs via a peer protocol" changes your failure-mode reasoning',
      points: [
        'If multi-primary genuinely required live Istiod-to-Istiod communication (as the original, incorrect bullet implied), an Istiod outage in cluster-2 could plausibly stall or desync cluster-1\'s config — a shared, correlated failure mode. Since the real mechanism is independent API-server watching, cluster-1\'s Istiod is unaffected by cluster-2\'s Istiod crashing; it is only affected if cluster-2\'s Kubernetes API SERVER itself becomes unreachable (a materially different, and typically much rarer, failure).',
        'This distinction directly informs the page\'s own separately-stated "Health and failover" claim ("if cluster-2 becomes unreachable, cluster-1\'s Istiod keeps the last-known state") — that claim is only correctly explained once you know the underlying mechanism is API-server watching, not inter-Istiod messaging.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'What the remote secret actually grants: API server access, not an Istiod peer link',
      language: 'bash',
      code: `# Generate a remote secret -- this is a kubeconfig, NOT a
# handshake token for talking to the other cluster's Istiod:
istioctl create-remote-secret \\
  --context=\${CTX_CLUSTER2} \\
  --name=cluster2 | \\
  kubectl apply --context=\${CTX_CLUSTER1} -f -

# Inspect it -- it's a Kubernetes Secret holding a kubeconfig
# for CLUSTER 2's own API SERVER, nothing Istiod-specific:
kubectl --context=\${CTX_CLUSTER1} get secret istio-remote-secret-cluster2 \\
  -n istio-system -o yaml

# Cluster-1's Istiod uses this kubeconfig to run its OWN,
# independent watch against cluster-2's API server -- the
# exact same client-go watch mechanism it uses locally.
# Cluster-2's Istiod does not need to be running, healthy,
# or reachable for this watch to keep working.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team debugging a multi-primary mesh sees cluster-2\'s Istiod pod crash-looping. Based on the main page\'s original (now-corrected) "PILOT_PEERS" framing, they assume cluster-1\'s view of cluster-2\'s services will now be stale or broken, since it can no longer reach cluster-2\'s Istiod. Is this the right diagnosis?',
    hint: 'What does cluster-1\'s Istiod actually watch to learn about cluster-2\'s services — the OTHER Istiod, or the OTHER cluster\'s Kubernetes API server?',
    solution: 'This diagnosis is very likely wrong. Cluster-1\'s Istiod never talks to cluster-2\'s Istiod at all — it independently watches cluster-2\'s Kubernetes API SERVER directly, using the remote-secret credentials. As long as cluster-2\'s API server itself stays reachable, cluster-1\'s view of cluster-2\'s services and endpoints stays accurate and up to date, completely independent of whether cluster-2\'s own Istiod pod is healthy. The team should instead check whether cluster-2\'s API SERVER is reachable from cluster-1 (a different, and usually much more available, component than a single Istiod pod) before concluding cross-cluster discovery is broken.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'In multi-primary mode, each cluster\'s Istiod talks directly to the other cluster\'s Istiod to exchange service and endpoint configuration.',
      reality: 'Per this subtopic\'s theory (a fabricated mechanism corrected on the main page during this batch), there is no Istiod-to-Istiod protocol at all — each Istiod independently watches the OTHER cluster\'s Kubernetes API server directly, using remote-secret credentials.'
    },
    {
      thought: '<code>remotePilotAddress</code> is the config field that wires up cross-cluster discovery in multi-primary mode.',
      reality: 'Per this subtopic\'s theory, <code>remotePilotAddress</code> is a real Istio field, but it belongs to the DIFFERENT Primary-Remote topology — it points a remote cluster\'s sidecar injector at the primary\'s Istiod for xDS, and plays no role in multi-primary\'s config exchange.'
    },
    {
      thought: 'If one cluster\'s Istiod pod crashes in a multi-primary mesh, the other cluster\'s view of that cluster\'s services will go stale.',
      reality: 'Per this subtopic\'s theory, the other cluster\'s Istiod watches the CRASHED cluster\'s Kubernetes API server directly, not the crashed Istiod pod — so as long as that cluster\'s API server itself stays up, cross-cluster discovery is unaffected by the Istiod pod\'s own health.'
    }
  ];
}
