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
  templateUrl: './merge-log-vs-k8s-logging-parser-are-different-mechanisms.html',
  styleUrl: './merge-log-vs-k8s-logging-parser-are-different-mechanisms.scss'
})
export class MergeLogVsK8sLoggingParserAreDifferentMechanismsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own Fluent Bit filter sets two JSON-parsing-related options together, with no distinction drawn between them',
      points: [
        'The main page\'s own "kubernetes" FILTER block sets `Merge_Log On` and `K8S-Logging.Parser On` on adjacent lines, with only brief inline comments — "merge JSON from app logs into record" and "honor pod annotation for parser" respectively. Both comments are individually accurate, but neither explains that these are two structurally DIFFERENT mechanisms operating at different scopes, not two settings that do roughly the same thing.',
        'Fluent Bit\'s own documentation describes `Merge_Log`\'s behavior directly: when enabled, the filter "tries to assume the log field from the incoming message is a JSON string message and make a structured representation of it" — this is a FILTER-LEVEL, blanket default applied to every pod\'s logs the same way. `K8S-Logging.Parser`, by contrast, "will only be processed if" a specific POD has an annotation naming "a pre-defined parser" that\'s "already registered" with Fluent Bit — a PER-POD, opt-in override.',
      ]
    },
    {
      heading: 'Why the scope difference matters: one is automatic for every pod, the other requires each pod to explicitly opt in',
      points: [
        'Because `Merge_Log On` is a filter-wide default, it already applies to EVERY pod\'s logs the moment the ConfigMap is deployed — a pod emitting plain JSON to stdout gets its fields automatically merged into the structured record with zero pod-level configuration required at all.',
        '`K8S-Logging.Parser`, per Fluent Bit\'s own docs, is a mechanism for pods whose logs need something MORE SPECIFIC than the generic JSON-merge behavior — a legacy app emitting a custom, non-JSON log format (say, a specific grok-parseable pattern) can add a Kubernetes annotation naming a REGISTERED custom parser, and Fluent Bit applies that parser specifically to that pod\'s logs instead of the generic behavior. Per Fluent Bit\'s own docs, this only activates "if Fluent Bit configuration... has enabled the option K8S-Logging.Parser" in the filter AND the specific pod supplies the annotation — two separate opt-in gates, not one.',
        'The practical consequence: a team debugging why one specific pod\'s logs are structured differently from every other pod\'s should look for a Kubernetes annotation on THAT pod specifically (the per-pod override), not assume the shared `Merge_Log On` filter setting (which applies uniformly to everything) is somehow behaving inconsistently — the two mechanisms genuinely operate at different scopes, and a difference in one pod\'s behavior almost always traces back to the per-pod annotation, not the shared filter config.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Merge_Log -- the filter-wide default, applies to every pod automatically',
      language: 'bash',
      code: `# The main page's own FILTER block:
# [FILTER]
#     Name                kubernetes
#     Match               kube.*
#     Merge_Log           On          # merge JSON from app logs into record
#     K8S-Logging.Parser  On          # honor pod annotation for parser
#     K8S-Logging.Exclude On          # honor pod annotation to exclude

# Pod A -- a Node.js service emitting plain JSON to stdout, NO
# special annotations at all:
# {"level":"info","msg":"Order placed","orderId":"123"}

# Because Merge_Log is On at the FILTER level, this JSON is
# automatically parsed and merged into the top-level record for
# EVERY pod matching kube.* -- Pod A needed zero pod-level
# configuration to get this behavior. It's the shared default.`,
    },
    {
      label: 'K8S-Logging.Parser -- an explicit, per-pod opt-in override',
      language: 'bash',
      code: `# Pod B -- a legacy .NET Framework service emitting a custom,
# NON-JSON log format Fluent Bit's generic Merge_Log can't parse
# meaningfully on its own:
# 2025-01-15 10:30:00 [INFO] Order placed orderId=123

# This pod's own Kubernetes manifest carries an annotation:
# metadata:
#   annotations:
#     fluentbit.io/parser: legacy-dotnet-parser

# Per Fluent Bit's own docs, this "suggests a pre-defined parser"
# -- but "will only be processed if Fluent Bit configuration...
# has enabled the option K8S-Logging.Parser" (which the main
# page's own FILTER block already does). A separate [PARSER]
# section, registered ahead of time, defines what
# "legacy-dotnet-parser" actually does (e.g. a grok pattern
# matching that exact log format).

# Only THIS specific pod, carrying THIS specific annotation, gets
# the custom parser applied -- every other pod in the cluster keeps
# using the generic Merge_Log-based JSON handling from the shared
# filter config, completely unaffected by Pod B's own annotation.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform engineer notices that one specific microservice\'s logs in Kibana/Grafana are structured differently from every other service\'s logs — most services show clean, parsed fields, but this one shows raw unparsed text in a single "log" field. They assume the shared Fluent Bit `Merge_Log On` setting must somehow be broken or inconsistently applied. Using this subtopic\'s theory, suggest a more likely first place to check.',
    hint: 'Per this subtopic\'s theory, is Merge_Log a per-pod setting that could apply inconsistently across pods, or a filter-wide default that applies the same way to everything matching the filter?',
    solution: 'Per this subtopic\'s theory, `Merge_Log On` is a FILTER-LEVEL setting that applies uniformly to every pod matching the filter\'s `Match` pattern — it has no per-pod variability built in, so "broken or inconsistent" isn\'t really a coherent failure mode for it. The more likely first place to check is the specific pod\'s own Kubernetes manifest for a `fluentbit.io/parser`-style annotation — per Fluent Bit\'s own docs, `K8S-Logging.Parser` is exactly the mechanism that lets ONE specific pod opt into different parsing behavior than every other pod, independent of the shared Merge_Log default. If this particular service\'s pod has such an annotation pointing at a parser that either doesn\'t exist, is misconfigured, or genuinely doesn\'t match this service\'s actual log format, that would explain exactly the symptom described — one service behaving differently while the shared filter config (and every other pod relying on it) works fine.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Merge_Log and K8S-Logging.Parser are two settings that both control JSON parsing in roughly the same way — enabling both is somewhat redundant, similar to setting the same option twice.',
      reality: 'Per this subtopic\'s theory, Fluent Bit\'s own docs describe them as operating at genuinely different scopes — Merge_Log is a filter-wide default applied to every pod automatically; K8S-Logging.Parser is a per-pod, annotation-based opt-in for a DIFFERENT, named parser. They are not redundant; they solve different problems for different pods.'
    },
    {
      thought: 'Since K8S-Logging.Parser is described as honoring "the pod annotation," any pod can just start using it by adding the annotation, with no other configuration required.',
      reality: 'This subtopic\'s theory shows there are two separate gates that both have to be satisfied — per Fluent Bit\'s own docs, the annotation "will only be processed if Fluent Bit configuration... has enabled the option K8S-Logging.Parser" in the filter itself, AND the named parser must already be registered in Fluent Bit\'s own parser configuration. The pod annotation alone, without both of those, does nothing.'
    },
    {
      thought: 'If one pod\'s logs are parsed differently from the rest of the cluster, the shared Fluent Bit ConfigMap (Merge_Log and friends) is the first place to look for the cause.',
      reality: 'Per this subtopic\'s exercise, a single pod behaving differently from every other pod points AWAY from the shared filter config (which applies uniformly) and TOWARD that specific pod\'s own Kubernetes annotations — the per-pod K8S-Logging.Parser mechanism is specifically designed to create exactly this kind of pod-by-pod variation.'
    }
  ];
}
