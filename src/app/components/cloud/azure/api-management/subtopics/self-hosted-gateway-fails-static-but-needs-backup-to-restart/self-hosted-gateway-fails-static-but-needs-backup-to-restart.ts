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
  templateUrl: './self-hosted-gateway-fails-static-but-needs-backup-to-restart.html',
  styleUrl: './self-hosted-gateway-fails-static-but-needs-backup-to-restart.scss'
})
export class SelfHostedGatewayFailsStaticButNeedsBackupToRestartSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page mentions the self-hosted gateway\'s deployment targets, never its dependency on the cloud',
      points: [
        'The main page\'s own theory describes the self-hosted gateway only in terms of WHERE it runs: "deploy the APIM gateway component as a container in on-premises environments, other clouds, or Kubernetes clusters. Manages to the cloud APIM control plane. Use for: hybrid cloud APIs, latency-sensitive on-premises backends, edge deployments." Nothing here says what happens if that connection to the cloud control plane is ever lost.',
        'This matters directly because of the deployment scenarios the main page itself names — an on-premises backend or an edge deployment is exactly the kind of environment where a transient loss of internet connectivity back to Azure is a realistic, not hypothetical, event.',
      ]
    },
    {
      heading: 'Confirmed via Microsoft\'s own self-hosted gateway documentation: it "fails static," with an important caveat',
      points: [
        'Per Microsoft\'s own documentation: "When connectivity to Azure is lost, the self-hosted gateway is unable to receive configuration updates, report its status, or upload telemetry. The self-hosted gateway is designed to \'fail static\' and can survive temporary loss of connectivity to Azure." A gateway that is ALREADY RUNNING when connectivity drops keeps serving traffic using its last-known configuration, held in memory.',
        'The important caveat is about what happens to a gateway that is NOT already running. Microsoft\'s own docs distinguish two configurations: "When configuration backup is turned off and connectivity to Azure is interrupted: Running self-hosted gateways continue to function... Stopped self-hosted gateways won\'t be able to start." Without a local configuration backup, a pod that restarts (a Kubernetes eviction, a node reboot, a routine redeploy) during a connectivity outage cannot come back up at all — "fail static" only protects an already-running instance.',
        'With configuration backup enabled, this gap closes: "Running self-hosted gateways continue to function by using an in-memory copy of the configuration... Stopped self-hosted gateways can start by using a backup copy of the configuration." Configuration backup works by having the gateway "regularly save a backup copy of the latest downloaded configuration on a persistent volume attached to their container or pod" — meaning it requires deliberately attaching persistent storage, not something that\'s on by default just by deploying the gateway as a container.',
      ]
    },
    {
      heading: 'Why this specifically matters for the deployment scenarios the main page names',
      points: [
        'A Kubernetes-based self-hosted gateway deployment is exactly the kind of environment where pods restart routinely for reasons unrelated to any real outage — node maintenance, autoscaling, a rolling update of an unrelated workload evicting a pod under memory pressure. If that restart happens to coincide with a connectivity blip to Azure and configuration backup was never configured, the gateway simply won\'t come back — not a graceful degradation, a hard failure to start.',
        'Recovery is automatic once connectivity returns, regardless of the backup setting: "When connectivity is restored, each self-hosted gateway affected by the outage automatically reconnects with its associated API Management instance and downloads all configuration updates that occurred while the gateway was offline." The backup setting only changes what happens DURING the outage for a stopped instance — not whether the gateway eventually catches back up once the network is fixed.',
        'The main page\'s own "edge deployments" and "on-premises backends" use cases are precisely where persistent-volume configuration backup is worth the deliberate setup effort — an edge site with a flaky uplink, left with the default (no backup) configuration, silently trades "the gateway degrades gracefully during an outage" for "the gateway may never restart during one" the moment any pod restart happens to overlap with a connectivity gap.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Fail-static behavior: an already-running gateway during an outage',
      language: 'bash',
      code: `# A self-hosted gateway pod, already running and serving traffic
# normally, loses connectivity to Azure (e.g. an ISP outage at an
# on-premises site -- one of the main page's own named scenarios):

# Per Microsoft's own docs, during the outage:
#   - Configuration updates: NOT received (frozen at last-known state)
#   - Status heartbeat: NOT sent (every 1 minute, normally)
#   - Telemetry upload: NOT sent
#   - REQUEST HANDLING: continues normally, using the in-memory
#     configuration the gateway already had before the outage began

# This is the documented "fail static" behavior -- the RUNNING
# gateway keeps proxying API requests and applying its existing
# policies exactly as before, entirely unaffected from a traffic
# perspective, for as long as the outage lasts.

# When connectivity returns:
az apim gateway list --resource-group my-rg --service-name my-apim
#   -> the self-hosted gateway automatically reconnects and
#      downloads every configuration change that happened while it
#      was offline -- no manual resync step needed.`,
    },
    {
      label: 'The gap: a STOPPED gateway during the same outage, with and without backup',
      language: 'bash',
      code: `# The SAME connectivity outage, but this time a Kubernetes node
# hosting the gateway pod reboots for routine maintenance, or the
# pod is evicted under memory pressure -- a completely normal
# Kubernetes event, unrelated to the outage itself.

# WITHOUT configuration backup configured (no persistent volume):
#   Per Microsoft's own docs: "Stopped self-hosted gateways won't be
#   able to start." The pod tries to restart, has no configuration
#   to load (nothing persisted, and Azure is unreachable to fetch a
#   fresh copy), and simply cannot come up -- a hard outage for this
#   gateway instance until Azure connectivity is restored.

# WITH configuration backup configured (persistent volume attached):
#   Per Microsoft's own docs: "Stopped self-hosted gateways can start
#   by using a backup copy of the configuration." The restarting pod
#   loads its last-saved configuration from the persistent volume
#   and resumes serving traffic immediately, still offline.

# Example Helm value enabling this (conceptual -- consult current
# Helm chart docs for the exact key):
# configuration:
#   backup:
#     enabled: true
#   volume:
#     persistentVolumeClaim: gateway-config-pvc`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'An edge site runs a self-hosted APIM gateway in Kubernetes with default settings (no configuration backup volume configured). A brief regional internet outage coincides, purely by chance, with a routine node patching cycle that evicts and restarts the gateway pod. The gateway does NOT come back online even after the pod restart completes successfully, and stays down until the internet outage itself is resolved. Is this the "fail static" behavior working as designed?',
    hint: 'Check whether Microsoft\'s own "fail static" guarantee applies to a gateway that was already running when connectivity dropped, or to a gateway trying to START while connectivity is down — and what role configuration backup plays in that specific distinction.',
    solution: 'This is a real gap, not the "fail static" guarantee working as intended — but it is exactly documented behavior, not a bug. Per Microsoft\'s own docs, "fail static" describes what happens to a gateway that is ALREADY RUNNING when connectivity drops: it keeps serving traffic from its in-memory configuration. It says nothing about a gateway trying to START during an outage. Because no configuration backup (persistent volume) was configured, the docs are explicit about this exact scenario: "Stopped self-hosted gateways won\'t be able to start" when connectivity is down. The pod restart from routine node patching — an event completely unrelated to the outage — is what exposed the gap: the gateway had no persisted configuration to load and no way to fetch a fresh one from Azure, so it stayed down for the full duration of the outage rather than degrading gracefully. The fix for this exact scenario is enabling configuration backup with a persistent volume attached to the gateway\'s container or pod, so a restarting instance can load its last-known configuration locally instead of requiring live connectivity to Azure just to start.'
  };

  misconceptions: Misconception[] = [
    {
      thought: '"Fail static" means a self-hosted APIM gateway can always survive a connectivity outage to Azure, regardless of what else happens to the gateway pod during that outage.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation scopes "fail static" specifically to gateways that are ALREADY RUNNING when connectivity drops — a gateway that stops and tries to restart during the same outage has no such guarantee unless configuration backup is separately configured.'
    },
    {
      thought: 'Configuration backup for a self-hosted gateway is enabled automatically just by deploying it as a container or Kubernetes pod.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs describe configuration backup as something that requires deliberately attaching a persistent volume to the gateway\'s container or pod — without that explicit setup, a stopped gateway during a connectivity outage has no local configuration to load and cannot start.'
    },
    {
      thought: 'Once a self-hosted gateway loses connectivity to Azure, it needs some manual step to resynchronize once the connection comes back.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states reconnection is fully automatic: "each self-hosted gateway affected by the outage automatically reconnects with its associated API Management instance and downloads all configuration updates that occurred while the gateway was offline" — no manual resync step is required, regardless of whether configuration backup was configured during the outage.'
    }
  ];
}
