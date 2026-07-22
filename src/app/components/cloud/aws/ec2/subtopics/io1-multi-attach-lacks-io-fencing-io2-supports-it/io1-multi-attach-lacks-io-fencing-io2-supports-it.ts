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
  templateUrl: './io1-multi-attach-lacks-io-fencing-io2-supports-it.html',
  styleUrl: './io1-multi-attach-lacks-io-fencing-io2-supports-it.scss'
})
export class Io1MultiAttachLacksIoFencingIo2SupportsItSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'The main page treats io1 and io2 Multi-Attach as interchangeable — they are not',
      points: [
        'The main page\'s own "EBS Volume Types" theory bullet states: "EBS Multi-Attach (io1/io2 only): attach one volume to up to 16 Nitro instances in the same AZ — requires a cluster-aware filesystem (GFS2, OCFS2)." This groups io1 and io2 together as though the "requires a cluster-aware filesystem" requirement is the whole story, and as though the two volume types provide the same underlying write-consistency guarantees to that filesystem.',
        'They do not. A cluster-aware filesystem on its own coordinates WHICH node believes it owns a given piece of data — but it still depends on the underlying storage layer to actually enforce that only the node that currently holds a lock can write to the corresponding blocks. That enforcement mechanism is called I/O fencing, and it is not something both Multi-Attach volume types provide equally.',
      ]
    },
    {
      heading: 'Only Multi-Attach io2 volumes support I/O fencing — io1 does not',
      points: [
        'Per AWS\'s own documentation, Multi-Attach enabled io2 volumes support I/O fencing via NVMe reservations — a protocol that lets an attached instance reserve exclusive (or shared) write access to the volume, so that another attached instance whose lock was revoked or that lost cluster membership genuinely cannot write to the volume anymore, even if it still believes it holds a valid lock at the application layer.',
        'Multi-Attach enabled io1 volumes explicitly do NOT support I/O fencing at all — AWS\'s own documentation states this directly. Without fencing, the storage layer itself provides no mechanism to physically block writes from a node that the cluster-aware filesystem\'s own coordination has already decided should no longer be writing — a classic "split-brain" scenario where a node that has lost quorum, or whose lock lease has silently expired due to a network partition, can still get its writes through to shared storage.',
        'This means the main page\'s own blanket "requires a cluster-aware filesystem" framing understates the real risk difference: for a production workload where correctness under a partial network failure or a stuck/zombie node genuinely matters, io1 Multi-Attach\'s lack of fencing is a materially weaker consistency guarantee than io2 Multi-Attach\'s NVMe-reservation-based fencing — even though a cluster-aware filesystem sits on top of both identically. AWS\'s own documentation additionally recommends io2 over io1 generally, for better performance, consistency, and durability at a comparable or lower cost — this fencing gap is one concrete reason why.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Creating an io2 Multi-Attach volume (fencing-capable)',
      language: 'bash',
      code: `# Create an io2 volume with Multi-Attach enabled
aws ec2 create-volume \\
  --availability-zone eu-west-1a \\
  --volume-type io2 \\
  --size 500 \\
  --iops 16000 \\
  --multi-attach-enabled \\
  --tag-specifications 'ResourceType=volume,Tags=[{Key=Name,Value=cluster-shared-vol}]'

# Attach it to two Nitro instances in the SAME AZ
aws ec2 attach-volume \\
  --volume-id vol-0abc12345 --instance-id i-node-a --device /dev/xvdf
aws ec2 attach-volume \\
  --volume-id vol-0abc12345 --instance-id i-node-b --device /dev/xvdf

# On each instance, the cluster-aware filesystem (e.g. OCFS2) still
# has to be configured and its own cluster membership/quorum set up
# -- io2's NVMe-reservation fencing complements the filesystem's own
# coordination, it doesn't replace the need for one entirely.

# Verify Multi-Attach is actually enabled on the volume:
aws ec2 describe-volumes --volume-ids vol-0abc12345 \\
  --query "Volumes[].MultiAttachEnabled"
# [true]`,
    },
    {
      label: 'The risk io1 leaves open: no fencing means no hard stop for a stale writer',
      language: 'bash',
      code: `# Attempting the SAME Multi-Attach setup on io1 instead --
# this still works, and the volume still attaches to multiple
# instances -- but the underlying guarantee is different:
aws ec2 create-volume \\
  --availability-zone eu-west-1a \\
  --volume-type io1 \\
  --size 500 \\
  --iops 16000 \\
  --multi-attach-enabled

# Both node-a and node-b can still write to this io1 volume
# whenever their own network stack lets a write through -- there is
# no NVMe-reservation mechanism at the EBS layer that can physically
# reject a write from a node the cluster software has already
# decided has lost its lock.
#
# The dangerous scenario: node-a experiences a transient network
# partition and appears "dead" to the cluster-aware filesystem's own
# coordination, which reassigns node-a's locks to node-b and lets
# node-b start writing to the previously node-a-owned blocks. If
# node-a's network partition resolves a moment later and node-a
# (still believing it holds its OLD lock, having not yet learned it
# was revoked) issues one more write to the same blocks -- on io1,
# NOTHING at the storage layer stops that write from landing and
# corrupting what node-b just wrote. On io2, the NVMe reservation
# that was transferred to node-b would cause node-a's now-invalid
# write to be rejected by the volume itself, independent of whether
# node-a's own application logic has caught up with the lock change.

# This is exactly why AWS's own documentation states plainly that
# io1 Multi-Attach volumes do not support I/O fencing, while io2
# Multi-Attach volumes do, via NVMe reservations.`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A team is designing a shared-storage cluster for a database that uses Multi-Attach EBS volumes plus a cluster-aware filesystem, and needs the strongest available protection against a "stale writer" — a node that briefly loses network connectivity, has its lock reassigned to another node by the cluster software, then reconnects and tries to write using its now-invalid lock. Following only the main page\'s own "requires a cluster-aware filesystem" guidance, would choosing either io1 or io2 be equally safe for this requirement? What does this subtopic\'s theory say instead?',
    hint: 'A cluster-aware filesystem coordinates which node SHOULD be writing — does it, by itself, have the power to physically prevent a node from writing once its lock is revoked?',
    solution: 'No, per this subtopic\'s theory, io1 and io2 are not equally safe for this specific requirement, even though both support Multi-Attach and both work with a cluster-aware filesystem. A cluster-aware filesystem\'s own coordination layer decides WHICH node should currently hold a lock, but that decision alone cannot physically stop a stale node from issuing a write — that enforcement has to happen at the storage layer itself, via I/O fencing. Multi-Attach io2 volumes support I/O fencing through NVMe reservations, meaning a node whose lock was reassigned genuinely cannot get a write through to the volume anymore, even if its own application logic hasn\'t yet learned the lock was revoked. Multi-Attach io1 volumes do not support I/O fencing at all, so exactly the stale-writer scenario described — a reconnecting node issuing one more write on its now-invalid lock — has no storage-layer safeguard and can silently corrupt data that the newly-lock-holding node has already written. For this specific requirement, the team should choose io2, not io1, precisely because of this fencing difference — the main page\'s own blanket "requires a cluster-aware filesystem" framing does not distinguish between the two, but the actual protection against this failure mode depends entirely on which volume type is chosen.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'Since both io1 and io2 support EBS Multi-Attach and both require a cluster-aware filesystem, they provide equivalent data-consistency guarantees for a shared-storage cluster.',
      reality: 'Per this subtopic\'s theory, only io2 Multi-Attach volumes support I/O fencing (via NVMe reservations) — io1 Multi-Attach volumes explicitly do not, making io1 meaningfully weaker for correctness under a partial network failure or a stale writer, despite both requiring the same cluster-aware filesystem.'
    },
    {
      thought: 'A cluster-aware filesystem is, by itself, sufficient to prevent a node whose lock was revoked from corrupting shared data.',
      reality: 'Per this subtopic\'s theory, the filesystem\'s own coordination only decides who SHOULD hold a lock — actually preventing a stale node\'s write from reaching the volume requires storage-layer I/O fencing, which only Multi-Attach io2 (not io1) provides.'
    },
    {
      thought: 'I/O fencing on Multi-Attach io2 volumes replaces the need for a cluster-aware filesystem entirely.',
      reality: 'Per this subtopic\'s code example, fencing complements the filesystem\'s own cluster coordination — the cluster-aware filesystem (e.g. OCFS2) still has to be configured and its own quorum/membership set up on every attached instance regardless of which Multi-Attach volume type is used.'
    }
  ];
}
