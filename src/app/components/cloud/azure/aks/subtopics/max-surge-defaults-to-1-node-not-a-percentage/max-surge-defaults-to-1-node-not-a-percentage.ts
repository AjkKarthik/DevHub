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
  templateUrl: './max-surge-defaults-to-1-node-not-a-percentage.html',
  styleUrl: './max-surge-defaults-to-1-node-not-a-percentage.scss'
})
export class MaxSurgeDefaultsTo1NodeNotAPercentageSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page names --max-surge and shows it in a command, but never states its default value or Microsoft\'s own production recommendation',
      points: [
        'The main page\'s own theory states: "Set maxSurge to allow new nodes to be provisioned before old ones drain, minimising disruption." Its own codeTabs example passes "--max-surge 1" explicitly — which reads as if the author is demonstrating a deliberate choice, when it is actually just the platform default being spelled out.',
        'Nothing on the main page says what happens if --max-surge is OMITTED entirely, or whether Microsoft has a specific recommended value for production clusters.',
      ]
    },
    {
      heading: 'Microsoft documents an exact default of exactly ONE extra node — a fixed integer, not a percentage — with a specific different recommendation for production',
      points: [
        'Per Microsoft\'s own documentation: "AKS configures upgrades to surge with one extra node by default. A default value of one for the max surge setting enables AKS to minimize workload disruption by creating an extra node before the cordon/drain of existing applications to replace an older versioned node." This is the SLOWEST safe setting — exactly one buffer node exists at any point during the entire node pool upgrade, regardless of how many total nodes the pool has.',
        'Microsoft explicitly recommends a DIFFERENT, higher value for production: "For production node pools, we recommend a max surge setting of 33%." A 10-node production pool left on the untouched default therefore upgrades one node at a time — noticeably slower than Microsoft\'s own recommended configuration, which would surge roughly 3-4 nodes at once.',
        'max-surge accepts two genuinely different value types with different scaling behavior, per Microsoft\'s own docs: "Integer | 5 | Five extra nodes to surge" versus "Percentage | 50% | Surge value of half the current node count in the pool." A percentage scales automatically as the pool\'s node count changes over time; a fixed integer does not — the main page\'s own example (--max-surge 1) happens to be both the literal default AND an integer, which could easily be mistaken for "the syntax example" rather than "this IS the unmodified default."',
        'Node surge has a real resource cost the main page never mentions: "Node surges require subscription quota for the requested max surge count for each upgrade operation... If each node pool has a max surge value of 50%, extra compute and IP quota of 10 nodes... is required to complete the upgrade." A higher max surge value for faster upgrades directly trades against available subscription quota and, on Azure CNI clusters, available subnet IP addresses.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Leaving max-surge unset — the slow, safe default',
      language: 'bash',
      code: `# Upgrading a 10-node pool with NO --max-surge specified
az aks nodepool upgrade \\
  --resource-group my-rg --cluster-name my-aks \\
  --name nodepool1 --kubernetes-version 1.30.0

# Per Microsoft's own docs: "AKS configures upgrades to surge with
# one extra node by default." Only ONE extra node is ever created
# at a time, regardless of pool size -- for a 10-node pool, this
# means 10 sequential cordon/drain/reimage cycles, each waiting on
# exactly one buffer node. Safe, minimal quota impact, but slow.`,
    },
    {
      label: 'Microsoft\'s own recommended production setting',
      language: 'bash',
      code: `# Per Microsoft's own docs: "For production node pools, we
# recommend a max surge setting of 33%."
az aks nodepool update \\
  --resource-group my-rg --cluster-name my-aks \\
  --name nodepool1 --max-surge 33%

# For the same 10-node pool, 33% surges roughly 3-4 nodes at a time
# (percentages round UP to the nearest node count) -- upgrading
# noticeably faster, at the cost of needing quota/IP headroom for
# those extra 3-4 nodes simultaneously.

# Check current quota impact before a large surge:
az vm list-usage --location eastus --output table
# Per Microsoft's own docs: "Node surges require subscription quota
# for the requested max surge count for each upgrade operation" --
# an upgrade can fail partway through if quota runs out mid-surge.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is confused reading the main page\'s own CLI example, which passes "--max-surge 1" explicitly during a node pool upgrade. They assume this must be a deliberately chosen, conservative setting the author picked for a reason specific to that example. Using this subtopic\'s theory, is there anything special about the value 1 in this context?',
    hint: 'Per Microsoft\'s own documentation, if --max-surge is omitted from the command entirely, what value does AKS use automatically?',
    solution: 'Per this subtopic\'s theory, there is nothing special being deliberately chosen — Microsoft\'s own documentation confirms "AKS configures upgrades to surge with one extra node by default," meaning --max-surge 1 produces the EXACT SAME behavior as omitting the flag entirely. The main page\'s example happens to spell out the platform default explicitly (likely for clarity in showing the flag\'s syntax), not because 1 is a special or recommended value for that scenario. In fact, Microsoft\'s own guidance points the opposite direction for production use: "For production node pools, we recommend a max surge setting of 33%" — a team copying the main page\'s literal example into a production upgrade command would be using the slowest, most conservative surge setting, not a value Microsoft actually recommends for that use case.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'If --max-surge isn\'t specified during a node pool upgrade, AKS surges as many nodes as capacity allows to complete the upgrade as fast as possible.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms the opposite — the unspecified default is exactly ONE extra node, the most conservative possible setting, not an automatically-maximized one.'
    },
    {
      thought: 'max-surge only accepts a percentage value, matching how autoscaling percentages usually work elsewhere in Azure.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation confirms max-surge accepts BOTH a fixed integer (a literal node count) and a percentage (scaling with pool size) — these are genuinely different behaviors, not just two ways of writing the same thing.'
    },
    {
      thought: 'Increasing max-surge for faster upgrades has no real cost beyond the upgrade taking less wall-clock time.',
      reality: 'Per this subtopic\'s theory, Microsoft\'s own documentation states node surges "require subscription quota for the requested max surge count for each upgrade operation" — a higher surge value can cause an upgrade to fail partway through if the subscription lacks sufficient compute or (on Azure CNI) subnet IP quota.'
    }
  ];
}
