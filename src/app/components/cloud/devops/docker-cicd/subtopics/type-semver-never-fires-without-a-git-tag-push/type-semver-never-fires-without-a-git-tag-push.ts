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
  templateUrl: './type-semver-never-fires-without-a-git-tag-push.html',
  styleUrl: './type-semver-never-fires-without-a-git-tag-push.scss'
})
export class TypeSemverNeverFiresWithoutAGitTagPushSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own workflow includes a semver tag rule its own trigger configuration can never satisfy',
      points: [
        'The main page\'s own GitHub Actions workflow\'s `on:` block triggers only on `push: branches: [main, development]` and `pull_request: branches: [main]`. A few lines later, the same workflow\'s `docker/metadata-action@v5` step lists three tag rules: `type=sha,format=short`, `type=semver,pattern={{version}}`, and `type=ref,event=branch` — presented as three tags this workflow will generate, with no distinction drawn between them.',
        'docker/metadata-action\'s own documentation states the semver rule\'s precondition directly: it "will be used on a push tag event and requires a valid semver Git tag." A "push tag event" specifically means the workflow was triggered by pushing a GIT TAG (e.g. `git tag v1.2.3 && git push --tags`) — not a branch push and not a pull request, the only two trigger types the main page\'s own `on:` block actually configures.',
      ]
    },
    {
      heading: 'The practical consequence: this workflow, exactly as written, never emits a semver-formatted image tag',
      points: [
        'Because the main page\'s own workflow has no `on: push: tags:` trigger at all, the `type=semver` rule in its metadata-action config is effectively dead configuration — every build this workflow ever runs is triggered by a branch push or a PR, and per docker/metadata-action\'s own documented precondition, the semver rule only activates on a tag-push event that this workflow can never receive.',
        'The other two rules in the same config work exactly as intended precisely because they don\'t share this precondition: `type=sha,format=short` and `type=ref,event=branch` both fire on ordinary branch pushes, which is why every image this workflow actually builds gets a SHA tag and a branch-name tag — just never the semver tag the config visually promises alongside them.',
        'This is not a bug that breaks the pipeline — the workflow still runs, still builds, still pushes with two working tag types — it\'s a piece of configuration that looks functional and reads as intentional (someone deliberately typed `type=semver,pattern={{version}}`) but is actually inert given how this specific workflow is triggered, the kind of gap that survives code review because nothing about it looks wrong on its own.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Three tag rules, but only two can ever actually fire in this workflow',
      language: 'bash',
      code: `# The main page's own workflow trigger -- no tag-push trigger at all:
# on:
#   push:
#     branches: [main, development]
#   pull_request:
#     branches: [main]

# The main page's own metadata-action config:
# - name: Extract metadata (tags, labels)
#   uses: docker/metadata-action@v5
#   with:
#     images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
#     tags: |
#       type=sha,format=short        # fires on branch push -- WORKS
#       type=semver,pattern={{version}}  # requires a TAG push -- NEVER FIRES
#       type=ref,event=branch        # fires on branch push -- WORKS

# Pushing a commit to 'main' with this exact workflow produces
# image tags like:
#   ghcr.io/myorg/myapp:abc1234   (from type=sha)
#   ghcr.io/myorg/myapp:main      (from type=ref,event=branch)
#
# It NEVER produces something like:
#   ghcr.io/myorg/myapp:1.2.3     (this is what type=semver would
#                                   generate, but only from a tag
#                                   push this workflow never receives)`,
    },
    {
      label: 'The fix -- adding the trigger the semver rule actually needs',
      language: 'bash',
      code: `# To make type=semver,pattern={{version}} actually produce a tag,
# the workflow's own trigger needs a tags: entry, per
# docker/metadata-action's own documented precondition ("will be
# used on a push tag event"):

# on:
#   push:
#     branches: [main, development]
#     tags: ['v*.*.*']             # <-- the missing piece
#   pull_request:
#     branches: [main]

# Now, pushing a git tag matching that pattern:
#   git tag v1.2.3
#   git push origin v1.2.3
#
# ...triggers this workflow via the NEW tags: entry, and per
# docker/metadata-action's own docs, THIS specific trigger type is
# what activates the semver rule -- producing:
#   ghcr.io/myorg/myapp:1.2.3     (from type=semver, now genuinely
#                                   fires, matching the tag pushed)
#   ghcr.io/myorg/myapp:abc1234   (type=sha still fires too)

# Ordinary branch pushes to main/development still behave exactly
# as before -- SHA and branch-name tags only, no semver tag,
# because those pushes still aren't tag-push events.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team copies the main page\'s own exact GitHub Actions workflow, expecting that after every merge to main, a new semver-tagged image (like `myapp:1.2.3`) appears in their registry alongside the SHA-tagged one. Weeks later, they notice no semver-tagged image has EVER been pushed, despite dozens of successful workflow runs and the config visibly including `type=semver,pattern={{version}}`. Using this subtopic\'s theory, explain why, and the one-line fix.',
    hint: 'Per this subtopic\'s theory, does docker/metadata-action\'s type=semver rule fire on ANY successful workflow run, or does it require a SPECIFIC kind of trigger event — and does the main page\'s own on: block include that trigger at all?',
    solution: 'No semver-tagged image has ever appeared because, per this subtopic\'s theory, docker/metadata-action\'s own docs state the semver rule "will be used on a push tag event and requires a valid semver Git tag" — it only activates when the workflow is triggered by pushing a GIT TAG, not by an ordinary branch push or merge. The main page\'s own `on:` block (which this team copied exactly) only configures `push: branches: [...]` and `pull_request` triggers — there is no `tags:` entry at all, meaning this workflow can never actually receive the specific trigger event the semver rule requires. Every one of the team\'s "dozens of successful workflow runs" was a branch-push-triggered run, so the SHA and branch-name tags fired correctly (their own preconditions were met) while the semver rule silently never had a chance to activate. The fix is adding a `tags:` pattern (e.g. `tags: [\'v*.*.*\']`) under the `push:` trigger, and then actually pushing a matching git tag (`git push origin v1.2.3`) to trigger a run that satisfies the semver rule\'s precondition — merging to main alone will never do it, no matter how many times it happens.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Listing `type=semver,pattern={{version}}` in a docker/metadata-action config guarantees a semver-formatted tag gets produced on every successful workflow run, the same way the sha and ref rules do.',
      reality: 'Per this subtopic\'s theory, docker/metadata-action\'s own docs describe a specific precondition for the semver rule — it only fires on a push TAG event, not any workflow trigger. Unlike `type=sha` and `type=ref,event=branch`, which fire on ordinary branch pushes, `type=semver` can silently never activate if the workflow\'s own trigger configuration never includes a tag push.'
    },
    {
      thought: 'If a docker/metadata-action config includes a tag rule that never actually fires, the workflow would visibly fail or produce an error, making the gap easy to catch.',
      reality: 'This subtopic\'s theory shows the opposite — the main page\'s own workflow runs successfully every time, pushes real images with two working tags (sha and ref), and never errors. The unfired semver rule produces no warning at all; the only way to notice is checking the registry for a tag format that never actually appears.'
    },
    {
      thought: 'Since the main page\'s own workflow config includes type=semver alongside two other tag rules, all three are presented as equally reliable, equally-tested parts of the same working pipeline.',
      reality: 'Per this subtopic\'s theory, the three rules have genuinely different activation preconditions baked into docker/metadata-action itself — two of them match this specific workflow\'s actual trigger configuration and reliably fire; the third has a precondition this workflow\'s `on:` block never satisfies, making it silently inert despite looking identical in the config to the working ones.'
    }
  ];
}
