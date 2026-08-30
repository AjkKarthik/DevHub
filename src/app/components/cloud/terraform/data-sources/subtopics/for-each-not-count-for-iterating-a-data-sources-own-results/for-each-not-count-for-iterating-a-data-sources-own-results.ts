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
  templateUrl: './for-each-not-count-for-iterating-a-data-sources-own-results.html',
  styleUrl: './for-each-not-count-for-iterating-a-data-sources-own-results.scss'
})
export class ForEachNotCountForIteratingADataSourcesOwnResultsSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own examples happen to avoid this — but never explain why the choice matters here specifically',
      points: [
        'The main page\'s theory mentions "Combining data sources with for_each lets you iterate over dynamically discovered infrastructure" as a good pattern — but its own codeTabs actually use <code>count</code> with a data source result in the Account & Region example (<code>count = 2</code> paired with <code>data.aws_availability_zones.available.names[count.index]</code>). The page never explains why for_each would have been the safer choice there, or in general, for data-source-driven iteration.',
      ]
    },
    {
      heading: 'A data source\'s own results are not guaranteed to come back in a stable order',
      points: [
        'Many cloud provider data sources that return a LIST of results (like <code>aws_subnets</code> matching a filter, or historically <code>aws_availability_zones</code>) do not guarantee the API returns that list in the same order on every call — a list that comes back as <code>["subnet-a", "subnet-b"]</code> today could come back as <code>["subnet-b", "subnet-a"]</code> on a later plan, with the underlying infrastructure completely unchanged.',
        'This matters specifically because of how <code>count</code> assigns identity: <code>count.index</code> ties a resource instance to a POSITION in the list, not to any specific value. If the data source\'s own list order shifts between runs, <code>count</code>-based resources silently see a diff — Terraform proposes destroying and recreating resources that, from the infrastructure\'s own perspective, never actually needed to change at all.',
      ]
    },
    {
      heading: 'for_each avoids this because it keys by the value itself, not by position',
      points: [
        'Converting a data source\'s list result to a set with <code>toset(...)</code> and using <code>for_each</code> ties each resource instance to the actual VALUE (a specific subnet ID, a specific AZ name) rather than its position in whatever order the API happened to return it — reordering the underlying list produces no diff at all, since every value is still present, just listed differently.',
        'This is the same underlying for_each-vs-count distinction the main page\'s own Resources topic covers for resource counts driven by a variable — the difference here is that the INSTABILITY comes from an external API\'s own response ordering, not from a human editing a list in a .tf file, which is a more subtle and easier-to-miss version of the same root problem.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'count on a data source result: order-sensitive',
      language: 'bash',
      code: `data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  tags = { Tier = "private" }
}

resource "aws_instance" "app" {
  count     = length(data.aws_subnets.private.ids)
  subnet_id = data.aws_subnets.private.ids[count.index]
  ami       = data.aws_ami.ubuntu.id
}
# If the AWS API returns this filter's matching subnet IDs in
# a DIFFERENT order on a later plan -- the underlying subnets
# themselves completely unchanged -- count.index now points at
# a different subnet ID than before. Terraform proposes
# destroying and recreating instances that never needed to
# change, purely because of API response reordering.`,
    },
    {
      label: 'for_each on the same data: order-independent',
      language: 'bash',
      code: `data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.main.id]
  }
  tags = { Tier = "private" }
}

resource "aws_instance" "app" {
  for_each  = toset(data.aws_subnets.private.ids)
  subnet_id = each.value
  ami       = data.aws_ami.ubuntu.id
}
# Each instance is now keyed by the SUBNET ID ITSELF, not by
# its position in whatever order the API returned. If the API
# response order changes between plans, the set of subnet IDs
# is unchanged, so for_each produces no diff at all -- exactly
# the same instances, regardless of API ordering.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own Account & Region pattern (count paired with a data source result index), a team uses `count = length(data.aws_subnets.private.ids)` and `subnet_id = data.aws_subnets.private.ids[count.index]` to create one instance per private subnet. Periodically, with no actual infrastructure change, terraform plan shows several instances being destroyed and recreated. What is the most likely cause, and what change would make the plan stable regardless of API response ordering?',
    hint: 'count ties resource identity to a POSITION in a list. What happens if the underlying data source\'s own API call doesn\'t guarantee the same list order on every call?',
    solution: 'The most likely cause is that the aws_subnets data source\'s underlying AWS API call is not guaranteed to return the matching subnet IDs in the same order on every call — even with the actual subnets completely unchanged, a reordered list means count.index now points at a different subnet ID than it did on the previous plan, producing a spurious destroy/recreate diff. The fix is switching from count to for_each, keyed on the subnet IDs themselves: `for_each = toset(data.aws_subnets.private.ids)` with `subnet_id = each.value`. Since for_each ties each resource instance to the actual VALUE rather than its position in the list, a reordered (but otherwise identical) list of subnet IDs produces no diff at all.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A cloud provider data source that returns a list of matching resources (like aws_subnets) always returns that list in the same, stable order across separate API calls.',
      reality: 'Per this subtopic\'s theory, many such data sources do not guarantee stable ordering — a list of matching resources can come back in a different order on a later call with the underlying infrastructure completely unchanged.'
    },
    {
      thought: 'The count-vs-for_each stability issue only applies to lists a human explicitly writes in a .tf variable — not to lists returned dynamically by a data source.',
      reality: 'Per this subtopic\'s theory, the exact same underlying problem applies to data-source-returned lists too — it is just harder to notice, since the instability comes from an external API\'s own response ordering rather than a visible edit to a .tf file.'
    },
    {
      thought: 'Since the main page\'s own Account & Region example uses count with a data source result, that pattern is the recommended, safe default for iterating data source results.',
      reality: 'Per this subtopic\'s theory, that specific example (indexing into aws_availability_zones.available.names) happens not to have hit the ordering problem in practice, but for_each keyed on the actual returned values is the generally safer choice whenever a data source\'s own list-ordering guarantees are not explicitly documented as stable.'
    }
  ];
}
