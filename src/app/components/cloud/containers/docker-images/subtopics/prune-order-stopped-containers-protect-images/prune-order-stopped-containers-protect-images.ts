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
  templateUrl: './prune-order-stopped-containers-protect-images.html',
  styleUrl: './prune-order-stopped-containers-protect-images.scss'
})
export class PruneOrderStoppedContainersProtectImagesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz answer says "referenced by any container" without saying which containers count',
      points: [
        'The main page\'s own quiz explanation for `docker image prune -a` says it removes "tagged images not currently referenced by any container." Read on its own, "any container" sounds like it could mean either "any running container" or "any container in any state" — the page never disambiguates.',
        'The main page\'s own CI cleanup mistake entry treats `docker image prune -a -f` as a self-contained cleanup step: "After build/push step in CI pipeline: docker image prune -a -f --filter \'until=24h\'." Nothing about this instruction depends on, or mentions, what state any OTHER containers on the same host are in.',
        'That framing hides a real dependency. Per Docker\'s own documentation, an image counts as "referenced" by ANY container that still exists on the host — running OR stopped/exited — not just running ones. A stopped container that nobody has removed yet still protects the image it was created from.',
      ]
    },
    {
      heading: 'Why this makes cleanup ORDER matter, in a way the main page\'s own single-command examples never surface',
      points: [
        'Because stopped containers count as "references," running `docker container prune` (removing stopped containers) BEFORE `docker image prune -a` on the same host changes what the image prune actually does — images that were previously protected by a now-deleted stopped container become eligible for removal the moment that container is gone.',
        'This means the exact same `docker image prune -a -f` command, run twice on hosts that are otherwise identical except for whether stopped containers were cleared first, can remove a meaningfully different (and larger, in the "containers cleared first" case) set of images. The command itself never changes; its effect depends on host state the command\'s own output gives no advance warning about.',
        'The main page\'s own separate `docker system prune -f` (mentioned as part of general batch cleanup on the sibling Docker CLI page) removes stopped containers AND unused images together in one call — which sidesteps the ordering question entirely by doing both in the same pass, rather than running two separate prune commands where the order between them changes the outcome.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The same image prune command, two different outcomes depending on what ran first',
      language: 'bash',
      code: `# Starting state: 3 stopped containers, each created from a
# DIFFERENT tagged image no longer referenced by anything else.
docker ps -a
# CONTAINER   IMAGE            STATUS
# c1          myapp:2.1.0      Exited (0) 3 days ago
# c2          myapp:2.0.0      Exited (1) 5 days ago
# c3          myapp:1.9.0      Exited (0) 10 days ago

# ── Path A: image prune WITHOUT clearing stopped containers first ─────────
docker image prune -a -f
# Per Docker's own definition, myapp:2.1.0 / 2.0.0 / 1.9.0 are all
# still "referenced" -- each has a stopped container (c1/c2/c3)
# still pointing at it. NONE of them are removed by this call.

# ── Path B: docker container prune FIRST, then the same image prune ──────
docker container prune -f
# Removes c1, c2, c3 (all stopped, none running).

docker image prune -a -f
# NOW myapp:2.1.0 / 2.0.0 / 1.9.0 have zero container references
# left at all -- this exact same command now removes all three.
#
# Same "docker image prune -a -f" command. Same starting images.
# Different result, purely because of what ran immediately before it.`,
    },
    {
      label: 'Sidestepping the ordering question entirely',
      language: 'bash',
      code: `# docker system prune -f clears stopped containers AND dangling
# images together in ONE pass -- there is no "which order did I run
# these two commands in" question, because it's a single call:
docker system prune -f
# Removes: stopped containers, dangling images, unused networks,
# build cache -- all evaluated together, not as two sequential
# commands whose relative order changes the final state.

# If the goal genuinely IS "remove every image not currently backing
# a RUNNING container, regardless of any stopped containers lying
# around," clear stopped containers first, on purpose, then prune
# images -- but do it as a DELIBERATE two-step sequence, not by
# accident because a scheduled job happens to run in that order:
docker container prune -f      # intentional: drop stopped containers first
docker image prune -a -f       # now aggressively cleans images too
# CI pipelines that only ever call image prune (never container
# prune) will consistently under-clean compared to one that also
# clears containers -- worth checking which one a scheduled cleanup
# job is actually doing before assuming disk usage should be low.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A CI runner has a nightly cron job running `docker image prune -a -f --filter "until=24h"` (matching the main page\'s own mistake-entry fix), yet disk usage keeps climbing week over week despite the job reporting success every night with no errors. Using this subtopic\'s theory, what is a plausible explanation, and what single additional command would most directly test it?',
    hint: 'Per this subtopic\'s theory, does a stopped (but not removed) container protect the image it was created from — and does the nightly job ever address stopped containers at all?',
    solution: 'Per this subtopic\'s theory, a plausible explanation is that the CI runner is accumulating stopped containers from every build (each build creates a container that exits when the job finishes but is never explicitly removed), and each of those stopped containers is protecting its own image from the nightly `docker image prune -a -f` — the job genuinely succeeds every night, but it can only ever remove images with zero container references of ANY kind, and a growing pile of stopped containers keeps expanding the set of "protected" images the job is not allowed to touch. The single most direct test: run `docker ps -a | wc -l` (or `docker ps -a --filter status=exited | wc -l`) to check whether stopped containers are piling up on the runner — a large and growing count strongly supports this explanation. The fix is adding `docker container prune -f` (or switching to `docker system prune -a -f`, which handles both together) to the same nightly job, so stopped containers stop protecting images that would otherwise be safely removable.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'docker image prune -a removes any image not backed by a currently RUNNING container — a stopped container from a prior run does not protect its image.',
      reality: 'Per this subtopic\'s theory, Docker\'s own definition of "referenced" for pruning purposes includes containers in ANY state, not just running ones — a stopped, unremoved container protects the image it came from exactly as effectively as a running one would.'
    },
    {
      thought: 'Running docker image prune -a -f on a schedule is a self-contained cleanup step whose effect depends only on the command itself, not on anything else happening on the host.',
      reality: 'Per this subtopic\'s exercise, the exact same command can remove a very different (and much smaller, if stopped containers are accumulating) set of images depending entirely on host state it has no visibility into or control over — specifically, how many stopped containers currently exist and what images they reference.'
    },
    {
      thought: 'Running docker container prune before docker image prune -a, versus running them in the opposite order, produces the same final disk state either way — pruning is pruning.',
      reality: 'Per this subtopic\'s theory, order matters directly: clearing stopped containers FIRST frees their images to be removed by the subsequent image prune, while running image prune first (with those containers still present) leaves those same images protected and untouched.'
    }
  ];
}
