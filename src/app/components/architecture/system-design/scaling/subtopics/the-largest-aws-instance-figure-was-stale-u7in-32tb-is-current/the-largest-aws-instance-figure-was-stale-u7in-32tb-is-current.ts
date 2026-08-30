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
  templateUrl: './the-largest-aws-instance-figure-was-stale-u7in-32tb-is-current.html',
  styleUrl: './the-largest-aws-instance-figure-was-stale-u7in-32tb-is-current.scss'
})
export class TheLargestAwsInstanceFigureWasStaleU7in32tbIsCurrentSubtopic {

  theory: TheoryPoint[] = [
    {
      heading: 'A specific-sounding number that had quietly gone stale',
      points: [
        'The main page originally cited "~448 vCPU, 24 TB RAM" as the vertical-scaling ceiling on AWS — a precise-sounding figure that matched a real AWS instance type, but one AWS has since deprecated for new launches. The main page has been corrected.',
      ]
    },
    {
      heading: 'The reality: AWS\'s vertical ceiling has moved to 896 vCPU / 32 TB RAM',
      points: [
        'The 448-vCPU/24-TB figure matches the u-24tb1.metal High Memory instance — but per AWS\'s own documentation, the U-9tb1, U-12tb1, U-18tb1, and U-24tb1 instance types "are no longer available for new instance launches."',
        'The current largest instance is u7in-32tb.224xlarge, part of the newer High Memory U7i family: 896 vCPUs and 32,768 GiB (32 TiB) of memory — roughly DOUBLE the vCPU count and a third more RAM than the figure the main page originally cited.',
        'This isn\'t a one-time fact to memorize and forget — cloud providers regularly retire and replace their largest instance types as hardware improves, so a specific "biggest instance" number is inherently a snapshot in time, not a fixed ceiling.',
      ]
    },
    {
      heading: 'Why citing a specific, dated number is worth double-checking before an interview',
      points: [
        'A candidate confidently stating "AWS tops out around 448 vCPUs" to argue a design needs horizontal scaling sooner than it might actually need to, based on a now-outdated ceiling, could reach the wrong conclusion about when vertical scaling genuinely runs out of headroom for a given workload.',
        'The more durable interview-ready framing is the CONCEPT ("cloud vertical scaling has a hard ceiling set by the largest currently-available instance type, and that ceiling moves over time") rather than memorizing a specific number that a provider can retire at any point — citing today\'s actual figure is a nice-to-have precision on top of that durable concept, not a substitute for it.',
      ]
    },
  ];

  codeTabs: CodeTab[] = [
    {
      label: 'Checking the current vertical-scaling ceiling directly',
      language: 'bash',
      code: `# Don't rely on a memorized "biggest instance" figure --
# check AWS's own current instance type listing:
aws ec2 describe-instance-types \\
  --filters "Name=instance-type,Values=u7in-32tb.224xlarge" \\
  --query "InstanceTypes[].{vCPUs:VCpuInfo.DefaultVCpus,MemoryGiB:MemoryInfo.SizeInMiB}"

# Current largest (High Memory U7i family):
#   u7in-32tb.224xlarge -- 896 vCPUs, 32,768 GiB (32 TiB)

# Deprecated, no longer available for new launches:
#   u-24tb1.metal -- 448 vCPUs, 24,576 GiB (24 TiB)
#   (superseded by the U7i family)`,
    },
  ];

  exercise: TryItExercise = {
    prompt: 'A candidate, citing the main page\'s original (now-corrected) "~448 vCPU, 24 TB RAM" ceiling, argues that a workload needing 500 vCPUs of single-machine capacity is fundamentally impossible on AWS and must be redesigned around horizontal scaling immediately. Using the corrected figure, is this the right conclusion?',
    hint: 'Does 500 vCPUs exceed the CURRENT largest AWS instance, or only the older, now-deprecated one the candidate remembered?',
    solution: 'No — using the corrected, current ceiling (896 vCPUs on u7in-32tb.224xlarge), a workload needing 500 vCPUs of single-machine capacity is well within what AWS currently offers on a single instance; it does NOT require redesigning around horizontal scaling for that reason alone. The candidate\'s conclusion was only correct relative to the older, deprecated 448-vCPU ceiling — a good illustration of why citing a specific vendor capacity number from memory, rather than checking current documentation, risks reaching a stale conclusion.'
  };

  misconceptions: Misconception[] = [
    {
      thought: 'The largest AWS instance available is ~448 vCPUs and 24 TB of RAM.',
      reality: 'Per this subtopic\'s theory (a stale figure corrected on the main page during this batch), that figure describes u-24tb1.metal, which AWS has deprecated for new launches — the current largest is u7in-32tb.224xlarge at 896 vCPUs and 32 TiB RAM.'
    },
    {
      thought: 'A cloud provider\'s "largest instance" ceiling is a fixed, stable fact worth memorizing once.',
      reality: 'Per this subtopic\'s theory, cloud providers regularly retire and replace their largest instance types as hardware improves — any specific number is a snapshot in time, worth re-checking rather than treating as permanent.'
    },
    {
      thought: 'Knowing the exact current largest-instance number is essential for reasoning about vertical scaling limits in a system design interview.',
      reality: 'Per this subtopic\'s theory, the durable, interview-ready understanding is the CONCEPT (vertical scaling has a moving ceiling set by the largest currently-available instance) — citing today\'s specific number is a nice precision add-on, not a substitute for that concept.'
    }
  ];
}
