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
  templateUrl: './a-data-source-can-need-depends-on-too-for-a-hidden-dependency.html',
  styleUrl: './a-data-source-can-need-depends-on-too-for-a-hidden-dependency.scss'
})
export class ADataSourceCanNeedDependsOnTooForAHiddenDependencySubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own quiz covers the attribute-reference case in depth, but never mentions explicit depends_on on a data source at all',
      points: [
        'The main page\'s quiz walks through what happens when a data source references an attribute of a resource being created in the SAME apply — Terraform defers that data source\'s evaluation to apply time, since there\'s nothing to query yet. That is a real, well-explained case — but it is specifically about an ATTRIBUTE REFERENCE. The page never addresses a data source with NO attribute reference at all, whose result would still be wrong if queried too early.',
      ]
    },
    {
      heading: 'A data source can have a side-effect dependency, exactly like a resource can',
      points: [
        'Just like a resource can depend on another resource\'s SIDE EFFECT rather than any specific attribute (the main page\'s own Resources topic covers this: an IAM policy attachment an EC2 instance needs before booting, with no direct attribute reference between them) — a DATA SOURCE can have the same kind of hidden dependency: its query result would only be correct or complete AFTER some other resource has finished doing something, even though nothing in the data source\'s own arguments references that resource\'s attributes.',
        'A concrete case: a data source querying for tagged resources (like <code>aws_instances</code> filtered by a tag) where the resources being tagged are created earlier in the SAME apply — if the data source has no attribute reference to those resources at all (it only filters by a tag value, not by any ID), Terraform has no way to know it should wait, and may query before the tagged resources actually exist.',
      ]
    },
    {
      heading: 'depends_on on a data source works, but has the same apply-time-deferral cost as the attribute-reference case',
      points: [
        'Adding <code>depends_on = [aws_instance.tagged]</code> directly to the data source block forces Terraform to wait for that resource before evaluating the data source — solving the correctness problem exactly the way <code>depends_on</code> solves it for resources.',
        'The cost is the SAME apply-time deferral the main page\'s own quiz already describes for the attribute-reference case: a data source with <code>depends_on</code> pointing at a not-yet-created resource cannot be resolved during <code>plan</code> (there\'s genuinely nothing to query), so its evaluation — and anything downstream of it — gets pushed to apply time, showing up as "(known after apply)" in the plan output, making the plan less informative than a data source that could resolve immediately.',
        'Per the same discipline the main page\'s own Resources topic already recommends for resource-level <code>depends_on</code>: use it only when the dependency genuinely cannot be expressed through a reference, and comment WHY it\'s there, since it is otherwise invisible to a future reader.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The hidden dependency: no attribute reference at all',
      language: 'bash',
      code: `resource "aws_instance" "tagged" {
  count = 3
  ami   = data.aws_ami.ubuntu.id
  tags  = { Role = "worker" }
}

# This data source filters by TAG VALUE only -- it never
# references any attribute of aws_instance.tagged directly,
# so Terraform's automatic graph has no reason to wait for
# those instances to be created first:
data "aws_instances" "workers" {
  instance_tags = { Role = "worker" }
}
# If this data source is evaluated during the SAME apply that
# creates aws_instance.tagged, it may run before those
# instances exist yet -- returning an empty or incomplete
# result, even though the config "looks" correct.`,
    },
    {
      label: 'The fix: depends_on directly on the data source',
      language: 'bash',
      code: `resource "aws_instance" "tagged" {
  count = 3
  ami   = data.aws_ami.ubuntu.id
  tags  = { Role = "worker" }
}

data "aws_instances" "workers" {
  instance_tags = { Role = "worker" }

  # Explicit dependency: this query needs the tagged instances
  # to already exist. No attribute of aws_instance.tagged is
  # referenced above, so Terraform's automatic graph can't see
  # this on its own -- same reasoning as depends_on on a
  # resource, applied to a data source instead.
  depends_on = [aws_instance.tagged]
}

# Cost: since aws_instance.tagged is created in this same
# apply, Terraform cannot resolve data.aws_instances.workers
# during plan -- its evaluation (and anything downstream of
# it) is deferred to apply time, showing as "(known after
# apply)" in the plan output.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A data source filters for EC2 instances by a tag value (`instance_tags = { Role = "worker" }`) with no attribute reference to any specific resource. In the same apply, three aws_instance resources are created with that exact tag. Occasionally, the data source\'s result is empty or incomplete, even though the instances clearly exist once the apply finishes. Why does an attribute reference alone not fix this, and what addition to the data source block does?',
    hint: 'The data source filters by a TAG VALUE, not by any resource attribute — so what would Terraform even reference to establish an implicit dependency here?',
    solution: 'There is no attribute of the tagged instances to reference in the data source\'s own arguments — it filters purely by tag value, which is not tied to any specific resource\'s attribute — so Terraform\'s automatic dependency graph has no way to know the data source should wait for those instances to be created first. This is the same category of hidden, side-effect-only dependency the main page\'s own Resources topic describes for resources needing depends_on, just applied to a data source. The fix is adding `depends_on = [aws_instance.tagged]` directly to the data source block, forcing Terraform to wait for those instances before evaluating the query — at the cost of deferring the data source\'s evaluation (and anything downstream of it) to apply time, since it cannot be resolved during plan when depending on a resource created in the same run.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'depends_on is a resource-only meta-argument — data sources cannot use it and can only ever depend on something Terraform infers automatically from an attribute reference.',
      reality: 'Per this subtopic\'s theory, data sources support depends_on directly, exactly for the case where a hidden, side-effect-only dependency exists with no attribute to reference at all.'
    },
    {
      thought: 'A data source filtering by a tag or other non-ID criteria (rather than referencing a specific resource\'s attribute) will still correctly wait for resources created in the same apply that happen to match its filter.',
      reality: 'Per this subtopic\'s theory, Terraform\'s automatic dependency graph is built purely from attribute references — a tag-based filter with no such reference gives Terraform no reason to wait, and the data source can be evaluated before the matching resources exist.'
    },
    {
      thought: 'Adding depends_on to a data source is free — it has no downside compared to a data source Terraform can resolve on its own during plan.',
      reality: 'Per this subtopic\'s theory, depends_on on a data source has the same cost as the main page\'s own attribute-reference deferral case: the data source (and anything downstream of it) cannot be resolved during plan, showing as "(known after apply)" instead of a concrete value.'
    }
  ];
}
