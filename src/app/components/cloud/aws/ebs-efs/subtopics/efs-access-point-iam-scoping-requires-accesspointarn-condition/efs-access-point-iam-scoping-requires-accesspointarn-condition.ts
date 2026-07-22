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
  templateUrl: './efs-access-point-iam-scoping-requires-accesspointarn-condition.html',
  styleUrl: './efs-access-point-iam-scoping-requires-accesspointarn-condition.scss'
})
export class EfsAccessPointIamScopingRequiresAccesspointarnConditionSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats POSIX identity enforcement as the whole isolation story',
      points: [
        'The main page\'s own "Amazon EFS" theory bullet describes Access Points as enforcing "a specific POSIX user/group and root directory per application — each ECS task or Lambda can have its own access point for isolation within the same EFS filesystem." Its own ECS code tab sets "iam": "ENABLED" in the task\'s authorizationConfig with no further explanation of what that flag actually gates.',
        'Read on its own, this suggests the access point ITSELF is what enforces the isolation between service-a\'s access point and service-b\'s access point — but the access point\'s POSIX/root-directory enforcement only applies to whichever traffic actually reaches it through a specific mount. Whether a given IAM role is even ALLOWED to use a specific access point (as opposed to a different one on the same file system) is a separate question, answered by IAM, not by the access point\'s own configuration.',
      ]
    },
    {
      heading: 'IAM scoping to a specific access point uses the elasticfilesystem:AccessPointArn condition key — without it, ClientMount isn\'t actually scoped',
      points: [
        'Per AWS\'s own documentation, "you can use an IAM policy to enforce that a specific NFS client, identified by its IAM role, can only access a specific access point... using the elasticfilesystem:AccessPointArn IAM condition key." A file system policy statement grants elasticfilesystem:ClientMount (and ClientWrite) on the file system\'s own ARN, with a Condition restricting it to one specific access point\'s ARN.',
        'This means the main page\'s own multi-tenant ECS scenario — separate access points for service-a and service-b on the same EFS filesystem — only gets real per-service isolation if EACH service\'s own IAM task role has a policy scoped with the AccessPointArn condition to ONLY its own access point. Without that condition, a role granted a broader elasticfilesystem:ClientMount permission on the file system (with no AccessPointArn restriction) can mount through ANY access point on that file system — including the OTHER service\'s access point, and therefore its POSIX identity and root directory — completely bypassing the isolation the access points were set up to provide.',
        'This is a genuinely easy trap because the mount itself will simply work either way: if service-a\'s IAM role happens to have unscoped ClientMount permission, mounting via service-b\'s access point ID succeeds without any IAM error — the POSIX/root-directory enforcement the main page\'s own bullet describes is real and does apply, but it applies to WHATEVER access point the mount actually specifies, and nothing stops the wrong access point from being specified if IAM doesn\'t restrict it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'The main page\'s own two-access-point setup, plus a matching IAM policy',
      language: 'bash',
      code: `# Matching the main page's own multi-tenant challenge exactly:
# two access points on the same file system, one per service.
aws efs create-access-point --file-system-id fs-0abc12345 \\
  --posix-user 'Uid=1001,Gid=1001' \\
  --root-directory 'Path=/service-a,CreationInfo={OwnerUid=1001,OwnerGid=1001,Permissions=755}'
# -> fsap-serviceA

aws efs create-access-point --file-system-id fs-0abc12345 \\
  --posix-user 'Uid=1002,Gid=1002' \\
  --root-directory 'Path=/service-b,CreationInfo={OwnerUid=1002,OwnerGid=1002,Permissions=755}'
# -> fsap-serviceB

# A file system policy that ACTUALLY scopes each role to its own
# access point, using the elasticfilesystem:AccessPointArn condition
# -- this is the piece the main page's own "iam": "ENABLED" flag
# never shows how to configure:
aws efs put-file-system-policy \\
  --file-system-id fs-0abc12345 \\
  --policy '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "ServiceAOnly",
        "Effect": "Allow",
        "Principal": { "AWS": "arn:aws:iam::123456789012:role/service-a-task-role" },
        "Action": ["elasticfilesystem:ClientMount", "elasticfilesystem:ClientWrite"],
        "Resource": "arn:aws:elasticfilesystem:eu-west-1:123456789012:file-system/fs-0abc12345",
        "Condition": {
          "StringEquals": {
            "elasticfilesystem:AccessPointArn": "arn:aws:elasticfilesystem:eu-west-1:123456789012:access-point/fsap-serviceA"
          }
        }
      },
      {
        "Sid": "ServiceBOnly",
        "Effect": "Allow",
        "Principal": { "AWS": "arn:aws:iam::123456789012:role/service-b-task-role" },
        "Action": ["elasticfilesystem:ClientMount", "elasticfilesystem:ClientWrite"],
        "Resource": "arn:aws:elasticfilesystem:eu-west-1:123456789012:file-system/fs-0abc12345",
        "Condition": {
          "StringEquals": {
            "elasticfilesystem:AccessPointArn": "arn:aws:elasticfilesystem:eu-west-1:123456789012:access-point/fsap-serviceB"
          }
        }
      }
    ]
  }'`,
    },
    {
      label: 'The trap: an unscoped ClientMount grant defeats the isolation',
      language: 'bash',
      code: `# A DIFFERENT (mistaken) file system policy, granting ClientMount
# broadly with no AccessPointArn condition -- this is what happens
# if a team just wants "let this role mount EFS" without thinking
# about per-access-point scoping:
aws efs put-file-system-policy \\
  --file-system-id fs-0abc12345 \\
  --policy '{
    "Version": "2012-10-17",
    "Statement": [{
      "Sid": "ServiceABroadAccess",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::123456789012:role/service-a-task-role" },
      "Action": ["elasticfilesystem:ClientMount", "elasticfilesystem:ClientWrite"],
      "Resource": "arn:aws:elasticfilesystem:eu-west-1:123456789012:file-system/fs-0abc12345"
    }]
  }'
# -- no Condition block at all.

# service-a's task role now tries to mount via service-b's OWN
# access point instead of its own:
mount -t efs -o tls,iam,accesspoint=fsap-serviceB fs-0abc12345: /mnt/wrong

# This SUCCEEDS -- IAM allows it (ClientMount was never restricted
# to a specific access point), and the mount enforces service-b's
# own POSIX identity (Uid=1002,Gid=1002) and root directory
# (/service-b) exactly as configured -- service-a's task can now
# read and write service-b's own files, completely bypassing the
# isolation the two separate access points were meant to provide.
# The access point's own POSIX/root-directory enforcement worked
# perfectly -- the gap was entirely on the IAM side.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A platform team sets up two EFS access points for two ECS services, following the main page\'s own pattern — each access point has its own POSIX UID/GID and root directory, and each task definition sets "iam": "ENABLED" in its EFS authorizationConfig. During a security review, they discover service-a\'s task role can successfully mount service-b\'s access point and read its files, even though the two access points have completely different POSIX identities and root directories configured. Using this subtopic\'s theory, explain how this is possible despite the access points being configured correctly, and what\'s actually missing.',
    hint: 'The access points themselves enforce POSIX identity and root directory correctly for whichever mount targets them — but what determines whether service-a\'s IAM role is even ALLOWED to target service-b\'s access point in the first place?',
    solution: 'Per this subtopic\'s theory, the access points themselves are configured correctly and are not the problem — the gap is that the file system\'s IAM policy grants service-a\'s task role elasticfilesystem:ClientMount permission WITHOUT the elasticfilesystem:AccessPointArn condition that would scope it to only service-a\'s own access point. Because IAM enforcement operates independently of, and BEFORE, the access point\'s own POSIX/root-directory logic, an unscoped ClientMount grant lets service-a\'s role successfully mount via ANY access point on the file system — including service-b\'s — at which point the mount correctly applies service-b\'s POSIX identity and root directory (exactly as the access point is configured to do), giving service-a\'s task full access to service-b\'s files. This is precisely why "the access point enforces POSIX identity for isolation," as the main page\'s own bullet states, is true but incomplete — that enforcement only kicks in for whichever access point a mount actually specifies, and nothing about the access point\'s own configuration prevents the WRONG access point from being specified if IAM doesn\'t restrict which ones a given role can use. The fix is adding the elasticfilesystem:AccessPointArn condition to each task role\'s permission statement in the file system policy, scoping service-a\'s role to only fsap-serviceA and service-b\'s role to only fsap-serviceB — turning the two-access-point setup into genuine per-service isolation instead of only per-service POSIX cosmetics.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Creating separate EFS access points with different POSIX identities and root directories, following the main page\'s own multi-tenant pattern, is sufficient by itself to isolate two applications\' data on the same file system.',
      reality: 'Per this subtopic\'s theory, the access points\' own POSIX/root-directory enforcement only applies to whichever access point a mount actually targets — real isolation additionally requires an IAM policy scoping each role to its own access point via the elasticfilesystem:AccessPointArn condition key.'
    },
    {
      thought: 'If an IAM role is granted elasticfilesystem:ClientMount permission on a file system, that permission is automatically limited to whatever access point the role\'s own task definition happens to reference.',
      reality: 'Per this subtopic\'s theory, an unscoped ClientMount grant (no AccessPointArn condition) allows mounting via ANY access point on that file system, regardless of which access point a specific task definition was originally intended to use — nothing in the task definition itself constrains this at the IAM layer.'
    },
    {
      thought: 'If IAM incorrectly allows the wrong access point to be mounted, the access point\'s own POSIX enforcement would still block cross-service file access as a fallback.',
      reality: 'Per this subtopic\'s exercise, the access point\'s POSIX enforcement works exactly as configured for whichever access point is actually mounted — it provides no additional protection against IAM having authorized the WRONG access point in the first place; the two layers are independent, not redundant.'
    }
  ];
}
