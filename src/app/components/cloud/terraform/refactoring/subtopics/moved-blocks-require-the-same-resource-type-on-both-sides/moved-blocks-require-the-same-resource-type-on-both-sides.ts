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
  templateUrl: './moved-blocks-require-the-same-resource-type-on-both-sides.html',
  styleUrl: './moved-blocks-require-the-same-resource-type-on-both-sides.scss'
})
export class MovedBlocksRequireTheSameResourceTypeOnBothSidesSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own examples never mix resource types, so this constraint stays invisible',
      points: [
        'Every <code>moved {}</code> example on the main page — the plain rename, the move into a module, the count-to-for_each migration — keeps the SAME resource type on both sides (<code>aws_instance</code> to <code>aws_instance</code>, <code>aws_s3_bucket</code> to <code>aws_s3_bucket</code>). Nothing on the page states this is a hard requirement rather than just how the examples happen to be written.',
      ]
    },
    {
      heading: 'The actual rule: from and to must reference the exact same resource type',
      points: [
        'A <code>moved {}</code> block requires the <code>from</code> and <code>to</code> addresses to be the SAME resource type — Terraform rejects a move where the two sides reference different types (e.g. <code>aws_instance.web</code> to <code>aws_spot_instance_request.web</code>), even if the two resource types are conceptually similar or serve an equivalent purpose, with an explicit "resource type mismatch" error.',
        'This makes sense once the underlying mechanism is clear: <code>moved</code> only remaps the STATE ADDRESS a set of already-tracked attribute values lives under — it does not transform or migrate the attribute SCHEMA itself. Two different resource types have different schemas (different attribute names, types, and computed values), so there is no way for Terraform to safely reinterpret one type\'s stored state as if it were the other.',
      ]
    },
    {
      heading: 'What this means for a genuine type change: moved cannot help, a real replace is required',
      points: [
        'If a refactor genuinely needs to swap one resource type for a conceptually similar but structurally different one (e.g. migrating from a deprecated resource to its replacement in a newer provider version, or switching an on-demand EC2 instance to a spot instance request), <code>moved {}</code> is not the right tool — this requires the normal destroy-and-recreate path (or, if the provider offers one, a dedicated migration mechanism specific to that resource pair), not a state-address remap.',
        'The failure mode to watch for is a moved block that LOOKS like it should work because the two resource types sound related — the error surfaces at plan/apply time, not earlier, so it is worth deliberately checking that both sides of any moved block reference identical resource type strings before relying on it during a refactor.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Valid: same resource type on both sides',
      language: 'bash',
      code: `moved {
  from = aws_instance.web
  to   = aws_instance.app
}
# Both sides are "aws_instance" -- valid rename, works fine.

moved {
  from = aws_instance.app
  to   = module.compute.aws_instance.app
}
# Both sides are still "aws_instance", just a different module
# path -- also valid, same rule applies to module moves.`,
    },
    {
      label: 'Invalid: different resource types',
      language: 'bash',
      code: `# Attempting to "migrate" an on-demand instance to a spot request
# using moved -- this looks plausible but is NOT supported:
moved {
  from = aws_instance.web
  to   = aws_spot_instance_request.web
}

$ terraform plan
# Error: Resource type mismatch
#
# This statement declares a move from aws_instance.web to
# aws_spot_instance_request.web, which is a resource of a
# different type.
#
# moved only remaps a STATE ADDRESS -- it cannot reinterpret one
# resource type's stored attributes as belonging to a completely
# different resource type's schema.

# The actual path here is a real destroy-and-recreate (or a
# provider-specific migration path, if one exists for this exact
# resource pair) -- there is no moved-block shortcut available.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team wants to migrate an aws_db_instance (RDS) resource to an aws_rds_cluster (Aurora) resource as part of a database platform upgrade, and plans to write a moved {} block to avoid the downtime of a destroy-and-recreate. Will this work, and why or why not?',
    hint: 'Does moved transform a resource\'s stored attributes to fit a different resource\'s schema, or does it only remap which address the SAME schema\'s data lives under?',
    solution: 'This will not work. aws_db_instance and aws_rds_cluster are different resource types with different schemas — a moved block requires the from and to addresses to reference the exact same resource type, since it only remaps the STATE ADDRESS a set of already-tracked attributes lives under, without transforming the attribute schema itself. Terraform will reject this with a "resource type mismatch" error at plan time. Migrating from RDS to Aurora genuinely requires a real destroy-and-recreate (or whatever dedicated migration path, if any, the provider offers specifically for that database engine transition) — there is no moved-block shortcut for changing resource types, no matter how conceptually similar the two resources are.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A moved block can migrate a resource to any conceptually similar resource type, not just rename or relocate a resource of the same type — since its job is remapping state addresses in general.',
      reality: 'Per this subtopic\'s theory, moved strictly requires the from and to addresses to reference the exact same resource type — it only remaps which address the same schema\'s already-tracked attributes live under, and errors immediately if the two sides are different types.'
    },
    {
      thought: 'Since the main page\'s module-move example changes a resource\'s address by adding a module prefix, moved is generally permissive about what changes between from and to, as long as the overall intent is "this is the same underlying thing."',
      reality: 'Per this subtopic\'s theory, the module-move example still keeps the SAME resource type on both sides (aws_instance to aws_instance) — only the module path portion of the address changes, which is a fundamentally different kind of change than swapping the resource type itself.'
    },
    {
      thought: 'If a moved block between two different resource types is invalid, Terraform will catch this at terraform validate time, before any plan or apply is attempted.',
      reality: 'Per this subtopic\'s theory, the resource type mismatch surfaces at plan/apply time, not earlier — worth deliberately double-checking both sides of a moved block reference the identical resource type string rather than assuming validate would catch a mistake first.'
    }
  ];
}
