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
  templateUrl: './a-timeout-does-not-mean-the-resource-was-not-created.html',
  styleUrl: './a-timeout-does-not-mean-the-resource-was-not-created.scss'
})
export class ATimeoutDoesNotMeanTheResourceWasNotCreatedSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page\'s own QnA explains timeouts thoroughly, but never addresses what happens on the NEXT apply',
      points: [
        'The main page\'s QnA on resource timeouts is detailed and accurate: "The timeouts block... specifies how long Terraform waits for each operation before failing... When a timeout is exceeded, Terraform marks the resource as tainted." True — but it stops right there, never explaining what actually happened to the REAL infrastructure, or what the very next apply run does about it.',
      ]
    },
    {
      heading: 'A timeout is Terraform giving up waiting — not the cloud provider giving up creating',
      points: [
        'When a create operation exceeds its configured (or default) timeout, Terraform stops WAITING for a response and reports failure — but the actual API call it made to the cloud provider may still be in progress, or may have already succeeded, entirely independently of Terraform\'s own patience running out. Slow-provisioning resources (an RDS cluster, a large EKS node group) are exactly the case where this gap matters most.',
      ]
    },
    {
      heading: 'The next apply can hit a genuine "already exists" conflict, not a clean retry',
      points: [
        'If the resource genuinely finished creating in the cloud provider AFTER Terraform\'s timeout gave up, the local (or remote) state may have no record of it at all — Terraform\'s own bookkeeping for that resource never got the success confirmation before it stopped waiting.',
        'The next <code>terraform apply</code> then sees a resource address with no corresponding state entry, and tries to create it fresh — which can fail with an "already exists" / naming-collision error from the provider, since the real object from the timed-out run is already sitting there under the same name/identifier.',
        'The documented recovery path is <code>terraform import</code> — bringing the already-existing real resource under Terraform\'s state management manually — rather than assuming a bare retry of <code>apply</code> will cleanly pick up where the timeout left off.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The timeouts block, and what "tainted" doesn\'t tell you',
      language: 'bash',
      code: `resource "aws_rds_cluster" "main" {
  cluster_identifier = "prod-db"
  engine              = "aurora-postgresql"

  timeouts {
    create = "40m"   # RDS clusters can genuinely take this long
    update = "30m"
    delete = "30m"
  }
}

# If cluster creation takes 45 minutes and the timeout is 40:
# Error: timeout while waiting for state to become 'available'
#   (last state: 'creating', timeout: 40m0s)
#
# Terraform marks this tainted -- but "tainted" only describes
# TERRAFORM'S bookkeeping. It says nothing about whether the
# actual RDS cluster finished creating in AWS five minutes
# after Terraform stopped waiting.`,
    },
    {
      label: 'What the next apply can actually hit',
      language: 'bash',
      code: `# If the cluster genuinely finished creating in AWS after the
# timeout, but Terraform's state has no record of that success:
$ terraform apply
# Terraform sees no state entry for aws_rds_cluster.main and
# plans a fresh create -- using the SAME cluster_identifier:
#   # aws_rds_cluster.main will be created
#
# AWS rejects it, since a cluster with that identifier already
# exists from the timed-out run:
# Error creating RDS Cluster: DBClusterAlreadyExistsFault:
#   Cluster already exists

# The documented recovery path is importing the real, already-
# existing resource into state -- not just retrying apply:
$ terraform import aws_rds_cluster.main prod-db
# Now state correctly reflects the real cluster that was
# actually created during the timed-out run, and subsequent
# plans compare against it normally instead of trying to
# recreate it.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'Following the main page\'s own timeouts example, an aws_rds_cluster resource has `timeouts { create = "40m" }`. The cluster actually takes 45 minutes in AWS, so Terraform times out and marks the resource tainted at the 40-minute mark. A teammate immediately re-runs `terraform apply`, expecting a clean retry — instead it fails with a DBClusterAlreadyExistsFault error. What actually happened, and what command is the documented way to recover instead of repeatedly retrying apply?',
    hint: 'A timeout means Terraform stopped WAITING for a response — it does not mean the underlying cloud API call stopped running. What state does Terraform have for a resource whose creation succeeded after Terraform already gave up?',
    solution: 'The RDS cluster genuinely finished creating in AWS about 5 minutes after Terraform\'s 40-minute timeout gave up waiting — Terraform\'s own state was never updated with that eventual success, since it had already stopped and reported failure before the real creation completed. The retried `terraform apply` therefore sees no state entry for the resource and tries to create it fresh under the same cluster_identifier, which AWS rejects because that identifier is already in use by the cluster from the timed-out run. The documented recovery path is `terraform import aws_rds_cluster.main prod-db` — bringing the already-existing real cluster under Terraform\'s state management directly — rather than repeatedly retrying apply and hitting the same conflict.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'A timeout error during terraform apply means the resource creation itself failed or was aborted in the cloud provider, not just that Terraform stopped waiting for a response.',
      reality: 'Per this subtopic\'s theory, a timeout means Terraform gave up WAITING — the actual API call to the cloud provider may still be in progress or may have already succeeded independently, entirely separate from Terraform\'s own patience running out.'
    },
    {
      thought: 'After a timeout marks a resource tainted, simply re-running terraform apply is a safe, clean way to retry the operation.',
      reality: 'Per this subtopic\'s theory, a plain retry can fail with an "already exists" conflict if the resource actually finished creating after the timeout — Terraform has no state record of that success and tries to create it fresh under the same identifier, colliding with the real object.'
    },
    {
      thought: 'The correct way to recover from a timeout-caused "already exists" conflict is to delete the real resource in the cloud console and let Terraform create it cleanly.',
      reality: 'Per this subtopic\'s theory, the documented recovery path is terraform import — bringing the already-existing real resource under Terraform\'s state management — not deleting a resource that may have finished provisioning correctly just because Terraform\'s own timeout gave up early.'
    }
  ];
}
