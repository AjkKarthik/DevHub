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
  templateUrl: './docker-inspect-reveals-every-e-secret-in-plaintext.html',
  styleUrl: './docker-inspect-reveals-every-e-secret-in-plaintext.scss'
})
export class DockerInspectRevealsEveryESecretInPlaintextSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page recommends docker -e for secrets, without naming its most direct exposure surface',
      points: [
        'The main page\'s own QnA answer for passing secrets says: "Docker: docker run -e SECRET_KEY=value or --env-file .env... For production: use external secret managers... Never bake secrets into Docker images (they appear in image layers)." This correctly warns about baked-in image layers, but never mentions that a RUNTIME <code>-e</code> flag has its own separate, equally direct exposure path.',
      ]
    },
    {
      heading: 'docker inspect shows every environment variable a container was started with, in plaintext',
      points: [
        '<code>docker inspect <container></code> returns the container\'s full configuration as JSON — including a <code>Config.Env</code> array listing every environment variable it was started with, values included, in plain readable text. Anyone with access to the Docker daemon (which in practice often means anyone who can run <code>docker</code> commands on that host at all, or anyone with access to the orchestration platform\'s equivalent inspect/describe API) can read every secret passed via <code>-e</code> or <code>--env-file</code> this way.',
        'This is a genuinely different exposure path from the "baked into image layers" risk the main page already warns about — it happens at RUNTIME, for every running (or even just stopped-but-not-removed) container, regardless of how carefully the image itself was built. A perfectly clean image with zero secrets baked in can still leak every secret it was started with, the moment anyone runs <code>docker inspect</code> against it.',
      ]
    },
    {
      heading: 'The actual fix: Docker secrets (or the orchestrator\'s equivalent), not environment variables at all',
      points: [
        'Docker\'s own dedicated secrets mechanism (Swarm services, or the equivalent constructs in Kubernetes/other orchestrators) mounts sensitive values as FILES under a path like <code>/run/secrets/<secret_name></code> inside the container, rather than as environment variables — these files are managed in memory rather than persisted to disk, and critically, they never appear in <code>docker inspect</code>\'s output at all, closing this exact exposure path entirely.',
        'This means the main page\'s own recommendation ("use environment variables injected at runtime... Kubernetes Secrets... mount as env vars via envFrom or env with secretKeyRef") is itself part of the exposure surface it\'s trying to avoid — a Kubernetes Secret mounted AS AN ENVIRONMENT VARIABLE is just as visible via <code>kubectl describe pod</code> / the container runtime\'s own inspect equivalent as a Docker <code>-e</code> flag is via <code>docker inspect</code>. Mounting the same Kubernetes Secret as a FILE (a volume mount) instead of an env var avoids this specific exposure path, the same way Docker\'s own file-based secrets do.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reproducing the exposure',
      language: 'bash',
      code: `# Following the main page's own recommended pattern:
docker run -d --name myapp -e DATABASE_PASSWORD=sup3rSecr3t! myapp:latest

# Anyone with docker daemon access can read it directly, in
# plaintext, with a single command -- no exploit, no vulnerability
# needed, this is INTENDED, DOCUMENTED docker behavior:
docker inspect myapp --format '{{json .Config.Env}}'
# ["DATABASE_PASSWORD=sup3rSecr3t!","PATH=/usr/local/sbin:..."]

# Even the FULL inspect output shows it in context:
docker inspect myapp | grep -A5 '"Env"'
# "Env": [
#     "DATABASE_PASSWORD=sup3rSecr3t!",
#     ...
# ]

# This works even on a STOPPED container that hasn't been
# removed yet -- the secret remains readable until "docker rm":
docker stop myapp
docker inspect myapp --format '{{json .Config.Env}}'
# ["DATABASE_PASSWORD=sup3rSecr3t!", ...]   <-- still fully visible`,
    },
    {
      label: 'The fix: file-based secrets, not environment variables',
      language: 'bash',
      code: `# Docker Swarm's own dedicated secrets mechanism -- mounted as
# a FILE, never as an environment variable:
echo "sup3rSecr3t!" | docker secret create db_password -
docker service create --name myapp \\
    --secret db_password \\
    myapp:latest
# Inside the container: cat /run/secrets/db_password
# The application reads the secret from that FILE path instead
# of from an environment variable.

# Confirm it's genuinely absent from inspect -- unlike -e, a
# Docker secret never appears in Config.Env at all:
docker inspect $(docker ps -q --filter name=myapp) \\
    --format '{{json .Config.Env}}'
# [] -- or only non-secret vars, if any were set separately

# The same principle applies to Kubernetes -- mount the Secret
# as a VOLUME, not as an env var, to avoid the equivalent
# exposure via "kubectl describe pod":
# volumeMounts:
#   - name: db-creds
#     mountPath: /run/secrets/db-password
#     readOnly: true
# volumes:
#   - name: db-creds
#     secret:
#       secretName: db-password`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own QnA guidance, a team runs `docker run -e API_KEY=live_sk_abc123... myapp:latest` in production, avoiding the "never bake secrets into images" mistake the main page specifically warns about. A security audit later flags the API key as exposed, even though the team confirms the image itself (checked via `docker history`) contains no trace of the key. Why is the audit still correct, and what is the fix that keeps the secret out of `docker inspect` entirely?',
    hint: 'The main page\'s own warning is specifically about secrets baked into IMAGE LAYERS — check whether a RUNTIME -e flag creates a completely separate, equally direct way to read the same secret, independent of anything in the image itself.',
    solution: 'The audit is correct because `docker run -e` creates its own separate exposure path, independent of the image entirely — every environment variable a container is started with (via -e or --env-file) is stored in that container\'s own configuration and is fully readable in plaintext via `docker inspect <container> --format \'{{json .Config.Env}}\'`, by anyone with access to the Docker daemon. This has nothing to do with what\'s baked into the image (which `docker history` correctly confirmed was clean) — it\'s a runtime configuration exposure, present for as long as the container exists (even stopped, until `docker rm`). The fix that avoids this specific exposure is switching from an environment variable to Docker\'s own dedicated secrets mechanism (`docker secret create` + `--secret` in a Swarm service, or the equivalent volume-mounted Secret in Kubernetes) — these are mounted as FILES inside the container rather than passed as environment variables, and file-based secrets never appear in `docker inspect`\'s `Config.Env` output at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'As long as a secret is never baked into a Docker image (only passed at runtime via -e), it is safely protected from casual exposure.',
      reality: 'Per this subtopic\'s theory, a runtime -e flag creates its own separate, equally direct exposure — every environment variable a container was started with is fully readable in plaintext via docker inspect, regardless of how clean the underlying image is.'
    },
    {
      thought: 'Injecting a Kubernetes Secret as an environment variable (via envFrom or secretKeyRef, exactly as the main page\'s own QnA describes) is meaningfully more secure than a Docker -e flag.',
      reality: 'Per this subtopic\'s theory, a Kubernetes Secret mounted as an environment variable is just as visible via kubectl describe pod (or the equivalent container-runtime inspect command) as a Docker -e flag is via docker inspect — the exposure risk is the same mechanism, just under a different orchestrator.'
    },
    {
      thought: 'Once a container using -e for a secret is stopped, the secret is no longer readable.',
      reality: 'Per this subtopic\'s theory, a stopped-but-not-removed container remains fully inspectable — docker inspect still returns its full Config.Env, secrets included, until the container is actually removed with docker rm.'
    }
  ];
}
