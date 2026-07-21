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
  templateUrl: './set-always-beats-f-regardless-of-command-line-order.html',
  styleUrl: './set-always-beats-f-regardless-of-command-line-order.scss'
})
export class SetAlwaysBeatsFRegardlessOfCommandLineOrderSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own mustKnow bullet phrases precedence as positional, "right-side wins"',
      points: [
        'The main page\'s own "Values precedence" mustKnow bullet states: "values.yaml < -f file < --set (right-side wins)." Read literally, "right-side wins" describes a POSITIONAL rule — whichever flag appears further right/later on the command line takes priority — which would imply that writing `--set foo=bar -f override.yaml` (with `-f` positioned AFTER `--set`) should let the values file win instead.',
        'The main page\'s own theory section separately explains that "multiple -f files are merged left-to-right" (a genuinely positional rule, for -f files AMONG THEMSELVES) — without ever clarifying that the rule governing --set VERSUS -f is a completely different, non-positional kind of precedence.',
      ]
    },
    {
      heading: 'What actually happens: --set always wins over any -f file, independent of command-line position entirely',
      points: [
        'Per Helm\'s own documented behavior, `--set` (along with `--set-string` and `--set-file`) has a fixed, TYPE-based precedence over `-f`/`--values` files — this holds true no matter where each flag is physically written on the command line. `helm upgrade myapp ./chart --set image.tag=v2 -f override.yaml` and `helm upgrade myapp ./chart -f override.yaml --set image.tag=v2` produce the IDENTICAL result: --set\'s image.tag value wins in both cases, even in the first command where -f visually appears to come "after" (more to the right than) --set.',
        'The "right-side wins" framing in the main page\'s own mustKnow bullet is only accurate for comparing values WITHIN the same flag type — multiple -f files merge left-to-right (later files override earlier ones), and multiple --set flags likewise apply left-to-right among themselves — but the relationship BETWEEN the two flag types (--set vs. -f) is a fixed hierarchy, not a positional one at all.',
        'This matters most for CI/CD pipelines that combine a shared, versioned base values file (-f base-values.yaml) with an environment-specific -f override AND a handful of --set flags for secrets or dynamic values (like an image tag from the build) — no matter how these flags are ordered on the command line, every --set flag always overrides anything in either -f file, which is usually the DESIRED behavior for secrets/dynamic values, but can silently defeat an author\'s attempt to have an -f override file "win" over an earlier --set by simply placing it later in the command.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Reordering the flags changes nothing — --set always wins',
      language: 'bash',
      code: `# values.yaml (chart default):
#   image:
#     tag: "1.0.0"

# override.yaml:
#   image:
#     tag: "2.0.0"

# Command A -- --set written FIRST, -f written AFTER it:
helm template myapp ./myapp --set image.tag=3.0.0 -f override.yaml \\
  | grep "tag:"
# tag: "3.0.0"   <- --set's 3.0.0 wins

# Command B -- -f written FIRST, --set written AFTER it (the order
# the main page's own "right-side wins" phrasing would suggest
# should make -f's 2.0.0 win instead):
helm template myapp ./myapp -f override.yaml --set image.tag=3.0.0 \\
  | grep "tag:"
# tag: "3.0.0"   <- STILL 3.0.0. Identical result to Command A.
#                   --set's value wins regardless of position.

# The ONLY way to change which value wins is changing WHICH FLAG
# TYPE carries the value, not where it sits on the command line.`,
    },
    {
      label: 'Where this actually bites: an override file meant to win over --set',
      language: 'bash',
      code: `# A CI pipeline template used across many services, with a
# per-service override file appended LAST, expecting (per the main
# page's own "right-side wins" phrasing) that appending it last
# means it takes final precedence over the pipeline's own --set
# flags for shared, pipeline-level defaults:

# ci-deploy.sh (shared across services):
helm upgrade --install "$SERVICE" ./chart \\
  --set replicaCount=2 \\
  --set resources.requests.cpu=100m \\
  -f "services/$SERVICE/override.yaml"    # appended last, on purpose

# services/payments-api/override.yaml:
#   replicaCount: 5   # <- team WANTS 5 replicas for this service,
#                      #    and placed this file last expecting it
#                      #    to override the pipeline's --set replicaCount=2

kubectl get deployment payments-api -o jsonpath='{.spec.replicas}'
# 2   <- NOT 5. The pipeline's --set replicaCount=2 silently won,
#         regardless of override.yaml being positioned after it.

# The actual fix: move the per-service override INTO its own --set
# flag (or restructure the pipeline to apply -f files first and
# --set only for values that should genuinely always win, like
# secrets/build metadata) -- an -f file can never out-rank a --set
# flag no matter where either is placed on the command line.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team builds a shared CI/CD deploy script that runs <code>helm upgrade --install "$SERVICE" ./chart --set replicaCount=2 -f "services/$SERVICE/override.yaml"</code> for every service, deliberately placing the per-service <code>-f</code> file LAST on the command line, believing this makes it take final precedence over the shared <code>--set replicaCount=2</code> default — following the main page\'s own "right-side wins" phrasing. One service\'s override file sets <code>replicaCount: 5</code>, but the deployed Deployment always ends up with exactly 2 replicas. Using this subtopic\'s theory, why doesn\'t moving the <code>-f</code> flag later in the command change the outcome?',
    hint: 'Is "right-side wins" true for comparing a <code>-f</code> file against a <code>--set</code> flag, or only true for comparing multiple flags of the SAME type against each other?',
    solution: 'Per this subtopic\'s theory, "right-side wins" only applies when comparing multiple flags of the SAME type against each other — multiple -f files merge left-to-right among themselves, and multiple --set flags apply left-to-right among themselves — but the relationship BETWEEN --set and -f is a fixed, type-based hierarchy that has nothing to do with command-line position at all. --set (and --set-string/--set-file) always takes precedence over any -f file, regardless of which one is written first or last on the command line. Moving the -f flag to the end of the command does not change this hierarchy — it only affects how that -f file would rank against OTHER -f files, if there were more than one. Since the pipeline\'s --set replicaCount=2 is present, it always wins over override.yaml\'s replicaCount: 5, no matter where either flag sits in the command. The fix requires changing which FLAG TYPE carries the per-service value — either passing the override via its own --set flag instead of -f, or restructuring the shared pipeline to not hardcode replicaCount via --set at all, letting each service\'s own -f file be the sole source for that value.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The main page\'s own "values.yaml < -f file < --set (right-side wins)" mustKnow bullet means precedence is purely positional — whichever flag is written furthest to the right on the actual command line always wins, regardless of flag type.',
      reality: 'Per this subtopic\'s theory, --set has a fixed, type-based precedence over -f files that holds true independent of command-line position — "right-side wins" is only an accurate description for comparing MULTIPLE flags of the same type (several -f files, or several --set flags) against each other.'
    },
    {
      thought: 'Deliberately placing a -f values file AFTER a --set flag on the command line is a reliable, documented technique to make that file\'s values take final precedence over the earlier --set flag.',
      reality: 'Per this subtopic\'s exercise, this technique does not work at all — --set always overrides any -f file\'s value for the same key, regardless of which one appears later in the command. A team relying on this ordering trick will get silently incorrect results with no error or warning.'
    },
    {
      thought: 'Since the main page\'s own theory says "multiple -f files are merged left-to-right," the same left-to-right merging logic must also govern how a single -f file compares against a single --set flag.',
      reality: 'Per this subtopic\'s theory, "multiple -f files merged left-to-right" describes ordering WITHIN the -f flag type only — it says nothing about, and does not extend to, how -f as a flag TYPE compares against --set as a different flag TYPE, which follows a separate, fixed hierarchy instead.'
    }
  ];
}
