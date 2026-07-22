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
  templateUrl: './registry-mirror-only-intercepts-docker-hub.html',
  styleUrl: './registry-mirror-only-intercepts-docker-hub.scss'
})
export class RegistryMirrorOnlyInterceptsDockerHubSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page introduces the registry mirror in the same breath as every OTHER registry it just described',
      points: [
        'The main page\'s "Registries" theory section lists Docker Hub, GHCR, ECR/ACR/GAR, and self-hosted Harbor as a sequence of registry options — then, as the FINAL bullet in that same list, introduces the registry mirror: "configure Docker daemon with a mirror URL to cache frequently pulled base images locally and avoid rate limits."',
        'Placed as the last item in a list that just covered five different registries, the sentence never restates which of those five the mirror actually applies to. A reader could reasonably assume a configured mirror caches pulls from any of them — GHCR pulls, ECR pulls, whatever the team happens to use.',
        'Per Docker\'s own documentation, the `registry-mirrors` daemon setting has a much narrower scope than that: it is specifically a mirror of Docker Hub (docker.io) and nothing else. "It\'s currently not possible to mirror another private registry, and only the central Hub can be mirrored."',
      ]
    },
    {
      heading: 'What actually happens when a mirror is configured and you pull from a non-Hub registry',
      points: [
        'When `registry-mirrors` is set in `daemon.json` and you run `docker pull nginx:1.27-alpine` (an image with no explicit registry prefix, which the main page\'s own theory already confirms "defaults to docker.io"), the daemon consults the configured mirror first, falling back to Docker Hub directly only if the mirror doesn\'t have what\'s needed.',
        'But the moment a pull explicitly names a different registry — exactly like the main page\'s own `docker pull ghcr.io/myorg/myapp:2.3.1` example, one code tab over from where the mirror advice appears — the mirror is never consulted at all. Per Docker\'s own confirmed behavior: "If registry mirrors are configured and a user attempts to pull an image from a registry that is not Docker Hub, the mirrors are not considered."',
        'This means a team that reads the main page\'s registries section top to bottom, sets up `registry-mirrors` expecting it to speed up or reduce rate-limit pressure on their GHCR/ECR pulls (both of which appear right alongside the mirror advice on the same page), gets zero benefit from that configuration for those pulls — the mirror was only ever going to help with the small subset of pulls that had no registry prefix at all, defaulting to Docker Hub.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Which of the main page\'s own pull commands a registry mirror actually affects',
      language: 'bash',
      code: `# /etc/docker/daemon.json
# {
#   "registry-mirrors": ["https://mirror.gcr.io"]
# }
# (requires: sudo systemctl restart docker)

# ── The main page's own "Pull / Tag / Push" code tab, command by command ──

docker pull nginx:1.27-alpine
# No registry prefix -> defaults to docker.io -> MIRROR CONSULTED FIRST.
# This is the one case the configured mirror actually helps with.

docker pull ghcr.io/myorg/myapp:2.3.1
# Explicit registry (ghcr.io) -> mirror is NEVER considered at all.
# Goes straight to ghcr.io, exactly as if no mirror were configured.

docker pull nginx@sha256:a4c0cfb7a0c0dac2025ec3d4f38b8eb5f4c97c16a1b8ef3e2d7b1a4f3c2b5e6f
# No registry prefix (implicit docker.io) -> MIRROR CONSULTED FIRST,
# same as the first command.

# Only 2 of these 3 example pulls from the SAME code tab ever touch
# the configured mirror -- the ghcr.io pull is completely unaffected
# by whether registry-mirrors is set or not.`,
    },
    {
      label: 'The actual fix for caching non-Hub registries',
      language: 'bash',
      code: `# There is no dockerd-level flag that transparently caches an
# arbitrary registry like GHCR or ECR the way registry-mirrors
# caches Docker Hub. Achieving that requires a genuinely separate
# mechanism -- a proxy-caching registry deployed and pointed at
# explicitly, not a daemon.json setting.

# Example: running a pull-through cache with the reference
# registry:2 image, configured as a Hub mirror (this specific
# setup only mirrors docker.io, same scope limitation as before):
# docker run -d -p 5000:5000 \\
#   -e REGISTRY_PROXY_REMOTEURL=https://registry-1.docker.io \\
#   registry:2

# For GHCR/ECR/ACR specifically, the correct approach is either:
# (1) each cloud provider's own pull-through-cache feature for
#     THEIR registry (e.g. ECR's own pull-through cache rules,
#     which explicitly proxy specific upstream registries), or
# (2) a dedicated caching registry product (Harbor's proxy cache
#     projects, JFrog Artifactory) configured with an explicit
#     upstream per registry -- not a single blanket daemon setting.

# The key distinction from registry-mirrors: these all require
# EXPLICITLY pointing pulls at the cache's own address (e.g.
# docker pull my-cache.internal/ghcr-proxy/myorg/myapp:2.3.1)
# rather than transparently intercepting a pull already addressed
# to ghcr.io the way registry-mirrors intercepts docker.io pulls.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team configures registry-mirrors on every CI runner, expecting it to reduce their GHCR pull rate-limit pressure — most of their CI pipelines pull base images with no registry prefix (implicitly docker.io) but pull the team\'s own application images from ghcr.io. After rollout, rate-limit errors on the docker.io pulls disappear, but GHCR rate-limit errors continue exactly as before. Using this subtopic\'s theory, explain why, and what the team would need to do differently to actually address the GHCR pulls.',
    hint: 'Per this subtopic\'s theory, does the configured registry-mirrors setting apply to every pull the daemon performs, or only to pulls resolving to one specific registry?',
    solution: 'Per this subtopic\'s theory, this is exactly the expected outcome, not a misconfiguration — registry-mirrors only ever intercepts pulls that resolve to Docker Hub (docker.io), which is why the no-prefix base-image pulls (implicitly docker.io) correctly started routing through the mirror and stopped hitting Docker Hub\'s own rate limits. The GHCR pulls, addressed explicitly to ghcr.io, were never eligible for the mirror in the first place — per Docker\'s own documented behavior, the daemon does not consider configured mirrors at all once a pull names a non-Hub registry explicitly, so nothing about setting registry-mirrors could have ever helped with GHCR rate limits, regardless of how the setting was configured. To actually address the GHCR pulls, the team needs a genuinely different mechanism — either GHCR/GitHub\'s own rate-limit mitigation options (authenticating pulls, which raises the limit, rather than trying to cache them), or standing up an explicit proxy-caching registry pointed at ghcr.io as its upstream and updating pull commands to reference that cache\'s own address — not another daemon.json setting, since no such transparent-interception mechanism exists for non-Hub registries.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Configuring registry-mirrors in daemon.json speeds up or caches pulls from any registry the team commonly uses — Docker Hub, GHCR, ECR, or a private registry.',
      reality: 'Per this subtopic\'s theory, registry-mirrors specifically and exclusively mirrors Docker Hub (docker.io) — Docker\'s own documentation confirms it is "currently not possible to mirror another private registry, and only the central Hub can be mirrored." Pulls explicitly addressed to any other registry never consult the configured mirror at all.'
    },
    {
      thought: 'Since the main page lists the registry mirror right alongside GHCR, ECR, ACR, and GAR in its own Registries section, it must be a general-purpose caching mechanism that works with all of them.',
      reality: 'Per this subtopic\'s theory, the mirror bullet sits in that list purely as one more registry-related concept, not because it applies to every registry mentioned nearby — of the main page\'s own example pull commands, only the ones with NO explicit registry prefix (implicitly docker.io) are ever affected by a configured mirror.'
    },
    {
      thought: 'If a configured registry mirror isn\'t reducing rate-limit errors for a non-Hub registry like GHCR, the mirror is probably misconfigured and needs troubleshooting.',
      reality: 'Per this subtopic\'s exercise, this is expected, correct behavior, not a misconfiguration — registry-mirrors was never going to affect GHCR pulls under any configuration, since the daemon does not consider configured mirrors at all for pulls resolving to a registry other than Docker Hub.'
    }
  ];
}
