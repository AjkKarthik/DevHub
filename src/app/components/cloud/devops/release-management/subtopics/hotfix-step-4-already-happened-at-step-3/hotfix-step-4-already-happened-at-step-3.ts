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
  templateUrl: './hotfix-step-4-already-happened-at-step-3.html',
  styleUrl: './hotfix-step-4-already-happened-at-step-3.scss'
})
export class HotfixStep4AlreadyHappenedAtStep3Subtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own hotfix steps and its own tag-triggered release workflow sit in the SAME code tab — but are never connected in words',
      points: [
        'The main page\'s "CHANGELOG & Hotfix Process" code tab lists a six-step hotfix process. Step 3 is "Tag the hotfix release" (`git tag -a v2.4.1 ...` then `git push origin v2.4.1`). Step 4 is its own separate bullet: "# 4. Deploy v2.4.1 to production" — with no command underneath it at all, unlike every other step in the list.',
        'The blank space under step 4 reads like a placeholder for "whatever your deploy process is" — a reasonable assumption, since deployment mechanics vary by project and the page hasn\'t shown one yet at this point in the tab.',
        'But the SAME code tab, just a few lines further down, shows exactly that mechanism: a "Release workflow on tag push" section with `on: push: tags: [\'v*.*.*\']`, running `npm publish --access public` and creating a GitHub Release with `dist/**/*`. The main page places this workflow in the same tab as the hotfix steps without ever pointing out that it is the answer to step 4\'s blank line.',
      ]
    },
    {
      heading: 'Tracing what actually happens: step 3\'s tag push IS the trigger for step 4\'s own workflow',
      points: [
        'The hotfix\'s own step 3 pushes a tag matching the pattern `v2.4.1` — which matches the release workflow\'s own trigger glob, `v*.*.*`, exactly. The instant `git push origin v2.4.1` completes, GitHub starts that release workflow automatically — before a human has done anything that could be described as "step 4."',
        'For a project that publishes to npm (the scenario the main page\'s own release workflow is written for), "deploy v2.4.1 to production" and "npm publish --access public" are the same action for a published package — publishing the new version to the registry IS the production release. That workflow\'s `npm publish` step, triggered automatically by step 3\'s tag push, is what step 4 describes.',
        'This means the hotfix process, as the main page\'s own two adjacent code blocks actually combine, has no manual step 4 at all for a project wired this way — by the time `git push origin v2.4.1` finishes, the release workflow is already running, and by the time a person could act on a literal "now deploy" instruction, the deploy (publish) has typically already happened. Listing it as its own numbered step, with no command, invites treating it as a separate manual action it is not — for THIS specific setup.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Step 3 and the release workflow, side by side (both from the SAME main-page code tab)',
      language: 'bash',
      code: `# ── Hotfix step 3 (the main page's own steps) ────────────────────────────
git tag -a v2.4.1 -m "Hotfix: payment null crash"
git push origin v2.4.1

# ── Hotfix step 4, as written on the main page ───────────────────────────
# 4. Deploy v2.4.1 to production
#    (no command shown here at all)

# ── The main page's own release workflow, later in the SAME tab ─────────
# .github/workflows/release.yml
# on:
#   push:
#     tags: ['v*.*.*']
# steps:
#   - run: npm test
#   - run: npm run build
#   - run: npm publish --access public
#   - uses: softprops/action-gh-release@v2
#     with:
#       body_path: CHANGELOG_FRAGMENT.md
#       files: dist/**/*

# 'v2.4.1' matches the glob 'v*.*.*' exactly -- the tag push in step 3
# is what starts this workflow. There is no gap between "step 3
# finishes" and "the release workflow begins."`,
    },
    {
      label: 'What actually happens on the timeline, in order',
      language: 'bash',
      code: `# Real event order once "git push origin v2.4.1" is run:
#
# t+0s   git push origin v2.4.1 completes locally
# t+1s   GitHub receives the new tag ref
# t+2s   GitHub Actions sees a push matching tags: ['v*.*.*'],
#        starts the release.yml workflow
# t+~30s npm test / npm run build finish
# t+~40s npm publish --access public completes
#        -- v2.4.1 is now live on the npm registry
# t+~45s GitHub Release created with CHANGELOG_FRAGMENT.md notes
#
# "Step 4: Deploy v2.4.1 to production" was never a separate human
# action to perform -- for a project wired with this exact release
# workflow, it is the label the main page put on something that was
# ALREADY IN PROGRESS, automatically, by t+2s. A person reading the
# hotfix steps top to bottom and pausing at step 4 to go run a deploy
# command would typically find the deploy already finished.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A developer follows the main page\'s own six-step hotfix process for a project that already has the tag-triggered release.yml workflow (also shown on the main page) configured. After completing step 3 (tagging and pushing v2.4.1), they open a deployment runbook and start manually running deploy commands for step 4, worried that "nothing happens automatically." Using this subtopic\'s theory, what is most likely already true by the time they start those manual commands, and what real risk does manually deploying anyway create?',
    hint: 'Per this subtopic\'s theory, what specific event, already completed at the end of step 3, is what actually starts the workflow that performs step 4\'s own action?',
    solution: 'Per this subtopic\'s theory, the release workflow was already triggered the moment the v2.4.1 tag push in step 3 completed — by the time the developer opens a runbook and starts manually deploying, the automated workflow\'s npm publish step is likely already running or already finished. The real risk isn\'t that step 4 goes undone; it\'s the opposite — a manual deploy running concurrently with (or after) the same release already being published automatically can mean the same version gets published twice (the second npm publish attempt for an already-published version number fails, since npm rejects republishing an existing version — a confusing, unnecessary CI failure notification for a release that actually already succeeded), or, for a project with a genuinely separate manual deploy step beyond npm publish, doing that work twice wastes effort without adding any missing action. The fix isn\'t a different manual process — it\'s recognizing that for a project wired with this tag-triggered workflow, step 4 was never a distinct action to perform; it is what step 3\'s tag push already set in motion, and the correct move is to check the workflow run\'s status rather than start deploying by hand.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The hotfix process\'s "4. Deploy v2.4.1 to production" step is a separate, manual action a person needs to go perform after tagging the release.',
      reality: 'Per this subtopic\'s theory, tracing the main page\'s own two adjacent code blocks in the same tab shows that pushing the v2.4.1 tag in step 3 already matches the release workflow\'s own `tags: [\'v*.*.*\']` trigger — the workflow (including the npm publish that IS the production deploy for a published package) starts automatically, before step 4 is ever manually acted on.'
    },
    {
      thought: 'Because step 4 has no command shown underneath it, unlike every other numbered step in the hotfix list, it must require external tooling the page simply doesn\'t cover.',
      reality: 'Per this subtopic\'s theory, the command IS shown on the main page — just several lines further down, in the same code tab\'s own separately-labeled release workflow section, connected to step 4 only by the fact that its tag-push trigger matches what step 3 already did.'
    },
    {
      thought: 'Running the deploy manually as well, just to be safe, after already pushing the hotfix tag, causes no harm even if an automated workflow is also configured.',
      reality: 'Per this subtopic\'s exercise, doing so risks a real, confusing failure — a manual npm publish attempt for a version the automated workflow already published fails outright (npm rejects republishing an existing version number), turning an already-successful release into a false-alarm CI failure notification.'
    }
  ];
}
