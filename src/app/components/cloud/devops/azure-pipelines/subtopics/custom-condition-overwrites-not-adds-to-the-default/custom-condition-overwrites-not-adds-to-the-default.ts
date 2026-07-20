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
  templateUrl: './custom-condition-overwrites-not-adds-to-the-default.html',
  styleUrl: './custom-condition-overwrites-not-adds-to-the-default.scss'
})
export class CustomConditionOverwritesNotAddsToTheDefaultSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz condition writes and(succeeded(), ...) without ever explaining why the succeeded() half is necessary',
      points: [
        'One of the main page\'s own quiz questions uses a condition shaped like <code>and(succeeded(), eq(variables[\'Build.SourceBranch\'], \'refs/heads/main\'))</code>. A reasonable reading is that <code>succeeded()</code> is just belt-and-braces caution — after all, doesn\'t a stage only run after its dependencies succeed anyway, condition or not?',
        'Per Microsoft\'s own Azure Pipelines documentation, that reasonable-sounding assumption is wrong once ANY <code>condition:</code> is written: "By default, a stage runs if it doesn\'t depend on any other job or stage, or if all its dependencies completed and succeeded... If you customize the default condition of the preceding steps for a stage, you remove the conditions for completion and success." A custom condition doesn\'t layer ON TOP of the implicit success check — it entirely REPLACES it.',
        'This is stated even more directly elsewhere in the same documentation set: "Important: When you specify a <code>condition</code> property for a stage, job, or step, you overwrite the default condition. Your stage, job, or step might run even if the build is canceled." Writing <code>condition: eq(variables[\'Build.SourceBranch\'], \'refs/heads/main\')</code> alone — with no <code>succeeded()</code> — makes that stage run on the main branch REGARDLESS of whether the previous stage failed, or was even canceled.',
      ]
    },
    {
      heading: 'Why this silently defeats the whole point of the main page\'s own "deploy only from push to main" fix',
      points: [
        'The main page\'s own mistake entry recommends gating a production deploy stage on the main branch. If that gate is written as a bare branch-name condition with no <code>succeeded()</code>, per Microsoft\'s own docs a canceled or failed build stage will NOT prevent the deploy stage from running, because the implicit success/completion check was silently discarded the moment a custom condition was written at all — the branch check succeeding is the ONLY thing left gating the deploy.',
        'Microsoft\'s own guidance is explicit about the fix: "So, if you use a custom condition, it\'s common to use <code>and(succeeded(),custom_condition)</code> to check whether the preceding stage ran successfully. Otherwise, the stage runs regardless of the outcome of the preceding stage." This is exactly the shape of the main page\'s own quiz condition — but the quiz never explains that omitting the <code>succeeded()</code> half would have been a real, exploitable gap, not just redundant caution.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Same branch check, two very different safety guarantees',
      language: 'bash',
      code: `# stages:
# - stage: Build
#   jobs:
#   - job: BuildJob
#     steps:
#     - script: exit 1   # this build FAILS on purpose

# - stage: Deploy
#   dependsOn: Build

#   # VERSION 1 -- looks like a safe main-branch-only gate.
#   # condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
#   #
#   # Per Microsoft's own docs, writing ANY custom condition removes
#   # the implicit "Build must have succeeded" check. On the main
#   # branch, this Deploy stage runs EVEN THOUGH Build just failed --
#   # the bare branch condition says nothing about Build's outcome
#   # at all, and there is no longer an implicit check filling that
#   # gap once a custom condition exists.

#   # VERSION 2 -- the main page's own quiz shape, actually safe.
#   condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
#   #
#   # succeeded() explicitly re-adds back the exact check that was
#   # silently lost the moment a condition was written at all --
#   # Deploy only runs on main AND only if Build succeeded.`,
    },
    {
      label: 'Cancellation makes the gap even more visible',
      language: 'bash',
      code: `# Per Microsoft's own docs: "When you specify a condition property
# for a stage, job, or step, you overwrite the default condition.
# Your stage, job, or step might run even if the build is canceled."

# stages:
# - stage: Build
#   jobs:
#   - job: BuildJob
#     steps:
#     - script: sleep 60   # someone cancels the run while this stage
#                          # is still in progress

# - stage: Deploy
#   dependsOn: Build
#   condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
#   # Cancel the run above while Build is running, on the main
#   # branch -- Deploy STILL starts, because this bare condition
#   # has no job-status-check function (succeeded/failed/always) in
#   # it at all, and per Microsoft's own docs, that's the exact
#   # trigger for their own documented FAQ: "Why is my build still
#   # running after I canceled it? ... a condition configured in a
#   # stage doesn't include a job status check function."`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A pipeline has a Deploy stage with <code>condition: eq(variables[\'Build.SourceBranch\'], \'refs/heads/main\')</code> and no <code>dependsOn</code>-related job status function anywhere in that condition. The Build stage it should depend on fails. On the main branch, does Deploy still run? Using this subtopic\'s theory, explain why or why not, and state the one-line fix.',
    hint: 'Per this subtopic\'s theory, does writing ANY custom <code>condition:</code> preserve the implicit "previous stage must succeed" check, or does it replace it entirely?',
    solution: 'Yes, Deploy still runs, even though Build failed. Per this subtopic\'s theory, Microsoft\'s own docs state that specifying a <code>condition</code> property "removes the conditions for completion and success" that would otherwise apply by default — a custom condition doesn\'t add to the implicit success check, it REPLACES it entirely. The condition <code>eq(variables[\'Build.SourceBranch\'], \'refs/heads/main\')</code> says nothing about Build\'s outcome at all, so on the main branch it evaluates to true regardless of whether Build succeeded, failed, or was even canceled. The fix, per Microsoft\'s own recommended pattern, is <code>condition: and(succeeded(), eq(variables[\'Build.SourceBranch\'], \'refs/heads/main\'))</code> — explicitly re-including <code>succeeded()</code> restores the safety check that was silently lost the moment any custom condition was introduced.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A stage or job always waits for its dependencies to succeed before running, no matter what <code>condition:</code> you write — the condition just adds an extra check on top.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs are explicit that writing ANY custom condition "removes the conditions for completion and success" that applied by default. A condition doesn\'t layer on top of the implicit success check — it fully replaces it, meaning a bare branch-name condition alone provides zero protection against a failed or canceled dependency.'
    },
    {
      thought: 'Adding <code>succeeded()</code> to a condition like <code>and(succeeded(), eq(...))</code> is just defensive redundancy, since the platform already enforces that dependencies must succeed.',
      reality: 'This subtopic\'s first code example shows the opposite is true once a custom condition exists at all — <code>succeeded()</code> is doing real, load-bearing work, restoring a safety check that the mere presence of any other condition would otherwise silently discard. Per Microsoft\'s own recommended pattern, this is exactly why they say "it\'s common to use <code>and(succeeded(),custom_condition)</code>."'
    },
    {
      thought: 'Canceling a pipeline run stops every stage that hasn\'t started yet, regardless of how its condition is written.',
      reality: 'This subtopic\'s second code example, grounded directly in Microsoft\'s own documented FAQ ("Why is my build still running after I canceled it?"), shows a stage without a job status check function (like <code>succeeded()</code>, <code>failed()</code>, or <code>always()</code>) in its condition can keep running even after the build is canceled — cancellation-safety isn\'t automatic once a custom condition exists, it has to be explicitly included.'
    }
  ];
}
