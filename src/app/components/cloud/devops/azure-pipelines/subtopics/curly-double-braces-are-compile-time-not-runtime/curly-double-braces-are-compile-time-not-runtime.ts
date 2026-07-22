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
  templateUrl: './curly-double-braces-are-compile-time-not-runtime.html',
  styleUrl: './curly-double-braces-are-compile-time-not-runtime.scss'
})
export class CurlyDoubleBracesAreCompileTimeNotRuntimeSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own "Templates & Variable Groups" code tab uses a third expression syntax it never names',
      points: [
        'The main page\'s own quiz already contrasts two expression syntaxes: <code>$(var)</code> (a queue-time macro, simple text substitution before a task runs) and <code>$[variables.var]</code> (a runtime expression, evaluated as the step actually runs). Neither of those is the syntax the main page\'s OWN "Templates & Variable Groups" code tab actually uses for its parameter — that tab writes <code>&#36;&#123;&#123; parameters.nodeVersion &#125;&#125;</code>, a third form the page never explains at all.',
        'Per Microsoft\'s own Azure Pipelines documentation, this is a distinct, third syntax: "Note the syntax <code>&#36;&#123;&#123;&#125;&#125;</code> for compile time and <code>$[]</code> for runtime expressions." A pipeline actually has three expression tiers, not two — <code>&#36;&#123;&#123; &#125;&#125;</code> (compile time), <code>$()</code> (queue-time macro), and <code>$[]</code> (runtime) — each evaluated at a different point in a pipeline\'s life, and the main page\'s own code only ever demonstrates one of the three by example, without naming it.',
      ]
    },
    {
      heading: 'What "compile time" specifically means, and why templates are built around it',
      points: [
        'Per Microsoft\'s own docs: "You can evaluate expressions at compile time or at run time... The difference between runtime and compile time expression syntaxes is primarily what context is available. In a compile-time expression (<code>&#36;&#123;&#123; &lt;expression&gt; &#125;&#125;</code>), you have access to <code>parameters</code> and statically defined <code>variables</code>. In a runtime expression (<code>$[ &lt;expression&gt; ]</code>), you have access to more <code>variables</code> but no parameters."',
        'This is exactly why the main page\'s own template YAML has to use <code>&#36;&#123;&#123; parameters.nodeVersion &#125;&#125;</code> rather than <code>$[parameters.nodeVersion]</code>: parameters only exist inside a compile-time expression at all. A template\'s parameters are expanded into the final YAML BEFORE the pipeline is even queued — by the time a runtime expression like <code>$[]</code> would evaluate, the template has already been fully expanded and <code>parameters</code> is out of scope.',
        'The practical ordering, per Microsoft\'s own docs, is: compile time (<code>&#36;&#123;&#123; &#125;&#125;</code>, when the YAML file — including every template — is assembled into a single execution plan) happens first; the queue-time macro (<code>$()</code>) substitutes plain text into a task\'s inputs right before that task runs; the runtime expression (<code>$[]</code>) evaluates last, as the step actually executes, with access to job/stage outputs that don\'t exist yet at compile time.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'All three expression syntaxes, side by side, same variable',
      language: 'bash',
      code: `# variables:
#   major: 1
#   compileVar: \${{ variables.major }}        # COMPILE TIME
#   #   -> expanded once, when the YAML is assembled into a plan.
#   #      Has access to parameters + statically-defined variables.
#   #      Cannot see anything computed while the pipeline runs.
#
#   isMain: $[eq(variables['Build.SourceBranch'], 'refs/heads/main')]
#   #   -> RUNTIME expression. Evaluated as the step runs.
#   #      Has access to more variables (dependencies, job status)
#   #      but NO parameters -- those are long gone by this point.

# steps:
#   - script: |
#       echo $(compileVar)   # queue-time MACRO reads the compile-time
#                             # result -- $() substitutes whatever text
#                             # ended up in the variable, right before
#                             # this task's inputs are populated.
#       echo $(isMain)        # same macro syntax, reading a variable
#                             # that itself came from a $[] runtime
#                             # expression -- $() doesn't care HOW a
#                             # variable's value was produced, only
#                             # that a value already exists by the
#                             # time this specific task starts.

# The main page's own Templates tab only ever shows the FIRST of
# these three -- \${{ parameters.nodeVersion }} -- with no code tab
# anywhere on the main page demonstrating the other two side by side.`,
    },
    {
      label: 'Why parameters cannot be read with $[] -- a genuine build failure',
      language: 'bash',
      code: `# templates/build-job.yml
# parameters:
# - name: nodeVersion
#   type: string
#   default: '18.x'
# jobs:
# - job: Build
#   steps:
#   - task: NodeTool@0
#     inputs:
#       # This is what the main page's own code tab actually does:
#       versionSpec: '\${{ parameters.nodeVersion }}'   # WORKS

#   - task: NodeTool@0
#     inputs:
#       # This does NOT work -- a $[] runtime expression has no
#       # access to "parameters" at all, per Microsoft's own docs
#       # ("In a runtime expression... you have access to more
#       # variables but no parameters"). By the time a runtime
#       # expression could evaluate, the template has already been
#       # compiled away -- parameters.nodeVersion no longer exists
#       # as a distinct thing to reference.
#       versionSpec: '$[parameters.nodeVersion]'        # FAILS

# The fix is never "switch to a different runtime function" -- it's
# recognizing that parameter substitution is fundamentally a
# COMPILE-TIME operation, so it can only ever use \${{ }}.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A teammate is debugging a template that sets <code>versionSpec: \'$[parameters.nodeVersion]\'</code> inside a task, and the pipeline fails to even start with a parsing-related error. They ask you why <code>$[]</code>, which they\'ve seen work fine for other variables elsewhere in the same pipeline, doesn\'t work here. Using this subtopic\'s theory, explain the actual cause.',
    hint: 'Per this subtopic\'s theory, which of the three expression tiers has access to <code>parameters</code> at all, and which one is being used in the failing line?',
    solution: 'The <code>$[]</code> syntax is a RUNTIME expression, and per Microsoft\'s own documentation, a runtime expression has access to more variables than a compile-time one, but explicitly NO parameters at all — parameters only exist inside a compile-time expression (<code>&#36;&#123;&#123; &#125;&#125;</code>). By the time a <code>$[]</code> expression would evaluate (as the step actually runs), the template has already been fully expanded into the final YAML plan during the earlier compile-time step — <code>parameters.nodeVersion</code> isn\'t a thing that exists anymore at that point for <code>$[]</code> to read. The variables the teammate has seen <code>$[]</code> work for elsewhere are ordinary pipeline variables (e.g. <code>Build.SourceBranch</code>), which genuinely are available at runtime — that success doesn\'t generalize to parameters, which are a fundamentally compile-time-only concept. The fix is changing <code>$[parameters.nodeVersion]</code> to <code>&#36;&#123;&#123; parameters.nodeVersion &#125;&#125;</code>, exactly like the main page\'s own working example already does.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Azure Pipelines has two expression syntaxes: the queue-time macro <code>$()</code> and the runtime expression <code>$[]</code> — those are the two the main page\'s own quiz contrasts.',
      reality: 'This subtopic\'s theory shows there is a third, distinct tier: the compile-time expression <code>&#36;&#123;&#123; &#125;&#125;</code>, which the main page\'s own "Templates & Variable Groups" code tab actually uses (<code>&#36;&#123;&#123; parameters.nodeVersion &#125;&#125;</code>) without ever naming it. Per Microsoft\'s own docs, all three exist and are evaluated at genuinely different points: compile time, queue time, and run time.'
    },
    {
      thought: 'Since <code>$[]</code> can read pipeline variables at runtime, it should also be able to read a template\'s parameters — parameters are just another kind of variable.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own docs are explicit that a runtime expression has "no parameters" in scope at all — parameters are only visible inside a compile-time (<code>&#36;&#123;&#123; &#125;&#125;</code>) expression, because template expansion (where parameters get substituted) happens entirely before the pipeline starts running, at compile time.'
    },
    {
      thought: 'It doesn\'t really matter which of the three expression syntaxes you use for a given value, as long as the final substituted text looks correct.',
      reality: 'This subtopic\'s second code example shows a case where the WRONG syntax fails outright rather than just producing a different-but-working result — <code>$[parameters.nodeVersion]</code> doesn\'t silently do the wrong thing, it fails because <code>parameters</code> genuinely isn\'t in scope for a runtime expression. Choosing the right tier isn\'t a style preference, it\'s determined by what context (parameters vs. statically-defined variables vs. full runtime state) the value you\'re referencing actually needs.'
    }
  ];
}
