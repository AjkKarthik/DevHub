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
  templateUrl: './stages-depend-on-whatever-stage-came-right-before-them.html',
  styleUrl: './stages-depend-on-whatever-stage-came-right-before-them.scss'
})
export class StagesDependOnWhateverStageCameRightBeforeThemSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own theory says "stages run sequentially by default" — sequential relative to WHAT is the missing half',
      points: [
        'The main page\'s own "Stages, Jobs & Dependencies" theory section states that stages run sequentially by default, contrasted with jobs, which run in parallel within a stage. That is accurate as far as it goes, but it doesn\'t say what a stage is actually sequenced AGAINST — a reader could reasonably assume "sequential" means "waits for every previously-defined stage" or "waits for the very first stage," rather than one specific stage.',
        'Per Microsoft\'s own Azure Pipelines documentation: "When you define multiple stages in a pipeline, they run sequentially by default in the order you define them in the YAML file... If you don\'t use a <code>dependsOn</code> keyword, stages run in the order they\'re defined." The real rule is narrower and more mechanical than "sequential" implies: each stage without an explicit <code>dependsOn</code> depends on exactly ONE thing — whichever stage is written immediately above it in the YAML file.',
      ]
    },
    {
      heading: 'Reordering stages in the YAML changes the dependency graph, even if no dependsOn key is touched at all',
      points: [
        'Because the implicit dependency is positional (based on YAML order), simply moving a stage block to a different position in the file silently changes what it waits for — no <code>dependsOn</code> line has to change for the pipeline\'s actual behavior to change. A stage moved to be first in the file loses its implicit dependency entirely; a stage moved to be immediately after a different stage now implicitly depends on THAT one instead.',
        'To make a stage run in parallel with the one before it — rather than sequentially after it — Microsoft\'s own docs show the fix isn\'t reordering at all, but an explicit empty dependency list: "<code>dependsOn: []</code> # Runs in parallel with FunctionalTest". An empty <code>dependsOn</code> array doesn\'t mean "use the default" — it explicitly means "this stage has NO dependencies," overriding the implicit positional default entirely, letting it start immediately alongside the pipeline\'s other independent stages.',
        'Microsoft\'s own docs also show this composes into genuine fan-out/fan-in graphs: <code>dependsOn: Test</code> on two different stages makes both of them run in parallel with EACH OTHER once <code>Test</code> finishes, and a later stage with <code>dependsOn: [DeployUS1, DeployUS2]</code> then waits for both of those to complete before it starts — a shape that has nothing to do with the stages\' order in the file once every <code>dependsOn</code> is written explicitly.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reordering alone changes the dependency graph — no dependsOn touched',
      language: 'bash',
      code: `# BEFORE -- Test implicitly depends on Build (the stage right
# above it); Deploy implicitly depends on Test.
# stages:
# - stage: Build
# - stage: Test
# - stage: Deploy

# AFTER -- someone reorders the file to put Deploy's config near
# the top for readability, touching zero dependsOn keys:
# stages:
# - stage: Deploy      # <-- now FIRST. Implicitly depends on
#                       #     NOTHING at all -- it will start
#                       #     immediately, in parallel with Build,
#                       #     instead of waiting for Test to finish.
# - stage: Build
# - stage: Test         # <-- now implicitly depends on Deploy,
#                       #     not Build.

# Per Microsoft's own docs ("stages run sequentially... in the
# order you define them in the YAML file"), this reordering is a
# genuine, silent behavior change -- Deploy running before Test
# even starts is very unlikely to be what was intended.`,
    },
    {
      label: 'dependsOn: [] for genuine parallelism, and a real fan-out/fan-in graph',
      language: 'bash',
      code: `# Microsoft's own documented example of two stages running in
# parallel with EACH OTHER, both starting immediately:
# stages:
# - stage: FunctionalTest
# - stage: AcceptanceTest
#   dependsOn: []   # explicitly "no dependencies" -- NOT the same
#                   # as omitting dependsOn, which would implicitly
#                   # depend on FunctionalTest instead.

# Microsoft's own documented fan-out / fan-in shape:
# stages:
# - stage: Test
# - stage: DeployUS1
#   dependsOn: Test        # runs after Test
# - stage: DeployUS2
#   dependsOn: Test        # runs in PARALLEL with DeployUS1,
#                          # both after Test
# - stage: DeployEurope
#   dependsOn:              # runs after BOTH DeployUS1 and
#   - DeployUS1              # DeployUS2 have completed
#   - DeployUS2

# None of this fan-out/fan-in shape is reachable through stage
# ORDERING alone -- once a pipeline needs anything more than a
# single straight line, every dependsOn has to be written out
# explicitly.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A pipeline has three stages in this order: Lint, Build, Deploy — none of them have an explicit <code>dependsOn</code>. A teammate wants Lint to run in parallel with Build (since linting doesn\'t need the build output), while Deploy should still wait for Build specifically. They ask whether just moving the Lint stage block below Build in the YAML file achieves this. Using this subtopic\'s theory, is that correct, and what should they do instead?',
    hint: 'Per this subtopic\'s theory, does reordering stages in the YAML file ever produce genuine PARALLEL execution, or does it only ever change which single stage something depends on sequentially?',
    solution: 'No, that\'s not correct — per this subtopic\'s theory, the implicit default dependency is always on exactly one stage (whichever is immediately above it in the file), so moving Lint below Build would just make Lint implicitly depend on Build sequentially instead of Deploy — Lint and Build still never run in parallel, the sequential chain just gets reordered. To make Lint genuinely run in parallel with Build, Microsoft\'s own documented fix is an explicit <code>dependsOn: []</code> on the Lint stage — "Runs in parallel with" whatever the pipeline\'s other independent stage is — regardless of Lint\'s position in the file. Deploy, meanwhile, should keep an explicit <code>dependsOn: Build</code> rather than relying on file position at all, since once Lint\'s dependency is made explicit, Deploy\'s implicit "whatever\'s right above it" default could easily end up depending on the wrong stage depending on how the file gets reordered later.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'When the main page says "stages run sequentially by default," it means every stage waits for every previously-defined stage to finish before it can start.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs describe a narrower, positional rule: without an explicit <code>dependsOn</code>, a stage depends on exactly ONE stage — whichever one is written immediately above it in the YAML file — not on every prior stage collectively.'
    },
    {
      thought: 'Reordering stage blocks in the YAML file is purely cosmetic — it changes what order they appear in an editor or the UI, but not the pipeline\'s actual runtime dependency graph.',
      reality: 'This subtopic\'s first code example shows the opposite: because the default dependency is based on file position, reordering stage blocks with zero <code>dependsOn</code> changes silently changes which stage each one implicitly depends on — a real, easy-to-miss behavior change, not a cosmetic one.'
    },
    {
      thought: 'To make two stages run in parallel instead of sequentially, you should just reorder them so neither one is "after" the other in the file.',
      reality: 'Per this subtopic\'s theory and Microsoft\'s own documented example, reordering never produces parallelism on its own — every stage still implicitly depends on whatever\'s immediately above it, if anything is. Genuine parallel execution requires an explicit <code>dependsOn: []</code> to override that positional default, regardless of where the stage sits in the file.'
    }
  ];
}
