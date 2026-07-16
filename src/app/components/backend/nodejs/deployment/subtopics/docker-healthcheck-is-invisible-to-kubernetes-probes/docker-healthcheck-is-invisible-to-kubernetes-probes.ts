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
  templateUrl: './docker-healthcheck-is-invisible-to-kubernetes-probes.html',
  styleUrl: './docker-healthcheck-is-invisible-to-kubernetes-probes.scss'
})
export class DockerHealthcheckIsInvisibleToKubernetesProbesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A Dockerfile\'s HEALTHCHECK instruction and Kubernetes\' own probes are two completely separate systems',
      points: [
        'The main page\'s own production Dockerfile includes a HEALTHCHECK instruction hitting /health, and its theory separately describes Kubernetes readinessProbe/livenessProbe. It is easy to read these as one coordinated system — the Dockerfile defines the check once, and both plain Docker and Kubernetes both use it. They do not.',
        'Kubernetes\' own official probes documentation makes no mention anywhere of a Dockerfile\'s HEALTHCHECK instruction. The kubelet\'s health-checking model is entirely self-contained: it runs its own exec/httpGet/tcpSocket/grpc checks defined directly in the Pod\'s container spec (the readinessProbe/livenessProbe/startupProbe fields), completely independent of anything baked into the image\'s Dockerfile. A Dockerfile\'s HEALTHCHECK instruction is simply never read, executed, or respected by Kubernetes at all.',
        'Under plain docker run (or Docker Swarm), HEALTHCHECK behaves differently again: it updates the container\'s inspectable health status (starting → healthy/unhealthy, driven by the check command\'s exit code), but a plain docker run with a --restart policy only restarts a container when its process actually EXITS — not merely because its health status flips to unhealthy while the process keeps running. Docker Swarm is the one context that actively reschedules unhealthy tasks based on this status; plain docker run does not.',
      ]
    },
    {
      heading: 'Why this matters for the main page\'s own Dockerfile',
      points: [
        'A HEALTHCHECK instruction baked into an image intended for Kubernetes deployment is not wrong to include (it is genuinely useful for local docker run debugging, docker inspect, and any Swarm-based deployment), but it provides zero automatic runtime benefit inside a Kubernetes cluster — the pod spec\'s own readinessProbe/livenessProbe are the only checks the kubelet actually acts on, and they need to be defined separately, in the Kubernetes manifest, even if they check the exact same /health endpoint the Dockerfile\'s HEALTHCHECK already probes.',
        'A common, costly mistake this enables: assuming a Dockerfile\'s HEALTHCHECK is "handling health checks" for a service that\'s actually deployed on Kubernetes, and never adding readinessProbe/livenessProbe to the Kubernetes manifest at all — the pod then has NO functioning health check from Kubernetes\' perspective, regardless of how correct or thorough the Dockerfile\'s own HEALTHCHECK is.',
      ]
    }
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Dockerfile HEALTHCHECK — visible to docker inspect, invisible to Kubernetes',
      language: 'typescript',
      code: `# Dockerfile — from the main page's own production stage
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \\
  CMD wget -qO- http://localhost:3000/health || exit 1

# This DOES affect:
#   docker inspect <container>   → shows "Health": "healthy"/"unhealthy"
#   docker ps                    → shows "(healthy)"/"(unhealthy)" next to STATUS
#   Docker Swarm                 → reschedules unhealthy tasks automatically
#
# This does NOT affect:
#   Kubernetes — the kubelet never reads this instruction at all.
#   A pod running this exact image with NO readinessProbe/livenessProbe
#   defined in its manifest has no functioning Kubernetes-level health
#   check whatsoever, no matter how correct this HEALTHCHECK is.`,
    },
    {
      label: 'The Kubernetes manifest needs its OWN, separately-defined probes',
      language: 'typescript',
      code: `# deployment.yaml — required in ADDITION to the Dockerfile's HEALTHCHECK,
# not instead of it, if this image is deployed to Kubernetes.
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
        - name: api
          image: my-registry/api:1.4.0   # the image with the HEALTHCHECK above
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /healthz
              port: 3000
            periodSeconds: 10
            failureThreshold: 3
          # Neither of these reads or depends on the image's own
          # HEALTHCHECK instruction in any way — they are entirely
          # separate checks the kubelet runs itself.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A service has a well-configured Dockerfile HEALTHCHECK that correctly detects when the app\'s database connection drops. It runs fine locally with docker run, correctly showing "(unhealthy)" in docker ps during a simulated DB outage. Once deployed to a Kubernetes cluster (with no readinessProbe or livenessProbe defined in the manifest), the same DB outage occurs — but Kubernetes keeps routing traffic to the pod, and never restarts it, throughout the entire outage. Explain why.',
    hint: 'Does Kubernetes\' kubelet read or act on a Dockerfile\'s HEALTHCHECK instruction at all — or does it rely entirely on its own, separately-configured probes?',
    solution: 'Kubernetes never routing away from the pod or restarting it happens because the kubelet does not read, execute, or respect a Dockerfile\'s HEALTHCHECK instruction under any circumstances — its entire health-checking model runs independently through readinessProbe/livenessProbe/startupProbe fields defined directly in the Pod\'s container spec, and since the manifest described here has neither one defined, there is no Kubernetes-level health check running at all for this pod. The Dockerfile\'s HEALTHCHECK genuinely does work correctly (as proven by the local docker run test correctly showing "(unhealthy)"), but that status is only visible to docker inspect/docker ps and, if this were Docker Swarm, to Swarm\'s own task rescheduling — none of which apply inside a Kubernetes cluster. The fix is adding an explicit readinessProbe (so Kubernetes stops routing traffic to the pod once the DB connection drops, typically checking the same /ready endpoint the main page\'s own theory describes) and a livenessProbe (so Kubernetes restarts the pod if it becomes permanently stuck) directly in the Kubernetes Deployment manifest — the Dockerfile\'s HEALTHCHECK instruction can stay for local debugging convenience, but it does not substitute for these Kubernetes-native probes in any way.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A Dockerfile\'s HEALTHCHECK instruction is a general-purpose health check that any container orchestrator — Kubernetes included — automatically discovers and acts on, since it\'s baked directly into the image itself.',
      reality: 'This subtopic\'s theory and first code example both show this is not the case — Kubernetes\' official probes documentation never mentions Docker\'s HEALTHCHECK instruction at all, and the kubelet relies entirely on its own separately-configured readinessProbe/livenessProbe/startupProbe fields in the pod spec, completely independent of anything in the Dockerfile.'
    },
    {
      thought: 'If a container\'s HEALTHCHECK reports "unhealthy" under plain docker run with a --restart policy configured, Docker will automatically restart that container, the same way an unhealthy Kubernetes pod gets restarted by a failing liveness probe.',
      reality: 'This subtopic\'s theory explains the actual behavior — under plain docker run, a --restart policy only triggers when the container\'s process actually exits, not merely because HEALTHCHECK flips its status to unhealthy while the process keeps running; only Docker Swarm actively reschedules tasks based on that health status.'
    },
    {
      thought: 'A well-tested, correctly working Dockerfile HEALTHCHECK (verified via docker run/docker inspect) guarantees the same health-checking behavior once that image is deployed to Kubernetes, since it\'s the same image and the same check command.',
      reality: 'This subtopic\'s exercise shows the opposite — a HEALTHCHECK that works perfectly under docker run has zero effect once the image runs inside Kubernetes without its own separately-defined readinessProbe/livenessProbe in the manifest, since the kubelet never reads the Dockerfile\'s instruction at all.'
    }
  ];
}
