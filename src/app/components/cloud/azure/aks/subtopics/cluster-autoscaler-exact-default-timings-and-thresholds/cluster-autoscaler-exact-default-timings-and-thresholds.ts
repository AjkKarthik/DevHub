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
  templateUrl: './cluster-autoscaler-exact-default-timings-and-thresholds.html',
  styleUrl: './cluster-autoscaler-exact-default-timings-and-thresholds.scss'
})
export class ClusterAutoscalerExactDefaultTimingsAndThresholdsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page says "cool-down" but never gives the actual default numbers behind Cluster Autoscaler\'s behavior',
      points: [
        'The main page\'s own theory states only: "Cluster Autoscaler (CA) adds nodes when pods are pending due to insufficient resources, removes underutilised nodes after a cool-down." No specific duration is given for "cool-down," and no mention is made of how "underutilised" is actually defined.',
        'Without these numbers, a team tuning CA behavior (e.g. "our workload has spiky 15-minute jobs, will nodes get removed between bursts?") has no way to reason about the default behavior without external research the main page doesn\'t provide.',
      ]
    },
    {
      heading: 'Microsoft documents an exact, tunable profile — scan-interval, the 10-minute cool-down, and a 50% utilization threshold are the load-bearing defaults',
      points: [
        'Per Microsoft\'s own Cluster Autoscaler profile settings table: "scan-interval | How often the cluster is reevaluated for scale up or down. | 10 seconds" — this is the base polling frequency the entire autoscaler operates on.',
        'The main page\'s "cool-down" is actually TWO separate, identically-defaulted settings: "scale-down-unneeded-time | How long a node should be unneeded before it\'s eligible for scale down. | 10 minutes" and "scale-down-delay-after-add | How long after scale up that scale down evaluation resumes. | 10 minutes." A node must be both continuously underutilized for 10 minutes AND not have had a scale-up event in the preceding 10 minutes before CA will even consider removing it.',
        '"Underutilised" has a precise, documented threshold: "scale-down-utilization-threshold | The maximum value between the sum of CPU requests and sum of Memory requests of all pods running on the node divided by node\'s corresponding allocatable resource, below which a node can be considered for scale down. | 0.5" — a node stays eligible for removal only while BOTH its CPU and memory request utilization stay under 50%.',
        'A separate safety mechanism prevents CA from over-reacting to cluster instability: "max-total-unready-percentage | Maximum percentage of unready nodes in the cluster. After this percentage is exceeded, CA halts operations. | 45%" — if too many nodes go unready at once (a networking blip, a zone issue), CA stops making scaling decisions entirely rather than potentially making things worse.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Why a 15-minute spiky workload never triggers scale-down with defaults',
      language: 'bash',
      code: `# Workload pattern: CPU spikes to 80% for 5 minutes, drops to 20%
# for 10 minutes, repeats. Node never truly sits idle long enough.

# Default scale-down-unneeded-time is 10 minutes -- but the SPIKE
# resets underutilization eligibility each cycle, and even during
# the 10-minute "quiet" window, the node is JUST AT the edge of the
# 10-minute scale-down-unneeded-time requirement -- any variance in
# timing means it rarely accumulates a full uninterrupted 10 minutes
# below the 50% scale-down-utilization-threshold.

az aks show --resource-group my-rg --name my-aks \\
  --query 'autoScalerProfile' --output json
# Confirms defaults are in effect unless explicitly overridden:
# "scanInterval": "10s", "scaleDownUnneededTime": "10m0s",
# "scaleDownUtilizationThreshold": "0.5"`,
    },
    {
      label: 'Tuning the profile for cost vs. performance',
      language: 'bash',
      code: `# Cost-optimized: scale down faster and more aggressively
az aks update --resource-group my-rg --name my-aks \\
  --cluster-autoscaler-profile \\
    scale-down-unneeded-time=3m,scale-down-delay-after-add=0m,scale-down-utilization-threshold=0.6

# Performance-optimized: batch scaling decisions, avoid premature
# removal of nodes that will be needed again shortly
az aks update --resource-group my-rg --name my-aks \\
  --cluster-autoscaler-profile \\
    scan-interval=30s,scale-down-utilization-threshold=0.4,ignore-daemonsets-utilization=true

# Per Microsoft's own docs: "The cluster autoscaler profile affects
# ALL node pools that use the cluster autoscaler. You can't set an
# autoscaler profile per node pool" -- a profile change is cluster-
# wide, never scoped to one pool, even if only one pool's workload
# motivated the change.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team has a batch-processing node pool where jobs run for exactly 8 minutes, with roughly 12 minutes of idle time between job batches. They expect Cluster Autoscaler to scale the pool down to zero during every idle gap, using default settings. In practice, nodes rarely scale down. Using this subtopic\'s theory, explain the likely cause.',
    hint: 'Per Microsoft\'s own documentation, how long must a node be continuously below the utilization threshold before it becomes eligible for scale-down — and is 12 minutes of idle time actually enough margin, given other default delays that also apply?',
    solution: 'Per this subtopic\'s theory, the 12-minute idle window is close to the edge of what the default settings allow, and other default delays likely consume the margin. Microsoft\'s own documentation confirms scale-down-unneeded-time defaults to 10 minutes — the node must sit continuously below the 50% scale-down-utilization-threshold for a full 10 minutes before CA even considers removing it, leaving only about 2 minutes of buffer in a 12-minute idle window. But there is a second default delay stacking on top: scale-down-delay-after-add also defaults to 10 minutes, meaning if a PREVIOUS batch\'s completion recently triggered any scale-up event, CA won\'t resume scale-down evaluation for another 10 minutes after that — a job cadence tight enough to trigger scale-up regularly can keep the cluster permanently inside this delay window, never accumulating enough uninterrupted "eligible" time to remove a node. The fix is tuning the profile explicitly (e.g. reducing scale-down-unneeded-time and scale-down-delay-after-add to something shorter than the workload\'s own idle window) rather than assuming default timings will match an unusually tight job cadence.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Cluster Autoscaler removes an underutilized node almost immediately once it notices low resource usage.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms a node must be continuously underutilized for scale-down-unneeded-time (10 minutes by default) before becoming eligible, and scale-down-delay-after-add (also 10 minutes by default) can independently block evaluation entirely after any recent scale-up.'
    },
    {
      thought: '"Underutilized" is a vague, internally-determined judgment call by the autoscaler.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation defines it precisely via scale-down-utilization-threshold — the higher of a node\'s CPU-request or memory-request utilization must stay below 50% (the default) for the node to be eligible for removal.'
    },
    {
      thought: 'Cluster Autoscaler profile settings can be tuned per node pool, so different pools in the same cluster can have different scale-down aggressiveness.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states directly: "You can\'t set an autoscaler profile per node pool" — profile settings are cluster-wide and apply to every autoscale-enabled node pool simultaneously.'
    }
  ];
}
